/**
 * The data behind /techifide, gathered once by `scripts/techifide.ts`: the raw
 * captures in `sources/`, and the `data.json` the page reads.
 */

/** The three ads, in the order the page offers them; `fullstack` is the default. */
export const AD_KEYS = ['fullstack', 'ml', 'qa'] as const;
export type AdKey = (typeof AD_KEYS)[number];

/** Every capture says when it was taken and from where. */
export interface Captured {
  url: string;
  capturedAt: string;
}

/** What the ad's JSON-LD says outside its body, shown as listing metadata, never quoted. */
export interface Listing {
  /** "São Paulo, Brazil". */
  location: string | null;
  remote: boolean;
  /** Where applicants must live, when the listing restricts it. */
  applicantCountry: string | null;
  employmentType: string | null;
}

/** One Manatal job ad: its JSON-LD metadata and its body as the lines a reader sees. */
export interface AdSource extends Captured {
  key: AdKey;
  title: string;
  datePosted: string;
  /**
   * Manatal sets this to thirty days after each request, so it is not an
   * expiry: kept as captured, never shown as a deadline.
   */
  validThrough: string | null;
  listing: Listing;
  lines: string[];
}

/** One of the eleven dimensions, named and described as Techifide publishes them. */
export interface Dimension {
  name: string;
  description: string;
}

export interface RoleFitSource extends Captured {
  dimensions: Dimension[];
}

/** A line quoted from a Techifide page, to cite it on the page. */
export interface QuoteSource extends Captured {
  quote: string;
}

/** The fields of `Techi-job-offer.docx`, Techifide's own vacancy template. */
export interface TemplateSource extends Captured {
  fields: string[];
}

/** A line of the ad, copied verbatim: the page shows it one tap behind every claim. */
export interface Quoted {
  quote: string;
}

/** One entry under a template field: a short label and the line it came from. */
export interface BriefItem extends Quoted {
  value: string;
}

/** A field of the template, empty when the ad says nothing that fills it. */
export interface BriefField {
  field: string;
  items: BriefItem[];
}

/** A dimension the ad speaks to: the level the role calls for, 1 to 5, and why. */
export interface ScoredDimension extends Quoted {
  name: string;
  score: 1 | 2 | 3 | 4 | 5;
  /** One line on what that level means for this role. */
  reading: string;
}

/** A dimension the ad does not speak to: what the intake call has to ask. */
export interface OpenDimension {
  name: string;
  question: string;
  /** 1 is the question most worth the hiring manager's time for this role. */
  rank: number;
}

export type DimensionResult = ScoredDimension | OpenDimension;

export const isScored = (d: DimensionResult): d is ScoredDimension => 'score' in d;

/**
 * A CV written for the demo, about no real person: the page reads it against
 * the ad's must-haves the way it reads the ad. Never a real candidate's CV.
 */
export interface CandidateSource {
  synthetic: true;
  label: string;
  writtenAt: string;
  lines: string[];
}

/** A must-have and the CV line that evidences it, or null when the CV does not. */
export interface CandidateEvidence {
  value: string;
  quote: string | null;
}

/** A behavioural interview question for one dimension the call left open, tied to the CV where it can be. */
export interface InterviewQuestion {
  dimension: string;
  question: string;
  quote: string | null;
}

export interface CandidateView {
  label: string;
  writtenAt: string;
  lines: string[];
  evidence: CandidateEvidence[];
  questions: InterviewQuestion[];
  /** Quotes the review dropped because they were not in the CV. */
  dropped: number;
}

/** Two lines of the same ad pulling in different directions, worth confirming. */
export interface Contradiction {
  note: string;
  quotes: [string, string];
}

export interface AdView {
  key: AdKey;
  title: string;
  url: string;
  capturedAt: string;
  datePosted: string;
  listing: Listing;
  /** The ad as lanes: lane 0 is the title, lane n the ad's n-th line. */
  lanes: string[];
  brief: BriefField[];
  dimensions: DimensionResult[];
  contradictions: Contradiction[];
  /** Quotes the review dropped because they were not in the ad, for the method note. */
  dropped: number;
  /** The synthetic candidate screened against this ad, when there is one. */
  candidate?: CandidateView;
}

/** What `data.json` holds and the page reads. */
export interface TechifideData {
  generatedAt: string;
  model: string;
  dimensions: Dimension[];
  sources: {
    roleFit: Captured;
    screening: QuoteSource;
    submitVacancy: QuoteSource;
    template: TemplateSource;
  };
  ads: Record<AdKey, AdView>;
}
