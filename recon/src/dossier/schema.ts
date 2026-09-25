import { z } from 'zod';

/**
 * The dossier is the state of one company's recon, from the identity anchor to
 * the email. Agents emit it; code validates and renders it (ADR-0001). Rules the
 * old skill stated in prose — nothing INFERIDO in the email, perishable findings
 * re-checked before sending, hygiene is never a door — are enforced here.
 */

/** The sixteen-hour build ceiling for a proposed Solution (ADR-0001). */
export const MAX_BUILD_HOURS = 16;

/** Solutions are always exactly three, even when a Door exists. */
export const SOLUTION_COUNT = 3;

/** "About two hundred words"; the hard limit leaves room for a signature. */
export const MAX_BODY_WORDS = 220;

/** Labs artifacts come down about sixty days out; ninety is the hard limit. */
export const MAX_ARTIFACT_DAYS = 90;

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case');
const timestamp = z.iso.datetime({ offset: true });
const url = z.url();
const score = z.number().int().min(1).max(5);

export const ANCHOR_KINDS = ['cnpj', 'registered-name'] as const;

/**
 * What every later surface must connect back to. In Brazil the CNPJ; elsewhere
 * the exact registered name plus the primary domain.
 */
export const anchorSchema = z.object({
  kind: z.enum(ANCHOR_KINDS),
  value: z.string().min(1),
  primaryDomain: z.string().min(1),
  brands: z.array(z.string().min(1)).default([]),
});

export const STATUSES = ['CONFIRMADO', 'INFERIDO'] as const;

export const FINDING_CATEGORIES = [
  'identity',
  'contact',
  'channel',
  'github',
  'hiring',
  'content',
  'market',
  'competitor',
  'reputation',
] as const;

/**
 * An executable re-check for a perishable finding. Phase two runs every one the
 * email depends on and refuses to proceed if any no longer holds.
 */
export const recheckSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('http'),
    url,
    expect: z
      .object({
        status: z.number().int().min(100).max(599).optional(),
        contains: z.string().min(1).optional(),
        absent: z.string().min(1).optional(),
      })
      .refine((e) => Object.values(e).some((v) => v !== undefined), {
        message: 'an http re-check must expect something',
      }),
  }),
  z.object({
    kind: z.literal('dns'),
    name: z.string().min(1),
    type: z.enum(['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS']),
    expect: z.enum(['present', 'absent']),
  }),
  z.object({
    kind: z.literal('gh'),
    endpoint: z.string().min(1),
    jq: z.string().min(1).optional(),
    expect: z
      .object({
        equals: z.string().optional(),
        contains: z.string().min(1).optional(),
      })
      .refine((e) => e.equals !== undefined || e.contains !== undefined, {
        message: 'a gh re-check must expect something',
      }),
  }),
]);

export const findingSchema = z
  .object({
    id,
    category: z.enum(FINDING_CATEGORIES),
    claim: z.string().min(1),
    status: z.enum(STATUSES),
    evidence: z.string().min(1),
    sourceUrl: url,
    observedAt: timestamp,
    // How this surface ties to the anchor — the org's `blog` field, a repo naming
    // the known product, an ATS slug. Required so a homonym cannot enter by default.
    anchorLink: z.string().min(1),
    perishable: z.boolean(),
    recheck: recheckSchema.optional(),
    lastRecheck: z.object({ at: timestamp, held: z.boolean() }).optional(),
  })
  .refine((f) => !f.perishable || f.recheck !== undefined, {
    message: 'a perishable finding needs an executable re-check',
    path: ['recheck'],
  });

export const REGISTERS = ['business', 'technical'] as const;

export const CHANNEL_KINDS = ['email', 'linkedin', 'github', 'whatsapp', 'form', 'other'] as const;

export const contactSchema = z.object({
  id,
  name: z.string().min(1),
  role: z.string().min(1),
  register: z.enum(REGISTERS),
  isDecider: z.boolean(),
  channels: z.array(
    z.object({
      kind: z.enum(CHANNEL_KINDS),
      value: z.string().min(1),
      findingId: id,
    }),
  ),
});

