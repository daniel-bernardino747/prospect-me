import { describe, expect, it } from 'vitest';

import {
  type BcbRow,
  buildData,
  decilePhrase,
  derive,
  isOutlier,
  isSmallSample,
  lastClosedMonth,
  monthsEndingAt,
  monthShort,
  monthStamp,
  pickCity,
  quantile,
  queueColumns,
  sentence,
  shareText,
  slugify,
  splitIbgeName,
} from './data';

const row = (AnoMes: number, ibge: number | null, pix: number, payers: number, value = pix * 100): BcbRow => ({
  AnoMes,
  Municipio_Ibge: ibge,
  Municipio: ibge ? `CIDADE ${ibge}` : 'N/D',
  VL_PagadorPF: value,
  QT_PagadorPF: pix,
  QT_PES_PagadorPF: payers,
});

const population = new Map([
  [3550308, { name: 'São Paulo', uf: 'SP', pop: 1000 }],
  [1302603, { name: 'Manaus', uf: 'AM', pop: 800 }],
  [1400704, { name: 'Pacaraima', uf: 'RR', pop: 100 }],
  [3500105, { name: 'Adamantina', uf: 'SP', pop: 50_000 }],
]);

const MED = { month: 202603, contestados: 1, aceitas: 1, devolucao: 1 };

describe('closed months', () => {
  it('cuts the running month, which the API already serves partial', () => {
    expect(lastClosedMonth(new Date('2026-09-25T12:00:00Z'))).toBe(202608);
    expect(lastClosedMonth(new Date('2026-09-01T00:00:00Z'))).toBe(202608);
    expect(lastClosedMonth(new Date('2027-01-10T00:00:00Z'))).toBe(202612);
  });

  it('counts twelve months back across a year', () => {
    expect(monthsEndingAt(202608, 12)).toEqual([
      202509, 202510, 202511, 202512, 202601, 202602, 202603, 202604, 202605, 202606, 202607, 202608,
    ]);
  });

  it('never keeps a month outside the window, even when the API sends it', () => {
    const { data } = buildData(
      [row(202608, 3550308, 380, 10), row(202609, 3550308, 1, 10), row(202607, 3550308, 300, 10)],
      population,
      [202607, 202608],
      '2026-09-25',
      MED,
    );
    expect(data.months).toEqual([202607, 202608]);
    expect(data.brasil.pix).toEqual([300, 380]);
    expect(data.mun[0][7]).toEqual([300, 380]);
  });
});

describe('the join', () => {
  const rows = [
    row(202608, 3550308, 381, 10),
    row(202608, 1302603, 709, 10),
    row(202608, 1400704, 2000, 400),
    row(202608, null, 99_999, 999),
    row(202608, 9999999, 5, 5),
    row(202607, 3550308, 360, 10),
  ];
  const { data, dropped } = buildData(rows, population, [202607, 202608], '2026-09-25', MED);

  it('drops the N/D row and anything IBGE does not know, and says so', () => {
    expect(data.mun.map((r) => r[0])).not.toContain(9999999);
    expect(dropped.some((d) => d.startsWith('9999999'))).toBe(true);
    expect(data.brasil.pix[1]).toBe(381 + 709 + 2000);
  });

  it('drops a município with no payer in the last month', () => {
    expect(data.mun.map((r) => r[0])).not.toContain(3500105);
  });

  it('computes Brasil as sum over sum, not a mean of cities', () => {
    const pix = derive(data);
    expect(pix.brasil.value).toBeCloseTo((381 + 709 + 2000) / (10 + 10 + 400));
  });

  it('orders the queue by Pix per payer, most first', () => {
    expect(data.mun.map((r) => r[1])).toEqual(['Manaus', 'São Paulo', 'Pacaraima']);
  });

  it('marks months with no row as gaps, not zeros', () => {
    expect(data.mun.find((r) => r[0] === 1302603)![7]).toEqual([null, 709]);
  });

  it('stores the average value per Pix in whole reais', () => {
    expect(data.mun.find((r) => r[0] === 3550308)![6]).toBe(100);
  });
});

