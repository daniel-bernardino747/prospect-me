/**
 * The data behind "Conta de tokens", gathered once by `scripts/conta-de-tokens.ts`
 * (see `build.ts`), and every rule the page computes from it. Pure: the server
 * render, the client and the tests all call the same functions.
 *
 * Two public sources:
 * - OpenRouter's model catalog: prices in US$ per token, turned into US$ per
 *   million here.
 * - OpenRouter's daily token totals for the top 50 models (CC BY 4.0), summed
 *   into seven-day weeks ending on the last complete day.
 */

/** US$ per million tokens. `cacheRead` is null when the catalog has no cache price. */
export interface Prices {
  input: number;
  cacheRead: number | null;
  output: number;
}

/**
 * - `paid`: priced in the catalog, billed by the formula.
 * - `free`: a `:free` variant (or a model the catalog prices at zero): US$ 0, with limits.
 * - `stealth`: an unidentified model under `stealth/`.
 * - `unpriced`: ranked, but no longer in the price catalog.
 */
export type ModelKind = 'paid' | 'free' | 'stealth' | 'unpriced';

export interface Model {
  /** The ranking's permaslug, or the catalog id of a reference model not ranked this week. */
  key: string;
  /** The catalog id without `:free`/`:batch`; null when the catalog does not have it. */
  id: string | null;
  name: string;
  provider: string;
  kind: ModelKind;
  /** Share of all the week's tokens (top 50 plus "other"); null when not ranked. */
  share: number | null;
  prices: Prices | null;
}

export interface Provider {
  slug: string;
  label: string;
  /** Tokens per week, aligned with `weeks`. */
  tokens: number[];
}

export interface ContaDeTokens {
  generatedAt: string;
  sources: {
    catalog: { url: string; fetchedAt: string };
    rankings: {
      /** The official endpoint the data comes from (or mirrors). */
      url: string;
      /** The dataset's own `meta.as_of`, quoted in the attribution line. */
      asOf: string;
      /** Where the bytes were read: the official API, or a public copy of its raw responses. */
      via: 'openrouter' | 'mirror';
      mirror?: string;
    };
  };
  /** Seven-day windows, oldest first; the last ends on the last complete UTC day. */
  weeks: { start: string; end: string }[];
  /** Every provider ranked in any week, without the dataset's "other" row. */
  providers: Provider[];
  /** All tokens per week, "other" included: the denominator of every share. */
  totals: number[];
  /** Every model ranked in the last week, plus the reference models. */
  models: Model[];
  /** Share of the last week's tokens that came from `:free` variants. */
  freeShare: number;
  /** Share of the last week's tokens whose model joined the price catalog. */
  coverage: number;
}

// ---------------------------------------------------------------------------
// Scenario

export const VOLUMES = { '100m': 1e8, '1b': 1e9, '10b': 1e10 } as const;
export type Volume = keyof typeof VOLUMES;
export const VOLUME_KEYS = Object.keys(VOLUMES) as Volume[];

export const CACHE_MAX = 95;
export const OUTPUT_MIN = 5;
export const OUTPUT_MAX = 60;
export const OUTPUT_STEP = 5;

export const DEFAULT_REF = 'anthropic/claude-sonnet-5';

/** The models the brief compares against, kept on the board even when not in the top 12. */
export const REFERENCE_IDS = [
  'anthropic/claude-sonnet-5',
  'anthropic/claude-opus-5.5',
  'openai/gpt-6-sol',
  'openai/gpt-6-luna',
  'google/gemini-3.1-pro-preview',
  'google/gemini-3.8-flash',
];

/** The illustrative case the page opens on, and what it falls back to. */
export interface Scenario {
  volume: Volume;
  /** Percent of the tokens that are output, 5 to 60 in steps of 5. */
  output: number;
  /** Percent of the input served from the cache, 0 to 95. */
  cache: number;
  /** Catalog id of the reader's reference model; always a paid model. */
  ref: string;
}

export const DEFAULT_SCENARIO: Scenario = { volume: '1b', output: 20, cache: 50, ref: DEFAULT_REF };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Reads `?t=1b&s=20&ref=…&c=50`; anything invalid falls back to the default, field by field. */
export function parseScenario(
  params: Record<string, string | string[] | undefined>,
  data: Pick<ContaDeTokens, 'models'>,
): Scenario {
  const t = first(params.t);
  const volume = t && t in VOLUMES ? (t as Volume) : DEFAULT_SCENARIO.volume;

  const s = Number(first(params.s));
  const output =
    Number.isInteger(s) && s >= OUTPUT_MIN && s <= OUTPUT_MAX && s % OUTPUT_STEP === 0 ? s : DEFAULT_SCENARIO.output;

  const c = Number(first(params.c) ?? NaN);
  const cache = Number.isInteger(c) && c >= 0 && c <= CACHE_MAX ? c : DEFAULT_SCENARIO.cache;

  const r = first(params.ref);
  const ref = r && referenceOptions(data).some((m) => m.id === r) ? r : DEFAULT_SCENARIO.ref;

  return { volume, output, cache, ref };
}

