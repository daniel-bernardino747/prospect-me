/**
 * What the page shows for one ad, decided here so it can be tested: the role
 * in a line, the must-haves, and the intake questions in the order they are
 * worth asking. The headline counts questions, never coverage (the dossier's
 * critique: "X of 11" reads as the ad failing).
 */
import { type AdView, type BriefItem, isScored, type OpenDimension } from './data';
import type { Overrides } from './overrides';

/** The template field whose items are the must-haves. */
export const MUST_HAVE_FIELD = 'Essential Experience/ Attributes';

/** Questions shown before the reader scrolls. */
export const FIRST_QUESTIONS = 3;

export function applyOverrides(ad: AdView, overrides: Overrides): AdView {
  const own = overrides[ad.key];
  if (!own) return ad;
  return {
    ...ad,
    dimensions: ad.dimensions.map((d) => {
      const o = own.questions?.[d.name];
      return !o || isScored(d) ? d : { ...d, question: o.question ?? d.question, rank: o.rank ?? d.rank };
    }),
    contradictions: ad.contradictions.map((c) => ({ ...c, note: own.contradictions?.[c.quotes[0]] ?? c.note })),
  };
}

/** The dimensions the ad leaves to the call, most useful first; ties keep Techifide's order. */
export function questions(ad: AdView): OpenDimension[] {
  return ad.dimensions
    .map((d, i) => ({ d, i }))
    .filter((x): x is { d: OpenDimension; i: number } => !isScored(x.d))
    .sort((a, b) => a.d.rank - b.d.rank || a.i - b.i)
    .map((x) => x.d);
}

export function mustHaves(ad: AdView): BriefItem[] {
  return ad.brief.find((f) => f.field === MUST_HAVE_FIELD)?.items ?? [];
}

const EMPLOYMENT: Record<string, string> = {
  FULL_TIME: 'full time',
  PART_TIME: 'part time',
  CONTRACTOR: 'contract',
  TEMPORARY: 'temporary',
};

/** "Senior / Staff Fullstack Software Engineer · remote, Brazil · full time", from the listing. */
export function roleLine(ad: Pick<AdView, 'title' | 'listing'>): string {
  const { listing } = ad;
  const where = listing.remote
    ? `remote${listing.applicantCountry ? `, ${listing.applicantCountry}` : ''}`
    : listing.location;
  const kind = listing.employmentType ? (EMPLOYMENT[listing.employmentType] ?? null) : null;
  return [ad.title, where, kind].filter(Boolean).join(' · ');
}

export interface FirstScreen {
  role: string;
  mustHaves: BriefItem[];
  count: number;
  first: OpenDimension[];
  rest: OpenDimension[];
}

/** Everything above the fold on a phone, in reading order. */
export function firstScreen(ad: AdView): FirstScreen {
  const all = questions(ad);
  return {
    role: roleLine(ad),
    mustHaves: mustHaves(ad),
    count: all.length,
    first: all.slice(0, FIRST_QUESTIONS),
    rest: all.slice(FIRST_QUESTIONS),
  };
}

/** "N questions your intake call still has to answer", in the singular when it is one. */
export function headline(count: number): string {
  return `${count} ${count === 1 ? 'question' : 'questions'} your intake call still has to answer`;
}

/** The lane a quote sits on, so every claim can point at its line of the ad. */
export function laneOf(quote: string, ad: Pick<AdView, 'lanes'>): number | undefined {
  const i = ad.lanes.findIndex((l) => l.includes(quote));
  return i < 0 ? undefined : i;
}

/** "L07": two digits, so lanes line up down the page. */
export const laneLabel = (lane: number) => `L${String(lane).padStart(2, '0')}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "28 Sep 2026", spelt out by hand: ICU's en-GB says "Sept" on some runtimes only. */
export function day(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
