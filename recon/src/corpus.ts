import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The Corpus lives in personal-website and is read only through its
 * `corpus:json` contract (personal-website ADR-0011), never by parsing its
 * markdown here. `CORPUS_REPO` points at that checkout.
 */
export const CORPUS_JSON_VERSION = 1;

export interface CorpusAccomplishment {
  id: string;
  affiliationId: string | null;
  date: string;
  kind: string;
  metric: string;
  title: string | null;
  statement: string;
  featured: boolean;
}

export interface CorpusJson {
  version: number;
  identity: Record<string, unknown> | null;
  affiliations: { id: string; organisation: string; role: string }[];
  accomplishments: CorpusAccomplishment[];
}

export function corpusRepo(): string {
  // Defaults to a sibling checkout: prospect-me and personal-website side by side.
  return resolve(process.env.CORPUS_REPO ?? fileURLToPath(new URL('../../../personal-website', import.meta.url)));
}

export function readCorpus(repo: string = corpusRepo()): CorpusJson {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const out = execFileSync(npm, ['run', '--silent', 'corpus:json'], {
    cwd: repo,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 32 * 1024 * 1024,
  });
  const corpus = JSON.parse(out) as CorpusJson;
  if (corpus.version !== CORPUS_JSON_VERSION) {
    throw new Error(
      `corpus:json is version ${corpus.version}; this reader understands ${CORPUS_JSON_VERSION}.`,
    );
  }
  return corpus;
}
