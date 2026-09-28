/**
 * What the zone chart shows for one state, and where its labels go: pure, so
 * the page, the OG image and the tests read the same chart.
 */
import {
  type Box,
  type LabelSpec,
  type Placed,
  placeLabels,
  polar,
  ringTagBox,
  route,
  routePoints,
  type Scene,
} from './chart';
import { type Collapsed, type EdgeState, type Exposure, type Graph, type Layout, OUTER_R, ringRadius, ROOT_R } from './data';

export type ChartMode = { kind: 'chaindrop'; exposure: Exposure } | { kind: 'whatif'; target: number };
export type NodeKind = 'root' | 'hit' | 'barred' | 'clean';

/** Node radii in chart units at desktop scale; phones scale them by PHONE_K (the CSS --k). */
export const NODE_R = 9;
export const HIT_R = 11;
/** The halo around an infected node: its label keeps outside it. */
export const HALO_R = 17;
export const PHONE_K = 1.7;
/** Label sets are laid out for these chart widths: under 330px, phones up to 600px, and 600px up (see the CSS). */
export const SIZES = { small: 288, phone: 340, desk: 720 } as const;
/** Labels stay inside the tick ring, so the sector names on the rim stay readable. */
const LABEL_R = OUTER_R + 14;

const plural = (k: number, one: string, many: string) => (k === 1 ? one : many);

export interface Zone {
  sec: Layout['sectors'][number];
  /** Deepest and nearest ring of a reached package in this door (0: none). */
  deep: number;
  near: number;
}

export interface ChartState {
  g: Graph;
  L: Layout;
  c: Collapsed;
  mode: ChartMode;
  place: (n: number) => { angle: number; ring: number };
  at: (n: number) => { x: number; y: number };
  gated: (e: number) => boolean;
  edgeState: (e: number) => EdgeState;
  nodeKind: (n: number) => NodeKind;
  versionShown: (n: number) => string;
  zones: Zone[];
  nearest: Zone | undefined;
  outerHop: number;
}

export function chartState(
  g: Graph,
  L: Layout,
  c: Collapsed,
  mode: ChartMode,
  hasMalicious: (pkg: string) => boolean,
): ChartState {
  const inView = new Set(c.nodes);
  const place = (n: number) => L.place.get(n)!;
  const at = (n: number) => polar(n === 0 ? 0 : ringRadius(place(n).ring, L.rings), place(n).angle);
  const gated = (e: number) => mode.kind === 'chaindrop' && hasMalicious(g.names[g.preset.edges[e][1]]);
  const edgeState = (e: number): EdgeState => (mode.kind === 'chaindrop' ? mode.exposure.edges[e] : 'none');
  const nodeKind = (n: number): NodeKind => {
    if (n === 0) return 'root';
    if (mode.kind === 'whatif') return n === mode.target ? 'hit' : 'clean';
    if (mode.exposure.resolved.has(n)) return 'hit';
    const into = c.edges.filter((e) => g.preset.edges[e][1] === n);
    if (hasMalicious(g.names[n]) && into.length > 0 && into.every((e) => edgeState(e) === 'barred')) return 'barred';
    return 'clean';
  };
  const versionShown = (n: number) =>
    mode.kind === 'chaindrop' && mode.exposure.resolved.has(n) ? mode.exposure.resolved.get(n)!.version : g.versions[n];

  // Reached nodes, per door: the zone and its front.
  const reached = mode.kind === 'chaindrop' ? mode.exposure.reached : [mode.target];
  const zones = L.sectors
    .filter((sec) => sec.door >= 0)
    .map((sec) => {
      const mine = reached.filter((n) => g.door[n] === sec.door && inView.has(n));
      if (mine.length === 0) return { sec, deep: 0, near: 0 };
      const rings = mine.map((n) => place(n).ring);
      return { sec, deep: Math.max(...rings), near: Math.min(...rings) };
    });
  const nearest = zones.filter((z) => z.near > 0).sort((a, b) => a.near - b.near)[0];
  const outerHop = Math.max(...g.depth.filter(Number.isFinite));
  return { g, L, c, mode, place, at, gated, edgeState, nodeKind, versionShown, zones, nearest, outerHop };
}

// ── Labels ───────────────────────────────────────────────────────────────

export interface RingTag {
  k: number;
  text: string;
  r: number;
  /** Where on its ring the number sits (see `ringTagAngle`). */
  angle: number;
}

/**
 * The ring numbers run along one ray inside the sector with no paths
 * ("outras N diretas"), 30° before 12 o'clock, so no path label ever competes
 * with them; with no such sector they sit at 12 o'clock.
 */
export function ringTagAngle(L: Layout): number {
  const outras = L.sectors.find((sec) => sec.door === -1);
  return outras && outras.end - outras.start >= 60 ? outras.end - 30 : 0;
}

