import { describe, expect, it } from 'vitest';

import type { Dimension } from './data';
import { type Extraction, findQuote, normalize, review } from './review';

const lines = [
  "You'll work across a modern React and TypeScript application, Python and Rust services.",
  'Experience working with WebAssembly in the browser, including integrating WASM modules.',
  '2D or 3D graphics, CAD or geometry-heavy applications.',
];

const dims: Dimension[] = [
  { name: 'Structure', description: 'How much clarity and direction you prefer before starting work.' },
  { name: 'Autonomy', description: 'How comfortable you are making decisions and working independently.' },
  { name: 'Ambiguity', description: 'How well you cope with uncertainty.' },
];

const extraction = (over: Partial<Extraction> = {}): Extraction => ({
  brief: [],
  dimensions: [],
  contradictions: [],
  ...over,
});

describe('findQuote', () => {
  it('returns the ad’s own wording when the model retyped its quote marks', () => {
    expect(findQuote('You’ll work across a modern React', lines)).toBe("You'll work across a modern React");
    expect(findQuote('You\'ll  work across a   modern React', lines)).toBe("You'll work across a modern React");
  });

  it('forgives a final full stop and outer quote marks, not other words', () => {
    expect(findQuote('"CAD or geometry-heavy applications."', lines)).toBe('CAD or geometry-heavy applications');
    expect(findQuote('CAD or geometry heavy applications', lines)).toBeUndefined();
  });

  it('refuses a quote that joins two lines or is too short to mean anything', () => {
    expect(findQuote('Rust services. Experience working with WebAssembly', lines)).toBeUndefined();
    expect(findQuote('React and', lines)).toBeUndefined();
  });

  it('accepts a short quote only when it is the whole line, as a list item', () => {
    expect(findQuote('Recommendation systems', ['Recommendation systems'])).toBe('Recommendation systems');
    expect(findQuote('Recommendation systems', ['Recommendation systems for search'])).toBeUndefined();
  });

  it('is case-sensitive: the quote is the ad’s text', () => {
    expect(findQuote('experience working with webassembly', lines)).toBeUndefined();
  });

  it('keeps the ad’s typographic marks, which normalize makes plain only for matching', () => {
    expect(normalize('“A” – ‘b’…')).toBe('"A" - \'b\'...');
    expect(findQuote('it’s a line – with marks', ['So it’s a line – with marks.'])).toBe('it’s a line – with marks');
  });
});

describe('review', () => {
  it('keeps every template field, in the template’s order, empty when unsupported', () => {
    const r = review(
      extraction({
        brief: [
          { field: 'Salary', items: [{ value: '£90k', quote: 'a salary of £90k is offered' }] },
          { field: 'Job Title', items: [{ value: 'Fullstack', quote: 'modern React and TypeScript application' }] },
        ],
      }),
      { lines },
      ['Job Title', 'Salary', 'Hours'],
      dims,
    );
    expect(r.brief.map((f) => f.field)).toEqual(['Job Title', 'Salary', 'Hours']);
    expect(r.brief[0].items).toEqual([{ value: 'Fullstack', quote: 'modern React and TypeScript application' }]);
    expect(r.brief[1].items).toEqual([]);
    expect(r.dropped).toBe(1);
  });

  it('turns a score whose quote is not in the ad back into its question', () => {
    const r = review(
      extraction({
        dimensions: [
          { name: 'Autonomy', evidence: { score: 5, quote: 'you will own everything alone', reading: 'High' }, question: 'Q?', rank: 2 },
          {
            name: 'Structure',
            evidence: { score: 2, quote: 'Experience working with WebAssembly in the browser', reading: 'Low' },
            question: 'S?',
            rank: 1,
          },
        ],
      }),
      { lines },
      [],
      dims,
    );
    expect(r.dimensions).toEqual([
      { name: 'Structure', score: 2, quote: 'Experience working with WebAssembly in the browser', reading: 'Low' },
      { name: 'Autonomy', question: 'Q?', rank: 2 },
      { name: 'Ambiguity', question: 'Ambiguity: How well you cope with uncertainty, for this role?', rank: 99 },
    ]);
    expect(r.dropped).toBe(1);
  });

  it('drops a score outside 1–5 even with a good quote', () => {
    const r = review(
      extraction({
        dimensions: [
          { name: 'Structure', evidence: { score: 7, quote: '2D or 3D graphics, CAD', reading: '' }, question: 'S?', rank: 1 },
        ],
      }),
      { lines },
      [],
      dims,
    );
    expect(r.dimensions[0]).toEqual({ name: 'Structure', question: 'S?', rank: 1 });
  });

  it('keeps a contradiction only when both quotes are in the ad', () => {
    const r = review(
      extraction({
        contradictions: [
          { note: 'Worth confirming.', quotes: ['Experience working with WebAssembly in the browser', 'CAD or geometry-heavy applications'] },
          { note: 'Invented.', quotes: ['Experience working with WebAssembly in the browser', 'Staff engineers lead nothing'] },
        ],
      }),
      { lines },
      [],
      dims,
    );
    expect(r.contradictions).toHaveLength(1);
    expect(r.contradictions[0].note).toBe('Worth confirming.');
  });
});
