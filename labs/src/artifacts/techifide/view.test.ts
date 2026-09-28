import { describe, expect, it } from 'vitest';

import type { AdView } from './data';
import { applyOverrides, day, firstScreen, headline, laneLabel, laneOf, MUST_HAVE_FIELD, questions, roleLine } from './view';

const ad = (over: Partial<AdView> = {}): AdView => ({
  key: 'fullstack',
  title: 'Senior / Staff Fullstack Software Engineer',
  url: 'https://example.com/job',
  capturedAt: '2026-09-28T10:54:28Z',
  datePosted: '2026-09-25T09:42:30Z',
  listing: { location: 'São Paulo, Brazil', remote: true, applicantCountry: 'Brazil', employmentType: 'FULL_TIME' },
  lanes: ['Senior / Staff Fullstack Software Engineer', 'Experience working with WebAssembly in the browser.'],
  brief: [
    { field: 'Job Title', items: [] },
    { field: MUST_HAVE_FIELD, items: [{ value: 'WebAssembly', quote: 'Experience working with WebAssembly' }] },
  ],
  dimensions: [
    { name: 'Structure', question: 'S?', rank: 3 },
    { name: 'Risk / Experimentation', score: 4, quote: 'likes difficult product problems', reading: 'High' },
    { name: 'Autonomy', question: 'A?', rank: 1 },
    { name: 'Ambiguity', question: 'B?', rank: 3 },
    { name: 'Product Thinking', question: 'P?', rank: 2 },
  ],
  contradictions: [{ note: 'Model note.', quotes: ['first quote here', 'second quote here'] }],
  dropped: 0,
  ...over,
});

describe('questions', () => {
  it('lists only the dimensions left to the call, by rank, ties in Techifide’s order', () => {
    expect(questions(ad()).map((q) => q.name)).toEqual(['Autonomy', 'Product Thinking', 'Structure', 'Ambiguity']);
  });
});

describe('firstScreen', () => {
  const screen = firstScreen(ad());

  it('counts every question, and shows the first three above the fold', () => {
    expect(screen.count).toBe(4);
    expect(screen.first.map((q) => q.question)).toEqual(['A?', 'P?', 'S?']);
    expect(screen.rest.map((q) => q.question)).toEqual(['B?']);
  });

  it('carries the must-haves from the template’s essential field', () => {
    expect(screen.mustHaves).toEqual([{ value: 'WebAssembly', quote: 'Experience working with WebAssembly' }]);
  });

  it('states the role in one line from the listing', () => {
    expect(screen.role).toBe('Senior / Staff Fullstack Software Engineer · remote, Brazil · full time');
    expect(roleLine({ title: 'QA', listing: { location: 'Leeds', remote: false, applicantCountry: null, employmentType: null } })).toBe(
      'QA · Leeds',
    );
  });
});

describe('headline', () => {
  it('counts questions, never coverage', () => {
    expect(headline(8)).toBe('8 questions your intake call still has to answer');
    expect(headline(1)).toBe('1 question your intake call still has to answer');
    expect(headline(8)).not.toMatch(/of 11/);
  });
});

describe('applyOverrides', () => {
  it('rewords and reorders a question, and rewrites a contradiction note', () => {
    const out = applyOverrides(ad(), {
      fullstack: {
        questions: { Structure: { question: 'Hand-written?', rank: 0 } },
        contradictions: { 'first quote here': 'Hand note.' },
      },
    });
    expect(questions(out)[0]).toEqual({ name: 'Structure', question: 'Hand-written?', rank: 0 });
    expect(out.contradictions[0].note).toBe('Hand note.');
  });

  it('never turns a scored dimension back into a question', () => {
    const out = applyOverrides(ad(), { fullstack: { questions: { 'Risk / Experimentation': { question: 'R?' } } } });
    expect(out.dimensions[1]).toEqual(ad().dimensions[1]);
  });

  it('leaves another ad alone', () => {
    expect(applyOverrides(ad(), { ml: { questions: { Structure: { question: 'X?' } } } })).toEqual(ad());
  });
});

describe('lanes', () => {
  it('points a quote at the ad line it sits on, the title being lane 0', () => {
    expect(laneOf('Experience working with WebAssembly', ad())).toBe(1);
    expect(laneOf('Staff Fullstack', ad())).toBe(0);
    expect(laneOf('not in the ad at all', ad())).toBeUndefined();
    expect(laneLabel(7)).toBe('L07');
  });

  it('dates in British English', () => {
    expect(day('2026-09-28T10:54:28.000Z')).toBe('28 Sep 2026');
  });
});
