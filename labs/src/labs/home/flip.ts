/**
 * Split-flap mechanics for the home page's board, on the DOM. A cell shows its
 * glyph twice: once on the base, once on an upper leaf hinged at the middle.
 * A flip paints the new glyph on the base and lets the leaf, still carrying the
 * old one, fall away around the hinge.
 */

const FALL = 'cubic-bezier(0.55, 0, 1, 0.45)';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

function glyphs(cell: HTMLElement) {
  const base = cell.firstElementChild as HTMLElement | null;
  const leaf = cell.querySelector<HTMLElement>('[data-leaf]');
  const leafGlyph = leaf?.firstElementChild as HTMLElement | null;
  return base && leaf && leafGlyph ? { base, leaf, leafGlyph } : null;
}

/** One flip from the glyph a cell shows to `to`; resolves when the leaf is down. */
export function flip(cell: HTMLElement, to: string, duration = 80): Promise<void> {
  const g = glyphs(cell);
  const from = g?.base.textContent ?? '';
  if (!g || from === to) return Promise.resolve();
  g.leafGlyph.textContent = from;
  g.base.textContent = to;
  cell.dataset.glyph = to;
  if (typeof g.leaf.animate !== 'function') return Promise.resolve();
  const fall = g.leaf.animate(
    [
      { opacity: 1, transform: 'perspective(240px) rotateX(0deg)' },
      { opacity: 1, transform: 'perspective(240px) rotateX(-90deg)' },
    ],
    { duration, easing: FALL },
  );
  return fall.finished.then(
    () => undefined,
    () => undefined,
  );
}

/**
 * The board refreshing: each cell runs through a few glyphs of its own kind and
 * settles back on the one it already showed, so the text is never hidden. Rows
 * start one after another; returns a cancel function.
 */
export function settle(rows: readonly HTMLElement[][], rowGap = 110, cellGap = 14): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const targets = new Map(rows.flat().map((cell) => [cell, cell.dataset.glyph ?? '']));
  rows.forEach((cells, r) => {
    cells.forEach((cell, i) => {
      const target = targets.get(cell) ?? '';
      const pool = DIGITS.includes(target) ? DIGITS : LETTERS.includes(target) ? LETTERS : '';
      if (!pool) return;
      const steps = [...Array.from({ length: 3 }, () => pool[Math.floor(Math.random() * pool.length)]), target];
      timers.push(
        setTimeout(
          async () => {
            for (const step of steps) {
              if (cancelled) return;
              await flip(cell, step, 70);
            }
          },
          r * rowGap + i * cellGap,
        ),
      );
    });
  });
  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
    // Whatever step a cell was on, it ends on the glyph it started with.
    targets.forEach((target, cell) => {
      const g = glyphs(cell);
      if (!g) return;
      g.leaf.getAnimations().forEach((a) => a.finish());
      g.base.textContent = target;
      g.leafGlyph.textContent = target;
      cell.dataset.glyph = target;
    });
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
