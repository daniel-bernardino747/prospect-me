/**
 * What the board needs in the browser, and the rules it draws by. Pure: the
 * server builds `BoardDay` from `data.json`, the client decodes the lamps and
 * asks these functions for radii, pulses and plates; Vitest checks them.
 */
import {
  annunciator,
  type CatalogEntry,
  type CurtailmentData,
  type Day,
  decodeLamp,
  type Glass,
  glassOf,
  type Lamp,
  lampScale,
  type MapGeometry,
  PATAMARES,
  peakIndex,
  type Reason,
  type Window,
} from './data';

export interface BoardPoint {
  /** Index into `data.points` (stable across days). */
  i: number;
  id: string;
  name: string;
  source: 'eol' | 'fv';
  uf: string;
  sub: string | null;
  /** Null when the point falls outside the frame (then it lives on the fora-do-mapa plate). */
  x: number | null;
  y: number | null;
  cutMwh: number;
  refMwh: number;
  lamp: string;
}

export interface BoardRestriction {
  label: string;
  reason: Reason;
  mwh: number;
  points: number[];
}

export interface AnnunciatorWindow extends Window {
  /** The glass the window lights with in each patamar, or null when it is off. */
  glassAt: (Glass | null)[];
  /** The UFs of its points that fall outside the frame. */
  offUfs: string[];
  /** How many of its points are on the map. */
  onMap: number;
}

/** Everything one day's board ships to the browser. */
export interface BoardDay {
  date: string;
  peak: number;
  /** Lamp scale, viewBox units per sqrt(MW). */
  k: number;
  map: MapGeometry;
  points: BoardPoint[];
  restrictions: BoardRestriction[];
  windows: AnnunciatorWindow[];
  refMw: number[];
  sobraMw: number[];
  redeMw: number[];
  byUf: Record<string, number>;
  ufMw: Record<string, number[]>;
  cutMwh: number;
  byReason: Record<Reason, number>;
}

export function boardDay(data: CurtailmentData, day: Day): BoardDay {
  const points: BoardPoint[] = Object.entries(day.points)
    .map(([key, p]) => {
      const i = Number(key);
      const meta = data.points[i];
      return { i, ...meta, cutMwh: p.cutMwh, refMwh: p.refMwh, lamp: p.lamp };
    })
    // Larger bezels first, so small lamps stay on top.
    .sort((a, b) => lampMax(b.lamp) - lampMax(a.lamp) || a.i - b.i);
  const byIndex = new Map(points.map((p) => [p.i, p]));
  const restrictions = day.restrictions.map((r) => ({
    label: data.catalog[r.c].label,
    reason: data.catalog[r.c].reason,
    mwh: r.mwh,
    points: r.points,
  }));
  return {
    date: day.date,
    peak: peakIndex(day),
    k: lampScale(day),
    map: data.map,
    points,
    restrictions,
    windows: windows(day, data.catalog, byIndex),
    refMw: day.refMw,
    sobraMw: day.sobraMw,
    redeMw: day.redeMw,
    byUf: day.byUf,
    ufMw: day.ufMw,
    cutMwh: day.cutMwh,
    byReason: day.byReason,
  };
}

const lampMax = (lamp: string) => Number(lamp.slice(0, lamp.indexOf('|')));

function windows(day: Day, catalog: readonly CatalogEntry[], byIndex: Map<number, BoardPoint>): AnnunciatorWindow[] {
  return annunciator(day, catalog).map((w) => {
    const folded =
      w.restriction === null
        ? [...day.restrictions].sort((a, b) => b.mwh - a.mwh).slice(-w.folded)
        : [day.restrictions[w.restriction]];
    const glassAt = Array.from({ length: PATAMARES }, (_, t) => {
      let sobra = 0;
      let rede = 0;
      for (const r of folded) {
        if (glassOf(catalog[r.c].reason) === 'sobra') sobra += r.mw[t];
        else rede += r.mw[t];
      }
      if (sobra + rede <= 0) return null;
      return sobra >= rede ? ('sobra' as const) : ('rede' as const);
    });
    const pts = w.points.map((i) => byIndex.get(i)).filter((p): p is BoardPoint => Boolean(p));
    return {
      ...w,
      glassAt,
      offUfs: [...new Set(pts.filter((p) => p.x === null).map((p) => p.uf))].sort(),
      onMap: pts.filter((p) => p.x !== null).length,
    };
  });
}

// ---------------------------------------------------------------------------
// Lamps

export interface DecodedPoint extends BoardPoint {
  series: Lamp;
  /** Bezel radius, fixed for the day. */
  rb: number;
}

export const bezel = (k: number, max: number) => Math.max(2.5, k * Math.sqrt(max));
const radius = (k: number, value: number) => (value > 0 ? k * Math.sqrt(value) : 0);

export function decodePoints(board: BoardDay): DecodedPoint[] {
  return board.points.map((p) => {
    const series = decodeLamp(p.lamp);
    return { ...p, series, rb: bezel(board.k, series.max) };
  });
}

export interface LampFrame {
  /** Glass radius: what it could produce. */
  rg: number;
  /** Lit radius: what was cut. */
  rc: number;
  /** Lit glass colour, from the patamar the frame starts in. */
  glass: Glass | null;
  /** Index into the day's restrictions, or -1. */
  restriction: number;
}

/**
 * A lamp at patamar `t`, `f` of the way (0–1) to `t + 1`. Radii interpolate
 * linearly; the reason colour switches at the boundary, never cross-fades.
 */
