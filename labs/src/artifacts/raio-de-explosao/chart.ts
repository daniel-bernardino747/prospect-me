/**
 * Polar geometry for the zone chart, in the SVG's 1000 × 1000 box, and the
 * placement of its HTML labels. Pure, so the layout can be tested without a
 * browser.
 */
import { CENTRE, OUTER_R, ringRadius, ROOT_R } from './data';

export interface Point {
  x: number;
  y: number;
}

/** Angle in degrees clockwise from 12 o'clock. */
export function polar(r: number, angle: number): Point {
  const a = (angle * Math.PI) / 180;
  return { x: CENTRE + r * Math.sin(a), y: CENTRE - r * Math.cos(a) };
}

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${f(p.x)} ${f(p.y)}`;

function arc(r: number, from: number, to: number): string {
  if (Math.abs(to - from) < 0.01) return '';
  const end = polar(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  return ` A ${f(r)} ${f(r)} 0 ${large} ${sweep} ${pt(end)}`;
}

export interface Route {
  d: string;
  /** The last radial segment, into the child: where a gate sits. */
  last: { from: number; to: number; angle: number };
  /** Where a range tag can sit: the middle of the arc, or of the radial. */
  mid: Point;
}

/**
 * Orthogonal polar routing, as a zone chart draws it: out along the parent's
 * radius, along an arc to the child's angle, then in along the child's radius.
 * An edge that does not go outward (a chord between nodes of one ring) runs
 * its arc just outside that ring.
 */
export function route(a: { ring: number; angle: number }, b: { ring: number; angle: number }, rings: number): Route {
  const gap = (OUTER_R - ROOT_R) / rings;
  const ra = a.ring === 0 ? ROOT_R : ringRadius(a.ring, rings);
  const rb = ringRadius(b.ring, rings);
  if (a.ring === 0) {
    const start = polar(ROOT_R, b.angle);
    return {
      d: `M ${pt(start)} L ${pt(polar(rb, b.angle))}`,
      last: { from: ROOT_R, to: rb, angle: b.angle },
      mid: polar((ROOT_R + rb) / 2, b.angle),
    };
  }
  const rm = b.ring > a.ring ? rb - gap / 2 : ra + gap * 0.32;
  const d = `M ${pt(polar(ra, a.angle))} L ${pt(polar(rm, a.angle))}${arc(rm, a.angle, b.angle)} L ${pt(polar(rb, b.angle))}`;
  const mid =
    Math.abs(b.angle - a.angle) > 4 ? polar(rm, (a.angle + b.angle) / 2) : polar((ra + rb) / 2, b.angle);
  return { d, last: { from: rm, to: rb, angle: b.angle }, mid };
}

/** A pie slice from the centre, for the hatched zone and the sector hit areas. */
export function wedge(r: number, from: number, to: number): string {
  if (to - from >= 359.9) {
    return `M ${pt(polar(r, 0))}${arc(r, 0, 180)}${arc(r, 180, 359.99)} Z`;
  }
  return `M ${CENTRE} ${CENTRE} L ${pt(polar(r, from))}${arc(r, from, to)} Z`;
}

/** An arc path along a ring, for the rim's sector names. */
export function ringArc(r: number, from: number, to: number): string {
  return `M ${pt(polar(r, from))}${arc(r, from, to)}`;
}

// ── Labels ────────────────────────────────────────────────────────────────

export interface LabelSpec {
  id: string;
  /** Anchor, in chart units. */
  at: Point;
  /** Radius, in chart units, of the mark the label must not cover. */
  clear: number;
  lines: string[];
  /** Mono labels are wider per character than the caps labels. */
  face: 'code' | 'label';
}

export interface Placed {
  id: string;
  /** Top-left of the box, in % of the chart. */
  left: number;
  top: number;
  /** The box in CSS px, so a later pass can keep clear of it. */
  box: Box;
  /** A hairline from the mark to the box, in % of the chart, when the label sits away from its mark. */
  leader?: { x1: number; y1: number; x2: number; y2: number };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const circleHits = (b: Box, c: { x: number; y: number; r: number }) => {
  const nx = Math.max(b.x, Math.min(c.x, b.x + b.w));
  const ny = Math.max(b.y, Math.min(c.y, b.y + b.h));
  return (nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r ** 2;
};

/** Estimated box of a label in CSS px: both faces measured at about 0.62em per character (Fragment Mono 0.6em plus rounding; the caps label with its tracking). */
export function labelSize(spec: LabelSpec, fontPx: number): { w: number; h: number } {
  const per = 0.62;
  const longest = Math.max(...spec.lines.map((l) => l.length));
  return { w: Math.ceil(longest * per * fontPx + 12), h: Math.ceil(spec.lines.length * fontPx * 1.3 + 4) };
}

/**
 * Greedy placement in priority order: each label tries the spots right around
 * its anchor, then spots stacked further above and below it (drawn with a
 * leader), and takes the first that stays inside the chart and clear of every
 * label, mark and `taken` box already down. A label that fits nowhere is left
 * out (the ledger always carries it), never drawn on top of another.
 */
export function placeLabels(
  specs: readonly LabelSpec[],
  chartPx: number,
  fontPx: number,
  marks: readonly { at: Point; r: number }[],
  taken: readonly Box[] = [],
  /** Chart units from the centre every corner must stay within (keeps the rim's sector names clear). */
  limitR = Infinity,
): Placed[] {
  const k = chartPx / 1000;
  const c = CENTRE * k;
  const lim2 = (limitR * k) ** 2;
  const inside = (b: Box) =>
    [b.x, b.x + b.w].every((px) => [b.y, b.y + b.h].every((py) => (px - c) ** 2 + (py - c) ** 2 <= lim2));
  const placed: Placed[] = [];
  const boxes: Box[] = [...taken];
  const obstacles = marks.map((m) => ({ x: m.at.x * k, y: m.at.y * k, r: m.r * k + 2 }));
  for (const spec of specs) {
    const { w, h } = labelSize(spec, fontPx);
    const x = spec.at.x * k;
    const y = spec.at.y * k;
    const g = spec.clear * k + 4;
    const near: [number, number][] = [
      [x - w / 2, y + g],
      [x - w / 2, y - g - h],
      [x + g, y - h / 2],
      [x - g - w, y - h / 2],
      [x + g * 0.7, y + g * 0.7],
      [x - g * 0.7 - w, y + g * 0.7],
      [x + g * 0.7, y - g * 0.7 - h],
      [x - g * 0.7 - w, y - g * 0.7 - h],
    ];
    const far: [number, number][] = [];
    for (let n = 1; n <= 4; n++) {
      const up = y - g - h - n * (h * 0.75 + 4);
      const down = y + g + n * (h * 0.75 + 4);
      far.push([x - 6, up], [x + 6 - w, up], [x - 6, down], [x + 6 - w, down]);
    }
    const ok = (b: Box) =>
      b.x >= 0 &&
      b.y >= 0 &&
      b.x + b.w <= chartPx &&
      b.y + b.h <= chartPx &&
      inside(b) &&
      !boxes.some((o) => overlaps(o, b)) &&
      !obstacles.some((o) => circleHits(b, o));
    const toBox = ([bx, by]: [number, number]): Box => ({ x: bx, y: by, w, h });
    let fit = near.map(toBox).find(ok);
    let leader: Placed['leader'];
    if (!fit) {
      fit = far.map(toBox).find(ok);
      if (fit) {
        const ex = Math.max(fit.x, Math.min(x, fit.x + fit.w));
        const ey = fit.y > y ? fit.y : fit.y + fit.h;
        const pc = (v: number) => (v / chartPx) * 100;
        leader = { x1: pc(x), y1: pc(y), x2: pc(ex), y2: pc(ey) };
      }
    }
    if (!fit) continue;
    boxes.push(fit);
    placed.push({ id: spec.id, left: (fit.x / chartPx) * 100, top: (fit.y / chartPx) * 100, box: fit, leader });
  }
  return placed;
}
