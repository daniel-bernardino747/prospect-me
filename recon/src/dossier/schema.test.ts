import { describe, expect, it } from 'vitest';

import { dossierSchema, unknownAccomplishments } from './schema.ts';

const ARTIFACT = 'https://labs.teamdbsolutions.com/acme';

/** A dossier that has reached the approach, valid by every rule. */
function approaching() {
  return {
    slug: 'acme',
    company: 'Acme Ltda',
    phase: 'approaching',
    createdAt: '2026-09-24T10:00:00-03:00',
    anchor: { kind: 'cnpj', value: '00.000.000/0001-00', primaryDomain: 'acme.com.br' },
    findings: [
      {
        id: 'f-email',
        category: 'contact',
        claim: 'ceo@acme.com.br receives mail',
        status: 'CONFIRMADO',
        evidence: 'MX live; address published on /contato',
        sourceUrl: 'https://acme.com.br/contato',
        observedAt: '2026-09-24T10:05:00-03:00',
        anchorLink: 'primary domain',
        perishable: false,
      },
      {
        id: 'f-no-quote',
        category: 'content',
        claim: 'No price or quote path on any product page',
        status: 'CONFIRMADO',
        evidence: 'All 42 product pages end in a generic contact form',
        sourceUrl: 'https://acme.com.br/produtos',
        observedAt: '2026-09-24T10:10:00-03:00',
        anchorLink: 'primary domain',
        perishable: true,
        recheck: { kind: 'http', url: 'https://acme.com.br/produtos', expect: { absent: 'orçamento' } },
        lastRecheck: { at: '2026-09-28T09:00:00-03:00', held: true },
      },
      {
        id: 'f-pattern',
        category: 'contact',
        claim: 'Emails follow nome.sobrenome@acme.com.br',
        status: 'INFERIDO',
        evidence: 'Aggregator',
        sourceUrl: 'https://example.org/aggregator',
        observedAt: '2026-09-24T10:12:00-03:00',
        anchorLink: 'domain in the pattern',
        perishable: false,
      },
    ],
    contacts: [
      {
        id: 'c-ceo',
        name: 'Fulano',
        role: 'CEO',
        register: 'business',
        isDecider: true,
        channels: [{ kind: 'email', value: 'ceo@acme.com.br', findingId: 'f-email' }],
      },
    ],
    problems: [
      {
        id: 'p-quote',
        stage: 'converts',
        lens: 'revenue',
        statement: 'A buyer ready to price an order has no way to do it',
        revenueImpact: 'Ready buyers leave for a competitor with an instant quote',
        findingIds: ['f-no-quote'],
      },
    ],
    solutions: [1, 2, 3].map((rank) => ({
      id: `s-${rank}`,
      title: `Solution ${rank}`,
      problemIds: ['p-quote'],
      whatItDoes: 'Prices an order from the public catalog',
      publicData: ['product catalog'],
      estimateHours: 12,
      impact: 4,
      rank,
      critique: {
        asRegister: 'business',
        wouldClick: 'It is my catalog',
        wouldIgnore: 'If prices are wrong',
        scores: { realPain: 4, specific: 5, plausible: 4, nonObvious: 3 },
        isHygiene: false,
        verdict: 'pass',
        attempt: 1,
      },
    })),
    brief: {
      solutionId: 's-1',
      chosenAt: '2026-09-25T10:00:00-03:00',
      intent: 'project',
      doneCriteria: ['Quotes any catalog product'],
      estimateHours: 12,
      labsSlug: 'acme',
      expiresAt: '2026-11-24T10:00:00-03:00',
    },
    approach: {
      contactId: 'c-ceo',
      channelFindingId: 'f-email',
      opensWith: 'artifact',
      subject: 'Um orçamento em 10 segundos',
      alternateSubjects: ['A', 'B'],
      body: `Fulano, construí um orçamento instantâneo com o catálogo de vocês: ${ARTIFACT}`,
      artifactUrl: ARTIFACT,
      citedFindingIds: ['f-no-quote'],
      writtenAt: '2026-09-28T10:00:00-03:00',
    },
  };
}

// Each test mutates the fixture into a shape the schema should refuse, so the
// draft is deliberately untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Draft = any;