export function lampFrame(p: DecodedPoint, board: Pick<BoardDay, 'k' | 'restrictions'>, t: number, f = 0): LampFrame {
  const { ref, cut, restriction } = p.series;
  const u = Math.min(PATAMARES - 1, t + 1);
  const lerp = (a: number, b: number) => a + (b - a) * f;
  const rg = lerp(radius(board.k, ref[t]), radius(board.k, ref[u]));
  const rc = Math.min(rg, lerp(radius(board.k, cut[t]), radius(board.k, cut[u])));
  const r = restriction[t];
  const glass = cut[t] > 0 && r >= 0 ? glassOf(board.restrictions[r].reason) : null;
  return { rg, rc, glass, restriction: cut[t] > 0 ? r : -1 };
}

/**
 * The lamps whose lit disc grows by at least a quarter of their bezel from `t`
 * to `t + 1`, largest growth first, at most `max` (the pulse pool's size).
 */
export function pulses(points: readonly DecodedPoint[], k: number, t: number, max = 12): number[] {
  if (t + 1 >= PATAMARES) return [];
  const grown: { index: number; by: number }[] = [];
  points.forEach((p, index) => {
    if (p.x === null) return;
    const by = radius(k, p.series.cut[t + 1]) - radius(k, p.series.cut[t]);
    if (by >= 0.25 * p.rb && by > 0) grown.push({ index, by });
  });
  return grown
    .sort((a, b) => b.by - a.by || a.index - b.index)
    .slice(0, max)
    .map((g) => g.index);
}

// ---------------------------------------------------------------------------
// Plates

export interface OffMapRow {
  uf: string;
  mwh: number;
  /** The glass most of the UF's off-map cut had in patamar `t`, or null when nothing was cut. */
  glass: Glass | null;
}

/** The fora-do-mapa plate: every UF with a point outside the frame, most cut first. */
export function offMap(points: readonly DecodedPoint[], restrictions: BoardDay['restrictions'], t: number): OffMapRow[] {
  const rows = new Map<string, { mwh: number; sobra: number; rede: number }>();
  for (const p of points) {
    if (p.x !== null) continue;
    const row = rows.get(p.uf) ?? { mwh: 0, sobra: 0, rede: 0 };
    row.mwh += p.cutMwh;
    const r = p.series.restriction[t];
    const cut = p.series.cut[t];
    if (cut > 0 && r >= 0) {
      if (glassOf(restrictions[r].reason) === 'sobra') row.sobra += cut;
      else row.rede += cut;
    }
    rows.set(p.uf, row);
  }
  return [...rows.entries()]
    .map(([uf, r]) => ({
      uf,
      mwh: r.mwh,
      glass: r.sobra + r.rede <= 0 ? null : r.sobra >= r.rede ? ('sobra' as const) : ('rede' as const),
    }))
    .sort((a, b) => b.mwh - a.mwh || a.uf.localeCompare(b.uf));
}

/** Share of the day's cut that happened at points outside the frame. */
export function offMapShare(points: readonly BoardPoint[], cutMwh: number): number {
  if (cutMwh <= 0) return 0;
  return points.filter((p) => p.x === null).reduce((s, p) => s + p.cutMwh, 0) / cutMwh;
}

/**
 * The hour (file time) at the centre of the solar reference generation over the
 * whole range. Near midday it means the file is in local time; the page uses it
 * to say why it reads `din_instante` as Brasília time.
 */
export function solarCentreHour(data: CurtailmentData): number | null {
  let weight = 0;
  let sum = 0;
  for (const day of data.days) {
    for (const [key, p] of Object.entries(day.points)) {
      if (data.points[Number(key)]?.source !== 'fv') continue;
      decodeLamp(p.lamp).ref.forEach((v, t) => {
        weight += v;
        sum += v * (t / 2 + 0.25);
      });
    }
  }
  return weight > 0 ? sum / weight : null;
}

/** A heat row as runs `[start, length, level]`, so the heatmap draws one rect per run, not per cell. */
export function heatRuns(levels: readonly number[]): [number, number, number][] {
  const runs: [number, number, number][] = [];
  for (let i = 0; i < levels.length; ) {
    let j = i + 1;
    while (j < levels.length && levels[j] === levels[i]) j++;
    runs.push([i, j - i, levels[i]]);
    i = j;
  }
  return runs;
}

/** "11h52" from a fractional hour. */
export function clockProse(hour: number): string {
  const total = Math.round(hour * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}h${String(total % 60).padStart(2, '0')}`;
}

/**
 * A step band for the recorder, in a `width × height` box scaled to `max`:
 * from `lower` (the baseline when omitted) up to `lower + values`, half hour by
 * half hour, never smoothed (the data is half-hourly).
 */
export function stepBand(values: readonly number[], max: number, width: number, height: number, lower?: readonly number[]): string {
  const n = values.length;
  const x = (i: number) => Math.round(((i * width) / n) * 100) / 100;
  const y = (v: number) => Math.round((height - (max > 0 ? (Math.min(v, max) / max) * height : 0)) * 100) / 100;
  const low = (i: number) => lower?.[i] ?? 0;
  let d = '';
  for (let i = 0; i < n; i++) d += `${i ? 'L' : 'M'}${x(i)} ${y(low(i) + values[i])}L${x(i + 1)} ${y(low(i) + values[i])}`;
  for (let i = n - 1; i >= 0; i--) d += `L${x(i + 1)} ${y(low(i))}L${x(i)} ${y(low(i))}`;
  return `${d}Z`;
}

/** A step line (no fill), for the possible curve. */
export function stepLine(values: readonly number[], max: number, width: number, height: number): string {
  const n = values.length;
  const x = (i: number) => Math.round(((i * width) / n) * 100) / 100;
  const y = (v: number) => Math.round((height - (max > 0 ? (v / max) * height : 0)) * 100) / 100;
  return values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}L${x(i + 1)} ${y(v)}`).join('');
}
