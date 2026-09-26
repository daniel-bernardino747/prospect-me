import { describe, expect, it } from 'vitest';

import { type LabelSpec, placeLabels, polar, route } from './chart';
import { CENTRE, ringRadius } from './data';

const spec = (id: string, x: number, y: number, lines = ['file-entry-cache', '11.1.6']): LabelSpec => ({
  id,
  at: { x, y },
  clear: 11,
  lines,
  face: 'code',
});

describe('polar', () => {
  it('measures angles clockwise from 12 o’clock', () => {
    expect(polar(100, 0)).toEqual({ x: CENTRE, y: CENTRE - 100 });
    const east = polar(100, 90);
    expect(east.x).toBeCloseTo(CENTRE + 100);
    expect(east.y).toBeCloseTo(CENTRE);
  });
});

describe('route', () => {
  it('leaves the root radially and ends on the child’s ring', () => {
    const r = route({ ring: 0, angle: 0 }, { ring: 1, angle: 90 }, 4);
    expect(r.last).toMatchObject({ to: ringRadius(1, 4), angle: 90 });
  });
});

describe('placeLabels', () => {
  // A chain on one radius, as the stylelint door draws it on a phone.
  const chain = [1, 2, 3, 4].map((k) => spec(`n${k}`, CENTRE + ringRadius(k, 5), CENTRE));
  const placed = placeLabels(chain, 340, 12, chain.map((c) => ({ at: c.at, r: 19 })));

  it('never lets two labels overlap', () => {
    for (const a of placed) {
      for (const b of placed) {
        if (a === b) continue;
        const clear =
          a.box.x + a.box.w <= b.box.x ||
          b.box.x + b.box.w <= a.box.x ||
          a.box.y + a.box.h <= b.box.y ||
          b.box.y + b.box.h <= a.box.y;
        expect(clear).toBe(true);
      }
    }
  });

  it('keeps every label inside the chart', () => {
    for (const p of placed) {
      expect(p.box.x).toBeGreaterThanOrEqual(0);
      expect(p.box.y).toBeGreaterThanOrEqual(0);
      expect(p.box.x + p.box.w).toBeLessThanOrEqual(340);
      expect(p.box.y + p.box.h).toBeLessThanOrEqual(340);
    }
  });

  it('labels the first in priority, and draws a leader for a label set away from its mark', () => {
    expect(placed[0].id).toBe('n1');
    for (const p of placed.filter((q) => q.leader)) {
      expect(p.leader!.x1).toBeCloseTo((chain.find((c) => c.id === p.id)!.at.x / 1000) * 100);
    }
  });

  it('keeps every corner inside the limit radius when one is given', () => {
    const inner = placeLabels(chain, 340, 12, [], [], 454);
    const c = 170;
    const lim = 454 * 0.34;
    for (const p of inner) {
      for (const px of [p.box.x, p.box.x + p.box.w]) {
        for (const py of [p.box.y, p.box.y + p.box.h]) {
          expect(Math.hypot(px - c, py - c)).toBeLessThanOrEqual(lim + 1e-9);
        }
      }
    }
  });

  it('keeps clear of boxes a previous pass already took', () => {
    const first = placeLabels([spec('a', 500, 500)], 340, 12, []);
    const second = placeLabels([spec('b', 500, 500)], 340, 12, [], first.map((p) => p.box));
    for (const p of second) {
      const a = first[0].box;
      const overlap = p.box.x < a.x + a.w && a.x < p.box.x + p.box.w && p.box.y < a.y + a.h && a.y < p.box.y + p.box.h;
      expect(overlap).toBe(false);
    }
  });
});
