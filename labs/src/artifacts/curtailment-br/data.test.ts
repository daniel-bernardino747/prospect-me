import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  annunciator,
  answer,
  buildDay,
  buildDays,
  Catalog,
  comparedWithGenerated,
  type CurtailmentData,
  dataProblems,
  type Day,
  decodeLamp,
  deck,
  encodeLamp,
  engrave,
  gwh,
  heat,
  hourClock,
  hourProse,
  level,
  LEVELS,
  longDate,
  mw,
  type OnsRow,
  PATAMARES,
  pctWhole,
  pickDay,
  plateDate,
  type Point,
  shortRestriction,
  sundaysLead,
  worstDays,
  worstWeek,
} from './data';

const data = JSON.parse(
  readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8'),
) as CurtailmentData;
const day16 = data.days.find((d) => d.date === '2026-08-16')!;

const zeros = () => new Array<number>(PATAMARES).fill(0);
const point = (id: string, uf = 'RN'): Point => ({ id, name: id, source: 'eol', uf, sub: null, x: 1, y: 1 });

describe('data.json', () => {
  it('passes the loader validation', () => {
    expect(dataProblems(data)).toEqual([]);
  });

  it('holds the 55 days of the brief, 01/08 to 24/09/2026, downloaded on 25/09', () => {
    expect(data.days).toHaveLength(55);
    expect(data.sources.firstDay).toBe('2026-08-01');
    expect(data.sources.lastDay).toBe('2026-09-24');
    expect(data.fetchedAt).toBe('2026-09-25');
  });

  // BRIEF.md, "Números por trás da frase": every figure on the first screen.
  it('matches the confirmed figures for 16/08/2026', () => {
    expect(gwh(day16.cutMwh)).toBe('399,9 GWh');
    expect(gwh(day16.genMwh)).toBe('400,6 GWh');
    expect(gwh(day16.refMwh)).toBe('817,0 GWh');
    expect(gwh(day16.byReason.ENE)).toBe('330,0 GWh');
    expect(gwh(day16.byReason.CNF)).toBe('49,6 GWh');
    expect(gwh(day16.byReason.REL)).toBe('20,3 GWh');
    expect(day16.sobraMw[21] + day16.redeMw[21]).toBe(40740);
    expect(day16.refMw[21]).toBe(46686);
  });

  it('writes the approved first-screen sentence for 16/08/2026', () => {
    const a = answer(day16);
    expect(a.lead + a.cut + a.middle + a.gen + a.tail).toBe(
      'Domingo, 16 de agosto de 2026: eólicas e solares deixaram de gerar 400 GWh por ordem do ONS, quase o mesmo tanto que geraram (401 GWh).',
    );
    const d = deck(day16);
    expect(`Às ${d.hour}, ${d.peakShare}${d.first}${d.reasonShare}${d.second}`).toBe(
      'Às 10h30, 87% do que podiam produzir estava cortado. E 82% do corte do dia foi por sobra de energia no sistema, não por falta de linha.',
    );
  });

  it('names the restrictions of the brief on 16/08/2026', () => {
    const w = annunciator(day16, data.catalog);
    expect(w).toHaveLength(6);
    expect(w[0]).toMatchObject({ label: 'Controle de frequência do SIN', reason: 'ENE' });
    expect(gwh(w[0].mwh)).toBe('330,0 GWh');
    expect(w[1]).toMatchObject({ label: 'LT 500 kV AÇU III / JAGUARUANA II', reason: 'CNF' });
    expect(gwh(w[1].mwh)).toBe('38,5 GWh');
    expect(w[2].label).toMatch(/Povo Novo \/ Marmeleiro C2/);
    expect(gwh(w[2].mwh)).toBe('16,8 GWh');
    expect(w[5].label).toMatch(/^Outras restrições \(\d+\)$/);
  });

  it('keeps the annunciator total equal to the day total', () => {
    for (const d of data.days) {
      const sum = annunciator(d, data.catalog).reduce((s, w) => s + w.mwh, 0);
      // Each restriction is rounded to MWh on its own.
      expect(Math.abs(sum - d.cutMwh)).toBeLessThanOrEqual(d.restrictions.length);
    }
  });

  it('ranks 16/08 as the worst day and 14–20/09 as the worst week', () => {
    expect(worstDays(data.days, 5).map((d) => d.date)).toEqual([
      '2026-08-16', '2026-09-20', '2026-08-01', '2026-09-19', '2026-08-23',
    ]);
    const week = worstWeek(data.days)!;
    expect(week).toMatchObject({ from: '2026-09-14', to: '2026-09-20' });
    expect(gwh(week.cutMwh)).toBe('1.722,7 GWh');
    expect(sundaysLead(data.days)).toBe(true);
  });

  it('places every point of the Northeast frame on the map', () => {
    const off = new Set(data.points.filter((p) => p.x === null).map((p) => p.uf));
    for (const uf of ['RN', 'CE', 'BA', 'PI', 'PB', 'PE', 'MA']) expect(off.has(uf)).toBe(false);
    for (const p of data.points) {
      if (p.x === null) continue;
      expect(p.y!).toBeGreaterThanOrEqual(data.map.rail);
      expect(p.y!).toBeLessThanOrEqual(data.map.height);
    }
  });
});

