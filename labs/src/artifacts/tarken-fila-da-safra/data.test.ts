import { describe, expect, it } from 'vitest';

import {
  bankShare,
  buildPracas,
  buildQueue,
  buildUfs,
  cutoffMonth,
  harvestYear,
  type MonthRow,
  type Praca,
  perHectare,
  queueBuckets,
  safraHarvestedIn,
  safraOf,
} from './data';

const month = (m: string, amount: number, operations: number, uf = 'MT'): MonthRow => ({
  uf,
  month: m,
  amount,
  operations,
});

describe('safras', () => {
  it('runs the plano safra from July to June', () => {
    expect(safraOf(new Date('2025-07-01T00:00:00Z'))).toBe('2025/26');
    expect(safraOf(new Date('2026-06-30T00:00:00Z'))).toBe('2025/26');
    expect(safraOf(new Date('2026-07-01T00:00:00Z'))).toBe('2026/27');
    expect(safraOf(new Date('2099-08-01T00:00:00Z'))).toBe('2099/00');
  });

  it('settles on 30 April of the harvest year', () => {
    expect(cutoffMonth('2025/26')).toBe('2026-04');
  });

  it('pairs a PAM harvest year with the safra that financed it', () => {
    expect(safraHarvestedIn('2025')).toBe('2024/25');
  });

  it('names the harvest a safra is paid from', () => {
    expect(harvestYear('2025/26')).toBe('2026');
  });
});

describe('buildQueue', () => {
  it('shares out what matures by April against the whole harvest', () => {
    const q = buildQueue([month('2026-05', 25, 10), month('2026-03', 50, 20), month('2026-04', 25, 10)], '2025/26');
    expect(q.total).toBe(100);
    expect(q.beforeCutoff).toBe(0.75);
    expect(q.months.map((m) => m.month)).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('queues by harvest: what matures in 2027 is the next harvest, whenever it was contracted', () => {
    const q = buildQueue([month('2026-04', 60, 20), month('2027-04', 40, 20)], '2025/26');
    expect(q.total).toBe(60);
    expect(q.beforeCutoff).toBe(1);
  });

  it('merges a month contracted across several safras before suppressing it', () => {
    const q = buildQueue([month('2026-06', 10, 6), month('2026-06', 5, 6), month('2026-03', 85, 20)], '2025/26');
    expect(q.months).toEqual([
      { month: '2026-03', amount: 85 },
      { month: '2026-06', amount: 15 },
    ]);
  });

  it('suppresses a month with too few operations but still counts it in the total', () => {
    const q = buildQueue([month('2026-03', 90, 20), month('2026-06', 10, 3)], '2025/26');
    expect(q.months).toEqual([
      { month: '2026-03', amount: 90 },
      { month: '2026-06', amount: null },
    ]);
    expect(q.beforeCutoff).toBe(0.9);
  });

  it('suppresses the whole safra when there are too few operations', () => {
    expect(buildQueue([month('2026-03', 90, 9)], '2025/26')).toEqual({
      operations: 9,
      total: null,
      beforeCutoff: null,
      months: [],
    });
  });

  it('keeps harvests apart', () => {
    const q = buildQueue([month('2026-03', 90, 20), month('2027-03', 10, 20)], '2026/27');
    expect(q.total).toBe(10);
  });
});

describe('queueBuckets', () => {
  const queue = buildQueue([month('2026-01', 5, 10), month('2026-04', 60, 20), month('2026-06', 7, 2)], '2025/26');
  const buckets = queueBuckets(queue, '2025/26');

  it('lays one bar per month of the harvest year, so the bars add up to the total', () => {
    expect(buckets.map((b) => b.key)).toEqual(
      Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`),
    );
  });

  it('shows an empty month as zero and a suppressed month as null', () => {
    expect(buckets.find((b) => b.key === '2026-02')?.amount).toBe(0);
    expect(buckets.find((b) => b.key === '2026-06')?.amount).toBeNull();
  });

  it('marks months up to April as before the cutoff', () => {
    expect(buckets.find((b) => b.key === '2026-04')?.beforeCutoff).toBe(true);
    expect(buckets.find((b) => b.key === '2026-05')?.beforeCutoff).toBe(false);
  });
});

describe('buildUfs', () => {
  it('builds each UF its own queue for both harvests', () => {
    const ufs = buildUfs([month('2026-03', 10, 20), month('2026-03', 7, 30, 'GO')], {
      complete: '2025/26',
      partial: '2026/27',
      measured: '2024/25',
      pamYear: '2025',
    });
    expect(Object.keys(ufs)).toEqual(['GO', 'MT']);
    expect(ufs.GO.queue['2025/26'].total).toBe(7);
    expect(ufs.MT.queue['2026/27'].total).toBeNull();
  });
});

describe('praças', () => {
  const pracas = buildPracas({
    custeio: [
      { municipio: 5107925, safra: '2024/25', value: 300, area: 100 },
      { municipio: 5107925, safra: '2024/25', value: 60, area: 10 },
      { municipio: 9999999, safra: '2024/25', value: 1, area: 1 },
    ],
    pam: [
      { municipio: 5107925, year: '2025', plantedHa: 550, kgHa: 4260 },
      { municipio: 5107925, year: '2024', kgHa: 3480 },
    ],
    names: new Map([[5107925, { name: 'Sorriso', uf: 'MT' }]]),
  });
  const sorriso = pracas['5107925'];

  it('sums the MDCR rows per safra and drops ids without a name', () => {
    expect(Object.keys(pracas)).toEqual(['5107925']);
    expect(sorriso.custeio['2024/25']).toEqual({ value: 360, area: 110 });
    expect(sorriso.yieldKgHa).toEqual({ '2024': 3480, '2025': 4260 });
  });

  it('measures the bank-financed share of planted soy in the same season', () => {
    expect(bankShare(sorriso, '2024/25', '2025')).toBe(0.2);
    expect(bankShare(sorriso, '2025/26', '2025')).toBeNull();
    expect(bankShare(sorriso, '2024/25', '2024')).toBeNull();
  });

  it('caps a financed area above the planted area at the whole', () => {
    const p: Praca = { ...sorriso, custeio: { '2024/25': { value: 1, area: 900 } } };
    expect(bankShare(p, '2024/25', '2025')).toBe(1);
  });

  it('prices custeio per financed hectare only when area was reported', () => {
    expect(perHectare({ value: 360, area: 120 })).toBe(3);
    expect(perHectare({ value: 360, area: 0 })).toBeNull();
    expect(perHectare(undefined)).toBeNull();
  });
});
