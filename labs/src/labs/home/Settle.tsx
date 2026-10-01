'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { prefersReducedMotion, settle } from './flip';

const SETTLED_KEY = 'labs:board-settled';

/**
 * Runs the board's refresh once per session: every row's cells flip through a
 * few glyphs and land back where the server rendered them. `data-row` marks a row.
 */
export function Settle({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = ref.current;
    if (!board || prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(SETTLED_KEY)) return;
      sessionStorage.setItem(SETTLED_KEY, '1');
    } catch {
      return;
    }
    const rows = [...board.querySelectorAll<HTMLElement>('[data-row]')].map((row) => [
      ...row.querySelectorAll<HTMLElement>('[data-cell]'),
    ]);
    return settle(rows);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