export function scenarioQuery(s: Scenario): string {
  return `?t=${s.volume}&s=${s.output}&ref=${s.ref}&c=${s.cache}`;
}

/** Only paid, priced models can be the reference. */
export function referenceOptions(data: Pick<ContaDeTokens, 'models'>): Model[] {
  return data.models.filter((m): m is Model & { id: string } => m.kind === 'paid' && m.id !== null);
}

export function modelById(data: Pick<ContaDeTokens, 'models'>, id: string): Model | undefined {
  return referenceOptions(data).find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// The bill

export interface Bill {
  /** US$ for input read fresh, input read from the cache, and output. */
  uncached: number;
  cached: number;
  output: number;
  total: number;
  /** No cache price: the cache share does not change this bill. */
  frozen: boolean;
}

/**
 * input × (1 − cache) × input price + input × cache × cache price + output × output price.
 * Cache writes, long-context overrides and batch prices are out (the method note says so).
 */
export function bill(prices: Prices, s: Pick<Scenario, 'volume' | 'output' | 'cache'>): Bill {
  const millions = VOLUMES[s.volume] / 1e6;
  const input = millions * (1 - s.output / 100);
  const out = millions * (s.output / 100);
  const frozen = prices.cacheRead === null;
  const cacheShare = frozen ? 0 : s.cache / 100;
  const uncached = input * (1 - cacheShare) * prices.input;
  const cached = frozen ? 0 : input * cacheShare * (prices.cacheRead as number);
  const output = out * prices.output;
  return { uncached, cached, output, total: uncached + cached + output, frozen };
}

// ---------------------------------------------------------------------------
// Formatting (pt-BR)

const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const price = new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 4 });

/** Whole dollars; below US$ 10, one decimal. Without the "US$". */
export function usd(v: number): string {
  if (v === 0) return '0';
  if (v < 10) return oneDecimal.format(Math.round(v * 10) / 10);
  return whole.format(Math.round(v));
}

/** A price per million as the catalog gives it: `0,075`, `2`, `0,0015`. */
export const perMillion = (v: number) => price.format(v);

/** `24,6%`, `<0,1%`, `—`. */
export function sharePct(v: number | null): string {
  if (v === null) return '—';
  if (v > 0 && v < 0.001) return '<0,1%';
  return `${oneDecimal.format(Math.round(v * 1000) / 10)}%`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-09-24" → "24 set 2026" */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** "18 a 24 set", or "28 ago a 3 set" across months. */
export function weekLabel(w: { start: string; end: string }): string {
  const [, sm, sd] = w.start.split('-').map(Number);
  const [, em, ed] = w.end.split('-').map(Number);
  return sm === em ? `${sd} a ${ed} ${MONTHS[em - 1]}` : `${sd} ${MONTHS[sm - 1]} a ${ed} ${MONTHS[em - 1]}`;
}

export const monthShort = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1];

export const VOLUME_LABEL: Record<Volume, string> = { '100m': '100 mi', '1b': '1 bi', '10b': '10 bi' };
const VOLUME_WORDS: Record<Volume, string> = {
  '100m': '100 milhões de tokens',
  '1b': '1 bilhão de tokens',
  '10b': '10 bilhões de tokens',
};

// ---------------------------------------------------------------------------
// Market

const last = (xs: readonly number[]) => xs[xs.length - 1];

export function providerLabel(data: Pick<ContaDeTokens, 'providers'>, slug: string): string {
  return data.providers.find((p) => p.slug === slug)?.label ?? slug;
}

/** A provider's share of the last week's tokens; 0 when not ranked. */
export function providerShare(data: Pick<ContaDeTokens, 'providers' | 'totals'>, slug: string): number {
  const p = data.providers.find((x) => x.slug === slug);
  return p ? last(p.tokens) / last(data.totals) : 0;
}

export interface Leader {
  provider: string;
  providerShare: number;
  model: Model;
}

/**
 * The provider with the largest share of the last week (never the unidentified
 * stealth models), and its most-used paid model. A `:free` variant never leads:
 * the next paid model of that provider does.
 */
