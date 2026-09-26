/**
 * The shape of `data.json` and every rule the page applies to it. Pure: no I/O,
 * no React, so the fetch script, the server render and the browser share one
 * reading of the ONS numbers (and Vitest checks it).
 */

/** ONS `cod_razaorestricao`. PAR (parecer de acesso) is grouped with the grid. */
export type Reason = 'ENE' | 'CNF' | 'REL' | 'PAR';
/** The two lamp glasses: surplus energy in the system, or a grid that could not carry it. */
export type Glass = 'sobra' | 'rede';

export const REASONS: readonly Reason[] = ['ENE', 'CNF', 'REL', 'PAR'];
export const glassOf = (r: Reason): Glass => (r === 'ENE' ? 'sobra' : 'rede');

/** Half hours in a day: `din_instante` 00:00 … 23:30. */
export const PATAMARES = 48;

export interface Point {
  /** ONS `id_ons`. */
  id: string;
  name: string;
  source: 'eol' | 'fv';
  uf: string;
  /** `nom_pontoconexao`, the substation it connects to. */
  sub: string | null;
  /** Projected position in the map's viewBox; null when it falls outside the frame. */
  x: number | null;
  y: number | null;
}

/** One named restriction, deduplicated by its short label and reason across the whole range. */
export interface CatalogEntry {
  label: string;
  reason: Reason;
  /** Every `dsc_restricao` text folded into this label, verbatim. */
  full: string[];
}

export interface DayRestriction {
  /** Index into `catalog`. */
  c: number;
  /** MWh cut under it over the day. */
  mwh: number;
  /** MW cut under it per patamar (rounded). */
  mw: number[];
  /** Indexes into `points` it cut at least once that day. */
  points: number[];
}

/**
 * One point on one day, encoded (see `encodeLamp`): the point's max reference
 * MW that day, then 48 reference levels, 48 cut levels and 48 restriction
 * indexes, each run-length encoded. Levels are for drawing only; every number
 * the page prints comes from the exact totals beside it.
 */
export interface DayPoint {
  lamp: string;
  /** MWh cut and MWh it could produce over the day (exact, rounded to MWh). */
  cutMwh: number;
  refMwh: number;
}

export interface Day {
  date: string;
  cutMwh: number;
  genMwh: number;
  refMwh: number;
  byReason: Record<Reason, number>;
  /** MWh cut per UF. */
  byUf: Record<string, number>;
  /** National MW per patamar: what could be produced, and what was cut per glass. */
  refMw: number[];
  sobraMw: number[];
  redeMw: number[];
  /** MW cut per UF per patamar. */
  ufMw: Record<string, number[]>;
  restrictions: DayRestriction[];
  /** Keyed by index into `points`; a point missing from the day's files is absent. */
  points: Record<string, DayPoint>;
}

export interface MapGeometry {
  width: number;
  height: number;
  /** Height of the plate rail: the sea band at the top that holds no land and no lamp. */
  rail: number;
  /** One stepped path per UF, and its tile centroid (for the UF plate). */
  ufs: { uf: string; d: string; cx: number; cy: number }[];
  /** UF borders and coast, along tile edges. */
  borders: string;
  /** The tile lattice, all lines. */
  seams: string;
}

export interface CurtailmentData {
  fetchedAt: string;
  sources: { onsModified: string; sigaModified: string; firstDay: string; lastDay: string };
  map: MapGeometry;
  points: Point[];
  catalog: CatalogEntry[];
  days: Day[];
}

// ---------------------------------------------------------------------------
// Lamp encoding

/** 64 JSON-safe symbols, no digits (digits are run lengths) and no `|` or `_`. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-./';
const INDEX = new Map([...ALPHABET].map((c, i) => [c, i]));
export const LEVELS = ALPHABET.length - 1;
/** Restriction slot meaning "no restriction in this patamar". */
const NONE = '_';

function rle(symbols: string[]): string {
  let out = '';
  for (let i = 0; i < symbols.length; ) {
    let j = i + 1;
    while (j < symbols.length && symbols[j] === symbols[i]) j++;
    out += symbols[i] + (j - i > 1 ? String(j - i) : '');
    i = j;
  }
  return out;
}

function unrle(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    const c = s[i++];
    let n = '';
    while (i < s.length && s[i] >= '0' && s[i] <= '9') n += s[i++];
    for (let k = n ? Number(n) : 1; k > 0; k--) out.push(c);
  }
  return out;
}

