import { describe, expect, it } from 'vitest';

import type { AdView, Dimension } from './data';
import {
  briefRows,
  exportText,
  initialWorksheet,
  isTouched,
  liveHeadline,
  MAX_TEXT,
  openFields,
  profileRows,
  remaining,
  restoreWorksheet,
  sourceOf,
  type Worksheet,
} from './worksheet';

const dims: Dimension[] = [
  { name: 'Structure', description: 'How much clarity.' },
  { name: 'Autonomy', description: 'How independently.' },
  { name: 'Ambiguity', description: 'How well with uncertainty.' },
];

const ad: AdView = {
  key: 'fullstack',
  title: 'Senior Engineer',
  url: 'https://example.com/job',
  capturedAt: '2026-09-28T10:54:28Z',
  datePosted: '2026-09-25T09:42:30Z',
  listing: { location: null, remote: true, applicantCountry: 'Brazil', employmentType: 'FULL_TIME' },
  lanes: ['Senior Engineer', 'Own features from concept through production.', 'Experience with WebAssembly in the browser.'],
  brief: [
    { field: 'Salary', items: [] },
    { field: 'Essential Experience/ Attributes', items: [{ value: 'WebAssembly', quote: 'Experience with WebAssembly in the browser' }] },
  ],
  dimensions: [
    { name: 'Structure', question: 'S?', rank: 2 },
    { name: 'Autonomy', score: 4, quote: 'Own features from concept through production', reading: 'Owns features' },
    { name: 'Ambiguity', question: 'A?', rank: 1 },
  ],
  contradictions: [],
  dropped: 0,
};

const answered = (over: Partial<Worksheet['dimensions']>, fields: Worksheet['fields'] = {}): Worksheet => {
  const base = initialWorksheet(ad);
  return { dimensions: { ...base.dimensions, ...over } as Worksheet['dimensions'], fields };
};

describe('initialWorksheet', () => {
  it('starts from the ad: its levels filled, the rest open', () => {
    expect(initialWorksheet(ad).dimensions).toEqual({
      Structure: { level: null, note: '' },
      Autonomy: { level: 4, note: '' },
      Ambiguity: { level: null, note: '' },
    });
    expect(isTouched(ad, initialWorksheet(ad))).toBe(false);
  });

  it('offers only the template fields the ad leaves empty', () => {
    expect(openFields(ad)).toEqual(['Salary']);
  });
});

describe('the count', () => {
  it('goes down as the call answers, in the order worth asking', () => {
    const sheet = answered({ Ambiguity: { level: 3, note: '' } });
    expect(remaining(ad, sheet).map((q) => q.name)).toEqual(['Structure']);
    expect(liveHeadline(ad, sheet)).toEqual({ count: 1, text: 'question your intake call still has to answer' });
    expect(isTouched(ad, sheet)).toBe(true);
  });

  it('says the profile is ready once nothing is left to ask', () => {
    const sheet = answered({ Ambiguity: { level: 3, note: '' }, Structure: { level: 2, note: '' } });
    expect(liveHeadline(ad, sheet)).toEqual({ count: 0, text: 'Role Fit Profile ready' });
  });
});

describe('sources', () => {
  it('credits the ad while the call keeps its level, and the call once it changes it', () => {
    expect(sourceOf(ad, initialWorksheet(ad), 'Autonomy')).toEqual({
      kind: 'ad',
      lane: 1,
      quote: 'Own features from concept through production',
    });
    expect(sourceOf(ad, answered({ Autonomy: { level: 5, note: '' } }), 'Autonomy')).toEqual({ kind: 'call' });
    expect(sourceOf(ad, initialWorksheet(ad), 'Structure')).toEqual({ kind: 'open' });
  });

  it('credits the call when it discusses a level, even where it agrees with the ad', () => {
    const sheet = answered({ Autonomy: { level: 4, note: 'Confirmed: owns features alone.' } });
    expect(sourceOf(ad, sheet, 'Autonomy')).toEqual({ kind: 'call' });
  });
});

describe('restoreWorksheet', () => {
  it('keeps what matches this ad and drops the rest', () => {
    const raw = JSON.stringify({
      dimensions: { Structure: { level: 2, note: 'tickets' }, Autonomy: { level: 9 }, Invented: { level: 3 } },
      fields: { Salary: '£70k–£80k', 'Not a field': 'x', 'Essential Experience/ Attributes': 'overwrite?' },
    });
    const sheet = restoreWorksheet(raw, ad);
    expect(sheet.dimensions.Structure).toEqual({ level: 2, note: 'tickets' });
    expect(sheet.dimensions.Autonomy).toEqual({ level: 4, note: '' });
    expect(sheet.dimensions).not.toHaveProperty('Invented');
    expect(sheet.fields).toEqual({ Salary: '£70k–£80k' });
  });

  it('lets the call clear a level the ad had set', () => {
    expect(restoreWorksheet(JSON.stringify({ dimensions: { Autonomy: { level: null, note: '' } } }), ad).dimensions.Autonomy.level).toBeNull();
  });

  it('falls back to the sheet before the call when storage is empty or broken', () => {
    expect(restoreWorksheet(null, ad)).toEqual(initialWorksheet(ad));
    expect(restoreWorksheet('{not json', ad)).toEqual(initialWorksheet(ad));
    expect(restoreWorksheet('"a string"', ad)).toEqual(initialWorksheet(ad));
  });

  it('trims text to size', () => {
    const sheet = restoreWorksheet(JSON.stringify({ fields: { Salary: 'x'.repeat(MAX_TEXT + 50) } }), ad);
    expect(sheet.fields.Salary).toHaveLength(MAX_TEXT);
  });
});

describe('exports', () => {
  const sheet = answered({ Structure: { level: 2, note: 'Groomed tickets from the PM.' } }, { Salary: '£70k' });

  it('fills the template: the ad with its lane, then the call', () => {
    expect(briefRows(ad, sheet)).toEqual([
      { field: 'Salary', values: [{ text: '£70k', from: 'the call' }] },
      { field: 'Essential Experience / Attributes', values: [{ text: 'WebAssembly', from: 'the ad, line 2' }] },
    ]);
  });

  it('lists every dimension in Techifide’s order with level, source and note', () => {
    expect(profileRows(ad, sheet, dims).map((r) => [r.name, r.level, r.source.kind, r.note])).toEqual([
      ['Structure', 2, 'call', 'Groomed tickets from the PM.'],
      ['Autonomy', 4, 'ad', ''],
      ['Ambiguity', null, 'open', ''],
    ]);
  });

  it('writes plain text for an e-mail, marking what is still to confirm', () => {
    const text = exportText(ad, sheet, dims, { url: 'https://example.com/t.docx' });
    expect(text).toContain('Salary: £70k (the call)');
    expect(text).toContain('Structure: 2/5 (from the call). Groomed tickets from the PM.');
    expect(text).toContain('Autonomy: 4/5 (from the ad, line 1)');
    expect(text).toContain('Ambiguity: to confirm');
  });
});