export interface Layer {
  placed: Placed[];
  /** The lines of each placed label, by id. */
  text: Map<string, string[]>;
  /** Ring numbers still shown (the front label replaces the one it covers). */
  rings: RingTag[];
}

/**
 * Every label on the chart, for one chart width. Phones name the root, the
 * front, every infected and every barred package; the other path nodes carry
 * their ledger id ("4b"). Desktop names every path node and tags each open
 * edge with its range; a barred package whose edges share one range carries
 * that range itself ("^5.6.0 · barrado ×3").
 */
export function chartLabels(s: ChartState, ids: ReadonlyMap<number, string>, size: keyof typeof SIZES): Layer {
  const { g, L, c, mode, place, at, nodeKind, edgeState, versionShown, nearest } = s;
  const px = SIZES[size];
  const phone = size !== 'desk';
  const scale = phone ? PHONE_K : 1;
  const rank = (n: number) => ({ root: 0, hit: 1, barred: 2, clean: 3 })[nodeKind(n)];
  const byPriority = [...c.nodes].sort((a, b) => rank(a) - rank(b) || place(a).ring - place(b).ring || a - b);
  const markR = (n: number) => (n === 0 ? ROOT_R : (nodeKind(n) === 'hit' ? HALO_R : HIT_R) * scale);

  // Edges into one package with one range read as one tag.
  const groups = new Map<string, { to: number; req: string; state: EdgeState; edges: number[] }>();
  if (mode.kind === 'chaindrop') {
    for (const e of c.edges) {
      const st = edgeState(e);
      if (!s.gated(e) || (st !== 'open' && st !== 'barred')) continue;
      const [, to, req] = g.preset.edges[e];
      const key = `${to}|${req}|${st}`;
      const grp = groups.get(key) ?? { to, req, state: st, edges: [] };
      grp.edges.push(e);
      groups.set(key, grp);
    }
  }
  const times = (k: number) => (k > 1 ? ` ×${k}` : '');
  /** The one range every gated edge into `n` shares, if it has one: the label carries it, next to its gate. */
  const oneRange = (n: number) => {
    const mine = [...groups.values()].filter((grp) => grp.to === n);
    return mine.length === 1 ? mine[0] : undefined;
  };
  /** On a phone a scoped name breaks after its scope, so it fits beside its node. */
  const nameLines = (n: number) => {
    const name = g.names[n];
    const slash = name.indexOf('/');
    return phone && name.startsWith('@') && slash > 0 ? [name.slice(0, slash + 1), name.slice(slash + 1)] : [name];
  };

  const tagAngle = ringTagAngle(L);
  const rings: RingTag[] = Array.from({ length: L.rings }, (_, i) => {
    const k = i + 1;
    const text = k < L.rings ? String(k) : `${k}${s.outerHop > L.rings ? '+' : ''} ${plural(k, 'SALTO', 'SALTOS')}`;
    return { k, text, r: ringRadius(k, L.rings), angle: tagAngle };
  });
  const lines = c.edges.flatMap((e) => {
    const [from, to] = g.preset.edges[e];
    return routePoints(route(place(from), place(to), L.rings));
  });
  const marks = c.nodes.map((n) => ({ at: at(n), r: markR(n) }));
  // The legend corner, bottom left (see the CSS).
  const legend: Box = phone ? { x: 0, y: px - 18, w: 176, h: 18 } : { x: 0, y: px - 56, w: px * 0.48, h: 56 };
  const taken = [
    ...rings.map((ring) => ({ id: `r${ring.k}`, box: ringTagBox(ring.r, ring.angle, ring.text, px) })),
    { id: 'legend', box: legend },
  ];
  // Sector names on the rim (on phones only the wide ones are drawn), as SVG units along r = 470.
  const rimFont = phone ? 36 : 17;
  const rim = L.sectors
    .filter((sec) => !phone || sec.end - sec.start >= 50)
    .map((sec) => {
      const name = sec.door >= 0 ? g.names[sec.door] : `outras ${sec.count} diretas`;
      return { angle: (sec.start + sec.end) / 2, half: ((name.length * 0.62 * rimFont) / 2 / 470) * (180 / Math.PI) + 2 };
    });
  const scene = { px, marks, lines, taken, limitR: LABEL_R, rim };

  // The root leans into the sector with no paths ("outras N diretas"), off every lane.
  const outras = L.sectors.find((sec) => sec.door === -1);
  const specs: LabelSpec[] = [
    {
      id: 'n0',
      at: at(0),
      clear: ROOT_R,
      lines: [g.names[0], g.versions[0]],
      face: 'code',
      fontPx: 12,
      mode: { kind: 'below', toward: outras ? (outras.start + outras.end) / 2 : undefined },
    },
  ];
  if (nearest) {
    const r = ringRadius(nearest.near, L.rings);
    specs.push({
      id: 'front',
      at: polar(r, (nearest.sec.start + nearest.sec.end) / 2),
      clear: 0,
      // Two short lines on a phone, where ring 1 is barely wider than the chip.
      lines: phone
        ? [mode.kind === 'whatif' ? 'ALVO' : 'FRENTE', `${nearest.near} ${plural(nearest.near, 'SALTO', 'SALTOS')}`]
        : [`${mode.kind === 'whatif' ? 'ALVO' : 'FRENTE'} · ${nearest.near} ${plural(nearest.near, 'SALTO', 'SALTOS')}`],
      face: 'label',
      fontPx: 12,
      mode: { kind: 'arc', r, from: nearest.sec.start, to: nearest.sec.end },
      covers: 'r',
    });
  }
  const node = (n: number, lines: string[], face: 'code' | 'label' = 'code'): LabelSpec => ({
    id: face === 'code' ? `n${n}` : `k${n}`,
    at: at(n),
    clear: markR(n),
    lines,
    face,
    fontPx: 12,
    mode: { kind: 'radial' },
  });
  const named = byPriority.filter((n) => n > 0 && nodeKind(n) !== 'clean');
  if (phone) {
    const phoneLines = (n: number) => {
      if (nodeKind(n) !== 'barred') return [...nameLines(n), versionShown(n)];
      const one = `${g.names[n]} · barrado`;
      return one.length <= 16 ? [one] : [...nameLines(n), 'barrado'];
    };
    specs.push(...named.map((n) => node(n, phoneLines(n))));
  } else {
    const deskLines = (n: number) => {
      const grp = oneRange(n);
      if (grp) {
        const verdict = grp.state === 'open' ? 'aceitava' : 'barrado';
        return [`${g.names[n]} ${versionShown(n)}`, `${grp.req} · ${verdict}${times(grp.edges.length)}`];
      }
      if (nodeKind(n) === 'barred') return [g.names[n], `${versionShown(n)} · barrado`];
      return [g.names[n], versionShown(n)];
    };
    // A package reached through several ranges keeps one tag per range, on its edge.
    const ranges: LabelSpec[] = [...groups.values()]
      .filter((grp) => oneRange(grp.to) !== grp)
      .map((grp) => {
        const e = grp.edges.find((x) => L.treeEdge.get(grp.to) === x) ?? grp.edges[0];
        const [from, to] = g.preset.edges[e];
        const v = mode.kind === 'chaindrop' ? mode.exposure.resolved.get(to)?.version : undefined;
        return {
          id: `e${e}`,
          at: route(place(from), place(to), L.rings).mid,
          clear: 4,
          lines: [`${grp.req} · ${grp.state === 'open' ? `aceitava ${v}` : 'barrado'}${times(grp.edges.length)}`],
          face: 'code' as const,
          fontPx: 12,
          mode: { kind: 'radial' as const },
        };
      });
    specs.push(
      ...named.map((n) => node(n, deskLines(n))),
      ...ranges,
      ...byPriority.filter((n) => n > 0 && nodeKind(n) === 'clean').map((n) => node(n, deskLines(n))),
    );
  }

  const text = new Map<string, string[]>();
  for (const spec of specs) text.set(spec.id, spec.lines);
  const first = placeAll(specs, scene);
  const done = new Set(first.map((p) => p.id));
  // Whatever has no name on the chart carries its ledger id, the same as its CAMINHO row.
  const idSpecs = c.nodes
    .filter((n) => n > 0 && !done.has(`n${n}`))
    .map((n) => node(n, [ids.get(n) ?? String(place(n).ring)], 'label'));
  for (const spec of idSpecs) text.set(spec.id, spec.lines);
  const second = placeLabels(idSpecs, { ...scene, taken: [...taken, ...first.map((p) => ({ id: p.id, box: p.box }))] });
  const covered = new Set(first.flatMap((p) => p.covered ?? []));
  return { placed: [...first, ...second], text, rings: rings.filter((ring) => !covered.has(`r${ring.k}`)) };
}

/**
 * Greedy placement names what it can in priority order; when that leaves a
 * name out, the names left out go first and it tries again. The run kept is
 * the one whose first missing name comes latest in priority (then the one that
 * names the most): a handful of labels, so a few runs at most.
 */
function placeAll(specs: readonly LabelSpec[], scene: Scene): Placed[] {
  const score = (placed: Placed[]) => {
    const first = specs.findIndex((sp) => !placed.some((p) => p.id === sp.id));
    return (first < 0 ? specs.length : first) * 100 + placed.length;
  };
  let order = [...specs];
  let best: Placed[] = [];
  for (let run = 0; run < 8; run++) {
    const placed = placeLabels(order, scene);
    if (score(placed) > score(best)) best = placed;
    const missing = order.filter((sp) => !placed.some((p) => p.id === sp.id));
    if (missing.length === 0) return placed;
    const [root, ...rest] = order;
    order = [root, ...missing, ...rest.filter((sp) => !missing.includes(sp))];
  }
  return best;
}
