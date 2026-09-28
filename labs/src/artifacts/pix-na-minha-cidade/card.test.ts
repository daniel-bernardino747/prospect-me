import { describe, expect, it } from 'vitest';

import { cardBottom, type Counts, EDGE_LIMIT, fitNumber, NUMBER_MAX, NUMBER_MIN, sparkEnds, wrap } from './card';

const typical: Counts = { cityLines: 1, sentenceLines: 3, outlierLines: 0, rows: 3, fineLines: 6 };

describe('the PNG fit rule', () => {
  it('keeps the full-size number when the ticket fits', () => {
    expect(fitNumber(typical)).toBe(NUMBER_MAX);
    expect(cardBottom(typical, NUMBER_MAX)).toBeLessThanOrEqual(EDGE_LIMIT);
  });

  it('steps the number down 20px at a time for a long name, a long sentence and an outlier note', () => {
    const long: Counts = { cityLines: 2, sentenceLines: 4, outlierLines: 3, rows: 3, fineLines: 7 };
    const size = fitNumber(long);
    expect(size).toBeLessThan(NUMBER_MAX);
    expect((NUMBER_MAX - size) % 20).toBe(0);
    expect(size).toBeGreaterThanOrEqual(NUMBER_MIN);
  });

  it('never goes under the floor, and never touches the fine print', () => {
    const huge: Counts = { cityLines: 4, sentenceLines: 8, outlierLines: 4, rows: 3, fineLines: 10 };
    expect(fitNumber(huge)).toBe(NUMBER_MIN);
    const withMoreFine = { ...huge, fineLines: 12 };
    expect(cardBottom(withMoreFine, NUMBER_MIN) - cardBottom(huge, NUMBER_MIN)).toBe(2 * 24);
  });
});

describe('the sparkline end labels', () => {
  it('round like the ticket, never truncate (Manaus 70,9 is 71 on both)', () => {
    expect(sparkEnds({ city: [60.2, null, 70.9], brasil: [40, 43.2] })).toEqual(['71', 'BR 43']);
    expect(sparkEnds({ city: [38.1, null], brasil: [43.5] })).toEqual(['38', 'BR 44']);
  });
});

describe('wrap', () => {
  const measure = (s: string) => s.length;
  it('breaks on words within the width', () => {
    expect(wrap('Quem usa Pix em São Paulo', 10, measure)).toEqual(['Quem usa', 'Pix em São', 'Paulo']);
  });
  it('keeps a word longer than the width on its own line', () => {
    expect(wrap('a Pindamonhangaba b', 5, measure)).toEqual(['a', 'Pindamonhangaba', 'b']);
  });
});