/** A value's level against the point's max: zero only when the value is zero. */
export function level(value: number, max: number): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(LEVELS, Math.max(1, Math.round((value / max) * LEVELS)));
}

export interface Lamp {
  /** Max MW the point could produce in any patamar of the day. */
  max: number;
  /** MW it could produce, per patamar (from levels: for drawing). */
  ref: number[];
  /** MW cut, per patamar (from levels, never above `ref`). */
  cut: number[];
  /** Index into the day's `restrictions`, or -1. */
  restriction: number[];
}

export function encodeLamp(ref: number[], cut: number[], restriction: number[]): string {
  const max = Math.ceil(Math.max(0, ...ref));
  if (restriction.some((r) => r >= ALPHABET.length)) throw new Error('more restrictions in a day than the alphabet holds');
  return [
    String(max),
    rle(ref.map((v) => ALPHABET[level(v, max)])),
    rle(cut.map((v) => ALPHABET[level(v, max)])),
    rle(restriction.map((r) => (r < 0 ? NONE : ALPHABET[r]))),
  ].join('|');
}

export function decodeLamp(encoded: string): Lamp {
  const [maxText, refs, cuts, restrictions] = encoded.split('|');
  const max = Number(maxText);
  const value = (c: string) => ((INDEX.get(c) ?? 0) / LEVELS) * max;
  const ref = unrle(refs).map(value);
  const cut = unrle(cuts).map((c, i) => Math.min(value(c), ref[i]));
  const restriction = unrle(restrictions).map((c) => (c === NONE ? -1 : (INDEX.get(c) ?? -1)));
  if (ref.length !== PATAMARES || cut.length !== PATAMARES || restriction.length !== PATAMARES) {
    throw new Error(`lamp does not hold ${PATAMARES} patamares`);
  }
  return { max, ref, cut, restriction };
}

// ---------------------------------------------------------------------------
// Restriction names

/**
 * The part of a `dsc_restricao` a reporter can cite: the line, flow or equipment,
 * without the ONS procedure codes, SGI numbers and circuit tags. Anything the
 * rules cannot shorten comes back cleaned, never invented.
 */
