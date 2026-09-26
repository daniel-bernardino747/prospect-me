/**
 * The data behind "Raio de explosão", gathered once by
 * `scripts/raio-de-explosao.ts`, and every rule the page applies to it. Pure
 * and client-safe: the semver work was done by the script (`rules.ts`), which
 * stored on each edge the malicious versions its range accepts.
 */

export interface MaliciousVersion {
  version: string;
  /** npm registry `time[version]`, ISO. */
  publishedAt: string;
  /** The ossf/malicious-packages record, via OSV. */
  osv: string | null;
}

/** [from, to, requirement, malicious versions the requirement accepts]. */
export type Edge = [from: number, to: number, requirement: string, accepts?: string[]];

export interface Preset {
  id: string;
  kind: 'dependency' | 'devDependency';
  root: { name: string; version: string; publishedAt: string };
  /** "name@version"; node 0 is the root. */
  nodes: string[];
  edges: Edge[];
}

export interface RaioData {
  fetchedAt: string;
  /** The instant the preset roots were checked to be what `npm install` gave. */
  replayAt: string;
  ioc: { url: string; packages: number; versions: number };
  /** ChainDrop versions of every package that appears in a preset's graph. */
  malicious: Record<string, MaliciousVersion[]>;
  presets: Preset[];
}

export const MAX_PATHS = 5;
const DAY = '2026-08-04';
const START = `${DAY}T09:30:00Z`;
/** StepSecurity: npm began unpublishing at about 10:39 UTC. */
const REMOVAL = `${DAY}T10:39:00Z`;

export const nameOf = (node: string) => node.slice(0, node.lastIndexOf('@'));
export const versionOf = (node: string) => node.slice(node.lastIndexOf('@') + 1);

// ── Graph ────────────────────────────────────────────────────────────────

export interface Graph {
  preset: Preset;
  names: string[];
  versions: string[];
  /** Shortest hop count from the root; the chart's ring. */
  depth: number[];
  into: number[][];
  out: number[][];
  /** The direct dependency the shortest path goes through (-1 for the root). */
  door: number[];
}

export function buildGraph(preset: Preset): Graph {
  const n = preset.nodes.length;
  const into: number[][] = Array.from({ length: n }, () => []);
  const out: number[][] = Array.from({ length: n }, () => []);
  preset.edges.forEach(([from, to], i) => {
    out[from].push(i);
    into[to].push(i);
  });
  const depth = new Array<number>(n).fill(Infinity);
  const door = new Array<number>(n).fill(-1);
  depth[0] = 0;
  const queue = [0];
  for (let q = 0; q < queue.length; q++) {
    const u = queue[q];
    for (const e of out[u]) {
      const v = preset.edges[e][1];
      if (depth[v] !== Infinity) continue;
      depth[v] = depth[u] + 1;
      door[v] = u === 0 ? v : door[u];
      queue.push(v);
    }
  }
  return {
    preset,
    names: preset.nodes.map(nameOf),
    versions: preset.nodes.map(versionOf),
    depth,
    into,
    out,
    door,
  };
}

// ── The exposure rule ────────────────────────────────────────────────────

export type EdgeState = 'none' | 'not-yet' | 'barred' | 'open';

const publishedBy = (m: MaliciousVersion, at: string) => Date.parse(m.publishedAt) <= Date.parse(at);

/**
 * An edge is open when a malicious version of its target that the range
 * accepts is already published; barred when malicious versions of the target
 * are out but the range takes none of them; not yet when none is out.
 */
export function edgeState(data: RaioData, g: Graph, edge: number, at: string): EdgeState {
  const [, to, , accepts = []] = g.preset.edges[edge];
  const bad = data.malicious[g.names[to]] ?? [];
  if (bad.length === 0) return 'none';
  const out = bad.filter((m) => publishedBy(m, at));
  if (out.some((m) => accepts.includes(m.version))) return 'open';
  return out.length > 0 ? 'barred' : 'not-yet';
}

export interface Exposure {
  edges: EdgeState[];
  /** Nodes an install at this instant resolves to a malicious version. */
  reached: number[];
  /** The version each reached node resolves to (the newest accepted one out). */
  resolved: Map<number, MaliciousVersion>;
  /** Hops to the nearest reached node, or null. */
  nearest: number | null;
}

