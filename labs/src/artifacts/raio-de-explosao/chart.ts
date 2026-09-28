/**
 * Polar geometry for the zone chart, in the SVG's 1000 × 1000 box, and the
 * placement of its HTML labels. Pure, so the layout can be tested without a
 * browser, and shared by the page and its OG image.
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
  /** The three legs: out along the parent's angle, along the arc, in along the child's. */
  legs: { ra: number; rm: number; rb: number; from: number; to: number };
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
      legs: { ra: ROOT_R, rm: ROOT_R, rb, from: b.angle, to: b.angle },
    };
  }
  const rm = b.ring > a.ring ? rb - gap / 2 : ra + gap * 0.32;
  const d = `M ${pt(polar(ra, a.angle))} L ${pt(polar(rm, a.angle))}${arc(rm, a.angle, b.angle)} L ${pt(polar(rb, b.angle))}`;
  const mid =
    Math.abs(b.angle - a.angle) > 4 ? polar(rm, (a.angle + b.angle) / 2) : polar((ra + rb) / 2, b.angle);
  return { d, last: { from: rm, to: rb, angle: b.angle }, mid, legs: { ra, rm, rb, from: a.angle, to: b.angle } };
}

/** Points every `step` chart units along a route, so labels can keep off the line. */
export function routePoints(r: Route, step = 8): Point[] {
  const { ra, rm, rb, from, to } = r.legs;
  const out: Point[] = [];
  const radial = (r0: number, r1: number, angle: number) => {
    const n = Math.max(1, Math.ceil(Math.abs(r1 - r0) / step));
    for (let i = 0; i <= n; i++) out.push(polar(r0 + ((r1 - r0) * i) / n, angle));
  };
  radial(ra, rm, from);
  const len = (Math.abs(to - from) * Math.PI * rm) / 180;
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) out.push(polar(rm, from + ((to - from) * i) / n));
  radial(rm, rb, to);
  return out;
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

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * How a label finds its spot:
 * - `radial`: just outside its mark on the side away from the centre, then slid
 *   along its ring to the next free slot, then around its mark, then dropped
 *   straight above or below it on a leader;
 * - `below`: leaning toward an angle when one is given (the root, into the
 *   sector with no paths), else centred under its mark, then above, left, right;
 * - `arc`: centred on a ring between two angles, nearest the middle first (the front, on its arc).
 */
export type Mode =
  | { kind: 'radial' }
  | { kind: 'below'; toward?: number }
  | { kind: 'arc'; r: number; from: number; to: number };

export interface LabelSpec {
  id: string;
  /** The mark the label names, in chart units. */
  at: Point;
  /** Radius, in chart units, of that mark. */
  clear: number;
  lines: string[];
  /** Mono labels are wider per character than the caps labels. */
  face: 'code' | 'label';
  fontPx: number;
  mode: Mode;
  /** It may cover a `taken` box whose id starts with this (the front over a ring number); the caller drops those. */
  covers?: string;
}

export interface Placed {
  id: string;
  /** Top-left of the box, in % of the chart. */
  left: number;
  top: number;
  /** The box in CSS px. */
  box: Box;
  /** A hairline from the mark to the box, in % of the chart, when the label sits away from its mark. */
  leader?: { x1: number; y1: number; x2: number; y2: number };
  /** Ids of `taken` boxes this label covers. */
  covered?: string[];
}

export interface Scene {
  /** Chart width in CSS px. */
  px: number;
  /** Every mark a label must not cover (nodes and the root), chart units. */
  marks: readonly { at: Point; r: number }[];
  /** Points along the drawn edges, chart units; a label keeps off them when it can. */
  lines?: readonly Point[];
  /** Boxes already down, in px (ring numbers, the legend corner). */
  taken?: readonly { id: string; box: Box }[];
  /** Chart units from the centre every corner must stay within where the rim carries a sector name. */
  limitR?: number;
  /** Where the sector names sit on the rim: angle and half-width, degrees. Elsewhere a label may reach the corner. */
  rim?: readonly { angle: number; half: number }[];
}