export function shortRestriction(dsc: string): string {
  let s = dsc.replace(/\s+/g, ' ').trim();
  const original = s;
  s = s
    .replace(/^Controle d[eo] (inequação|fluxo)\s*:\s*/i, '')
    .replace(/^SGI [\d.\-]+\s*:\s*/i, '')
    .replace(/^[\d.]+-\d\d\s*-\s*/, '')
    .replace(/^[A-Z0-9_.*()\-<>=+ ]+? # /, '')
    .replace(/^Ambas - /, '')
    .replace(/^LIMITAÇÃO DA TRANSMISSÃO (NA|NAS|DA|DAS) /i, '')
    .replace(/^LIMITAÇÃO DO /i, '')
    .replace(/^CONTROLE DE CARREGAMENTO D(A|AS|O|OS) /i, '')
    .replace(/\s*(-\s*)?(Conforme )?SGI\b.*$/i, '')
    .replace(/,?\s*conforme SGI.*$/i, '')
    .replace(/\s+-\s+IO-[A-Z.0-9]+.*$/, '')
    .replace(/\s+e MOP .*$/i, '')
    .replace(/\s*[–-]\s*C\d\([A-Z0-9]+\)/g, '')
    .replace(/\s+E\s+C\d\([A-Z0-9]+\)/g, '')
    .replace(/\s*\(0\d[A-Z0-9]+\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s.,;-]+$/, '')
    .trim();
  if (s.length < 4) s = original.replace(/[\s.]+$/, '');
  return s.replace(/(\d)\s*KV\b/gi, '$1 kV');
}

/** Engraved caps that keep `kV` in its correct case. */
export function engrave(label: string): string {
  return label.toLocaleUpperCase('pt-BR').replace(/(\d) KV\b/g, '$1 kV');
}

// ---------------------------------------------------------------------------
// Formatting (pt-BR)

const fmt = (digits: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const f0 = fmt(0);
const f1 = fmt(1);

/** MWh → "399,9 GWh" */
export const gwh = (mwh: number) => `${f1.format(mwh / 1000)} GWh`;
/** MWh → "400" (whole GWh, for the sentence) */
export const gwhWhole = (mwh: number) => f0.format(mwh / 1000);
/** "40.740 MW"; a nonzero value under 1 MW never prints as 0. */
export function mw(v: number): string {
  if (v > 0 && v < 1) return '< 1 MW';
  return `${f0.format(v)} MW`;
}
/**
 * Whole percent in prose, truncated: "82%" for 82,5%, so a share is never
 * stated above what the data holds (the approved sentence reads 82%).
 */
export const pctWhole = (share: number) => `${Math.floor(share * 100 + 1e-9)}%`;
export const pctFine = (share: number) => `${f1.format(share * 100)}%`;

/** Index → "10h30" (prose) */
export function hourProse(i: number): string {
  const h = Math.floor(i / 2);
  return `${String(h).padStart(2, '0')}h${i % 2 ? '30' : '00'}`;
}
/** Index → "10:30" (the clock) */
export function hourClock(i: number): string {
  const h = Math.floor(i / 2);
  return `${String(h).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const WEEKDAY_ABBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();
/** "2026-08-16" → "Domingo, 16 de agosto de 2026" */
export function longDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const w = WEEKDAYS[weekday(date)];
  return `${w[0].toUpperCase()}${w.slice(1)}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}
/** "2026-08-16" → "16/08/2026" */
export const dateBr = (date: string) => date.split('-').reverse().join('/');
/** "2026-08-16" → "16/08" */
export const dayMonth = (date: string) => date.slice(8, 10) + '/' + date.slice(5, 7);
/** "2026-08-16" → "DOM · 16/08/2026" */
export const plateDate = (date: string) => `${WEEKDAY_ABBR[weekday(date)]} · ${dateBr(date)}`;

// ---------------------------------------------------------------------------
// The sentences

export const cutMw = (day: Day, i: number) => day.sobraMw[i] + day.redeMw[i];

/** The patamar with the most MW cut; the earliest on a tie. */
export function peakIndex(day: Day): number {
  let best = 0;
  for (let i = 1; i < PATAMARES; i++) if (cutMw(day, i) > cutMw(day, best)) best = i;
  return best;
}

/** Share of what could be produced that was cut, in a patamar; null when nothing could be produced. */
export function cutShare(day: Day, i: number): number | null {
  return day.refMw[i] > 0 ? cutMw(day, i) / day.refMw[i] : null;
}

export const sobraShare = (day: Day) => (day.cutMwh > 0 ? day.byReason.ENE / day.cutMwh : 0);

/**
 * How the day's cut compares with what was generated, in words that stay true
 * for any day: "quase o mesmo tanto" only within 5%.
 */
export function comparedWithGenerated(cutMwh: number, genMwh: number): string {
  if (genMwh <= 0) return 'sem geração registrada no dia';
  const ratio = cutMwh / genMwh;
  if (Math.abs(ratio - 1) <= 0.05) return `quase o mesmo tanto que geraram (${gwhWhole(genMwh)} GWh)`;
  if (ratio > 1) return `mais do que geraram (${gwhWhole(genMwh)} GWh)`;
  return `o equivalente a ${pctWhole(ratio)} do que geraram (${gwhWhole(genMwh)} GWh)`;
}

export interface Answer {
  /** Before the cut figure. */
  lead: string;
  cut: string;
  /** Between the cut figure and the generated figure. */
  middle: string;
  gen: string | null;
  tail: string;
}

/**
 * The h1, in parts so the two figures can be marked. For 16/08/2026: "Domingo,
 * 16 de agosto de 2026: eólicas e solares deixaram de gerar 400 GWh por ordem
 * do ONS, quase o mesmo tanto que geraram (401 GWh)."
 */
export function answer(day: Day): Answer {
  const lead = `${longDate(day.date)}: eólicas e solares deixaram de gerar `;
  const cut = `${gwhWhole(day.cutMwh)} GWh`;
  const compared = comparedWithGenerated(day.cutMwh, day.genMwh);
  const m = /^(.*\()([\d.,]+ GWh)(\))$/.exec(compared);
  if (!m) return { lead, cut, middle: ` por ordem do ONS, ${compared}`, gen: null, tail: '.' };
  return { lead, cut, middle: ` por ordem do ONS, ${m[1]}`, gen: m[2], tail: `${m[3]}.` };
}

export interface Deck {
  hour: string;
  peakShare: string;
  first: string;
  reasonShare: string;
  second: string;
}

/**
 * The second sentence, which opens POR QUÊ: the peak, and which reason carried
 * the day. When the grid carried most of it, the sentence says so instead.
 */
export function deck(day: Day): Deck {
  const peak = peakIndex(day);
  const share = cutShare(day, peak) ?? 0;
  const sobra = sobraShare(day);
  const bySobra = sobra >= 0.5;
  return {
    hour: hourProse(peak),
    peakShare: pctWhole(share),
    first: ' do que podiam produzir estava cortado. E ',
    reasonShare: pctWhole(bySobra ? sobra : 1 - sobra),
    second: bySobra
      ? ' do corte do dia foi por sobra de energia no sistema, não por falta de linha.'
      : ' do corte do dia foi porque a rede não aguentou, não por sobra de energia.',
  };
}

// ---------------------------------------------------------------------------
// The board

/** Lamp scale for a day, in viewBox units: the largest point's bezel is 13. */
export function lampScale(day: Day): number {
  let max = 0;
  for (const p of Object.values(day.points)) max = Math.max(max, Number(p.lamp.slice(0, p.lamp.indexOf('|'))));
  return max > 0 ? 13 / Math.sqrt(max) : 0;
}

export const bezelRadius = (k: number, max: number) => Math.max(2.5, k * Math.sqrt(max));
export const discRadius = (k: number, mwValue: number) => (mwValue > 0 ? k * Math.sqrt(mwValue) : 0);

/** Top restrictions for the annunciator: up to `slots`, the last folding the rest. */
export interface Window {
  /** Index into the day's restrictions, or null for "Outras restrições". */
  restriction: number | null;
  label: string;
  reason: Reason | null;
  mwh: number;
  mw: number[];
  points: number[];
  /** How many restrictions the "outras" window folds. */
  folded: number;
}

export function annunciator(day: Day, catalog: readonly CatalogEntry[], slots = 6): Window[] {
  const all = day.restrictions.map((r, i) => ({ r, i })).sort((a, b) => b.r.mwh - a.r.mwh);
  const own = (x: { r: DayRestriction; i: number }): Window => ({
    restriction: x.i,
    label: catalog[x.r.c].label,
    reason: catalog[x.r.c].reason,
    mwh: x.r.mwh,
    mw: x.r.mw,
    points: x.r.points,
    folded: 0,
  });
  if (all.length <= slots) return all.map(own);
  const shown = all.slice(0, slots - 1).map(own);
  const rest = all.slice(slots - 1);
  const reasons = new Set(rest.map((x) => catalog[x.r.c].reason));
  shown.push({
    restriction: null,
    label: `Outras restrições (${rest.length})`,
    reason: reasons.size === 1 ? [...reasons][0] : null,
    mwh: rest.reduce((s, x) => s + x.r.mwh, 0),
    mw: Array.from({ length: PATAMARES }, (_, t) => rest.reduce((s, x) => s + x.r.mw[t], 0)),
    points: [...new Set(rest.flatMap((x) => x.r.points))].sort((a, b) => a - b),
    folded: rest.length,
  });
  return shown;
}

/** Heat ramp stop (0–4) for a national MW cut: thresholds 0, 5, 15, 25, 35 GW. */
export function heat(mwValue: number): 0 | 1 | 2 | 3 | 4 {
  if (mwValue >= 35_000) return 4;
  if (mwValue >= 25_000) return 3;
  if (mwValue >= 15_000) return 2;
  if (mwValue >= 5_000) return 1;
  return 0;
}

/** The days with the most cut, worst first. */
export function worstDays(days: readonly Day[], n: number): Day[] {
  return [...days].sort((a, b) => b.cutMwh - a.cutMwh).slice(0, n);
}

/** Whether the day selector may say "Os domingos acendem primeiro." */
export function sundaysLead(days: readonly Day[]): boolean {
  return worstDays(days, 5).filter((d) => weekday(d.date) === 0).length >= 2;
}

/** The complete Monday–Sunday week with the most cut, or null if none fits in the range. */
export function worstWeek(days: readonly Day[]): { from: string; to: string; cutMwh: number; refMwh: number } | null {
  const byDate = new Map(days.map((d) => [d.date, d]));
  let best: { from: string; to: string; cutMwh: number; refMwh: number } | null = null;
  for (const d of days) {
    if (weekday(d.date) !== 1) continue;
    const week: Day[] = [];
    for (let k = 0; k < 7; k++) {
      const date = new Date(Date.parse(`${d.date}T12:00:00Z`) + k * 86_400_000).toISOString().slice(0, 10);
      const day = byDate.get(date);
      if (day) week.push(day);
    }
    if (week.length < 7) continue;
    const cutMwh = week.reduce((s, x) => s + x.cutMwh, 0);
    if (!best || cutMwh > best.cutMwh) {
      best = { from: week[0].date, to: week[6].date, cutMwh, refMwh: week.reduce((s, x) => s + x.refMwh, 0) };
    }
  }
  return best;
}

/** The day `?dia=` asks for, or the default; `found` is false when it asked for one that is not there. */
export function pickDay(days: readonly Day[], asked: string | string[] | undefined, fallback: string) {
  const want = Array.isArray(asked) ? asked[0] : asked;
  const hit = want ? days.find((d) => d.date === want) : undefined;
  const day = hit ?? days.find((d) => d.date === fallback) ?? days[0];
  return { day, found: !want || Boolean(hit) };
}

/** Problems that must fail the build instead of shipping a broken page. */
export function dataProblems(data: CurtailmentData): string[] {
  const problems: string[] = [];
  if (!data.days?.length) return ['no days'];
  if (!data.points?.length) problems.push('no points');
  for (const d of data.days) {
    for (const key of ['refMw', 'sobraMw', 'redeMw'] as const) {
      if (d[key]?.length !== PATAMARES) problems.push(`${d.date}: ${key} does not hold ${PATAMARES} patamares`);
    }
    for (const [i, p] of Object.entries(d.points)) {
      if (!data.points[Number(i)]) problems.push(`${d.date}: point ${i} is not in points`);
      try {
        const lamp = decodeLamp(p.lamp);
        if (lamp.restriction.some((r) => r >= d.restrictions.length)) problems.push(`${d.date}: point ${i} names a missing restriction`);
      } catch (e) {
        problems.push(`${d.date}: point ${i}: ${(e as Error).message}`);
      }
    }
    for (const r of d.restrictions) if (!data.catalog[r.c]) problems.push(`${d.date}: restriction ${r.c} is not in the catalog`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Aggregation: from ONS rows to `days` (used by the fetch script; pure, so Vitest
// checks the MWmed → MWh conversion, the reason split and the deduplication).

/** One ONS row: one point, one half hour. MW values are the file's MWmed. */
export interface OnsRow {
  /** Index into `points`. */
  point: number;
  /** "AAAA-MM-DD" */
  date: string;
  /** Patamar 0–47 (00h00 … 23h30). */
  t: number;
  ref: number;
  cut: number;
  gen: number;
  reason: Reason | null;
  dsc: string | null;
}

/** Label for a cut the ONS gave a reason but no text for (none in Aug–Sep 2026, guarded). */
export const NO_TEXT = 'Sem descrição do ONS';

const zeros = () => new Array<number>(PATAMARES).fill(0);
/** A half hour at P MWmed is P/2 MWh. */
const mwh = (sumMw: number) => sumMw / 2;

export class Catalog {
  readonly entries: CatalogEntry[] = [];
  private readonly byKey = new Map<string, number>();

  /** The entry a cut row belongs to: same reason, same citable label. */
  index(reason: Reason, dsc: string | null): number {
    const text = dsc?.replace(/\s+/g, ' ').trim() || null;
    const label = text ? shortRestriction(text) : NO_TEXT;
    const key = `${reason}|${label.toLocaleLowerCase('pt-BR')}`;
    let i = this.byKey.get(key);
    if (i === undefined) {
      i = this.entries.length;
      this.entries.push({ label, reason, full: [] });
      this.byKey.set(key, i);
    }
    const entry = this.entries[i];
    if (text && !entry.full.includes(text)) entry.full.push(text);
    return i;
  }
}

/**
 * Every complete day in `rows` (48 patamares), oldest first. A row with a cut
 * but no reason is an error: the page could not say why, and would have to guess.
 */
export function buildDays(rows: readonly OnsRow[], points: readonly Point[], catalog: Catalog): Day[] {
  const byDate = new Map<string, OnsRow[]>();
  for (const r of rows) {
    if (r.t < 0 || r.t >= PATAMARES || !Number.isInteger(r.t)) throw new Error(`${r.date}: patamar ${r.t} out of range`);
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  }
  const days: Day[] = [];
  for (const date of [...byDate.keys()].sort()) {
    const dayRows = byDate.get(date)!;
    if (new Set(dayRows.map((r) => r.t)).size !== PATAMARES) continue;
    days.push(buildDay(date, dayRows, points, catalog));
  }
  return days;
}

export function buildDay(date: string, rows: readonly OnsRow[], points: readonly Point[], catalog: Catalog): Day {
  const refMw = zeros();
  const sobraMw = zeros();
  const redeMw = zeros();
  const ufMw: Record<string, number[]> = {};
  const byReason: Record<Reason, number> = { ENE: 0, CNF: 0, REL: 0, PAR: 0 };
  const byUf: Record<string, number> = {};
  let cutSum = 0;
  let genSum = 0;
  let refSum = 0;

  interface Acc { ref: number[]; cut: number[]; cat: number[] }
  const perPoint = new Map<number, Acc>();
  const perCat = new Map<number, { mw: number[]; points: Set<number> }>();

  for (const r of rows) {
    const p = points[r.point];
    if (!p) throw new Error(`${date}: row for unknown point ${r.point}`);
    const ref = Math.max(0, r.ref);
    const cut = Math.max(0, r.cut);
    const gen = Math.max(0, r.gen);
    refSum += ref;
    genSum += gen;
    refMw[r.t] += ref;

    let acc = perPoint.get(r.point);
    if (!acc) {
      acc = { ref: zeros(), cut: zeros(), cat: new Array<number>(PATAMARES).fill(-1) };
      perPoint.set(r.point, acc);
    }
    acc.ref[r.t] += ref;

    if (cut > 0) {
      if (!r.reason) throw new Error(`${date} ${hh(r.t)}: ${p.id} was cut with no reason`);
      cutSum += cut;
      byReason[r.reason] += cut;
      byUf[p.uf] = (byUf[p.uf] ?? 0) + cut;
      (ufMw[p.uf] ??= zeros())[r.t] += cut;
      if (r.reason === 'ENE') sobraMw[r.t] += cut;
      else redeMw[r.t] += cut;
      acc.cut[r.t] += cut;
      const c = catalog.index(r.reason, r.dsc);
      acc.cat[r.t] = c;
      let pc = perCat.get(c);
      if (!pc) {
        pc = { mw: zeros(), points: new Set() };
        perCat.set(c, pc);
      }
      pc.mw[r.t] += cut;
      pc.points.add(r.point);
    }
  }

  // The day's restrictions, most MWh first; lamps point into this order.
  const restrictions: DayRestriction[] = [...perCat.entries()]
    .map(([c, v]) => ({
      c,
      mwh: Math.round(mwh(v.mw.reduce((s, x) => s + x, 0))),
      mw: v.mw.map((x) => Math.round(x)),
      points: [...v.points].sort((a, b) => a - b),
    }))
    .sort((a, b) => b.mwh - a.mwh || a.c - b.c);
  const slot = new Map(restrictions.map((r, i) => [r.c, i]));

  const dayPoints: Record<string, DayPoint> = {};
  for (const [i, acc] of [...perPoint.entries()].sort((a, b) => a[0] - b[0])) {
    dayPoints[i] = {
      lamp: encodeLamp(acc.ref, acc.cut, acc.cat.map((c) => (c < 0 ? -1 : slot.get(c)!))),
      cutMwh: Math.round(mwh(acc.cut.reduce((s, x) => s + x, 0))),
      refMwh: Math.round(mwh(acc.ref.reduce((s, x) => s + x, 0))),
    };
  }

  const round = (xs: number[]) => xs.map((x) => Math.round(x));
  return {
    date,
    cutMwh: Math.round(mwh(cutSum)),
    genMwh: Math.round(mwh(genSum)),
    refMwh: Math.round(mwh(refSum)),
    byReason: {
      ENE: Math.round(mwh(byReason.ENE)),
      CNF: Math.round(mwh(byReason.CNF)),
      REL: Math.round(mwh(byReason.REL)),
      PAR: Math.round(mwh(byReason.PAR)),
    },
    byUf: Object.fromEntries(Object.entries(byUf).map(([uf, v]) => [uf, Math.round(mwh(v))])),
    refMw: round(refMw),
    sobraMw: round(sobraMw),
    redeMw: round(redeMw),
    ufMw: Object.fromEntries(Object.entries(ufMw).map(([uf, v]) => [uf, round(v)])),
    restrictions,
    points: dayPoints,
  };
}

function hh(t: number) {
  return `${String(Math.floor(t / 2)).padStart(2, '0')}:${t % 2 ? '30' : '00'}`;
}
