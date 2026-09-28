/**
 * The generated `data.json`, checked against the captures it came from: what
 * the page shows is only what Techifide published.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AD_KEYS, type AdSource, isScored, type TechifideData } from './data';
import { loadTechifide } from './load';

const dir = join(process.cwd(), 'src/artifacts/techifide');
const data = JSON.parse(readFileSync(join(dir, 'data.json'), 'utf8')) as TechifideData;
const source = (key: string) => JSON.parse(readFileSync(join(dir, 'sources', `ad-${key}.json`), 'utf8')) as AdSource;

/** Every string the page shows for an ad, with the quote it stands on (if any). */
function claims(key: (typeof AD_KEYS)[number]) {
  const ad = loadTechifide().ads[key];
  return [
    ...ad.brief.flatMap((f) => f.items.map((i) => ({ text: i.value, quote: i.quote }))),
    ...ad.dimensions.map((d) => (isScored(d) ? { text: d.reading, quote: d.quote } : { text: d.question, quote: '' })),
    ...ad.contradictions.map((c) => ({ text: c.note, quote: c.quotes.join(' ') })),
  ];
}

describe.each(AD_KEYS)('data.json: %s', (key) => {
  const ad = data.ads[key];
  const { title, lines: body } = source(key);
  const lines = [title, ...body];
  const inAd = (quote: string) => lines.some((l) => l.includes(quote));

  it('quotes only text literally in the captured ad', () => {
    const quotes = [
      ...ad.brief.flatMap((f) => f.items.map((i) => i.quote)),
      ...ad.dimensions.flatMap((d) => (isScored(d) ? [d.quote] : [])),
      ...ad.contradictions.flatMap((c) => c.quotes),
    ];
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.filter((q) => !inAd(q))).toEqual([]);
  });

  it('has the eleven published dimensions, each scored with a quote or asked as a question, never both', () => {
    expect(ad.dimensions.map((d) => d.name)).toEqual(data.dimensions.map((d) => d.name));
    expect(ad.dimensions).toHaveLength(11);
    for (const d of ad.dimensions) {
      const scored = 'score' in d && 'quote' in d;
      const asked = 'question' in d;
      expect(scored !== asked, d.name).toBe(true);
      if (isScored(d)) expect([1, 2, 3, 4, 5]).toContain(d.score);
      else expect(d.question.trim().length, d.name).toBeGreaterThan(0);
    }
  });

  it('shows no number the ad does not contain', () => {
    const text = lines.join('\n');
    const unsourced = claims(key).flatMap(({ text: t, quote }) =>
      (t.match(/\d+(?:[.,]\d+)?/g) ?? []).filter((n) => !quote.includes(n) && !text.includes(n)).map((n) => `${n} in "${t}"`),
    );
    expect(unsourced).toEqual([]);
  });

  it('keeps every template field, filled or empty', () => {
    expect(ad.brief.map((f) => f.field)).toEqual(data.sources.template.fields);
  });

  it('says when the ad was captured', () => {
    expect(Date.parse(ad.capturedAt)).not.toBeNaN();
    expect(ad.url).toMatch(/^https:\/\/techifide\.careers-page\.com\/jobs\//);
  });
});

describe('data.json: sources', () => {
  it('dates every capture', () => {
    for (const s of Object.values(data.sources)) expect(Date.parse(s.capturedAt), s.url).not.toBeNaN();
    expect(Date.parse(data.generatedAt)).not.toBeNaN();
  });

  it('quotes Techifide’s own pages as captured', () => {
    expect(data.sources.submitVacancy.quote).toContain('advanced matching algorithm');
    expect(data.sources.screening.quote).toContain('Role Fit Profile');
  });
});
