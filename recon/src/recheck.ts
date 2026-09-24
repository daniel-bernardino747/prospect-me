import { execFile } from 'node:child_process';
import { resolve as resolveDns } from 'node:dns/promises';
import { promisify } from 'node:util';

import type { Recheck } from './dossier/schema.ts';

/**
 * Runs a perishable finding's re-check. Phase two refuses to write an email on a
 * finding whose re-check no longer holds (ADR-0001), so this is the one place
 * that decides "still true".
 */

export interface RecheckResult {
  held: boolean;
  observed: string;
}

export interface RecheckDeps {
  http(url: string): Promise<{ status: number; body: string }>;
  dns(name: string, type: string): Promise<unknown[]>;
  gh(endpoint: string, jq?: string): Promise<string>;
}

// Many hosts answer 403/406 to a bare client; a browser UA avoids false "down".
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const liveDeps: RecheckDeps = {
  async http(url) {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    return { status: res.status, body: await res.text() };
  },
  async dns(name, type) {
    try {
      const records = await resolveDns(name, type);
      // SOA answers with a single record rather than a list.
      return Array.isArray(records) ? records : [records];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENODATA' || code === 'ENOTFOUND') return [];
      throw error;
    }
  },
  async gh(endpoint, jq) {
    const { stdout } = await promisify(execFile)('gh', ['api', endpoint, ...(jq ? ['--jq', jq] : [])], {
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout.trim();
  },
};

export async function runRecheck(check: Recheck, deps: RecheckDeps = liveDeps): Promise<RecheckResult> {
  try {
    switch (check.kind) {
      case 'http': {
        const { status, body } = await deps.http(check.url);
        const failures: string[] = [];
        if (check.expect.status !== undefined && status !== check.expect.status) {
          failures.push(`status ${status}, expected ${check.expect.status}`);
        }
        if (check.expect.contains !== undefined && !body.includes(check.expect.contains)) {
          failures.push(`"${check.expect.contains}" no longer present`);
        }
        if (check.expect.absent !== undefined && body.includes(check.expect.absent)) {
          failures.push(`"${check.expect.absent}" now present`);
        }
        return { held: failures.length === 0, observed: failures.join('; ') || `status ${status}` };
      }
      case 'dns': {
        const records = await deps.dns(check.name, check.type);
        const present = records.length > 0;
        return {
          held: present === (check.expect === 'present'),
          observed: `${check.type} ${check.name}: ${present ? `${records.length} record(s)` : 'none'}`,
        };
      }
      case 'gh': {
        const out = await deps.gh(check.endpoint, check.jq);
        const held =
          (check.expect.equals === undefined || out === check.expect.equals) &&
          (check.expect.contains === undefined || out.includes(check.expect.contains));
        return { held, observed: out.length > 200 ? `${out.slice(0, 200)}…` : out };
      }
    }
  } catch (error) {
    // A check that cannot run has not held: nothing unverified goes out.
    return { held: false, observed: `could not run: ${(error as Error).message}` };
  }
}