export function exposureAt(data: RaioData, g: Graph, at: string): Exposure {
  const edges = g.preset.edges.map((_, i) => edgeState(data, g, i, at));
  const resolved = new Map<number, MaliciousVersion>();
  g.preset.edges.forEach(([, to, , accepts = []], i) => {
    if (edges[i] !== 'open') return;
    const hit = (data.malicious[g.names[to]] ?? [])
      .filter((m) => accepts.includes(m.version) && publishedBy(m, at))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
    if (hit) resolved.set(to, hit);
  });
  const reached = [...resolved.keys()].sort((a, b) => g.depth[a] - g.depth[b] || a - b);
  return { edges, reached, resolved, nearest: reached.length ? g.depth[reached[0]] : null };
}

// ── The morning of 4 August ──────────────────────────────────────────────

export type Verdict = { kind: 'open'; hops: number; range: string } | { kind: 'barred'; range: string } | { kind: 'sem-efeito' };

export type Entry =
  | { kind: 'start'; id: string; at: string }
  | { kind: 'publish'; id: string; at: string; pkg: string; version: string; osv: string | null; verdict: Verdict }
  | { kind: 'removal'; id: string; at: string };

/** "10:13:02" from an ISO instant. */
export const clockOf = (iso: string) => iso.slice(11, 19);
const idOf = (iso: string) => clockOf(iso).replaceAll(':', '');

/**
 * One row per publish of a ChainDrop version of a package in this graph, in
 * order, between "before the first event" and the removal statement. Each
 * verdict is the exposure rule applied at that row's instant.
 */
export function morning(data: RaioData, g: Graph): Entry[] {
  const inGraph = [...new Set(g.names)].filter((n) => data.malicious[n]);
  const events = inGraph
    .flatMap((pkg) => data.malicious[pkg].map((m) => ({ pkg, m })))
    .sort((a, b) => Date.parse(a.m.publishedAt) - Date.parse(b.m.publishedAt) || a.pkg.localeCompare(b.pkg));

  const entries: Entry[] = [{ kind: 'start', id: idOf(START), at: START }];
  const seen = new Set<string>();
  let removed = false;
  for (const { pkg, m } of events) {
    if (!removed && Date.parse(m.publishedAt) >= Date.parse(REMOVAL)) {
      entries.push({ kind: 'removal', id: '1039', at: REMOVAL });
      removed = true;
    }
    let id = idOf(m.publishedAt);
    while (seen.has(id)) id += 'b';
    seen.add(id);
    entries.push({
      kind: 'publish',
      id,
      at: m.publishedAt,
      pkg,
      version: m.version,
      osv: m.osv,
      verdict: verdictOf(data, g, pkg, m),
    });
  }
  if (!removed) entries.push({ kind: 'removal', id: '1039', at: REMOVAL });
  return entries;
}

function verdictOf(data: RaioData, g: Graph, pkg: string, m: MaliciousVersion): Verdict {
  const nodes = g.names.flatMap((n, i) => (n === pkg ? [i] : [])).sort((a, b) => g.depth[a] - g.depth[b]);
  const edges = nodes.flatMap((n) => g.into[n]);
  const accepting = edges.filter((e) => (g.preset.edges[e][3] ?? []).includes(m.version));
  if (accepting.length === 0) {
    return { kind: 'barred', range: g.preset.edges[edges[0]][2] };
  }
  const before = new Date(Date.parse(m.publishedAt) - 1).toISOString();
  const already = accepting.some((e) => edgeState(data, g, e, before) === 'open');
  if (already) return { kind: 'sem-efeito' };
  const node = accepting.map((e) => g.preset.edges[e][1]).sort((a, b) => g.depth[a] - g.depth[b])[0];
  const edge = accepting.find((e) => g.preset.edges[e][1] === node)!;
  return { kind: 'open', hops: g.depth[node], range: g.preset.edges[edge][2] };
}

/**
 * The row a preset opens on: the publish that opens its shallowest path (the
 * door event), or the last publish where nothing ever opens.
 */
export function defaultEntry(entries: readonly Entry[]): number {
  let best = -1;
  let bestHops = Infinity;
  entries.forEach((e, i) => {
    if (e.kind === 'publish' && e.verdict.kind === 'open' && e.verdict.hops < bestHops) {
      best = i;
      bestHops = e.verdict.hops;
    }
  });
  if (best >= 0) return best;
  for (let i = entries.length - 1; i >= 0; i--) if (entries[i].kind === 'publish') return i;
  return 0;
}

// ── Collapsing the graph to its paths ────────────────────────────────────