/** Past this slide along the ring a label gets a leader; past the cap it is not placed there at all. */
export const LEADER_FROM = 24;
export const LEADER_CAP = 40;
const GAP = 8;

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Whether the segment a→b passes through box `o` (sampled; leaders are short). */
const crosses = (a: Point, b: Point, o: Box) => {
  for (let i = 1; i < 12; i++) {
    const x = a.x + ((b.x - a.x) * i) / 12;
    const y = a.y + ((b.y - a.y) * i) / 12;
    if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true;
  }
  return false;
};

/** Distance from a point to the nearest point of a box (0 inside). */
const toBox = (b: Box, p: Point) => {
  const nx = Math.max(b.x, Math.min(p.x, b.x + b.w));
  const ny = Math.max(b.y, Math.min(p.y, b.y + b.h));
  return { d: Math.hypot(nx - p.x, ny - p.y), at: { x: nx, y: ny } };
};

/** Estimated box of a label in CSS px: Fragment Mono at about 0.62em per character (0.6em plus rounding), the condensed caps label at about 0.56em with its tracking. */
export function labelSize(spec: Pick<LabelSpec, 'lines' | 'fontPx' | 'face'>): { w: number; h: number } {
  const longest = Math.max(...spec.lines.map((l) => l.length));
  return {
    w: Math.ceil(longest * (spec.face === 'code' ? 0.62 : 0.56) * spec.fontPx + 12),
    h: Math.ceil(spec.lines.length * spec.fontPx * 1.3 + 4),
  };
}

interface Candidate {
  box: Box;
  /** How far the label was moved from its first spot, px. */
  moved: number;
  leaderOk: boolean;
}

/** The box whose nearest edge sits at `a`, leaning along the unit vector `u`. */
function lean(a: Point, u: Point, w: number, h: number): Box {
  const d = (w / 2) * Math.abs(u.x) + (h / 2) * Math.abs(u.y);
  return { x: a.x + u.x * d - w / 2, y: a.y + u.y * d - h / 2, w, h };
}