describe('derive', () => {
  const { data } = buildData(
    [
      row(202608, 3550308, 380, 10),
      row(202608, 1302603, 710, 10),
      row(202608, 3500105, 500, 10),
      row(202608, 1400704, 2000, 400),
    ],
    population,
    [202608],
    '2026-09-25',
    MED,
  );
  const pix = derive(data);

  it('ranks in Brazil, in the state and among capitals', () => {
    const sp = pix.byIbge.get(3550308)!;
    expect(sp.rank).toBe(3);
    expect(sp.stateRank).toBe(2);
    expect(sp.stateTotal).toBe(2);
    expect(sp.capitalRank).toBe(2);
    expect(pix.byIbge.get(3500105)!.capitalRank).toBeUndefined();
    expect(pix.capitals.map((c) => c.name)).toEqual(['Manaus', 'São Paulo']);
  });

  it('flags a border town with more payers than residents', () => {
    expect(pix.byIbge.get(1400704)!.outlier).toBe(true);
    expect(pix.byIbge.get(3550308)!.outlier).toBe(false);
  });

  it('falls back to São Paulo with a notice, never a 404', () => {
    expect(pickCity(pix, undefined)).toMatchObject({ city: { ibge: 3550308 }, notFound: false });
    expect(pickCity(pix, '1302603')).toMatchObject({ city: { ibge: 1302603 }, notFound: false });
    expect(pickCity(pix, '123')).toMatchObject({ city: { ibge: 3550308 }, notFound: true });
    expect(pickCity(pix, '9999999')).toMatchObject({ city: { ibge: 3550308 }, notFound: true });
    expect(pickCity(pix, ['1302603', 'x'])).toMatchObject({ city: { ibge: 1302603 } });
    expect(pickCity(pix, '')).toMatchObject({ notFound: true });
  });
});

describe('small samples and outliers', () => {
  it('hides the exact place below 2.000 payers', () => {
    expect(isSmallSample(1999)).toBe(true);
    expect(isSmallSample(2000)).toBe(false);
  });

  it('says the decile from both ends of the queue', () => {
    expect(decilePhrase(1, 5571)).toBe('entre os 10% que mais usam');
    expect(decilePhrase(557, 5571)).toBe('entre os 10% que mais usam');
    expect(decilePhrase(558, 5571)).toBe('entre os 20% que mais usam');
    expect(decilePhrase(2785, 5571)).toBe('entre os 50% que mais usam');
    expect(decilePhrase(2786, 5571)).toBe('entre os 50% que menos usam');
    expect(decilePhrase(5571, 5571)).toBe('entre os 10% que menos usam');
  });

  it('needs payers above the estimate, not equal', () => {
    expect(isOutlier(100, 100)).toBe(false);
    expect(isOutlier(101, 100)).toBe(true);
    expect(isOutlier(5, 0)).toBe(false);
  });
});

describe('words', () => {
  it('says an average as an average', () => {
    expect(sentence('São Paulo', 38.1, 43.2, 202608)).toBe(
      'Quem usa Pix em São Paulo fez, em média, 38 Pix em agosto. A média do Brasil é 43.',
    );
    expect(shareText('Manaus', 70.9, 202608)).toBe('Manaus: 71 Pix por usuário em agosto. E a sua cidade?');
  });

  it('names months the pt-BR way', () => {
    expect(monthShort(202509)).toBe('set/25');
    expect(monthStamp(202608)).toBe('AGO/2026');
  });

  it('splits the IBGE name from its UF', () => {
    expect(splitIbgeName("Alta Floresta D'Oeste - RO")).toEqual({ name: "Alta Floresta D'Oeste", uf: 'RO' });
    expect(splitIbgeName('Bom Jesus - PI')).toEqual({ name: 'Bom Jesus', uf: 'PI' });
    expect(() => splitIbgeName('Brasília')).toThrow();
  });

  it('makes a file name without accents', () => {
    expect(slugify("São João d'Aliança")).toBe('sao-joao-d-alianca');
  });
});

describe('the queue strip', () => {
  it('draws groups of ten at their median, front first', () => {
    const values = Array.from({ length: 25 }, (_, i) => 25 - i);
    const cols = queueColumns(values, 10);
    expect(cols).toEqual([
      { from: 1, median: 20.5 },
      { from: 11, median: 10.5 },
      { from: 21, median: 3 },
    ]);
  });

  it('keeps a last group of one', () => {
    expect(queueColumns([3, 2, 1], 2)).toEqual([
      { from: 1, median: 2.5 },
      { from: 3, median: 1 },
    ]);
  });

  it('takes a nearest-rank quantile', () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(quantile(v, 0.99)).toBe(99);
    expect(quantile(v, 1)).toBe(100);
  });
});
