import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  answer,
  answerText,
  bands,
  bill,
  board,
  type ContaDeTokens,
  DEFAULT_SCENARIO,
  flapWidth,
  leader,
  type Model,
  monthTicks,
  parseScenario,
  type Prices,
  ratioTag,
  referenceOptions,
  scenarioQuery,
  sharePct,
  usd,
  weekLabel,
} from './data';

const DATA = JSON.parse(
  readFileSync(join(import.meta.dirname, 'data.json'), 'utf8'),
) as ContaDeTokens;

// Prices per million from the brief (Achado 10), catalog of 2026-09-25.
const SONNET_5: Prices = { input: 2, cacheRead: 0.2, output: 10 };
const OPUS_5_5: Prices = { input: 4, cacheRead: 0.2, output: 20 };
const DEEPSEEK_FLASH: Prices = { input: 0.075, cacheRead: 0.0015, output: 0.3 };
const GLM_FLASH: Prices = { input: 0.045, cacheRead: 0.01, output: 0.14 };

const at = (cache: number) => ({ volume: '1b' as const, output: 20, cache });

describe('bill', () => {
  it('reproduces the brief’s default-case bills at 0, 50 and 90% cache', () => {
    const cases: [Prices, number[]][] = [
      [SONNET_5, [3600, 2880, 2304]],
      [OPUS_5_5, [7200, 5680, 4464]],
      [DEEPSEEK_FLASH, [120, 91, 67]],
      [GLM_FLASH, [64, 50, 39]],
    ];
    for (const [prices, expected] of cases) {
      expect([0, 50, 90].map((c) => Math.round(bill(prices, at(c)).total))).toEqual(expected);
    }
  });

  it('splits the total into fresh input, cached input and output', () => {
    const b = bill(SONNET_5, at(50));
    // 800M input: 400M fresh at 2, 400M cached at 0.2; 200M output at 10.
    expect(b).toMatchObject({ uncached: 800, cached: 80, output: 2000, total: 2880, frozen: false });
  });

  it('does not move a model with no cache price, whatever the cache share', () => {
    const noCache: Prices = { input: 1, cacheRead: null, output: 2 };
    const bills = [0, 50, 95].map((c) => bill(noCache, at(c)));
    expect(new Set(bills.map((b) => b.total)).size).toBe(1);
    expect(bills.every((b) => b.frozen && b.cached === 0)).toBe(true);
    // It still moves with volume and output share.
    expect(bill(noCache, { volume: '10b', output: 20, cache: 50 }).total).toBe(bills[0].total * 10);
    expect(bill(noCache, { volume: '1b', output: 40, cache: 50 }).total).not.toBe(bills[0].total);
  });

  it('scales with the volume preset', () => {
    expect(bill(SONNET_5, { volume: '100m', output: 20, cache: 50 }).total).toBeCloseTo(288);
    expect(bill(SONNET_5, { volume: '10b', output: 20, cache: 50 }).total).toBeCloseTo(28800);
  });
});

describe('the first-viewport sentence', () => {
  it('is generated from the data for the default case', () => {
    expect(answerText(answer(DATA, DEFAULT_SCENARIO))).toBe(
      'Com 50% de cache, 1 bilhão de tokens por mês custa US$ 2.880 no Claude Sonnet 5 e US$ 91 no DeepSeek V4.1 Flash — e a DeepSeek ficou com 24,6% dos tokens do OpenRouter na última semana; a Anthropic, com 2,8%.',
    );
  });

  it('marks the reference bill and the leader bill, and footnotes prices and share', () => {
    const figs = answer(DATA, DEFAULT_SCENARIO).segments.filter((s) => 'fig' in s);
    expect(figs).toContainEqual({ fig: 'US$ 2.880', mark: 'ref', note: 1 });
    expect(figs).toContainEqual({ fig: 'US$ 91', mark: 'leader' });
    expect(figs).toContainEqual({ fig: '24,6%', note: 2 });
  });

  it('says "Sem cache" at 0%', () => {
    expect(answerText(answer(DATA, { ...DEFAULT_SCENARIO, cache: 0 }))).toMatch(/^Sem cache, 1 bilhão .* US\$ 3\.600 .* US\$ 120 /);
  });

  it('says the cache does not apply when the reference has no cache price', () => {
    const data = withModel(DATA, { input: 1, cacheRead: null, output: 4 });
    const a = answer(data, { ...DEFAULT_SCENARIO, ref: 'test/no-cache' });
    expect(a.refBill.frozen).toBe(true);
    expect(answerText(a)).toMatch(/^Sem preço de cache no catálogo, 1 bilhão de tokens por mês custa US\$ 1\.600 no No Cache/);
  });

  it('does not compare the leader with itself when it is the reference', () => {
    const lead = leader(DATA).model;
    const text = answerText(answer(DATA, { ...DEFAULT_SCENARIO, ref: lead.id as string }));
    expect(text).toContain(`no ${lead.name}, o modelo mais usado da DeepSeek, que ficou com 24,6%`);
    expect(text.match(/US\$/g)).toHaveLength(1);
  });

  it('says so when the reference provider is not in the top 50', () => {
    const data = withModel(DATA, { input: 1, cacheRead: 0.1, output: 4 });
    expect(answerText(answer(data, { ...DEFAULT_SCENARIO, ref: 'test/no-cache' }))).toMatch(/a Test não entrou no top 50\.$/);
  });
});

