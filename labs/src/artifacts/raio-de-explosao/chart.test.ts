import { describe, expect, it } from 'vitest';

import { type Box, type LabelSpec, placeLabels, polar, route, routePoints } from './chart';
import { CENTRE, ringRadius } from './data';

const spec = (id: string, x: number, y: number, lines = ['file-entry-cache', '11.1.6']): LabelSpec => ({
  id,
  at: { x, y },
  clear: 11,
  lines,
  face: 'code',
  fontPx: 12,
  mode: { kind: 'radial' },
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

  it('samples its points from parent to child', () => {
    const pts = routePoints(route({ ring: 1, angle: 30 }, { ring: 2, angle: 90 }, 4));
    const first = polar(ringRadius(1, 4), 30);
    const last = polar(ringRadius(2, 4), 90);
    expect(pts[0].x).toBeCloseTo(first.x);
    expect(pts.at(-1)!.y).toBeCloseTo(last.y);
  });
});

const clear = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

describe('placeLabels', () => {
  // A chain on one radius, as the stylelint door draws it on a phone.
  const chain = [1, 2, 3, 4].map((k) => spec(`n${k}`, CENTRE + ringRadius(k, 5), CENTRE));
  const marks = chain.map((c) => ({ at: c.at, r: 19 }));
  const placed = placeLabels(chain, { px: 340, marks });

  it('never lets two labels overlap', () => {
    for (const a of placed) for (const b of placed) if (a !== b) expect(clear(a.box, b.box)).toBe(true);
  });

  it('keeps every label inside the chart', () => {
    for (const p of placed) {
      expect(p.box.x).toBeGreaterThanOrEqual(0);
      expect(p.box.y).toBeGreaterThanOrEqual(0);
      expect(p.box.x + p.box.w).toBeLessThanOrEqual(340);
      expect(p.box.y + p.box.h).toBeLessThanOrEqual(340);
    }
  });

  it('never leaves a label nearer another mark than its own without a leader', () => {
    const k = 0.34;
    const dist = (b: Box, x: number, y: number) =>
      Math.hypot(Math.max(b.x, Math.min(x, b.x + b.w)) - x, Math.max(b.y, Math.min(y, b.y + b.h)) - y);
    for (const p of placed.filter((q) => !q.leader)) {
      const own = chain.find((c) => c.id === p.id)!.at;
      const mine = dist(p.box, own.x * k, own.y * k);
      for (const m of chain) {
        if (m.id === p.id) continue;
        expect(dist(p.box, m.at.x * k, m.at.y * k)).toBeGreaterThanOrEqual(mine - 3);
      }
    }
  });

  it('starts a leader at its own mark', () => {
    for (const p of placed.filter((q) => q.leader)) {
      const own = chain.find((c) => c.id === p.id)!.at;
      expect(Math.hypot(p.leader!.x1 - own.x / 10, p.leader!.y1 - own.y / 10)).toBeLessThan(3);
    }
  });

  it('sets a label outward from the centre when there is room', () => {
    const [p] = placeLabels([spec('a', CENTRE + 200, CENTRE, ['keyv', '5.6.0'])], { px: 340, marks: [] });
    expect(p.box.x).toBeGreaterThan((CENTRE + 200) * 0.34);
    expect(p.leader).toBeUndefined();
  });

  it('keeps every corner inside the limit radius when one is given', () => {
    const inner = placeLabels(chain, { px: 340, marks: [], limitR: 454 });
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

  it('keeps clear of taken boxes, except those it may cover, and reports those', () => {
    const [a] = placeLabels([spec('a', 500, 500)], { px: 340, marks: [] });
    const [b] = placeLabels([spec('b', 500, 500)], { px: 340, marks: [], taken: [{ id: 'x', box: a.box }] });
    expect(clear(a.box, b.box)).toBe(true);
    const [c] = placeLabels([{ ...spec('c', 500, 500), covers: 'x' }], {
      px: 340,
      marks: [],
      taken: [{ id: 'x', box: a.box }],
    });
    expect(c.covered).toEqual(['x']);
  });
});