function candidates(spec: LabelSpec, k: number, w: number, h: number): Candidate[] {
  const c = CENTRE * k;
  const p = { x: spec.at.x * k, y: spec.at.y * k };
  const clear = spec.clear * k;
  const out: Candidate[] = [];
  const unit = (deg: number) => ({ x: Math.sin((deg * Math.PI) / 180), y: -Math.cos((deg * Math.PI) / 180) });

  if (spec.mode.kind === 'below') {
    const g = clear + 6;
    if (spec.mode.toward !== undefined) {
      const u = unit(spec.mode.toward);
      out.push({ box: lean({ x: p.x + u.x * g, y: p.y + u.y * g }, u, w, h), moved: 0, leaderOk: false });
    }
    out.push(
      { box: { x: p.x - w / 2, y: p.y + g, w, h }, moved: 0, leaderOk: false },
      { box: { x: p.x - w / 2, y: p.y - g - h, w, h }, moved: 0, leaderOk: false },
      { box: { x: p.x - g - w, y: p.y - h / 2, w, h }, moved: 0, leaderOk: false },
      { box: { x: p.x + g, y: p.y - h / 2, w, h }, moved: 0, leaderOk: false },
    );
    return out;
  }

  if (spec.mode.kind === 'arc') {
    const { r, from, to } = spec.mode;
    const mid = (from + to) / 2;
    const angles: number[] = [];
    for (let s = 0; s <= (to - from) / 2; s += 3) {
      for (const a of s === 0 ? [mid] : [mid + s, mid - s]) if (a >= from + 1 && a <= to - 1) angles.push(a);
    }
    // On the arc first, then just outside it (never inside: a wide chip leant
    // inward lands on a nearer ring and names the wrong distance).
    for (const a of angles) {
      const q = polar(r, a);
      out.push({ box: { x: q.x * k - w / 2, y: q.y * k - h / 2, w, h }, moved: 0, leaderOk: false });
    }
    for (const a of angles) {
      const u = unit(a);
      const q = polar(r, a);
      out.push({ box: lean({ x: q.x * k + u.x * 4, y: q.y * k + u.y * 4 }, u, w, h), moved: 0, leaderOk: false });
    }
    return out;
  }

  // Radial: out from the centre through the mark, then along the mark's ring.
  const R = Math.hypot(p.x - c, p.y - c);
  const angle = R < 1 ? 180 : (Math.atan2(p.x - c, -(p.y - c)) * 180) / Math.PI;
  const slide = (s: number, push: number) => {
    const a = angle + ((s / Math.max(R, 1)) * 180) / Math.PI;
    const u = unit(a);
    const at = { x: c + u.x * (R + clear + GAP + push), y: c + u.y * (R + clear + GAP + push) };
    return { box: lean(at, u, w, h), moved: Math.abs(s) + push, leaderOk: true };
  };
  out.push(slide(0, 0));
  for (let s = 6; s <= LEADER_CAP; s += 6) out.push(slide(s, 0), slide(-s, 0));
  // Beside, under and over the mark, then around it in the other directions.
  const g = clear + 4;
  out.push(
    { box: { x: p.x + g, y: p.y - h / 2, w, h }, moved: 0, leaderOk: true },
    { box: { x: p.x - g - w, y: p.y - h / 2, w, h }, moved: 0, leaderOk: true },
    { box: { x: p.x - w / 2, y: p.y + g, w, h }, moved: 0, leaderOk: true },
    { box: { x: p.x - w / 2, y: p.y - g - h, w, h }, moved: 0, leaderOk: true },
  );
  for (let a = 45; a < 360; a += 45) {
    const u = unit(angle + a);
    out.push({ box: lean({ x: p.x + u.x * (clear + 4), y: p.y + u.y * (clear + 4) }, u, w, h), moved: 0, leaderOk: true });
  }
  // Straight below or above it, on a short vertical leader.
  for (const d of [12, 24, 36]) {
    for (const dir of [1, -1]) {
      const y = dir > 0 ? p.y + clear + 4 + d : p.y - clear - 4 - d - h;
      // Always on a leader: the label sits clear of its mark.
      for (const x of [p.x - w / 2, p.x - 10, p.x + 10 - w]) {
        out.push({ box: { x, y, w, h }, moved: LEADER_FROM + d, leaderOk: true });
      }
    }
  }
  for (const push of [12, 24]) {
    out.push(slide(0, push));
    for (let s = 6; s + push <= LEADER_CAP; s += 6) out.push(slide(s, push), slide(-s, push));
  }
  return out;
}

/**
 * Places labels in priority order. A label takes the first spot (see `Mode`)
 * inside the chart, clear of every label, mark and taken box already down,
 * and off the drawn edges when it can. A label that is nearer another mark
 * than its own, or slid more than LEADER_FROM px, gets a leader to its mark.
 * A label that fits nowhere is left out (the ledger always carries it), never
 * drawn on top of another.
 */