describe('leader', () => {
  it('is the largest provider’s most-used paid model', () => {
    const l = leader(DATA);
    expect(l.provider).toBe('deepseek');
    expect(l.model.id).toBe('deepseek/deepseek-v4.1-flash');
    expect(l.model.kind).toBe('paid');
  });

  it('is never a free variant, even when one has the most tokens', () => {
    const data = structuredClone(DATA);
    const free = data.models.find((m) => m.kind === 'free') as Model;
    free.provider = 'deepseek';
    free.share = 0.9;
    expect(leader(data).model.kind).toBe('paid');
  });

  it('is never the unidentified stealth provider', () => {
    const data = structuredClone(DATA);
    const stealth = data.providers.find((p) => p.slug === 'stealth');
    if (stealth) stealth.tokens = stealth.tokens.map(() => 1e15);
    expect(leader(data).provider).not.toBe('stealth');
  });
});

describe('board', () => {
  const b = board(DATA, DEFAULT_SCENARIO, false);

  it('sorts paid models by bill, ascending', () => {
    const totals = b.paid.map((r) => (r.bill as { total: number }).total);
    expect(totals).toEqual([...totals].sort((x, y) => x - y));
  });

  it('keeps free variants out of the paid ranking, at zero', () => {
    expect(b.paid.every((r) => r.model.kind === 'paid')).toBe(true);
    expect(b.free.length).toBeGreaterThan(0);
    expect(b.free.every((r) => r.bill?.total === 0)).toBe(true);
  });

  it('lists stealth and unpriced models at the end with no bill', () => {
    expect(b.tail.every((r) => r.bill === null)).toBe(true);
    const all = board(DATA, DEFAULT_SCENARIO, true);
    expect(all.tail.map((r) => r.model.kind).sort()).toEqual(['stealth', 'unpriced']);
    expect(all.tail.find((r) => r.model.kind === 'stealth')?.model.name).toBe('Modelo não identificado');
  });

  it('shows the reference models and the reader’s reference, once each', () => {
    const ids = b.paid.map((r) => r.model.id);
    for (const id of ['anthropic/claude-sonnet-5', 'anthropic/claude-opus-5.5', 'openai/gpt-6-sol', 'openai/gpt-6-luna']) {
      expect(ids.filter((x) => x === id)).toHaveLength(1);
    }
    const ref = referenceOptions(DATA).find((m) => !ids.includes(m.id)) as Model;
    const withRef = board(DATA, { ...DEFAULT_SCENARIO, ref: ref.id as string }, false);
    expect(withRef.paid.filter((r) => r.isRef).map((r) => r.model.id)).toEqual([ref.id]);
  });

  it('marks exactly one reference row and one leader row', () => {
    expect(b.paid.filter((r) => r.isRef)).toHaveLength(1);
    expect(b.paid.filter((r) => r.isLeader).map((r) => r.model.id)).toEqual(['deepseek/deepseek-v4.1-flash']);
  });

  it('reveals every model with "Ver todos"', () => {
    const all = board(DATA, DEFAULT_SCENARIO, true);
    expect(all.paid.length + all.free.length + all.tail.length).toBe(b.total);
    expect(b.paid.length + b.free.length + b.tail.length).toBeLessThan(b.total);
  });
});