/** Nodes whose package has a ChainDrop version: the targets outside "e se". */
export function chainDropTargets(data: RaioData, g: Graph): number[] {
  return g.names.flatMap((n, i) => (i > 0 && data.malicious[n] ? [i] : []));
}

/**
 * Simple paths root → target, as edge lists, shortest first. Searched
 * backwards from the target, and never more than four hops longer than the
 * shortest path, so a large graph cannot explode it.
 */
export function pathsTo(g: Graph, target: number, cap = 50): number[][] {
  if (!Number.isFinite(g.depth[target]) || target === 0) return [];
  const maxLen = g.depth[target] + 4;
  const found: number[][] = [];
  const onPath = new Set<number>([target]);
  const walk = (node: number, edges: number[]) => {
    if (found.length >= cap) return;
    if (node === 0) {
      found.push([...edges].reverse());
      return;
    }
    for (const e of g.into[node]) {
      const from = g.preset.edges[e][0];
      if (onPath.has(from) || edges.length + 1 + g.depth[from] > maxLen) continue;
      onPath.add(from);
      edges.push(e);
      walk(from, edges);
      edges.pop();
      onPath.delete(from);
    }
  };
  walk(target, []);
  return found.sort((a, b) => a.length - b.length || a.join().localeCompare(b.join()));
}

export interface Collapsed {
  nodes: number[];
  edges: number[];
  /** Paths per target beyond MAX_PATHS (capped count), for "+ k caminhos". */
  more: Map<number, number>;
  paths: Map<number, number[][]>;
}

export function collapse(g: Graph, targets: readonly number[], limit = MAX_PATHS): Collapsed {
  const nodes = new Set<number>([0]);
  const edges = new Set<number>();
  const more = new Map<number, number>();
  const paths = new Map<number, number[][]>();
  for (const t of targets) {
    const all = pathsTo(g, t);
    if (all.length === 0) continue;
    const kept = all.slice(0, limit);
    paths.set(t, kept);
    if (all.length > limit) more.set(t, all.length - limit);
    for (const p of kept) {
      for (const e of p) {
        edges.add(e);
        nodes.add(g.preset.edges[e][0]);
        nodes.add(g.preset.edges[e][1]);
      }
    }
  }
  return {
    nodes: [...nodes].sort((a, b) => g.depth[a] - g.depth[b] || a - b),
    edges: [...edges].sort((a, b) => a - b),
    more,
    paths,
  };
}

// ── The polar layout ─────────────────────────────────────────────────────

export const CENTRE = 500;
export const ROOT_R = 46;
export const OUTER_R = 440;
const OUTRAS_MIN = 60;
const DOOR_MIN = 40;

export interface Sector {
  /** The direct dependency, or -1 for "outras N diretas". */
  door: number;
  start: number;
  end: number;
  count?: number;
}

export interface Layout {
  rings: number;
  sectors: Sector[];
  /** Angle (degrees clockwise from 12 o'clock) and ring of each collapsed node. */
  place: Map<number, { angle: number; ring: number }>;
  /** Tree parent edge per collapsed node; the other collapsed edges are chords. */
  treeEdge: Map<number, number>;
  field: { node: number; angle: number; ring: number }[];
  directs: number;
}

export const ringRadius = (k: number, rings: number) => (k <= 0 ? 0 : ROOT_R + k * ((OUTER_R - ROOT_R) / rings));