describe('lamp encoding', () => {
  it('round-trips within one level and keeps zero as zero', () => {
    const ref = Array.from({ length: PATAMARES }, (_, t) => (t < 12 ? 0 : 100 + t * 7));
    const cut = ref.map((v, t) => (t > 20 && t < 30 ? v * 0.8 : 0));
    const r = ref.map((_, t) => (t > 20 && t < 30 ? (t < 25 ? 0 : 1) : -1));
    const lamp = decodeLamp(encodeLamp(ref, cut, r));
    const step = lamp.max / LEVELS;
    lamp.ref.forEach((v, t) => {
      expect(Math.abs(v - ref[t])).toBeLessThanOrEqual(step / 2 + 1e-9);
      expect(v === 0).toBe(ref[t] === 0);
      expect(lamp.cut[t]).toBeLessThanOrEqual(v);
      expect(lamp.cut[t] === 0).toBe(cut[t] === 0);
    });
    expect(lamp.restriction).toEqual(r);
  });

  it('never rounds a tiny nonzero value to level zero', () => {
    expect(level(0.001, 1000)).toBe(1);
    expect(level(0, 1000)).toBe(0);
    expect(level(1000, 1000)).toBe(LEVELS);
  });

  it('rejects a lamp that does not hold 48 patamares', () => {
    expect(() => decodeLamp('10|A5|A5|_5')).toThrow(/48/);
  });
});

describe('aggregation', () => {
  const pts = [point('A'), point('B', 'RS')];
  const row = (p: number, t: number, ref: number, cut: number, reason: OnsRow['reason'], dsc: string | null = null): OnsRow => ({
    point: p, date: '2026-08-16', t, ref, cut, gen: ref - cut, reason, dsc,
  });
  const full = (extra: OnsRow[]) => [
    ...Array.from({ length: PATAMARES }, (_, t) => row(0, t, 0, 0, null)),
    ...extra,
  ];

  it('converts half-hour MWmed into MWh and splits by reason', () => {
    const catalog = new Catalog();
    const day = buildDay('2026-08-16', full([
      row(1, 20, 300, 200, 'ENE', 'Controle de frequência do SIN.'),
      row(1, 21, 300, 100, 'REL', 'Controle do FNESE, conforme SGI 43.225-26'),
    ]), pts, catalog);
    expect(day.cutMwh).toBe(150);
    expect(day.genMwh).toBe(150);
    expect(day.refMwh).toBe(300);
    expect(day.byReason).toEqual({ ENE: 100, CNF: 0, REL: 50, PAR: 0 });
    expect(day.sobraMw[20]).toBe(200);
    expect(day.redeMw[21]).toBe(100);
    expect(day.byUf).toEqual({ RS: 150 });
    expect(day.restrictions.map((r) => catalog.entries[r.c].label)).toEqual(['Controle de frequência do SIN', 'Controle do FNESE']);
  });

  it('refuses a cut with no reason: the page could not say why', () => {
    expect(() => buildDay('2026-08-16', [row(0, 3, 10, 5, null)], pts, new Catalog())).toThrow(/no reason/);
  });

  it('drops incomplete days', () => {
    const rows = [row(0, 0, 1, 0, null)];
    expect(buildDays(rows, pts, new Catalog())).toEqual([]);
  });

  it('folds texts that differ only in SGI numbers into one restriction', () => {
    const catalog = new Catalog();
    const a = catalog.index('REL', 'Controle do FNESE, conforme SGI 43.225-26');
    const b = catalog.index('REL', 'Controle do FNESE, conforme SGI 43.300-26');
    expect(a).toBe(b);
    expect(catalog.entries[a].full).toHaveLength(2);
    expect(catalog.index('CNF', 'Controle do FNESE, conforme SGI 43.225-26')).not.toBe(a);
  });
});

