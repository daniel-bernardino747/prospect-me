import { describe, expect, it } from 'vitest';

import { buildData, type CatalogModel, joinCatalog, kindOf, nameFromSlug, perMillion, type RankingRow, weekWindows } from './build';

const cat = (id: string, name: string, prompt: string, completion: string, cacheRead?: string, canonical = id): CatalogModel => ({
  id,
  canonical_slug: canonical,
  name,
  pricing: { prompt, completion, ...(cacheRead === undefined ? {} : { input_cache_read: cacheRead }) },
});

const CATALOG: CatalogModel[] = [
  cat('anthropic/claude-sonnet-5', 'Anthropic: Claude Sonnet 5', '0.000002', '0.00001', '0.0000002', 'anthropic/claude-sonnet-5-20260630'),
  cat('anthropic/claude-opus-5.5', 'Anthropic: Claude Opus 5.5', '0.000004', '0.00002', '0.0000002'),
  cat('openai/gpt-6-sol', 'OpenAI: GPT-6 Sol', '0.000002', '0.00001', '0.0000002'),
  cat('openai/gpt-6-luna', 'OpenAI: GPT-6 Luna', '0.0000001', '0.0000005', '0.00000001'),
  cat('google/gemini-3.1-pro-preview', 'Google: Gemini 3.1 Pro Preview', '0.000002', '0.000012'),
  cat('google/gemini-3.8-flash', 'Google: Gemini 3.8 Flash', '0.0000003', '0.0000025'),
  // Same canonical slug: the list price, its batch variant, its free variant.
  cat('deepseek/deepseek-v4.1-flash:batch', 'DeepSeek: DeepSeek V4.1 Flash (batch)', '0.0000000375', '0.00000015', undefined, 'deepseek/deepseek-v4.1-flash-20260910'),
  cat('deepseek/deepseek-v4.1-flash', 'DeepSeek: DeepSeek V4.1 Flash', '0.000000075', '0.0000003', '0.0000000015', 'deepseek/deepseek-v4.1-flash-20260910'),
  cat('deepseek/deepseek-v4.1-flash:free', 'DeepSeek: DeepSeek V4.1 Flash (free)', '0', '0', undefined, 'deepseek/deepseek-v4.1-flash-20260910'),
];

const row = (date: string, model_permaslug: string, total_tokens: number): RankingRow => ({
  date,
  model_permaslug,
  total_tokens: String(total_tokens),
});

describe('weekWindows', () => {
  it('ends on the last complete day, seven days each, oldest first', () => {
    const w = weekWindows('2026-09-24', 3);
    expect(w).toEqual([
      { start: '2026-09-04', end: '2026-09-10' },
      { start: '2026-09-11', end: '2026-09-17' },
      { start: '2026-09-18', end: '2026-09-24' },
    ]);
  });
});