describe('bands', () => {
  it('stacks the top providers by last-week share, then "outros", summing to 100% each week', () => {
    const bs = bands(DATA, 'anthropic');
    expect(bs[0]).toMatchObject({ slug: 'deepseek', tone: 'ink' });
    expect(bs.at(-1)?.slug).toBe('outros');
    for (let i = 0; i < DATA.weeks.length; i++) {
      expect(bs.reduce((sum, b) => sum + b.shares[i], 0)).toBeCloseTo(1, 6);
    }
    expect(bs.find((b) => b.slug === 'anthropic')?.tone).toBe('ref');
  });

  it('adds the reference provider when it is outside the top 8', () => {
    const small = [...DATA.providers].sort((a, b) => a.tokens.at(-1)! - b.tokens.at(-1)!)[0];
    const bs = bands(DATA, small.slug);
    expect(bs.find((b) => b.slug === small.slug)?.tone).toBe('ref');
    expect(bs).toHaveLength(10);
  });

  it('gives ink to the next provider when the reference provider leads', () => {
    const bs = bands(DATA, 'deepseek');
    expect(bs[0]).toMatchObject({ slug: 'deepseek', tone: 'ref' });
    expect(bs[1].tone).toBe('ink');
    expect(bs.filter((b) => b.tone === 'plain').map((b) => b.shade)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('scenario in the URL', () => {
  it('round-trips', () => {
    const s = { volume: '10b' as const, output: 35, cache: 80, ref: 'openai/gpt-6-sol' };
    const q = new URLSearchParams(scenarioQuery(s));
    expect(parseScenario(Object.fromEntries(q), DATA)).toEqual(s);
  });

  it('falls back field by field on anything invalid', () => {
    expect(parseScenario({ t: '5b', s: '17', c: '96', ref: 'nope/nope' }, DATA)).toEqual(DEFAULT_SCENARIO);
    expect(parseScenario({ c: '0' }, DATA).cache).toBe(0);
    expect(parseScenario({ c: '95' }, DATA).cache).toBe(95);
    // A free model can never be the reference.
    const free = DATA.models.find((m) => m.kind === 'free') as Model;
    expect(parseScenario({ ref: free.key }, DATA).ref).toBe(DEFAULT_SCENARIO.ref);
  });
});

describe('formatting', () => {
  it('formats bills in pt-BR: whole dollars, one decimal below 10', () => {
    expect(usd(2880)).toBe('2.880');
    expect(usd(28800)).toBe('28.800');
    expect(usd(6.74)).toBe('6,7');
    expect(usd(0)).toBe('0');
  });

  it('formats shares, including tiny and absent ones', () => {
    expect(sharePct(0.246)).toBe('24,6%');
    expect(sharePct(0.0004)).toBe('<0,1%');
    expect(sharePct(null)).toBe('—');
  });

  it('writes the ratio tag, with one decimal below 2×', () => {
    expect(ratioTag(2880, 91)).toBe('32× MENOS');
    expect(ratioTag(100, 70)).toBe('1,4× MENOS');
    expect(ratioTag(100, 300)).toBe('3× MAIS');
    expect(ratioTag(100, 100)).toBeNull();
    expect(ratioTag(100, 0)).toBeNull();
  });

  it('labels weeks and months', () => {
    expect(weekLabel({ start: '2026-09-18', end: '2026-09-24' })).toBe('18 a 24 set');
    expect(weekLabel({ start: '2026-08-28', end: '2026-09-03' })).toBe('28 ago a 3 set');
    const ticks = monthTicks(DATA.weeks);
    expect(ticks[0]).toEqual({ index: 0, label: 'abr' });
    expect(ticks.map((t) => t.label)).toEqual(['abr', 'mai', 'jun', 'jul', 'ago', 'set']);
  });

  it('sizes flaps to the widest bill, capped at 7 cells', () => {
    expect(flapWidth([91, 2880])).toBe(5);
    expect(flapWidth([1e9])).toBe(7);
  });
});

/** The data plus one priced model from a provider that is not ranked. */
function withModel(data: ContaDeTokens, prices: Prices): ContaDeTokens {
  const copy = structuredClone(data);
  copy.models.push({ key: 'test/no-cache', id: 'test/no-cache', name: 'No Cache', provider: 'test', kind: 'paid', share: null, prices });
  copy.providers.push({ slug: 'test', label: 'Test', tokens: data.weeks.map(() => 0) });
  return copy;
}
