/**
 * Where everything sits on the heijunka board, in axis units (one unit per
 * five-minute pitch). The page turns units into percentages across and pixels
 * down; the OG image reuses the same layout. Pure.
 */

import {
  axis,
  type Axis,
  type Bastidores,
  type Checkpoint,
  clock,
  type Column,
  type Commit,
  day,
  duration,
  LANES,
  type LaneId,
  PITCH_MS,
  type Run,
  waitEnd,
  workingPerColumn,
} from './data';

export interface CardPiece {
  run: Run;
  lane: number;
  /** Pitch-snapped extent: the pigeonholes the span occupied. */
  from: number;
  to: number;
  /** The exact working time inside it (the time punch). */
  exactFrom: number;
  exactTo: number;
  first: boolean;
  last: boolean;
  /** 1 when it overlaps an earlier card in its lane (drawn 4px down, like stacked T-cards). */
  stack: number;
  /** Encaixe delay, ms. */
  delay: number;
}

export interface Band {
  cp: Checkpoint;
  from: number;
  to: number;
  open: boolean;
  delay: number;
}

export interface Tick {
  x: number;
  label: string;
  strong: boolean;
}

export interface BoardLayout {
  axis: Axis;
  pieces: CardPiece[];
  bands: Band[];
  commits: { commit: Commit; x: number; labelled: boolean }[];
  prompts: { at: string; x: number }[];
  ticks: Tick[];
  working: number[];
  /** Columns under a stop band. */
  stopped: boolean[];
  /** Where the caixa-preta line became bastidores. */
  replacedAt: number | null;
  /** Total encaixe duration, ms. */
  encaixeMs: number;
}

const ms = (iso: string) => Date.parse(iso);
export const laneIndex = (id: LaneId) => LANES.findIndex((l) => l.id === id);

/** The column an instant falls in; an end exactly on a boundary belongs to the column before. */
function columnOf(cols: Column[], t: number, isEnd = false): number {
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const [a, b] = c.kind === 'pitch' ? [c.start, c.start + PITCH_MS] : [c.from, c.to];
    if (isEnd ? t > a && t <= b : t >= a && t < b) return i;
  }
  return isEnd ? cols.length - 1 : 0;
}

const colEnd = (ax: Axis, i: number) => (i + 1 < ax.offsets.length ? ax.offsets[i + 1] : ax.width);

export function layoutBoard(d: Bastidores, cols: Column[]): BoardLayout {
  const ax = axis(cols);
  const pieces: CardPiece[] = [];
  for (const run of d.runs) {
    const lane = laneIndex(run.lane);
    run.spans.forEach(([s, e], k) => {
      const i = columnOf(cols, ms(s));
      const j = Math.max(i, columnOf(cols, ms(e), true));
      pieces.push({
        run,
        lane,
        from: ax.offsets[i],
        to: colEnd(ax, j),
        exactFrom: ax.at(s),
        exactTo: Math.max(ax.at(e), ax.at(s) + 0.04),
        first: k === 0,
        last: k === run.spans.length - 1,
        stack: 0,
        delay: 0,
      });
    });
  }
  pieces.sort((a, b) => a.exactFrom - b.exactFrom || a.lane - b.lane);
  const lastInLane = new Map<number, CardPiece>();
  for (const p of pieces) {
    const prev = lastInLane.get(p.lane);
    if (prev && p.from < prev.to - 1e-9) p.stack = prev.stack === 0 ? 1 : 0;
    if (!prev || p.to >= prev.to) lastInLane.set(p.lane, p);
  }

  const bands: Band[] = d.checkpoints.map((cp) => ({
    cp,
    from: ax.at(cp.at),
    to: ax.at(waitEnd(cp, d.asOf)),
    open: cp.status === 'pendente',
    delay: 0,
  }));

  const stopped = cols.map((c, i) => {
    const a = ax.offsets[i];
    const b = colEnd(ax, i);
    return bands.some((band) => band.from < b && band.to > a && band.to - band.from > 0.2);
  });

  let lastLabel = -Infinity;
  const commits = d.commits.map((commit) => {
    const x = ax.at(commit.at);
    const ok = x - lastLabel >= 3.8;
    if (ok) lastLabel = x;
    return { commit, x, labelled: ok };
  });

  // Clock labels: every half hour, the hour in bold, and the day wherever it changes.
  const ticks: Tick[] = [];
  let lastX = -Infinity;
  let lastDay = '';
  cols.forEach((c, i) => {
    if (c.kind !== 'pitch') return;
    const x = ax.offsets[i];
    const afterBreak = i === 0 || cols[i - 1].kind === 'break';
    const hhmm = clock(c.start);
    const minute = Number(hhmm.slice(3));
    const dd = day(c.start);
    if (!(afterBreak || minute % 30 === 0)) return;
    if (x - lastX < 4.2) return;
    const label = dd !== lastDay ? `${dd} · ${hhmm}` : minute === 0 ? `${hhmm.slice(0, 2)}h` : hhmm;
    ticks.push({ x, label, strong: minute === 0 || dd !== lastDay });
    lastX = x + (dd !== lastDay ? 2.2 : 0);
    lastDay = dd;
  });

  // The caixa-preta line became bastidores where its first bastidores card begins.
  const firstBas = d.runs.find((r) => r.lane === 'bastidores' && !r.label.includes('caixa-preta'));
  const hadCaixa = d.runs.some((r) => r.label.includes('caixa-preta'));
  const replacedAt = hadCaixa && firstBas ? ax.at(firstBas.spans[0][0]) : null;

  // The encaixe: cards slot in by start time, the line holds at every stop.
  const HOLD = 500;
  const holds = bands.length * (HOLD + 420);
  const step = Math.max(8, Math.min(45, (3200 - holds) / Math.max(1, ax.width)));
  const upto = (x: number) => x * step + bands.filter((b) => b.to <= x + 1e-6).length * (HOLD + 420);
  for (const p of pieces) p.delay = Math.round(upto(p.exactFrom));
  for (const b of bands) b.delay = Math.round(b.from * step + bands.filter((o) => o.to <= b.from + 1e-6).length * (HOLD + 420));

  return {
    axis: ax,
    pieces,
    bands,
    commits,
    prompts: d.prompts.map((at) => ({ at, x: ax.at(at) })),
    ticks,
    working: workingPerColumn(d, cols),
    stopped,
    replacedAt,
    encaixeMs: Math.round(ax.width * step + holds),
  };
}

/** What a card says when read aloud or in the run list. */
export function runSummary(r: Run): string {
  const s = ms(r.spans[0][0]);
  const e = ms(r.spans[r.spans.length - 1][1]);
  const lane = LANES.find((l) => l.id === r.lane)!.label;
  const active = r.spans.reduce((a, [x, y]) => a + ms(y) - ms(x), 0);
  return `${r.label}, ${lane}, ${day(s)} ${clock(s)} a ${day(e) === day(s) ? '' : `${day(e)} `}${clock(e)}, ${duration(active)} trabalhando`;
}