/**
 * An entry point, and only one of two things. Channel and hygiene findings have
 * no kind here on purpose: they are never a door.
 */
export const doorSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('pull-request'),
    id,
    repo: url,
    // What the PR fixes for their product or customers — not a typo, not a bump.
    problemReached: z.string().min(1),
    findingIds: z.array(id).min(1),
  }),
  z.object({
    kind: z.literal('challenge'),
    id,
    scope: z.string().min(1),
    findingIds: z.array(id).min(1),
    // Accomplishments carrying a Metric that already do what the challenge asks.
    accomplishmentIds: z.array(z.string().min(1)).min(1),
  }),
]);

/** Where along the customer's journey revenue leaks. */
export const JOURNEY_STAGES = ['found', 'chosen', 'converts', 'kept'] as const;

export const problemSchema = z
  .object({
    id,
    stage: z.enum(JOURNEY_STAGES),
    lens: z.enum(['revenue', 'operational-cost']),
    statement: z.string().min(1),
    // Qualitative on purpose: no invented number.
    revenueImpact: z.string().min(1),
    // Operational cost counts only where their customer feels it.
    felt: z.string().min(1).optional(),
    findingIds: z.array(id).min(1),
    competitor: z
      .object({
        name: z.string().min(1),
        doesBetter: z.string().min(1),
        findingIds: z.array(id).min(1),
      })
      .optional(),
  })
  .refine((p) => p.lens === 'revenue' || p.felt !== undefined, {
    message: 'an operational-cost problem must say how the customer feels it',
    path: ['felt'],
  });

export const critiqueSchema = z
  .object({
    asRegister: z.enum(REGISTERS),
    wouldClick: z.string().min(1),
    wouldIgnore: z.string().min(1),
    scores: z.object({
      realPain: score,
      specific: score,
      plausible: score,
      nonObvious: score,
    }),
    isHygiene: z.boolean(),
    verdict: z.enum(['pass', 'weak', 'rejected']),
    // 1 on first critique; 2 after the single revision a rejection earns.
    attempt: z.union([z.literal(1), z.literal(2)]),
  })
  .refine((c) => !c.isHygiene || c.verdict !== 'pass', {
    message: 'hygiene dressed as a solution cannot pass',
    path: ['verdict'],
  });

export const solutionSchema = z.object({
  id,
  title: z.string().min(1),
  problemIds: z.array(id).min(1),
  whatItDoes: z.string().min(1),
  // Demonstrable with nothing of theirs but what is public.
  publicData: z.array(z.string().min(1)).min(1),
  precedentAccomplishmentIds: z.array(z.string().min(1)).default([]),
  estimateHours: z.number().positive().max(MAX_BUILD_HOURS),
  impact: score,
  rank: z.number().int().min(1).max(SOLUTION_COUNT),
  critique: critiqueSchema.optional(),
});

/** A solution over the ceiling: material for the conversation, never one of the three. */
export const beyondCeilingSchema = z.object({
  title: z.string().min(1),
  problemIds: z.array(id).min(1),
  estimateHours: z.number().positive(),
  why: z.string().min(1),
});

/**
 * What Daniel wants from the approach, decided when he chooses what to build:
 * a place on the team, or a project. It sets the email's ask and whether an
 * open role is the reason for writing or a supporting line.
 */
export const INTENTS = ['join', 'project'] as const;

export const briefSchema = z.object({
  solutionId: id,
  chosenAt: timestamp,
  intent: z.enum(INTENTS),
  doneCriteria: z.array(z.string().min(1)).min(1),
  estimateHours: z.number().positive().max(MAX_BUILD_HOURS),
  labsSlug: id,
  expiresAt: timestamp,
});

export const approachSchema = z.object({
  contactId: id,
  // The finding that establishes the channel used; it must be CONFIRMADO.
  channelFindingId: id,
  opensWith: z.enum(['artifact', 'door']),
  doorId: id.optional(),
  subject: z.string().min(1),
  alternateSubjects: z.array(z.string().min(1)).length(2),
  body: z.string().min(1),
  artifactUrl: url,
  citedFindingIds: z.array(id),
  citedAccomplishmentIds: z.array(z.string().min(1)).default([]),
  writtenAt: timestamp,
});

