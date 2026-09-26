import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CAPITALS, derive, lastClosedMonth, type PixData } from './data';

/**
 * The committed data.json against the figures BRIEF.md confirmed on 25/09/2026
 * (findings A4, A6–A9, A16). A regeneration that let in the partial month, PJ
 * payers or the N/D row would move these numbers and fail here, not on the page.
 */
const data = JSON.parse(readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8')) as PixData;
const pix = derive(data);
const city = (ibge: number) => pix.byIbge.get(ibge)!;

describe('data.json as committed', () => {
  it('holds twelve closed months ending before the month it was fetched in', () => {
    expect(data.months).toHaveLength(12);
    expect(data.months.at(-1)).toBe(lastClosedMonth(new Date(`${data.fetchedAt}T12:00:00Z`)));
    expect(data.months.at(-1)).toBe(202608);
  });

  it('ranks all 5.571 municípios, and nothing else (no N/D row)', () => {
    expect(pix.cities).toHaveLength(5571);
    expect(new Set(pix.cities.map((c) => c.ibge)).size).toBe(5571);
    expect(pix.cities.every((c) => /^\d{7}$/.test(String(c.ibge)))).toBe(true);
  });

  it('gives Brasil 43,2 Pix por usuário in agosto (A6)', () => {
    expect(pix.brasil.value).toBeCloseTo(43.2, 1);
  });

  it('gives São Paulo 38,1, 2.805º of 5.571, 331º of 645, 25ª capital, R$ 243 (A7, A8)', () => {
    const sp = city(3550308);
    expect(sp.pix).toBe(373_200_700);
    expect(sp.payers).toBe(9_788_772);
    expect(sp.value).toBeCloseTo(38.1, 1);
    expect([sp.rank, sp.total, sp.stateRank, sp.stateTotal, sp.capitalRank, sp.ticket]).toEqual([
      2805, 5571, 331, 645, 25, 243,
    ]);
  });

  it('puts Manaus 3º in Brazil and first among capitals, Florianópolis last (A8)', () => {
    expect(city(1302603).rank).toBe(3);
    expect(pix.capitals[0].ibge).toBe(1302603);
    expect(pix.capitals.at(-1)!.ibge).toBe(4205407);
    expect(city(4205407).value).toBeCloseTo(32.5, 1);
    expect(pix.capitals).toHaveLength(Object.keys(CAPITALS).length);
  });

  it('flags Pacaraima as a border outlier, metric untouched (A16)', () => {
    const p = city(1400456);
    expect(p.payers).toBe(174_555);
    expect(p.pop).toBe(24_132);
    expect(p.outlier).toBe(true);
    expect(p.value).toBeCloseTo(p.pix / p.payers, 6);
  });
});
