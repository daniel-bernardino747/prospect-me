'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { CACHE_MAX } from './data';
import { FlapFigure } from './FlapFigure';
import s from './conta.module.css';

const DETENTS = [0, 25, 50, 75, 95];

interface Props {
  variant: 'full' | 'compact';
  value: number;
  onChange: (v: number) => void;
}

const valueText = (v: number) => `${v} por cento da entrada vinda do cache`;

/**
 * The one lever. A native range, restyled: arrows ±1 and Home/End come from the
 * browser; PageUp/PageDown are pinned to ±10 because browsers disagree on them.
 */
export function Fader({ variant, value, onChange }: Props) {
  const id = useId();
  const [detent, setDetent] = useState<number | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    const was = prev.current;
    prev.current = value;
    if (was === value || !DETENTS.includes(value)) return;
    setDetent(value);
    const t = setTimeout(() => setDetent(null), 240);
    return () => clearTimeout(t);
  }, [value]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const step = e.key === 'PageUp' ? 10 : e.key === 'PageDown' ? -10 : 0;
    if (!step) return;
    e.preventDefault();
    onChange(Math.min(CACHE_MAX, Math.max(0, value + step)));
  };

  const full = variant === 'full';
  const ticks = full ? Array.from({ length: CACHE_MAX / 5 + 1 }, (_, i) => i * 5) : [0, 25, 50, 75, 95];

  return (
    <div className={`${s.fader} ${full ? s.faderFull : s.faderCompact}`}>
      <label className={s.faderLabel} htmlFor={id}>
        {full ? 'Cache de entrada' : 'Cache'}
      </label>
      <div className={s.faderReadout}>
        {full ? (
          <FlapFigure value={`${value}%`} width={3} size="sm" surface="sheet" label={`${value}%`} />
        ) : (
          <span className={s.faderReadoutText} aria-hidden="true">
            {value}%
          </span>
        )}
      </div>
      <div className={s.faderTrack} style={{ ['--p' as string]: value / CACHE_MAX }}>
        <input
          id={id}
          className={s.range}
          type="range"
          min={0}
          max={CACHE_MAX}
          step={1}
          value={value}
          aria-label={full ? 'Parte da entrada servida do cache' : 'Cache de entrada, na tabela'}
          aria-valuetext={valueText(value)}
          onChange={(e) => onChange(Number(e.currentTarget.value))}
          onKeyDown={onKeyDown}
        />
        <span className={s.ticks} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className={`${s.tick} ${DETENTS.includes(t) ? s.tickMajor : ''} ${detent === t ? s.tickOn : ''}`}
              style={{ ['--at' as string]: t / CACHE_MAX }}
            >
              {full && DETENTS.includes(t) ? <span className={s.tickLabel}>{t}</span> : null}
            </span>
          ))}
        </span>
      </div>
      {full ? (
        <p className={`${s.faderNote} ${value === CACHE_MAX ? s.faderNoteOn : ''}`} aria-live="polite">
          {value === CACHE_MAX ? '95% é o teto: mesmo com cache, parte da entrada é sempre nova.' : ''}
        </p>
      ) : null}
    </div>
  );
}