describe('joining the ranking to the price catalog', () => {
  it('reads US$ per token as US$ per million without float noise', () => {
    expect(perMillion('0.000000075')).toBe(0.075);
    expect(perMillion('0.0000000015')).toBe(0.0015);
  });

  it('matches the permaslug to the canonical slug and takes the list price, not :batch', () => {
    expect(joinCatalog('deepseek/deepseek-v4.1-flash-20260910', CATALOG)?.id).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('strips :free before joining', () => {
    expect(joinCatalog('deepseek/deepseek-v4.1-flash-20260910:free', CATALOG)?.id).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('classifies stealth, free, unpriced and paid rows', () => {
    const j = joinCatalog('deepseek/deepseek-v4.1-flash-20260910', CATALOG);
    expect(kindOf('stealth/space-bunny-alpha', undefined)).toBe('stealth');
    expect(kindOf('deepseek/deepseek-v4.1-flash-20260910:free', j)).toBe('free');
    expect(kindOf('typesafe/jev-1.13-20260917', undefined)).toBe('unpriced');
    expect(kindOf('deepseek/deepseek-v4.1-flash-20260910', j)).toBe('paid');
  });

  it('names a model the catalog lost from its slug', () => {
    expect(nameFromSlug('typesafe/jev-1.13-20260917')).toBe('jev-1.13');
  });
});

describe('buildData', () => {
  const rows = [
    row('2026-09-15', 'deepseek/deepseek-v4.1-flash-20260910', 100),
    row('2026-09-15', 'other', 100),
    row('2026-09-20', 'deepseek/deepseek-v4.1-flash-20260910', 500),
    row('2026-09-21', 'deepseek/deepseek-v4.1-flash-20260910:free', 100),
    row('2026-09-21', 'anthropic/claude-sonnet-5-20260630', 150),
    row('2026-09-22', 'stealth/space-bunny-alpha', 50),
    row('2026-09-22', 'typesafe/jev-1.13-20260917', 50),
    row('2026-09-23', 'other', 150),
    // Before the window: ignored.
    row('2025-01-01', 'anthropic/claude-sonnet-5-20260630', 9e9),
  ];
  const data = buildData({
    catalog: CATALOG,
    rows,
    endDate: '2026-09-24',
    generatedAt: '2026-09-25T00:00:00Z',
    sources: {
      catalog: { url: 'c', fetchedAt: '2026-09-25T00:00:00Z' },
      rankings: { url: 'r', asOf: '2026-09-25T00:00:00Z', via: 'openrouter' },
    },
  });

  it('sums tokens per provider per week, with "other" only in the totals', () => {
    expect(data.weeks).toHaveLength(26);
    expect(data.totals.at(-1)).toBe(1000);
    expect(data.totals.at(-2)).toBe(200);
    expect(data.providers.map((p) => p.slug)).toEqual(['deepseek', 'anthropic', 'stealth', 'typesafe']);
    expect(data.providers[0]).toMatchObject({ label: 'DeepSeek' });
    expect(data.providers[0].tokens.at(-1)).toBe(600);
    expect(data.providers.find((p) => p.slug === 'stealth')?.label).toBe('Não identificado');
  });

  it('reports the joined coverage and the free share of the last week', () => {
    // Joined: 500 + 100 (free, joins by canonical slug) + 150 = 750 of 1000.
    expect(data.coverage).toBeCloseTo(0.75);
    expect(data.freeShare).toBeCloseTo(0.1);
  });

  it('keeps the free variant apart from the paid model it shares a slug with', () => {
    const flash = data.models.filter((m) => m.id === 'deepseek/deepseek-v4.1-flash');
    expect(flash.map((m) => m.kind).sort()).toEqual(['free', 'paid']);
    expect(flash.find((m) => m.kind === 'free')?.prices).toBeNull();
    expect(flash.find((m) => m.kind === 'paid')?.prices).toEqual({ input: 0.075, cacheRead: 0.0015, output: 0.3 });
  });

  it('adds the reference models that are not ranked, with no share', () => {
    const opus = data.models.find((m) => m.id === 'anthropic/claude-opus-5.5');
    expect(opus).toMatchObject({ kind: 'paid', share: null, name: 'Claude Opus 5.5' });
    const gemini = data.models.find((m) => m.id === 'google/gemini-3.8-flash');
    expect(gemini?.prices?.cacheRead).toBeNull();
  });

  it('refuses data with an empty last week', () => {
    expect(() => buildData({ catalog: CATALOG, rows: rows.slice(0, 2), endDate: '2026-09-24', generatedAt: '', sources: data.sources })).toThrow(
      /no tokens in the last week/,
    );
  });

  it('refuses a missing reference model', () => {
    expect(() =>
      buildData({ catalog: CATALOG.slice(1), rows, endDate: '2026-09-24', generatedAt: '', sources: data.sources }),
    ).toThrow(/reference model anthropic\/claude-sonnet-5/);
  });
});
