/**
 * Turns the two raw OpenRouter responses into `data.json`. Called only by
 * `scripts/conta-de-tokens.ts`; kept here, pure, so its rules are tested.
 * Type-only imports: the script runs this file directly under Node.
 */
import type { ContaDeTokens, Model, ModelKind, Prices, Provider } from './data';

export const WEEKS = 26;
/** Below this share of the week's tokens joined to a price, the data is not written. */
export const MIN_COVERAGE = 0.8;

const REFERENCE_IDS = [
  'anthropic/claude-sonnet-5',
  'anthropic/claude-opus-5.5',
  'openai/gpt-6-sol',
  'openai/gpt-6-luna',
  'google/gemini-3.1-pro-preview',
  'google/gemini-3.8-flash',
];

export interface CatalogModel {
  id: string;
  canonical_slug: string;
  name: string;
  pricing: { prompt: string; completion: string; input_cache_read?: string };
}

export interface RankingRow {
  date: string;
  model_permaslug: string;
  total_tokens: string;
}

export interface BuildInput {
  catalog: CatalogModel[];
  rows: RankingRow[];
  /** The last complete day the data covers (`meta.end_date`). */
  endDate: string;
  sources: ContaDeTokens['sources'];
  generatedAt: string;
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Seven-day windows ending on `endDate`, oldest first. */
export function weekWindows(endDate: string, count = WEEKS): { start: string; end: string }[] {
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const e = end - 7 * DAY * (count - 1 - i);
    return { start: iso(e - 6 * DAY), end: iso(e) };
  });
}

const suffix = /:(free|batch)$/;

/** "$0.000000075 per token" → 0.075 per million, without float noise. */
export const perMillion = (v: string) => Number((Number(v) * 1e6).toPrecision(10));

/** "Anthropic: Claude Sonnet 5" → ["Anthropic", "Claude Sonnet 5"]. */
export function splitName(name: string): [string | null, string] {
  const i = name.indexOf(': ');
  return i < 0 ? [null, name] : [name.slice(0, i), name.slice(i + 2)];
}

/**
 * The catalog model a ranking permaslug names: the permaslug without `:free`
 * is a `canonical_slug`, and of the ids sharing it the one without a
 * `:batch`/`:free` suffix is the model's list price.
 */
export function joinCatalog(permaslug: string, catalog: readonly CatalogModel[]): CatalogModel | undefined {
  const base = permaslug.replace(/:free$/, '');
  const matches = catalog.filter((m) => m.canonical_slug === base || m.id === base);
  return matches.find((m) => !suffix.test(m.id)) ?? matches[0];
}

function pricesOf(m: CatalogModel): Prices {
  const p = m.pricing;
  return {
    input: perMillion(p.prompt),
    cacheRead: p.input_cache_read === undefined ? null : perMillion(p.input_cache_read),
    output: perMillion(p.completion),
  };
}

/** "typesafe/jev-1.13-20260917" → "jev-1.13": a readable name for a model the catalog lost. */
export function nameFromSlug(slug: string): string {
  return slug.split('/').pop()!.replace(/:free$/, '').replace(/-\d{8}$/, '');
}

export function kindOf(permaslug: string, joined: CatalogModel | undefined): ModelKind {
  if (permaslug.startsWith('stealth/')) return 'stealth';
  if (permaslug.endsWith(':free')) return 'free';
  if (!joined) return 'unpriced';
  if (Number(joined.pricing.prompt) === 0 && Number(joined.pricing.completion) === 0) return 'free';
  return 'paid';
}

export function buildData(input: BuildInput): ContaDeTokens {
  const { catalog, endDate } = input;
  const weeks = weekWindows(endDate);
  const weekOf = (date: string) => weeks.findIndex((w) => date >= w.start && date <= w.end);

  const totals = weeks.map(() => 0);
  const byProvider = new Map<string, number[]>();
  const lastWeek = new Map<string, number>();

  for (const r of input.rows) {
    const i = weekOf(r.date);
    if (i < 0) continue;
    const tokens = Number(r.total_tokens);
    if (!Number.isFinite(tokens) || tokens < 0) throw new Error(`bad total_tokens for ${r.model_permaslug} on ${r.date}`);
    totals[i] += tokens;
    if (r.model_permaslug !== 'other') {
      const provider = r.model_permaslug.split('/')[0];
      const series = byProvider.get(provider) ?? weeks.map(() => 0);
      series[i] += tokens;
      byProvider.set(provider, series);
    }
    if (i === weeks.length - 1) lastWeek.set(r.model_permaslug, (lastWeek.get(r.model_permaslug) ?? 0) + tokens);
  }

  const lastTotal = totals[totals.length - 1];
  if (!(lastTotal > 0)) throw new Error(`no tokens in the last week (${weeks.at(-1)!.start}..${endDate})`);

  // Provider labels come from the catalog's own names ("DeepSeek: …").
  const labels = new Map<string, string>();
  for (const m of catalog) {
    const [label] = splitName(m.name);
    const slug = m.id.split('/')[0];
    if (label && !labels.has(slug)) labels.set(slug, label);
  }
  labels.set('stealth', 'Não identificado');

  const providers: Provider[] = [...byProvider.entries()]
    .map(([slug, tokens]) => ({ slug, label: labels.get(slug) ?? slug, tokens }))
    .sort((a, b) => b.tokens.at(-1)! - a.tokens.at(-1)! || a.slug.localeCompare(b.slug));

  let joinedTokens = 0;
  let freeTokens = 0;
  const models: Model[] = [];
  for (const [slug, tokens] of [...lastWeek.entries()].sort((a, b) => b[1] - a[1])) {
    if (slug === 'other') continue;
    const joined = slug.startsWith('stealth/') ? undefined : joinCatalog(slug, catalog);
    if (joined) joinedTokens += tokens;
    if (slug.endsWith(':free')) freeTokens += tokens;
    const kind = kindOf(slug, joined);
    models.push({
      key: slug,
      id: joined ? joined.id.replace(suffix, '') : null,
      name: kind === 'stealth' ? 'Modelo não identificado' : joined ? splitName(joined.name)[1].replace(/ \(free\)$/, '') : nameFromSlug(slug),
      provider: slug.split('/')[0],
      kind,
      share: tokens / lastTotal,
      prices: kind === 'paid' && joined ? pricesOf(joined) : null,
    });
  }

  for (const id of REFERENCE_IDS) {
    if (models.some((m) => m.kind === 'paid' && m.id === id)) continue;
    const m = catalog.find((c) => c.id === id);
    if (!m) throw new Error(`reference model ${id} is not in the catalog`);
    models.push({
      key: id,
      id,
      name: splitName(m.name)[1],
      provider: id.split('/')[0],
      kind: 'paid',
      share: null,
      prices: pricesOf(m),
    });
  }

  return {
    generatedAt: input.generatedAt,
    sources: input.sources,
    weeks,
    providers,
    totals,
    models,
    freeShare: freeTokens / lastTotal,
    coverage: joinedTokens / lastTotal,
  };
}