export const trapSchema = z.object({
  surface: z.string().min(1),
  belongsTo: z.string().min(1),
  howRuledOut: z.string().min(1),
});

export const PHASES = ['investigating', 'choosing', 'building', 'approaching', 'sent'] as const;

export type Phase = (typeof PHASES)[number];

const reached = (phase: Phase, target: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(target);

const baseDossierSchema = z.object({
  slug: id,
  company: z.string().min(1),
  phase: z.enum(PHASES),
  createdAt: timestamp,
  anchor: anchorSchema,
  findings: z.array(findingSchema),
  contacts: z.array(contactSchema).default([]),
  doors: z.array(doorSchema).default([]),
  problems: z.array(problemSchema).default([]),
  solutions: z.array(solutionSchema).default([]),
  beyondCeiling: z.array(beyondCeilingSchema).default([]),
  brief: briefSchema.optional(),
  approach: approachSchema.optional(),
  traps: z.array(trapSchema).default([]),
});

type BaseDossier = z.infer<typeof baseDossierSchema>;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Cross-record rules: references resolve, and each phase has what it needs. */
function checkDossier(d: BaseDossier, ctx: z.RefinementCtx): void {
  const issue = (message: string, path: (string | number)[]) =>
    ctx.addIssue({ code: 'custom', message, path });

  const unique = (ids: string[], path: string) => {
    const seen = new Set<string>();
    ids.forEach((value, i) => {
      if (seen.has(value)) issue(`duplicate id "${value}"`, [path, i, 'id']);
      seen.add(value);
    });
  };
  unique(d.findings.map((f) => f.id), 'findings');
  unique(d.contacts.map((c) => c.id), 'contacts');
  unique(d.doors.map((x) => x.id), 'doors');
  unique(d.problems.map((p) => p.id), 'problems');
  unique(d.solutions.map((s) => s.id), 'solutions');

  const findings = new Map(d.findings.map((f) => [f.id, f]));
  const problems = new Set(d.problems.map((p) => p.id));

  const resolveFindings = (ids: string[], path: (string | number)[]) =>
    ids.forEach((fid, i) => {
      if (!findings.has(fid)) issue(`unknown finding "${fid}"`, [...path, i]);
    });

  d.contacts.forEach((c, ci) =>
    c.channels.forEach((ch, chi) => {
      if (!findings.has(ch.findingId)) {
        issue(`unknown finding "${ch.findingId}"`, ['contacts', ci, 'channels', chi, 'findingId']);
      }
    }),
  );
  d.doors.forEach((door, i) => resolveFindings(door.findingIds, ['doors', i, 'findingIds']));
  d.problems.forEach((p, i) => {
    resolveFindings(p.findingIds, ['problems', i, 'findingIds']);
    if (p.competitor) resolveFindings(p.competitor.findingIds, ['problems', i, 'competitor', 'findingIds']);
  });
  const checkProblemRefs = (ids: string[], path: (string | number)[]) =>
    ids.forEach((pid, i) => {
      if (!problems.has(pid)) issue(`unknown problem "${pid}"`, [...path, i]);
    });
  d.solutions.forEach((s, i) => checkProblemRefs(s.problemIds, ['solutions', i, 'problemIds']));
  d.beyondCeiling.forEach((b, i) => checkProblemRefs(b.problemIds, ['beyondCeiling', i, 'problemIds']));

  if (reached(d.phase, 'choosing')) {
    if (d.solutions.length !== SOLUTION_COUNT) {
      issue(`exactly ${SOLUTION_COUNT} solutions are required to choose`, ['solutions']);
    }
    const ranks = new Set(d.solutions.map((s) => s.rank));
    if (ranks.size !== d.solutions.length) issue('solution ranks must be distinct', ['solutions']);
    d.solutions.forEach((s, i) => {
      if (!s.critique) {
        issue('every solution is critiqued before Daniel chooses', ['solutions', i, 'critique']);
      } else if (s.critique.verdict === 'rejected') {
        issue(
          s.critique.attempt === 1
            ? 'a rejected solution goes back once for revision'
            : 'after its revision a failing solution reaches Daniel marked weak, not rejected',
          ['solutions', i, 'critique', 'verdict'],
        );
      }
    });
  }

  if (reached(d.phase, 'building')) {
    if (!d.brief) {
      issue('building requires a brief', ['brief']);
    } else {
      if (!d.solutions.some((s) => s.id === d.brief!.solutionId)) {
        issue(`unknown solution "${d.brief.solutionId}"`, ['brief', 'solutionId']);
      }
      const chosen = Date.parse(d.brief.chosenAt);
      const expires = Date.parse(d.brief.expiresAt);
      if (expires <= chosen || expires - chosen > MAX_ARTIFACT_DAYS * 86_400_000) {
        issue(`an artifact expires within ${MAX_ARTIFACT_DAYS} days of being chosen`, ['brief', 'expiresAt']);
      }
    }
  }

  if (reached(d.phase, 'approaching')) {
    const a = d.approach;
    if (!a) {
      issue('approaching requires an approach', ['approach']);
      return;
    }
    const contact = d.contacts.find((c) => c.id === a.contactId);
    if (!contact) issue(`unknown contact "${a.contactId}"`, ['approach', 'contactId']);

    const cited = [...a.citedFindingIds, a.channelFindingId];
    cited.forEach((fid) => {
      const f = findings.get(fid);
      if (!f) {
        issue(`unknown finding "${fid}"`, ['approach', 'citedFindingIds']);
        return;
      }
      if (f.status !== 'CONFIRMADO') {
        issue(`the email cannot rest on INFERIDO finding "${fid}"`, ['approach', 'citedFindingIds']);
      }
      if (f.perishable) {
        const after = d.brief ? Date.parse(d.brief.chosenAt) : 0;
        if (!f.lastRecheck || !f.lastRecheck.held || Date.parse(f.lastRecheck.at) < after) {
          issue(`perishable finding "${fid}" must be re-checked, and hold, after the build`, [
            'approach',
            'citedFindingIds',
          ]);
        }
      }
    });

    const door = a.doorId ? d.doors.find((x) => x.id === a.doorId) : undefined;
    if (a.doorId && !door) issue(`unknown door "${a.doorId}"`, ['approach', 'doorId']);
    if (a.opensWith === 'door' && !door) issue('an approach cannot open with a door it does not have', ['approach', 'opensWith']);
    if (contact) {
      const expected = contact.register === 'technical' && door ? 'door' : 'artifact';
      if (a.opensWith !== expected) {
        issue(`a ${contact.register} decider${door ? ' with a door' : ''} is opened with the ${expected}`, [
          'approach',
          'opensWith',
        ]);
      }
    }

    if (!a.body.includes(a.artifactUrl)) issue('the body carries the artifact link', ['approach', 'body']);
    if (wordCount(a.body) > MAX_BODY_WORDS) {
      issue(`the body is over ${MAX_BODY_WORDS} words`, ['approach', 'body']);
    }
  }
}

export const dossierSchema = baseDossierSchema.superRefine(checkDossier);

export type Dossier = z.infer<typeof dossierSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Recheck = z.infer<typeof recheckSchema>;

/**
 * Accomplishment ids must exist in the Corpus and carry a Metric outside a
 * draft. The Corpus lives in personal-website, so the caller passes the eligible
 * ids read from its `corpus:json` contract; the schema alone cannot know them.
 */
export function unknownAccomplishments(dossier: Dossier, eligible: ReadonlySet<string>): string[] {
  const referenced = [
    ...dossier.doors.flatMap((x) => (x.kind === 'challenge' ? x.accomplishmentIds : [])),
    ...dossier.solutions.flatMap((s) => s.precedentAccomplishmentIds),
    ...(dossier.approach?.citedAccomplishmentIds ?? []),
  ];
  return [...new Set(referenced)].filter((a) => !eligible.has(a));
}
