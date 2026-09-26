'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FAST, flip, NORMAL, prefersReducedMotion, settle } from './flap';
import s from './conta.module.css';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const SEPARATORS = new Set(['.', ',']);
const SETTLED_KEY = 'conta-de-tokens:settled';

interface Props {
  /** The figure as shown, e.g. "2.880" or "50%". */
  value: string;
  /** Cells, left-padded with blanks. */
  width: number;
  size: 'lg' | 'sm';
  surface: 'band' | 'sheet';
  /** What a screen reader hears instead of the cells, e.g. "US$ 2.880 por mês". */
  label: string;
  /** Run the first-visit settle (the two plates, once per session). */
  settleOnce?: boolean;
}

/** A figure as split-flap cells: only the cells whose glyph changes flip. */
export function FlapFigure({ value, width, size, surface, label, settleOnce }: Props) {
  const glyphs = value.padStart(width, ' ').split('');
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const prev = useRef(glyphs);
  const lastFlip = useRef(0);
  const [changed, setChanged] = useState(false);

  useIso(() => {
    const before = prev.current;
    prev.current = glyphs;
    const reduced = prefersReducedMotion();
    const diff = glyphs.map((g, i) => (g !== before[i] && before.length === glyphs.length ? i : -1)).filter((i) => i >= 0);
    if (!diff.length && before.join('') === glyphs.join('')) return;
    if (reduced) {
      setChanged(true);
      const t = setTimeout(() => setChanged(false), 600);
      return () => clearTimeout(t);
    }
    // Consecutive-frame changes (a drag) get the short flip.
    const now = performance.now();
    const timing = now - lastFlip.current < 120 ? FAST : NORMAL;
    lastFlip.current = now;
    diff.forEach((i, k) => {
      const cell = cells.current[i];
      if (cell) void flip(cell, before[i], glyphs[i], { ...timing, delay: k * 22 });
    });
  }, [glyphs.join('')]);

  useEffect(() => {
    if (!settleOnce || prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(SETTLED_KEY)) return;
      sessionStorage.setItem(SETTLED_KEY, '1');
    } catch {
      return;
    }
    return settle(
      cells.current.filter((c): c is HTMLSpanElement => c !== null),
      glyphs,
    );
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      className={`${s.flap} ${size === 'lg' ? s.flapLg : s.flapSm} ${surface === 'band' ? s.onBand : s.onSheet} ${changed ? s.flapChanged : ''}`}
    >
      <span className={s.srOnly}>{label}</span>
      <span className={s.cells} aria-hidden="true">
        {glyphs.map((g, i) => {
          const blank = g === ' ' ? 'true' : 'false';
          return (
            <span
              key={i}
              ref={(el) => {
                cells.current[i] = el;
              }}
              className={`${s.cell} ${SEPARATORS.has(g) ? s.cellSep : ''}`}
            >
              <span className={`${s.face} ${s.up}`} data-blank={blank}>
                <span>{g === ' ' ? '' : g}</span>
              </span>
              <span className={`${s.face} ${s.lo}`} data-blank={blank}>
                <span>{g === ' ' ? '' : g}</span>
              </span>
              <span className={`${s.face} ${s.up} ${s.ov}`} data-l="next">
                <span />
              </span>
              <span className={`${s.face} ${s.lo} ${s.ov}`} data-l="old">
                <span />
              </span>
              <span className={`${s.face} ${s.up} ${s.ov} ${s.ovTop}`} data-l="fall">
                <span />
              </span>
              <span className={`${s.face} ${s.lo} ${s.ov} ${s.ovTop}`} data-l="land">
                <span />
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
