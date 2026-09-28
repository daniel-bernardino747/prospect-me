import { describe, expect, it } from 'vitest';

import { tilePaths } from './geometry';

describe('tilePaths', () => {
  const grid = [
    [null, 'CE', 'CE'],
    ['PI', 'PI', 'CE'],
  ];
  const xs = [0, 10, 20, 30];
  const ys = [0, 10, 20];

  it('draws each UF as runs of whole tiles', () => {
    const { ufs } = tilePaths(grid, xs, ys);
    expect(ufs.map((u) => u.uf)).toEqual(['CE', 'PI']);
    expect(ufs[0].d).toBe('M10 0H30V10H10ZM20 10H30V20H20Z');
    expect(ufs[1].d).toBe('M0 10H20V20H0Z');
  });

  it('keeps each UF plate on its own land', () => {
    const { ufs } = tilePaths(grid, xs, ys);
    const pi = ufs.find((u) => u.uf === 'PI')!;
    expect(pi.cy).toBe(15);
  });

  it('draws borders and coast along tile edges only, never the frame', () => {
    const { borders } = tilePaths(grid, xs, ys);
    expect(borders).toContain('M0 10H10'); // sea / PI
    expect(borders).toContain('M10 10H20'); // CE / PI
    expect(borders).toContain('M20 10V20'); // PI / CE
    expect(borders).not.toMatch(/M0 0H30/);
  });

  it('rejects edges that do not match the grid', () => {
    expect(() => tilePaths(grid, [0, 10], ys)).toThrow();
  });
});
