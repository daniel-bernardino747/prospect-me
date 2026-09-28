/**
 * The split-flap mechanics, on the DOM, with the Web Animations API. A cell has
 * two base halves (rendered by React with the current glyph) and four overlay
 * halves this module drives:
 *
 *   next  upper, new glyph   covers the base while a settle runs through digits
 *   old   lower, old glyph   stays until the new lower half lands on it
 *   fall  upper, old glyph   rotates away around the hinge, revealing `next`
 *   land  lower, new glyph   rotates down from the hinge onto `old`
 *
 * Overlays are transparent at rest (CSS), so when every animation is done the
 * base halves, which already hold the new glyph, are what shows.
 */

const EASE_FALL = 'cubic-bezier(0.55, 0, 1, 0.45)';
const EASE_LAND = 'cubic-bezier(0.2, 0.9, 0.3, 1.2)';
const PERSPECTIVE = 'perspective(300px)';

export interface FlipTiming {
  delay: number;
  fall: number;
  land: number;
}

export const NORMAL: FlipTiming = { delay: 0, fall: 70, land: 90 };
export const FAST: FlipTiming = { delay: 0, fall: 40, land: 50 };

interface Layers {
  next: HTMLElement;
  old: HTMLElement;
  fall: HTMLElement;
  land: HTMLElement;
}

const running = new WeakMap<HTMLElement, Animation[]>();

function layers(cell: HTMLElement): Layers | null {
  const get = (name: string) => cell.querySelector<HTMLElement>(`[data-l="${name}"]`);
  const next = get('next');
  const old = get('old');
  const fall = get('fall');
  const land = get('land');
  return next && old && fall && land ? { next, old, fall, land } : null;
}

function paint(el: HTMLElement, glyph: string) {
  el.dataset.blank = glyph === ' ' ? 'true' : 'false';
  const g = el.firstElementChild as HTMLElement | null;
  if (g) g.textContent = glyph === ' ' ? '' : glyph;
}

/** Ends any flip in flight on this cell at its final state: a new value never queues. */
export function finish(cell: HTMLElement) {
  for (const a of running.get(cell) ?? []) a.finish();
  running.delete(cell);
}

/** One flip from `from` to `to`; resolves when the new lower half has landed. */
export function flip(cell: HTMLElement, from: string, to: string, t: FlipTiming): Promise<void> {
  finish(cell);
  const l = layers(cell);
  if (!l || typeof cell.animate !== 'function') return Promise.resolve();
  paint(l.next, to);
  paint(l.old, from);
  paint(l.fall, from);
  paint(l.land, to);

  const total = t.delay + t.fall + t.land;
  const hold = (el: HTMLElement) => el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: total });
  const fallStart = t.delay / (t.delay + t.fall);
  const anims = [
    hold(l.next),
    hold(l.old),
    l.fall.animate(
      [
        { offset: 0, opacity: 1, transform: `${PERSPECTIVE} rotateX(0deg)` },
        { offset: fallStart, opacity: 1, transform: `${PERSPECTIVE} rotateX(0deg)`, easing: EASE_FALL },
        { offset: 1, opacity: 1, transform: `${PERSPECTIVE} rotateX(-90deg)` },
      ],
      { duration: t.delay + t.fall },
    ),
    l.land.animate(
      [
        { opacity: 1, transform: `${PERSPECTIVE} rotateX(90deg)` },
        { opacity: 1, transform: `${PERSPECTIVE} rotateX(0deg)` },
      ],
      { duration: t.land, delay: t.delay + t.fall, easing: EASE_LAND, fill: 'backwards' },
    ),
  ];
  running.set(cell, anims);
  return Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
}

const DIGITS = '0123456789';

/**
 * The first-visit settle: from blank through three random digits to the value,
 * 160ms a step. Separators and blanks do not spin. Returns a cancel function.
 */
export function settle(cells: readonly HTMLElement[], glyphs: readonly string[], stagger = 40): () => void {
  let cancelled = false;
  cells.forEach((cell, i) => {
    const target = glyphs[i];
    if (!DIGITS.includes(target)) return;
    const steps = [' ', ...Array.from({ length: 3 }, () => DIGITS[Math.floor(Math.random() * 10)]), target];
    const l = layers(cell);
    if (!l) return;
    // Blank until this cell's turn.
    paint(l.next, ' ');
    paint(l.old, ' ');
    l.next.style.opacity = '1';
    l.old.style.opacity = '1';
    const run = async () => {
      await new Promise((r) => setTimeout(r, i * stagger));
      for (let k = 1; k < steps.length && !cancelled; k++) {
        await flip(cell, steps[k - 1], steps[k], { delay: 0, fall: 70, land: 90 });
        if (k === 1) {
          l.next.style.opacity = '';
          l.old.style.opacity = '';
        }
      }
      l.next.style.opacity = '';
      l.old.style.opacity = '';
    };
    void run();
  });
  return () => {
    cancelled = true;
    cells.forEach((c) => {
      finish(c);
      const l = layers(c);
      if (l) {
        l.next.style.opacity = '';
        l.old.style.opacity = '';
      }
    });
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