export function leader(data: Pick<ContaDeTokens, 'providers' | 'totals' | 'models'>): Leader {
  const ranked = data.providers
    .filter((p) => p.slug !== 'stealth')
    .map((p) => ({ slug: p.slug, share: providerShare(data, p.slug) }))
    .sort((a, b) => b.share - a.share);
  for (const p of ranked) {
    const model = data.models
      .filter((m) => m.provider === p.slug && m.kind === 'paid' && m.prices && m.share !== null)
      .sort((a, b) => (b.share as number) - (a.share as number))[0];
    if (model) return { provider: p.slug, providerShare: p.share, model };
  }
  throw new Error('no ranked paid model');
}

/** "32× MENOS", "1,4× MENOS", "3× MAIS"; null when the two bills are the same. */
export function ratioTag(refTotal: number, otherTotal: number): string | null {
  if (refTotal <= 0 || otherTotal <= 0) return null;
  const hi = Math.max(refTotal, otherTotal);
  const lo = Math.min(refTotal, otherTotal);
  const r = hi / lo;
  const fmt = r >= 2 ? whole.format(Math.round(r)) : oneDecimal.format(Math.round(r * 10) / 10);
  if (fmt === '1,0') return null;
  return `${fmt}× ${otherTotal < refTotal ? 'MENOS' : 'MAIS'}`;
}

// ---------------------------------------------------------------------------
// The answer sentence

export type Segment =
  | { text: string }
  /** A compared figure: set in the data face; `mark` says which decoration it takes. */
  | { fig: string; mark?: 'ref' | 'leader'; note?: 1 | 2 };

export interface Answer {
  segments: Segment[];
  ref: Model;
  refBill: Bill;
  leader: Leader;
  leaderBill: Bill;
}

/** The first viewport's sentence, generated from the data so it changes when the data does. */
export function answer(data: ContaDeTokens, s: Scenario): Answer {
  const ref = modelById(data, s.ref) ?? (modelById(data, DEFAULT_REF) as Model);
  const lead = leader(data);
  const refBill = bill(ref.prices as Prices, s);
  const leaderBill = bill(lead.model.prices as Prices, s);

  const segments: Segment[] = [];
  if (refBill.frozen) segments.push({ text: 'Sem preço de cache no catálogo, ' });
  else if (s.cache === 0) segments.push({ text: 'Sem cache, ' });
  else segments.push({ text: 'Com ' }, { fig: `${s.cache}%` }, { text: ' de cache, ' });

  const leadLabel = providerLabel(data, lead.provider);
  const refProvider = providerLabel(data, ref.provider);
  const tail = ' dos tokens do OpenRouter na última semana';

  segments.push({ text: `${VOLUME_WORDS[s.volume]} por mês custa ` });
  if (ref.id === lead.model.id) {
    segments.push(
      { fig: `US$ ${usd(refBill.total)}`, mark: 'ref', note: 1 },
      { text: ` no ${ref.name}, o modelo mais usado da ${leadLabel}, que ficou com ` },
      { fig: sharePct(lead.providerShare), note: 2 },
      { text: `${tail}.` },
    );
  } else {
    segments.push(
      { fig: `US$ ${usd(refBill.total)}`, mark: 'ref', note: 1 },
      { text: ` no ${ref.name} e ` },
      { fig: `US$ ${usd(leaderBill.total)}`, mark: 'leader' },
      { text: ` no ${lead.model.name} — e a ${leadLabel} ficou com ` },
      { fig: sharePct(lead.providerShare), note: 2 },
    );
    if (ref.provider === lead.provider) segments.push({ text: `${tail}.` });
    else {
      const refShare = providerShare(data, ref.provider);
      if (refShare === 0) segments.push({ text: `${tail}; a ${refProvider} não entrou no top 50.` });
      else segments.push({ text: `${tail}; a ${refProvider}, com ` }, { fig: sharePct(refShare) }, { text: '.' });
    }
  }
  return { segments, ref, refBill, leader: lead, leaderBill };
}

export const answerText = (a: Answer) => a.segments.map((x) => ('text' in x ? x.text : x.fig)).join('');

// ---------------------------------------------------------------------------
// The board

export interface Row {
  model: Model;
  /** Null for stealth and unpriced models; 0 for free ones. */
  bill: Bill | null;
  isRef: boolean;
  isLeader: boolean;
}

export interface Board {
  /** Paid models, ascending by bill. */
  paid: Row[];
  /** Free variants, by share: never sorted by bill, never "the cheapest". */
  free: Row[];
  /** Unidentified and unpriced models, at the end. */
  tail: Row[];
  /** How many models "Ver todos" reveals. */
  total: number;
}

export const DEFAULT_TOP = 12;

/**
 * The board's rows: by default the top 12 by weekly volume, the brief's
 * reference models and the reader's reference; with `all`, every model.
 */