function errors(mutate: (d: Draft) => void): string[] {
  const d = structuredClone(approaching()) as Draft;
  mutate(d);
  const result = dossierSchema.safeParse(d);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe('dossierSchema', () => {
  it('accepts a dossier that satisfies every rule', () => {
    expect(errors(() => {})).toEqual([]);
  });

  it('refuses an INFERIDO finding cited by the email', () => {
    expect(errors((d) => d.approach.citedFindingIds.push('f-pattern'))).toContain(
      'the email cannot rest on INFERIDO finding "f-pattern"',
    );
  });

  it('refuses a perishable finding without an executable re-check', () => {
    expect(errors((d) => delete d.findings[1].recheck)).toContain(
      'a perishable finding needs an executable re-check',
    );
  });

  it('refuses to approach on a perishable finding that no longer holds', () => {
    expect(errors((d) => (d.findings[1].lastRecheck.held = false))).toContain(
      'perishable finding "f-no-quote" must be re-checked, and hold, after the build',
    );
  });

  it('refuses to approach on a re-check older than the build', () => {
    expect(errors((d) => (d.findings[1].lastRecheck.at = '2026-09-24T12:00:00-03:00'))).toContain(
      'perishable finding "f-no-quote" must be re-checked, and hold, after the build',
    );
  });

  it('refuses a solution over the build ceiling', () => {
    expect(errors((d) => (d.solutions[0].estimateHours = 24))).not.toEqual([]);
  });

  it('requires exactly three solutions to choose', () => {
    expect(errors((d) => d.solutions.pop())).toContain('exactly 3 solutions are required to choose');
  });

  it('refuses hygiene dressed as a passing solution', () => {
    expect(errors((d) => (d.solutions[0].critique.isHygiene = true))).toContain(
      'hygiene dressed as a solution cannot pass',
    );
  });

  it('sends a first rejection back instead of to Daniel', () => {
    expect(errors((d) => (d.solutions[0].critique.verdict = 'rejected'))).toContain(
      'a rejected solution goes back once for revision',
    );
  });

  it('refuses a solution pointing at a problem that does not exist', () => {
    expect(errors((d) => (d.solutions[0].problemIds = ['p-ghost']))).toContain('unknown problem "p-ghost"');
  });

  it('refuses a finding without an anchor link', () => {
    expect(errors((d) => delete d.findings[0].anchorLink)).not.toEqual([]);
  });

  it('has no door kind for hygiene', () => {
    expect(
      errors((d) => {
        d.doors = [{ kind: 'broken-link', id: 'd-1', findingIds: ['f-email'] }];
      }),
    ).not.toEqual([]);
  });

  it('opens a technical decider with the door when there is one', () => {
    const messages = errors((d) => {
      d.contacts[0].register = 'technical';
      d.doors = [
        {
          kind: 'challenge',
          id: 'd-challenge',
          scope: 'Kanban API',
          findingIds: ['f-email'],
          accomplishmentIds: ['homeet'],
        },
      ];
      d.approach.doorId = 'd-challenge';
    });
    expect(messages).toContain('a technical decider with a door is opened with the door');
  });

  it('opens a business decider with the artifact even when there is a door', () => {
    const messages = errors((d) => {
      d.approach.opensWith = 'door';
      d.doors = [
        {
          kind: 'challenge',
          id: 'd-challenge',
          scope: 'Kanban API',
          findingIds: ['f-email'],
          accomplishmentIds: ['homeet'],
        },
      ];
      d.approach.doorId = 'd-challenge';
    });
    expect(messages).toContain('a business decider with a door is opened with the artifact');
  });

  it('requires the artifact link in the body', () => {
    expect(errors((d) => (d.approach.body = 'Fulano, construí uma coisa.'))).toContain(
      'the body carries the artifact link',
    );
  });

  it('refuses a body over the word limit', () => {
    expect(errors((d) => (d.approach.body = `${'palavra '.repeat(230)}${ARTIFACT}`))).toContain(
      'the body is over 220 words',
    );
  });

  it('refuses an artifact that outlives ninety days', () => {
    expect(errors((d) => (d.brief.expiresAt = '2027-03-01T10:00:00-03:00'))).toContain(
      'an artifact expires within 90 days of being chosen',
    );
  });

  it('refuses a brief that does not say what the approach is for', () => {
    expect(errors((d) => delete (d.brief as Partial<typeof d.brief>).intent)).not.toEqual([]);
  });

  it('does not demand approach rules while still investigating', () => {
    expect(
      errors((d) => {
        d.phase = 'investigating';
        d.solutions = [];
        delete d.brief;
        delete d.approach;
      }),
    ).toEqual([]);
  });
});

describe('unknownAccomplishments', () => {
  it('names Accomplishments absent from the eligible Corpus ids', () => {
    const d = dossierSchema.parse({
      ...approaching(),
      solutions: approaching().solutions.map((s, i) => ({
        ...s,
        precedentAccomplishmentIds: i === 0 ? ['homeet', 'draft-thing'] : [],
      })),
    });
    expect(unknownAccomplishments(d, new Set(['homeet']))).toEqual(['draft-thing']);
  });
});