export function placeLabels(specs: readonly LabelSpec[], scene: Scene): Placed[] {
  const { px } = scene;
  const k = px / 1000;
  const c = CENTRE * k;
  const lim2 = ((scene.limitR ?? Infinity) * k) ** 2;
  const rim = scene.rim;
  const beyond2 = (505 * k) ** 2;
  // Inside the tick ring, or clear of the band that carries the sector names.
  const free = (x: number, y: number) => {
    const d2 = (x - c) ** 2 + (y - c) ** 2;
    return d2 <= lim2 || !nearName(x, y) || (rim !== undefined && d2 > beyond2);
  };
  const nearName = (x: number, y: number) => {
    if (!rim) return true;
    const a = ((Math.atan2(x - c, -(y - c)) * 180) / Math.PI + 360) % 360;
    return rim.some((r) => Math.abs(((a - r.angle + 540) % 360) - 180) <= r.half);
  };
  const inside = (b: Box) =>
    b.x >= 0 &&
    b.y >= 0 &&
    b.x + b.w <= px &&
    b.y + b.h <= px &&
    [b.x, b.x + b.w].every((x) => [b.y, b.y + b.h].every((y) => free(x, y))) &&
    // The box's own middle edges too, so a wide box cannot straddle a name.
    [
      [b.x + b.w / 2, b.y],
      [b.x + b.w / 2, b.y + b.h],
      [b.x, b.y + b.h / 2],
      [b.x + b.w, b.y + b.h / 2],
    ].every(([x, y]) => free(x, y));
  const marks = scene.marks.map((m) => ({ x: m.at.x * k, y: m.at.y * k, r: m.r * k + 2 }));
  const lines = (scene.lines ?? []).map((q) => ({ x: q.x * k, y: q.y * k }));
  const taken = scene.taken ?? [];
  const boxes: Box[] = [];
  const leaders: [Point, Point][] = [];
  const placed: Placed[] = [];

  for (const spec of specs) {
    const { w, h } = labelSize(spec);
    const own = { x: spec.at.x * k, y: spec.at.y * k };
    const ownR = spec.clear * k;
    const hitsMark = (b: Box) => marks.some((m) => toBox(b, m).d < m.r);
    const onLine = (b: Box) => lines.some((q) => toBox(b, q).d < 1.5);
    const blocked = (b: Box) =>
      !inside(b) ||
      boxes.some((o) => overlaps(o, b)) ||
      taken.some((t) => !(spec.covers && t.id.startsWith(spec.covers)) && overlaps(t.box, b)) ||
      hitsMark(b) ||
      leaders.some(([a, z]) => crosses(a, z, b));
    const all = candidates(spec, k, w, h);
    let chosen: { cand: Candidate; leader: boolean } | undefined;
    for (const strict of [true, false]) {
      for (const cand of all) {
        if (blocked(cand.box) || (strict && onLine(cand.box))) continue;
        const mine = toBox(cand.box, own).d;
        // Not clearly nearer its own mark than any other: it could read as that one's label.
        const ambiguous =
          spec.mode.kind !== 'arc' &&
          marks.some((m) => (m.x !== own.x || m.y !== own.y) && toBox(cand.box, m).d - m.r < mine - ownR + 4);
        const leader = cand.moved > LEADER_FROM || ambiguous;
        if (leader && (!cand.leaderOk || mine - ownR > LEADER_CAP + 8)) continue;
        // A leader must not run under another label, or it points at the wrong one.
        if (leader && boxes.some((o) => crosses(own, toBox(cand.box, own).at, o))) continue;
        chosen = { cand, leader };
        break;
      }
      if (chosen) break;
    }
    if (!chosen) continue;
    const box = chosen.cand.box;
    boxes.push(box);
    const pc = (v: number) => (v / px) * 100;
    let leader: Placed['leader'];
    if (chosen.leader) {
      const end = toBox(box, own).at;
      const len = Math.hypot(end.x - own.x, end.y - own.y) || 1;
      const start = { x: own.x + ((end.x - own.x) / len) * ownR, y: own.y + ((end.y - own.y) / len) * ownR };
      leader = { x1: pc(start.x), y1: pc(start.y), x2: pc(end.x), y2: pc(end.y) };
      leaders.push([start, end]);
    }
    const covered = spec.covers
      ? taken.filter((t) => t.id.startsWith(spec.covers!) && overlaps(t.box, box)).map((t) => t.id)
      : undefined;
    placed.push({ id: spec.id, left: pc(box.x), top: pc(box.y), box, leader, covered });
  }
  return placed;
}

/** The px box of a ring number centred on its ring at `angle`. */
export function ringTagBox(r: number, angle: number, text: string, px: number, fontPx = 12): Box {
  const k = px / 1000;
  const p = polar(r, angle);
  const w = Math.ceil(text.length * 0.62 * fontPx + 8);
  const h = Math.ceil(fontPx * 1.3);
  return { x: p.x * k - w / 2, y: p.y * k - h / 2, w, h };
}
