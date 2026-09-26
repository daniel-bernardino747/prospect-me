import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  bezel,
  boardDay,
  clockProse,
  type DecodedPoint,
  decodePoints,
  heatRuns,
  lampFrame,
  offMap,
  offMapShare,
  pulses,
  solarCentreHour,
  stepBand,
} from './board';
import { type CurtailmentData, gwh, PATAMARES } from './data';

const data = JSON.parse(
  readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8'),
) as CurtailmentData;
const day16 = data.days.find((d) => d.date === '2026-08-16')!;
const board = boardDay(data, day16);
const points = decodePoints(board);

const fake = (cut: number[], ref = new Array(PATAMARES).fill(100), x: number | null = 10): DecodedPoint => ({
  i: 0, id: 'X', name: 'X', source: 'eol', uf: 'RN', sub: null, x, y: x, cutMwh: 0, refMwh: 0, lamp: '',
  series: { max: 100, ref, cut, restriction: cut.map((c) => (c > 0 ? 0 : -1)) },
  rb: bezel(1, 100),
});
const oneRestriction = { k: 1, restrictions: [{ label: 'L', reason: 'CNF' as const, mwh: 0, points: [] }] };

describe('boardDay', () => {
  it('opens at the peak, 10h30 on 16/08/2026', () => {
    expect(board.peak).toBe(21);
  });

  it('draws larger bezels first so small lamps stay on top', () => {
    const r = points.map((p) => p.rb);
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeLessThanOrEqual(r[i - 1]);
  });

  it('gives the largest point a bezel of 13 units', () => {
    expect(Math.max(...points.map((p) => p.rb))).toBeCloseTo(13, 5);
  });

  it('knows which annunciator windows point only outside the frame', () => {
    const povoNovo = board.windows.find((w) => /Povo Novo/.test(w.label))!;
    expect(povoNovo.onMap).toBe(0);
    expect(povoNovo.offUfs).toEqual(['RS']);
    expect(povoNovo.glassAt.some((g) => g === 'rede')).toBe(true);
  });

  it('lights the frequency-control window amber at the peak', () => {
    expect(board.windows[0].glassAt[21]).toBe('sobra');
    // The Açu III line cut in other half hours, always red when lit.
    expect(board.windows[1].glassAt.filter(Boolean)).toContain('rede');
    expect(board.windows[1].glassAt.every((g) => g !== 'sobra')).toBe(true);
  });
});

describe('lampFrame', () => {
  it('never lights more than the glass', () => {
    for (const p of points) {
      for (let t = 0; t < PATAMARES; t++) {
        const f = lampFrame(p, board, t, 0.5);
        expect(f.rc).toBeLessThanOrEqual(f.rg + 1e-9);
      }
    }
  });

  it('interpolates radii but switches the glass at the boundary', () => {
    const cut = new Array(PATAMARES).fill(0);
    cut[11] = 64;
    const p = fake(cut);
    expect(lampFrame(p, oneRestriction, 10, 0).rc).toBe(0);
    expect(lampFrame(p, oneRestriction, 10, 0.5).rc).toBeCloseTo(4, 5);
    expect(lampFrame(p, oneRestriction, 10, 0.5).glass).toBeNull();
    expect(lampFrame(p, oneRestriction, 11, 0).glass).toBe('rede');
    expect(lampFrame(p, oneRestriction, 11, 0).rc).toBeCloseTo(8, 5);
  });

  it('shows a hollow socket when the point could produce nothing', () => {
    const p = fake(new Array(PATAMARES).fill(0), new Array(PATAMARES).fill(0));
    expect(lampFrame(p, oneRestriction, 3)).toEqual({ rg: 0, rc: 0, glass: null, restriction: -1 });
  });
});

describe('pulses', () => {
  it('pulses only lamps that grow by a quarter of their bezel', () => {
    const small = new Array(PATAMARES).fill(0);
    small[5] = 1; // radius 1, bezel 10: under a quarter
    const big = new Array(PATAMARES).fill(0);
    big[5] = 36; // radius 6
    expect(pulses([fake(small), fake(big)], 1, 4)).toEqual([1]);
  });

  it('never pulses more than the pool of 12, largest growth first, and never off the map', () => {
    const many = Array.from({ length: 20 }, (_, i) => {
      const cut = new Array(PATAMARES).fill(0);
      cut[1] = (i + 5) ** 2;
      return fake(cut, undefined, i === 19 ? null : 10);
    });
    const p = pulses(many, 1, 0);
    expect(p).toHaveLength(12);
    expect(p[0]).toBe(18);
    expect(p).not.toContain(19);
    expect(pulses(many, 1, PATAMARES - 1)).toEqual([]);
  });

  it('pulses at most 12 lamps at any step of the real day', () => {
    for (let t = 0; t < PATAMARES; t++) expect(pulses(points, board.k, t).length).toBeLessThanOrEqual(12);
  });
});

describe('fora do mapa', () => {
  it('keeps the sentence whole: on-map plus off-map is the day total', () => {
    const rows = offMap(points, board.restrictions, board.peak);
    const off = rows.reduce((s, r) => s + r.mwh, 0);
    const on = points.filter((p) => p.x !== null).reduce((s, p) => s + p.cutMwh, 0);
    expect(Math.abs(on + off - day16.cutMwh)).toBeLessThanOrEqual(points.length);
  });

  it('lists RS first on 16/08/2026 with 23,7 GWh', () => {
    const rows = offMap(points, board.restrictions, board.peak);
    expect(rows[0].uf).toBe('RS');
    expect(gwh(rows[0].mwh)).toBe('23,7 GWh');
    expect(rows.map((r) => r.uf)).toEqual(expect.arrayContaining(['SP', 'GO', 'SC']));
  });

  it('is under a tenth of the day on 16/08/2026', () => {
    const share = offMapShare(board.points, board.cutMwh);
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.1);
  });
});

describe('time zone evidence', () => {
  it('centres the solar reference near midday, so the file reads as local time', () => {
    const h = solarCentreHour(data)!;
    expect(h).toBeGreaterThan(11);
    expect(h).toBeLessThan(13);
    expect(clockProse(11.87)).toBe('11h52');
  });
});

describe('heatRuns', () => {
  it('covers every half hour once, in runs of equal level', () => {
    const runs = heatRuns([0, 0, 1, 4, 4, 4, 0]);
    expect(runs).toEqual([[0, 2, 0], [2, 1, 1], [3, 3, 4], [6, 1, 0]]);
    expect(runs.reduce((s, r) => s + r[1], 0)).toBe(7);
  });
});

describe('stepBand', () => {
  it('draws half-hour steps from the baseline', () => {
    expect(stepBand([1, 2], 2, 20, 10)).toBe('M0 5L10 5L10 0L20 0L20 10L10 10L10 10L0 10Z');
  });

  it('stacks on a lower band', () => {
    expect(stepBand([1], 2, 10, 10, [1])).toBe('M0 0L10 0L10 5L0 5Z');
  });
});
