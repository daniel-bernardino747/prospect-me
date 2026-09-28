/**
 * The intake call as state: what the ad already says, what the call adds, and
 * what it still has to answer. Pure, so the page, the exports and the tests
 * read the same thing. Nothing here leaves the browser.
 */
import { type AdView, type Dimension, isScored, type TemplateSource } from './data';
import { fieldName, headline, laneOf, questions } from './view';

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

/** What the level means for the role, at both ends of the scale. */
export const SCALE = { low: 'Very little', high: 'A great deal' } as const;

/** Notes and typed fields stay short: this is a call sheet, not a document store. */
export const MAX_TEXT = 600;

export interface DimensionAnswer {
  level: Level | null;
  note: string;
}

export interface Worksheet {
  dimensions: Record<string, DimensionAnswer>;
  /** Template fields the ad left empty, filled on the call. */
  fields: Record<string, string>;
}

/** Where a level comes from: the ad's line, the call, or nowhere yet. */
export type Source = { kind: 'ad'; lane: number | undefined; quote: string } | { kind: 'call' } | { kind: 'open' };

const isLevel = (n: unknown): n is Level => typeof n === 'number' && LEVELS.includes(n as Level);

/** The sheet before the call: the ad's levels filled in, everything else open. */
export function initialWorksheet(ad: AdView): Worksheet {
  return {
    dimensions: Object.fromEntries(
      ad.dimensions.map((d) => [d.name, { level: isScored(d) ? d.score : null, note: '' }]),
    ),
    fields: {},
  };
}

/** The fields a call can fill: the template's fields the ad does not. */
export function openFields(ad: AdView): string[] {
  return ad.brief.filter((f) => f.items.length === 0).map((f) => f.field);
}

/**
 * A stored sheet, trusted only as far as it matches this ad: unknown names are
 * dropped, levels outside 1–5 are ignored, text is trimmed to size. Anything
 * unreadable falls back to the sheet before the call.
 */
export function restoreWorksheet(raw: string | null, ad: AdView): Worksheet {
  const base = initialWorksheet(ad);
  if (!raw) return base;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!parsed || typeof parsed !== 'object') return base;
  const { dimensions, fields } = parsed as Partial<Record<keyof Worksheet, Record<string, unknown>>>;
  for (const name of Object.keys(base.dimensions)) {
    const got = dimensions?.[name] as Partial<Record<keyof DimensionAnswer, unknown>> | undefined;
    if (!got) continue;
    base.dimensions[name] = {
      level: got.level === null ? null : isLevel(got.level) ? got.level : base.dimensions[name].level,
      note: typeof got.note === 'string' ? got.note.slice(0, MAX_TEXT) : '',
    };
  }
  for (const field of openFields(ad)) {
    const value = fields?.[field];
    if (typeof value === 'string' && value.trim()) base.fields[field] = value.slice(0, MAX_TEXT);
  }
  return base;
}

export function sourceOf(ad: AdView, sheet: Worksheet, name: string): Source {
  const answer = sheet.dimensions[name];
  if (!answer || answer.level === null) return { kind: 'open' };
  const d = ad.dimensions.find((x) => x.name === name);
  // A note means the call discussed it, so the level is the call's even where it agrees with the ad.
  if (d && isScored(d) && d.score === answer.level && !answer.note.trim()) {
    return { kind: 'ad', lane: laneOf(d.quote, ad), quote: d.quote };
  }
  return { kind: 'call' };
}

/** The ad's questions the call has not answered yet, in the order worth asking. */
export function remaining(ad: AdView, sheet: Worksheet) {
  return questions(ad).filter((q) => sheet.dimensions[q.name]?.level == null);
}

/** "3 questions your intake call still has to answer", or that the profile is done. */
export function liveHeadline(ad: AdView, sheet: Worksheet): { count: number; text: string } {
  const count = remaining(ad, sheet).length;
  return { count, text: count === 0 ? 'Role Fit Profile ready' : headline(count).replace(/^\d+ /, '') };
}

/** Whether the call has changed anything, so an untouched page stays as it opened. */
export function isTouched(ad: AdView, sheet: Worksheet): boolean {
  return JSON.stringify(sheet) !== JSON.stringify(initialWorksheet(ad));
}

export interface ProfileRow {
  name: string;
  description: string;
  level: Level | null;
  source: Source;
  note: string;
}

/** The Role Fit Profile, one row per published dimension, in Techifide's order. */
export function profileRows(ad: AdView, sheet: Worksheet, dimensions: readonly Dimension[]): ProfileRow[] {
  return dimensions.map((dim) => ({
    name: dim.name,
    description: dim.description,
    level: sheet.dimensions[dim.name]?.level ?? null,
    source: sourceOf(ad, sheet, dim.name),
    note: sheet.dimensions[dim.name]?.note.trim() ?? '',
  }));
}

export interface BriefRow {
  field: string;
  values: { text: string; from: string }[];
}

/** The template, filled: the ad's items with their lane, then what the call added. */
export function briefRows(ad: AdView, sheet: Worksheet): BriefRow[] {
  return ad.brief.map((f) => {
    const values = f.items.map((i) => {
      const lane = laneOf(i.quote, ad);
      return { text: i.value, from: lane === undefined ? 'the ad' : `the ad, line ${lane}` };
    });
    const typed = sheet.fields[f.field]?.trim();
    if (typed) values.push({ text: typed, from: 'the call' });
    return { field: fieldName(f.field), values };
  });
}

/** "the ad, L07" or "the call": where a level came from, for the exports. */
export const fromLabel = (s: Source) =>
  s.kind === 'ad' ? `the ad${s.lane === undefined ? '' : `, line ${s.lane}`}` : s.kind === 'call' ? 'the call' : '';

/** The whole sheet as plain text, to paste into an e-mail. */
export function exportText(
  ad: AdView,
  sheet: Worksheet,
  dimensions: readonly Dimension[],
  template: Pick<TemplateSource, 'url'>,
): string {
  const lines = [`${ad.title}: vacancy brief and Role Fit Profile`, `Ad: ${ad.url}`, '', 'VACANCY BRIEF (Techi-job-offer template)'];
  for (const row of briefRows(ad, sheet)) {
    lines.push(`${row.field}: ${row.values.length ? row.values.map((v) => `${v.text} (${v.from})`).join('; ') : 'to confirm'}`);
  }
  lines.push('', 'ROLE FIT PROFILE (1 = very little, 5 = a great deal)');
  for (const row of profileRows(ad, sheet, dimensions)) {
    const level = row.level === null ? 'to confirm' : `${row.level}/5 (from ${fromLabel(row.source)})`;
    lines.push(`${row.name}: ${level}${row.note ? `. ${row.note}` : ''}`);
  }
  lines.push('', `Template: ${template.url}`, 'Prepared in an independent prototype by Daniel Bernardino; nothing here was sent anywhere.');
  return lines.join('\n');
}