export function board(data: ContaDeTokens, s: Scenario, all: boolean): Board {
  const lead = leader(data);
  const ranked = data.models
    .filter((m) => m.share !== null)
    .sort((a, b) => (b.share as number) - (a.share as number));
  const top = new Set(ranked.slice(0, DEFAULT_TOP).map((m) => m.key));
  const keep = (m: Model) =>
    all || top.has(m.key) || (m.id !== null && m.kind === 'paid' && (REFERENCE_IDS.includes(m.id) || m.id === s.ref));

  // A reference model is listed once, even when both its ranked row and its id qualify.
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const m of data.models) {
    if (!keep(m)) continue;
    const dedupe = m.kind === 'paid' && m.id ? m.id : m.key;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    rows.push({
      model: m,
      bill: m.kind === 'paid' && m.prices ? bill(m.prices, s) : m.kind === 'free' ? ZERO : null,
      isRef: m.kind === 'paid' && m.id === s.ref,
      isLeader: m.key === lead.model.key,
    });
  }

  const byShare = (a: Row, b: Row) => (b.model.share ?? -1) - (a.model.share ?? -1);
  return {
    paid: rows
      .filter((r) => r.model.kind === 'paid')
      .sort((a, b) => (a.bill as Bill).total - (b.bill as Bill).total || a.model.name.localeCompare(b.model.name)),
    free: rows.filter((r) => r.model.kind === 'free').sort(byShare),
    tail: rows.filter((r) => r.model.kind === 'stealth' || r.model.kind === 'unpriced').sort(byShare),
    total: countAll(data),
  };
}

const ZERO: Bill = { uncached: 0, cached: 0, output: 0, total: 0, frozen: true };

function countAll(data: ContaDeTokens): number {
  return new Set(data.models.map((m) => (m.kind === 'paid' && m.id ? m.id : m.key))).size;
}

/** The flap width for a set of bills: the widest formatted value, capped at 7 cells. */
export function flapWidth(totals: readonly number[], min = 1): number {
  return Math.min(7, Math.max(min, ...totals.map((t) => usd(t).length)));
}

// ---------------------------------------------------------------------------
// The market chart

/** `ink` is the leading provider's band (or the next one when the reader's provider leads). */
export type BandTone = 'ink' | 'ref' | 'plain' | 'outros';

export interface Band {
  slug: string;
  label: string;
  /** Share per week, aligned with `weeks`. */
  shares: number[];
  tone: BandTone;
  /** 1–6 for plain bands, in stacking order; hatched when 5 or 6. */
  shade: number;
}

export const TOP_PROVIDERS = 8;

/**
 * The stacked bands, bottom-up by last-week share: the top 8 providers, the
 * reference model's provider when it is not among them, and "outros" (every
 * other provider plus the dataset's "other" row).
 */
export function bands(data: ContaDeTokens, refProvider: string): Band[] {
  const lead = leader(data).provider;
  const byLast = [...data.providers].sort((a, b) => last(b.tokens) - last(a.tokens));
  const chosen = byLast.slice(0, TOP_PROVIDERS);
  const ref = data.providers.find((p) => p.slug === refProvider);
  if (ref && !chosen.includes(ref)) chosen.push(ref);

  let shade = 0;
  const out: Band[] = chosen.map((p) => {
    const tone: BandTone = p.slug === refProvider ? 'ref' : p.slug === lead ? 'ink' : 'plain';
    return {
      slug: p.slug,
      label: p.label,
      shares: p.tokens.map((t, i) => (data.totals[i] > 0 ? t / data.totals[i] : 0)),
      tone,
      shade: tone === 'plain' ? (shade++ % 6) + 1 : 0,
    };
  });
  // The ref provider leading too: it takes the highlighter, and the next one takes ink.
  if (refProvider === lead) {
    const next = out.find((b) => b.tone === 'plain');
    if (next) {
      next.tone = 'ink';
      let n = 0;
      for (const b of out) if (b.tone === 'plain') b.shade = (n++ % 6) + 1;
    }
  }
  const outros = data.totals.map((t, i) => (t > 0 ? 1 - out.reduce((sum, b) => sum + b.shares[i], 0) : 0));
  out.push({ slug: 'outros', label: 'Outros', shares: outros.map((v) => Math.max(0, v)), tone: 'outros', shade: 0 });
  return out;
}

/** The weeks where a month label goes: the first week that ends in each month, the first week included. */
export function monthTicks(weeks: readonly { start: string; end: string }[]): { index: number; label: string }[] {
  const ticks: { index: number; label: string }[] = [];
  let prev = '';
  weeks.forEach((w, i) => {
    const m = w.end.slice(0, 7);
    if (m !== prev) {
      ticks.push({ index: i, label: monthShort(w.end) });
      prev = m;
    }
  });
  return ticks;
}
