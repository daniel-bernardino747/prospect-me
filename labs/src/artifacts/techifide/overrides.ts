/**
 * Daniel's hand edits to the extraction, applied when the page loads, so they
 * survive a regenerated `data.json`. Keyed by ad and by the dimension's
 * published name; an override only rewords or reorders a question, it never
 * turns a question into a score.
 */
import type { AdKey } from './data';

export interface QuestionOverride {
  question?: string;
  rank?: number;
}

/** Contradiction notes, keyed by the first quote of the pair. */
export type Overrides = Partial<
  Record<AdKey, { questions?: Record<string, QuestionOverride>; contradictions?: Record<string, string> }>
>;

export const OVERRIDES: Overrides = {};
