/**
 * The mimic board's tiles, from a grid of cells already assigned to a UF (or to
 * the sea) and the projected edges of its columns and rows. Pure: the fetch
 * script does the projection and the point-in-state tests with d3-geo, and this
 * turns the result into the few SVG paths the page draws, with no d3 shipped.
 */
import type { MapGeometry } from './data';

/** `grid[row][col]`: a UF code, or null for sea. Rows run north to south. */
export type Grid = (string | null)[][];

const n = (v: number) => String(Math.round(v * 100) / 100);

export function tilePaths(grid: Grid, xs: readonly number[], ys: readonly number[]): Omit<MapGeometry, 'width' | 'height' | 'rail'> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (xs.length !== cols + 1 || ys.length !== rows + 1) throw new Error('edges do not match the grid');
  if (grid.some((row) => row.length !== cols)) throw new Error('ragged grid');

  // One path per UF: each row's runs of that UF as rectangles.
  const parts = new Map<string, string[]>();
  const cells = new Map<string, [number, number][]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; ) {
      const uf = grid[r][c];
      let e = c + 1;
      while (e < cols && grid[r][e] === uf) e++;
      if (uf) {
        const list = parts.get(uf) ?? [];
        list.push(`M${n(xs[c])} ${n(ys[r])}H${n(xs[e])}V${n(ys[r + 1])}H${n(xs[c])}Z`);
        parts.set(uf, list);
        const own = cells.get(uf) ?? [];
        for (let k = c; k < e; k++) own.push([r, k]);
        cells.set(uf, own);
      }
      c = e;
    }
  }

  const ufs = [...parts.keys()].sort().map((uf) => {
    const own = cells.get(uf)!;
    const centre = ([r, c]: [number, number]) => [(xs[c] + xs[c + 1]) / 2, (ys[r] + ys[r + 1]) / 2];
    const mx = own.reduce((s, cell) => s + centre(cell)[0], 0) / own.length;
    const my = own.reduce((s, cell) => s + centre(cell)[1], 0) / own.length;
    // The UF's own cell nearest its mean: a concave state keeps its plate on its land.
    let best = own[0];
    let bestD = Infinity;
    for (const cell of own) {
      const [x, y] = centre(cell);
      const d = (x - mx) ** 2 + (y - my) ** 2;
      if (d < bestD) [best, bestD] = [cell, d];
    }
    const [cx, cy] = centre(best);
    return { uf, d: parts.get(uf)!.join(''), cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10 };
  });

  // Borders and coast: cell edges whose two sides differ and touch land; the
  // frame's own edges are not a border (the land goes on past them).
  const segs: string[] = [];
  for (let r = 1; r < rows; r++) {
    for (let c = 0; c < cols; ) {
      if (grid[r - 1][c] === grid[r][c]) { c++; continue; }
      let e = c + 1;
      while (e < cols && grid[r - 1][e] !== grid[r][e] && grid[r - 1][e] === grid[r - 1][c] && grid[r][e] === grid[r][c]) e++;
      segs.push(`M${n(xs[c])} ${n(ys[r])}H${n(xs[e])}`);
      c = e;
    }
  }
  for (let c = 1; c < cols; c++) {
    for (let r = 0; r < rows; ) {
      if (grid[r][c - 1] === grid[r][c]) { r++; continue; }
      let e = r + 1;
      while (e < rows && grid[e][c - 1] !== grid[e][c] && grid[e][c - 1] === grid[r][c - 1] && grid[e][c] === grid[r][c]) e++;
      segs.push(`M${n(xs[c])} ${n(ys[r])}V${n(ys[e])}`);
      r = e;
    }
  }

  const seams = [
    ...xs.slice(1, -1).map((x) => `M${n(x)} ${n(ys[0])}V${n(ys[rows])}`),
    ...ys.slice(1, -1).map((y) => `M${n(xs[0])} ${n(y)}H${n(xs[cols])}`),
  ].join('');

  return { ufs, borders: segs.join(''), seams };
}
