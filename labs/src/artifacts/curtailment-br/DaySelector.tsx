'use client';

import { type KeyboardEvent, type PointerEvent as ReactPointerEvent, useId, useRef, useState } from 'react';

import { dayMonth, gwh } from './data';
import s from './curtailment.module.css';

export interface DayRow {
  date: string;
  cutMwh: number;
  sunday: boolean;
  /** Heat level of the national MW cut, as runs `[start patamar, length, level]`. */
  heat: [number, number, number][];
}

const WEEK = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const weekdayWord = (date: string) => WEEK[new Date(`${date}T12:00:00Z`).getUTCDay()];
const href = (date: string) => `?dia=${date}`;

/**
 * The 55 days as a heatmap, one row per day and one column per half hour. One
 * tab stop: Up/Down moves, Enter opens. A tap picks the nearest row and asks to
 * confirm, since a 7px row is too small a target to navigate on touch. Without
 * JavaScript every row is a plain link.
 */
export function DaySelector({ rows, current, worst }: { rows: DayRow[]; current: string; worst: string[] }) {
  const [active, setActive] = useState(() => Math.max(0, rows.findIndex((r) => r.date === current)));
  const [confirm, setConfirm] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const worstSet = new Set(worst);
  const row = rows[active];

  const pick = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientY - box.top) / box.height) * rows.length);
    setActive(Math.max(0, Math.min(rows.length - 1, i)));
    setConfirm(true);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, Math.min(rows.length - 1, a + (e.key === 'ArrowDown' ? 1 : -1))));
      setConfirm(true);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : rows.length - 1);
      setConfirm(true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      window.location.assign(href(row.date));
    }
  };

  return (
    <div className={s.days}>
      <div className={s.daysFrame}>
        <div className={s.dayLabels} aria-hidden="true">
          {rows.map((r) =>
            r.sunday || r.date === current ? (
              <span
                key={r.date}
                className={s.dayLabel}
                data-current={r.date === current ? '' : undefined}
                style={{ top: `${((rows.indexOf(r) + 0.5) / rows.length) * 100}%` }}
              >
                {dayMonth(r.date)}
                {r.sunday && <span className={s.sundayMark}> D</span>}
              </span>
            ) : null,
          )}
        </div>
        <div
          ref={gridRef}
          className={s.heat}
          role="listbox"
          tabIndex={0}
          aria-label="Dias de 01/08 a 24/09/2026; setas para escolher, Enter para abrir"
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onKey}
          onClickCapture={(e) => {
            // With JS, a tap selects and confirms instead of navigating.
            e.preventDefault();
          }}
          onPointerDown={pick}
        >
          <svg viewBox={`0 0 48 ${rows.length}`} preserveAspectRatio="none" className={s.heatSvg}>
            {rows.map((r, i) => (
              <a key={r.date} href={href(r.date)} tabIndex={-1}>
                <g
                  role="option"
                  id={`${id}-${i}`}
                  aria-selected={i === active}
                  aria-label={`${dayMonth(r.date)}, ${weekdayWord(r.date)}: ${gwh(r.cutMwh)} cortados${r.date === current ? ', no painel' : ''}`}
                >
                  {r.heat.map(([x, n, level]) => (
                    <rect key={x} x={x} y={i} width={n + 0.02} height={1.02} data-heat={level} />
                  ))}
                </g>
              </a>
            ))}
          </svg>
          <span
            className={s.rowMark}
            data-kind="current"
            style={{ top: `${(rows.findIndex((r) => r.date === current) / rows.length) * 100}%`, height: `${100 / rows.length}%` }}
            aria-hidden="true"
          />
          {confirm && active !== rows.findIndex((r) => r.date === current) && (
            <span
              className={s.rowMark}
              data-kind="active"
              style={{ top: `${(active / rows.length) * 100}%`, height: `${100 / rows.length}%` }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className={s.dayTotals} aria-hidden="true">
          {rows.map((r, i) =>
            worstSet.has(r.date) || r.date === current ? (
              <span key={r.date} className={s.dayTotal} style={{ top: `${((i + 0.5) / rows.length) * 100}%` }}>
                {worstSet.has(r.date) && <span className={s.worstTick} />}
                {/* Rows are 7–9px: only the day on the panel carries its number, or neighbours would collide. */}
                {r.date === current && gwh(r.cutMwh).replace(' GWh', '')}
              </span>
            ) : null,
          )}
        </div>
      </div>
      <div className={s.hourAxis} aria-hidden="true">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h30</span>
      </div>
      <p className={s.heatKey}>
        <span className={s.heatKeyLabel}>GW cortados no país, por meia hora:</span>
        {['0', '5', '15', '25', '35+'].map((label, i) => (
          <span key={label} className={s.heatKeyItem}>
            <span className={s.heatSwatch} data-heat={i} aria-hidden="true" />
            {label}
          </span>
        ))}
        <span className={s.heatKeyItem}>
          <span className={s.worstTick} aria-hidden="true" /> os 5 piores dias
        </span>
      </p>
      <p className={s.confirm} aria-live="polite">
        {confirm && row.date !== current ? (
          <a className={s.confirmPlate} href={href(row.date)}>
            Ver {dayMonth(row.date)} ({weekdayWord(row.date)}) · {gwh(row.cutMwh)}
            <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
              <path d="M1.5 6h8M6.5 2.5 10 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </a>
        ) : (
          <span className={s.confirmHint}>
            {confirm ? 'Este é o dia no painel.' : 'Toque numa linha (ou use as setas) para escolher outro dia.'}
          </span>
        )}
      </p>
    </div>
  );
}
