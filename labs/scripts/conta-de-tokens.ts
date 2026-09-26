/**
 * Gathers the public data behind /demo/conta-de-tokens once, and writes the
 * aggregate the page reads. Run by hand, never on a schedule (ADR-0002: data
 * public, cited, gathered once).
 *
 *   node --no-warnings labs/scripts/conta-de-tokens.ts
 *
 * Sources:
 * - OpenRouter model catalog, GET /api/v1/models (no auth): prices.
 * - OpenRouter daily token totals for the top 50 models, GET
 *   /api/v1/datasets/rankings-daily (CC BY 4.0, cite "Source: OpenRouter
 *   (openrouter.ai/rankings), as of {as_of}."). Needs an OpenRouter key:
 *   OPENROUTER_API_KEY from the environment, or from the `.env` of the main
 *   checkout (found through git, so it works from a worktree). The key is only
 *   sent to openrouter.ai; it is never printed nor written anywhere.
 *   Without a key, the script reads the same raw responses from the public
 *   mirror IAPS-AI/OpenRouter-OS-Rankings and records that in the data, so the
 *   page's method note says so.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildData, type CatalogModel, MIN_COVERAGE, type RankingRow, WEEKS } from '../src/artifacts/conta-de-tokens/build.ts';

const OUT = fileURLToPath(new URL('../src/artifacts/conta-de-tokens/data.json', import.meta.url));
const CATALOG = 'https://openrouter.ai/api/v1/models';
const RANKINGS = 'https://openrouter.ai/api/v1/datasets/rankings-daily';
const MIRROR_REPO = 'https://github.com/IAPS-AI/OpenRouter-OS-Rankings';
const MIRROR = (year: number) =>
  `https://raw.githubusercontent.com/IAPS-AI/OpenRouter-OS-Rankings/main/data/rankings-${year}.json`;

interface RankingsResponse {
  data: RankingRow[];
  meta: { as_of: string; version: string; start_date: string; end_date: string };
}

/** The key from the environment, or from the main checkout's `.env`; never logged. */
function openRouterKey(): string | undefined {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd: dirname(OUT),
      encoding: 'utf8',
    }).trim();
    const env = join(dirname(common), '.env');
    if (!existsSync(env)) return undefined;
    const line = readFileSync(env, 'utf8')
      .split(/\r?\n/)
      .find((l) => /^\s*OPENROUTER_API_KEY\s*=/.test(l));
    const value = line?.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    return value || undefined;
  } catch {
    return undefined;
  }
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  // Never echo the request: its headers may carry the key.
  if (!res.ok) throw new Error(`${new URL(url).origin}${new URL(url).pathname}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

function validate(r: RankingsResponse, source: string): RankingsResponse {
  if (!Array.isArray(r.data) || !r.meta?.as_of || !r.meta.end_date) throw new Error(`${source}: unexpected shape`);
  if (r.meta.version !== 'v1') throw new Error(`${source}: dataset version ${r.meta.version}, expected v1`);
  for (const row of r.data.slice(0, 50)) {
    if (typeof row.date !== 'string' || typeof row.model_permaslug !== 'string' || !/^\d+$/.test(row.total_tokens)) {
      throw new Error(`${source}: unexpected row ${JSON.stringify(row)}`);
    }
  }
  return r;
}

const DAY = 86_400_000;

async function rankings(): Promise<{ response: RankingsResponse; via: 'openrouter' | 'mirror' }> {
  const key = openRouterKey();
  if (key) {
    // The last complete UTC day, and enough days before it for WEEKS weeks.
    const end = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    const start = new Date(Date.parse(`${end}T00:00:00Z`) - (WEEKS * 7 - 1) * DAY).toISOString().slice(0, 10);
    console.log(`rankings-daily ${start}..${end} from openrouter.ai`);
    const response = await json<RankingsResponse>(`${RANKINGS}?start_date=${start}&end_date=${end}&period=day`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    return { response: validate(response, 'rankings-daily'), via: 'openrouter' };
  }

  console.log(`no OPENROUTER_API_KEY: reading the raw rankings-daily responses from ${MIRROR_REPO}`);
  const year = new Date().getUTCFullYear();
  const current = validate(await json<RankingsResponse>(MIRROR(year)), 'mirror');
  // Early in the year the 26 weeks reach into the previous year's file.
  const needFrom = new Date(Date.parse(`${current.meta.end_date}T00:00:00Z`) - (WEEKS * 7 - 1) * DAY);
  if (needFrom.getUTCFullYear() < year) {
    const previous = validate(await json<RankingsResponse>(MIRROR(year - 1)), 'mirror');
    current.data = [...previous.data, ...current.data];
  }
  return { response: current, via: 'mirror' };
}

async function main() {
  const fetchedAt = new Date().toISOString();
  console.log('model catalog');
  const catalog = (await json<{ data: CatalogModel[] }>(CATALOG)).data;
  if (!Array.isArray(catalog) || catalog.length < 100) throw new Error('catalog: unexpected shape');

  const { response, via } = await rankings();
  const data = buildData({
    catalog,
    rows: response.data,
    endDate: response.meta.end_date,
    generatedAt: fetchedAt,
    sources: {
      catalog: { url: CATALOG, fetchedAt },
      rankings: {
        url: RANKINGS,
        asOf: response.meta.as_of,
        via,
        ...(via === 'mirror' ? { mirror: MIRROR_REPO } : {}),
      },
    },
  });

  if (data.coverage < MIN_COVERAGE) {
    console.error(`only ${(data.coverage * 100).toFixed(1)}% of the week's tokens joined a price. Not writing.`);
    process.exitCode = 1;
    return;
  }
  writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(
    `${data.weeks[0].start}..${data.weeks.at(-1)!.end}: ${data.providers.length} providers, ${data.models.length} models, ` +
      `join ${(data.coverage * 100).toFixed(1)}%, as_of ${data.sources.rankings.asOf} (${via}) → ${OUT}`,
  );
}

await main();