describe('restriction names', () => {
  it.each([
    ['Controle de inequação: LIMITAÇÃO DA TRANSMISSÃO NA LT 500 KV AÇU III / JAGUARUANA II – C1(V7) - IO-ON.NE.5NE', 'LT 500 kV AÇU III / JAGUARUANA II'],
    ['Controle do fluxo: FNESE # Fluxo Nordeste/Sudeste - Conforme SGI 43.225-26', 'Fluxo Nordeste/Sudeste'],
    ['Controle de inequação: CONTROLE DE CARREGAMENTO DAS LT 500 KV SOBRADINHO / SÃO JOÃO DO PIAUÍ - C1(C5) E C2(C2) - IO-ON.NE.5NE', 'LT 500 kV SOBRADINHO / SÃO JOÃO DO PIAUÍ'],
    ['Controle de frequência do SIN.', 'Controle de frequência do SIN'],
  ])('%s', (dsc, label) => {
    expect(shortRestriction(dsc)).toBe(label);
  });

  it('keeps kV in its case when engraved', () => {
    expect(engrave('LT 500 kV Açu III')).toBe('LT 500 kV AÇU III');
  });
});

describe('words and numbers', () => {
  it('formats pt-BR', () => {
    expect(mw(40740)).toBe('40.740 MW');
    expect(mw(0.4)).toBe('< 1 MW');
    expect(hourProse(21)).toBe('10h30');
    expect(hourClock(0)).toBe('00:00');
    expect(longDate('2026-08-16')).toBe('Domingo, 16 de agosto de 2026');
    expect(plateDate('2026-08-16')).toBe('DOM · 16/08/2026');
  });

  it('never states a share above what the data holds', () => {
    expect(pctWhole(0.825)).toBe('82%');
    expect(pctWhole(0.8726)).toBe('87%');
  });

  it('says "quase o mesmo tanto" only within 5%', () => {
    expect(comparedWithGenerated(399_929, 400_649)).toMatch(/^quase o mesmo tanto/);
    expect(comparedWithGenerated(300_000, 400_000)).toMatch(/^o equivalente a 75%/);
    expect(comparedWithGenerated(500_000, 400_000)).toMatch(/^mais do que geraram/);
  });

  it('writes the grid-led sentence when the grid carried most of the day', () => {
    const d: Day = { ...day16, byReason: { ENE: 10, CNF: 80, REL: 10, PAR: 0 }, cutMwh: 100 };
    expect(deck(d).second).toMatch(/a rede não aguentou/);
    expect(deck(d).reasonShare).toBe('90%');
  });

  it('bins the heat ramp at 0, 5, 15, 25 and 35 GW', () => {
    expect([0, 4_999, 5_000, 15_000, 25_000, 35_000, 41_000].map(heat)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
});

describe('?dia', () => {
  it('falls back to the default day and says it did not find the asked one', () => {
    expect(pickDay(data.days, '2026-08-20', '2026-08-16')).toMatchObject({ day: { date: '2026-08-20' }, found: true });
    expect(pickDay(data.days, undefined, '2026-08-16')).toMatchObject({ day: { date: '2026-08-16' }, found: true });
    expect(pickDay(data.days, '2031-01-01', '2026-08-16')).toMatchObject({ day: { date: '2026-08-16' }, found: false });
    expect(pickDay(data.days, ['<script>', 'x'], '2026-08-16')).toMatchObject({ day: { date: '2026-08-16' }, found: false });
  });
});

describe('dataProblems', () => {
  it('reports a day with a broken lamp or a missing restriction', () => {
    const broken: CurtailmentData = {
      ...data,
      days: [{ ...day16, points: { 0: { lamp: '1|A|A|A', cutMwh: 0, refMwh: 0 } } }],
    };
    expect(dataProblems(broken).join()).toMatch(/48/);
    expect(dataProblems({ ...data, days: [] })).toEqual(['no days']);
    const lamp = encodeLamp(zeros(), zeros(), zeros().map(() => 60));
    const missing: CurtailmentData = { ...data, days: [{ ...day16, points: { 0: { lamp, cutMwh: 0, refMwh: 0 } } }] };
    expect(dataProblems(missing).join()).toMatch(/missing restriction/);
  });
});
