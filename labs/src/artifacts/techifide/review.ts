/**
 * The review pass: code, not a model. What the extraction returns is kept only
 * where its quote is literally in the ad; a score whose quote is not becomes
 * the dimension's question, and an item or contradiction without its quote is
 * dropped. Nothing here calls the network, so a paste can run through it too.
 */
import type {
  AdSource,
  CandidateView,
  BriefField,
  Contradiction,
  Dimension,
  DimensionResult,
  ScoredDimension,
} from './data';

/** What the model returns for one ad (see `pipeline.ts` for the schema). */
export interface Extraction {
  brief: { field: string; items: { value: string; quote: string }[] }[];
  dimensions: {
    name: string;
    evidence: { score: number; quote: string; reading: string } | null;
    question: string;
    rank: number;
  }[];
  contradictions: { note: string; quotes: string[] }[];
}

/**
 * Whitespace collapsed, typographic quotes and dashes made plain, so a quote
 * the model re-typed with straight quotes still matches the ad's curly ones.
 * Case and wording are left alone: those are the quote.
 */
export function normalize(s: string): string {
  return s
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strips the ends a model tends to add or drop: outer quote marks and a final full stop. */
function core(quote: string): string {
  return normalize(quote)
    .replace(/^["']+|["']+$/g, '')
    .replace(/[.;,:]+$/, '')
    .trim();
}

/**
 * The ad's own wording for a quote, when the quote is inside one of its lines;
 * otherwise undefined. The page shows the ad's text, never the model's copy.
 */
export function findQuote(quote: string, lines: readonly string[]): string | undefined {
  const needle = core(quote);
  if (!needle) return undefined;
  // A couple of words out of a sentence would "match" almost any ad; they
  // count only when they are the whole line, as a short list item is.
  const short = needle.split(' ').length < 3;
  for (const line of lines) {
    const hay = normalize(line);
    const at = hay.indexOf(needle);
    if (at < 0 || (short && core(line) !== needle)) continue;
    // Map back to the original line: normalization only shortens whitespace
    // runs and keeps every other character one-for-one.
    return sliceOriginal(line, at, needle.length);
  }
  return undefined;
}

/** The substring of `line` whose normalized form spans [start, start + length). */
function sliceOriginal(line: string, start: number, length: number): string {
  const trimmed = line.replace(/^\s+/, '');
  const offset = line.length - trimmed.length;
  let n = 0;
  let from = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const isSpace = /\s/.test(trimmed[i]);
    if (isSpace && i > 0 && /\s/.test(trimmed[i - 1])) continue;
    if (n === start) from = i;
    n += trimmed[i] === '…' ? 3 : 1;
    if (n === start + length) return line.slice(offset + from, offset + i + 1);
  }
  return line.slice(offset + Math.max(from, 0)).trim();
}

export interface Reviewed {
  brief: BriefField[];
  dimensions: DimensionResult[];
  contradictions: Contradiction[];
  dropped: number;
}

const isScore = (n: number): n is ScoredDimension['score'] => Number.isInteger(n) && n >= 1 && n <= 5;

/**
 * Keeps what the ad supports, in Techifide's order: every template field and
 * every one of the eleven dimensions appears exactly once, whatever the model
 * returned.
 */
export function review(
  extraction: Extraction,
  ad: Pick<AdSource, 'lines'>,
  fields: readonly string[],
  dimensions: readonly Dimension[],
): Reviewed {
  let dropped = 0;
  const verified = (quote: string) => {
    const found = findQuote(quote, ad.lines);
    if (!found) dropped++;
    return found;
  };

  const brief = fields.map((field): BriefField => {
    const items = extraction.brief.filter((b) => b.field === field).flatMap((b) => b.items);
    const seen = new Set<string>();
    return {
      field,
      items: items.flatMap((item) => {
        const quote = verified(item.quote);
        if (!quote || seen.has(quote) || !item.value.trim()) return [];
        seen.add(quote);
        return [{ value: item.value.trim(), quote }];
      }),
    };
  });

  const results = dimensions.map((dim): DimensionResult => {
    const got = extraction.dimensions.find((d) => d.name === dim.name);
    const evidence = got?.evidence;
    const quote = evidence ? verified(evidence.quote) : undefined;
    if (evidence && quote && isScore(evidence.score)) {
      return { name: dim.name, score: evidence.score, quote, reading: evidence.reading.trim() };
    }
    return { name: dim.name, question: got?.question.trim() || fallbackQuestion(dim), rank: got?.rank ?? 99 };
  });

  const contradictions = extraction.contradictions.flatMap((c): Contradiction[] => {
    if (c.quotes.length !== 2) return [];
    const [a, b] = c.quotes.map(verified);
    return a && b && a !== b ? [{ note: c.note.trim(), quotes: [a, b] }] : [];
  });

  return { brief, dimensions: results, contradictions, dropped };
}

/** What the model returns for a CV read against one ad. */
export interface CandidateExtraction {
  mustHaves: { value: string; quote: string | null }[];
  questions: { dimension: string; question: string; quote: string | null }[];
}

/**
 * The same review for a CV: a must-have counts as evidenced only when its quote
 * is literally in the CV; otherwise it is left for the interview. Every
 * must-have of the ad appears once, in the ad's order, and only the dimensions
 * the call left open get a question, in the order worth asking.
 */
export function reviewCandidate(
  extraction: CandidateExtraction,
  cv: { label: string; writtenAt: string; lines: string[] },
  mustHaves: readonly string[],
  openDimensions: readonly string[],
): CandidateView {
  let dropped = 0;
  const verified = (quote: string | null) => {
    if (!quote) return null;
    const found = findQuote(quote, cv.lines);
    if (!found) dropped++;
    return found ?? null;
  };
  const evidence = mustHaves.map((value) => {
    const got = extraction.mustHaves.find((m) => m.value === value);
    return { value, quote: got ? verified(got.quote) : null };
  });
  const questions = openDimensions.flatMap((dimension) => {
    const got = extraction.questions.find((q) => q.dimension === dimension);
    return got?.question.trim() ? [{ dimension, question: got.question.trim(), quote: verified(got.quote) }] : [];
  });
  return { label: cv.label, writtenAt: cv.writtenAt, lines: cv.lines, evidence, questions, dropped };
}

/** Only reached if the model skipped a dimension: Techifide's own description, as a question. */
function fallbackQuestion(dim: Dimension): string {
  return `${dim.name}: ${dim.description.replace(/\.$/, '')}, for this role?`;
}
