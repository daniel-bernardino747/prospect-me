'use client';

import { useEffect, useRef } from 'react';

import s from './board.module.css';
import { Cell } from './Flaps';
import { flip, prefersReducedMotion } from './flip';

const FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * The board's clock, in Brasília time. The server renders blank flaps (it cannot
 * know when the page is read); the client fills them and flips the digits that
 * change at each minute.
 */
export function Clock() {
  const ref = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cells = [...(ref.current?.querySelectorAll<HTMLElement>('[data-cell]') ?? [])];
    const reduced = prefersReducedMotion();
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = new Date();
      const time = FORMAT.format(now);
      [...time].forEach((g, i) => {
        if (cells[i]) void flip(cells[i], g, reduced ? 0 : 90);
      });
      if (label.current) label.current.textContent = `${time}, horário de Brasília`;
      timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`${s.flaps} ${s.clock}`}>
      <span ref={label} className={s.srOnly} />
      <span ref={ref} className={s.word} aria-hidden="true">
        {['', '', ':', '', ''].map((g, i) => (
          <Cell key={i} glyph={g} />
        ))}
      </span>
      <span className={s.clockLabel} aria-hidden="true">
        Brasília
      </span>
    </span>
  );
}