/** A stable fraction in [0, 1) from a package name (FNV-1a). */
export function hashUnit(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

/** Splits `total` degrees in proportion to `weights`, each at least `min`. */
export function apportion(weights: readonly number[], total: number, min: number): number[] {
  const out = new Array<number>(weights.length).fill(0);
  const fixed = new Set<number>();
  for (;;) {
    const free = weights.map((_, i) => i).filter((i) => !fixed.has(i));
    const left = total - fixed.size * min;
    const sum = free.reduce((s, i) => s + weights[i], 0);
    let changed = false;
    for (const i of free) {
      out[i] = sum > 0 ? (left * weights[i]) / sum : left / free.length;
      if (out[i] < min && left >= min * free.length) {
        fixed.add(i);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const i of fixed) out[i] = min;
  return out;
}

export function layout(g: Graph, c: Collapsed): Layout {
  const inView = new Set(c.nodes);
  const ringOf = (n: number) => Math.min(g.depth[n], 6);
  // Every package keeps its true distance, the off-path field included, so the
  // rings follow the whole graph's depth (3 to 6; deeper sits on "6+").
  const rings = Math.min(6, Math.max(3, ...g.depth.filter(Number.isFinite)));

  // A spanning tree of the collapsed view: each node hangs from its shallowest parent.
  const treeEdge = new Map<number, number>();
  const children = new Map<number, number[]>();
  for (const n of c.nodes) {
    if (n === 0) continue;
    const e = c.edges
      .filter((e) => g.preset.edges[e][1] === n && inView.has(g.preset.edges[e][0]))
      .sort((a, b) => g.depth[g.preset.edges[a][0]] - g.depth[g.preset.edges[b][0]] || a - b)[0];
    treeEdge.set(n, e);
    const p = g.preset.edges[e][0];
    children.set(p, [...(children.get(p) ?? []), n]);
  }
  // Leaf counts and the spread below skip nodes already visited, so a cycle cannot loop.
  const leaves = new Map<number, number>();
  const leafCount = (n: number, seen = new Set<number>()): number => {
    if (leaves.has(n)) return leaves.get(n)!;
    seen.add(n);
    const kids = (children.get(n) ?? []).filter((k) => !seen.has(k));
    const v = kids.length ? kids.reduce((s, k) => s + leafCount(k, seen), 0) : 1;
    leaves.set(n, v);
    return v;
  };

  const directs = g.preset.edges.filter(([from]) => from === 0).length;
  const doors = children.get(0) ?? [];
  const otherDirects = new Set(g.preset.edges.filter(([from, to]) => from === 0 && !inView.has(to)).map(([, to]) => to)).size;
  const outrasWidth =
    otherDirects === 0 ? 0 : doors.length === 0 ? 360 : Math.min(180, Math.max(OUTRAS_MIN, (360 * otherDirects) / (otherDirects + doors.length)));
  const widths = apportion(doors.map((d) => leafCount(d)), 360 - outrasWidth, DOOR_MIN);

  const sectors: Sector[] = [];
  const place = new Map<number, { angle: number; ring: number }>();
  place.set(0, { angle: 0, ring: 0 });
  let a = 0;
  const spread = (n: number, start: number, end: number, seen: Set<number>) => {
    place.set(n, { angle: (start + end) / 2, ring: ringOf(n) });
    seen.add(n);
    const kids = (children.get(n) ?? []).filter((k) => !seen.has(k));
    const total = kids.reduce((s, k) => s + leafCount(k), 0);
    let s = start;
    for (const k of kids) {
      const w = ((end - start) * leafCount(k)) / total;
      spread(k, s, s + w, seen);
      s += w;
    }
  };
  doors.forEach((d, i) => {
    sectors.push({ door: d, start: a, end: a + widths[i] });
    spread(d, a, a + widths[i], new Set([0]));
    a += widths[i];
  });
  if (outrasWidth > 0) sectors.push({ door: -1, start: a, end: 360, count: otherDirects });

  const field: Layout['field'] = [];
  g.preset.nodes.forEach((node, n) => {
    if (inView.has(n) || !Number.isFinite(g.depth[n])) return;
    const sector = sectors.find((s) => s.door === g.door[n]) ?? sectors.find((s) => s.door === -1) ?? sectors[0];
    if (!sector) return;
    const w = sector.end - sector.start;
    field.push({ node: n, angle: sector.start + (0.06 + 0.88 * hashUnit(node)) * w, ring: Math.min(g.depth[n], rings) });
  });

  return { rings, sectors, place, treeEdge, field, directs };
}

// ── Words ────────────────────────────────────────────────────────────────

/** A sentence in pieces, so the page can colour figures and set names in code. */
/** `fig` is a figure of exposure (magenta); `lead` is set in ink, for a zero said in words. */
export type Piece = { t: 'text' | 'fig' | 'lead' | 'code'; v: string };

const saltos = (k: number) => (k === 1 ? 'salto' : 'saltos');
const hhmm = (iso: string) => clockOf(iso).slice(0, 5);

/**
 * The headline for a preset at an entry. At the preset's default entry it is
 * the case's sentence; at any other it says where ChainDrop stood then.
 */
export function headline(
  data: RaioData,
  g: Graph,
  entries: readonly Entry[],
  index: number,
  exposure: Exposure,
): Piece[] {
  const entry = entries[index];
  const root = g.preset.root;
  if (index === defaultEntry(entries) && entry.kind === 'publish') {
    const n = exposure.reached.length;
    if (n === 0) {
      return [
        { t: 'lead', v: 'Nenhum caminho.' },
        { t: 'text', v: ' As faixas do ' },
        { t: 'code', v: root.name },
        { t: 'text', v: ` ${root.version} não aceitavam nenhuma versão do ChainDrop.` },
      ];
    }
    if (n === 1) {
      return [
        { t: 'code', v: root.name },
        { t: 'text', v: ` ${root.version} puxava um pacote infectado a ` },
        { t: 'fig', v: String(exposure.nearest) },
        { t: 'text', v: ` ${saltos(exposure.nearest!)}.` },
      ];
    }
    const doors = new Set(exposure.reached.map((r) => g.door[r])).size;
    return [
      { t: 'fig', v: String(n) },
      { t: 'text', v: ' dos ' },
      { t: 'fig', v: String(data.ioc.packages) },
      {
        t: 'text',
        v: ` pacotes do ChainDrop entravam por ${doors === 1 ? 'um único' : doors} ${g.preset.kind === 'devDependency' ? 'devDependency' : 'dependência'}.`,
      },
    ];
  }
  if (entry.kind === 'start') {
    return [{ t: 'text', v: `Às ${hhmm(entry.at)} UTC, nenhuma versão do ChainDrop estava publicada.` }];
  }
  const when = entry.kind === 'removal' ? `Às ~${hhmm(entry.at)} UTC` : `Às ${clockOf(entry.at)} UTC`;
  if (exposure.nearest !== null) {
    return [
      { t: 'text', v: `${when}, o ChainDrop estava a ` },
      { t: 'fig', v: String(exposure.nearest) },
      { t: 'text', v: ` ${saltos(exposure.nearest)} do ` },
      { t: 'code', v: root.name },
      { t: 'text', v: '.' },
    ];
  }
  return [
    { t: 'text', v: `${when}, o ChainDrop já estava no registro, e nenhuma faixa do ` },
    { t: 'code', v: root.name },
    { t: 'text', v: ' o aceitava.' },
  ];
}

/** The condition that makes the headline true, on the line right under it. */
export function qualifier(entries: readonly Entry[], index: number): string {
  const entry = entries[index];
  const base = 'npm install sem lockfile, 4 ago 2026';
  if (index === defaultEntry(entries) && entry.kind === 'publish') {
    return entry.verdict.kind === 'open' ? `${base}, a partir de ${hhmm(entry.at)} UTC` : `${base}, 09:30–10:39 UTC`;
  }
  if (entry.kind === 'removal') return `${base}, às ~${hhmm(entry.at)} UTC`;
  return `${base}, às ${entry.kind === 'start' ? hhmm(entry.at) : clockOf(entry.at)} UTC`;
}

/** The "e se" headline: every path to any package, no malicious list needed. */
export function whatIfHeadline(g: Graph, target: number, c: Collapsed): Piece[] {
  const paths = (c.paths.get(target)?.length ?? 0) + (c.more.get(target) ?? 0);
  const k = g.depth[target];
  return [
    { t: 'text', v: 'Se ' },
    { t: 'code', v: g.names[target] },
    { t: 'text', v: ' for comprometido: ' },
    { t: 'fig', v: String(paths) },
    { t: 'text', v: ` ${paths === 1 ? 'caminho' : 'caminhos'}, o mais curto a ` },
    { t: 'fig', v: String(k) },
    { t: 'text', v: ` ${saltos(k)}.` },
  ];
}

/** The one line the stepper announces for an entry. */
export function liveLine(g: Graph, entry: Entry): string {
  if (entry.kind === 'start') return '09:30 UTC · antes do primeiro evento: nenhuma versão do ChainDrop publicada.';
  if (entry.kind === 'removal') {
    return '~10:39 UTC · o npm começa a remover as versões (StepSecurity). A hora de saída de cada versão não é pública; o gráfico fica como estava.';
  }
  const head = `${clockOf(entry.at)} UTC · ${entry.pkg} ${entry.version} publicada.`;
  const v = entry.verdict;
  if (v.kind === 'open') return `${head} ${v.range} aceitava: caminho aberto a ${v.hops} ${saltos(v.hops)} do ${g.preset.root.name}.`;
  if (v.kind === 'barred') return `${head} ${v.range} não aceita ${entry.version}: barrado.`;
  return `${head} O caminho já estava aberto: sem efeito.`;
}

export const dateBr = (iso: string) => {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
};
