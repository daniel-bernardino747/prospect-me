'use client';

import { type KeyboardEvent, type PointerEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { type Band, type ContaDeTokens, monthTicks, sharePct, weekLabel } from './data';
import s from './conta.module.css';

interface Props {
  data: Pick<ContaDeTokens, 'weeks'>;
  bands: Band[];
}

const LABEL_GAP = 14;

const fillOf = (b: Band, pid: string) =>
  b.tone === 'ink'
    ? 'var(--leader)'
    : b.tone === 'ref'
      ? 'var(--marca)'
      : b.tone === 'outros'
        ? `url(#${pid}-outros)`
        : b.shade >= 5
          ? `url(#${pid}-hatch${b.shade})`
          : `var(--band-${b.shade})`;

/** The swatch colour behind a pattern, for the legend. */
const swatchOf = (b: Band) =>
  b.tone === 'ink' ? 'var(--leader)' : b.tone === 'ref' ? 'var(--marca)' : b.tone === 'outros' ? 'var(--band-outros)' : `var(--band-${b.shade})`;

const shareOrDash = (v: number) => (v > 0 ? sharePct(v) : '—');

/** Spreads label centres at least `gap` apart, inside [min, max], keeping their order. */
export function spread(ys: number[], gap: number, min: number, max: number): number[] {
  const out = ys.map((y) => Math.min(max, Math.max(min, y)));
  for (let i = 1; i < out.length; i++) if (out[i] - out[i - 1] < gap) out[i] = out[i - 1] + gap;
  const over = out.at(-1)! - max;
  if (over > 0) {
    out[out.length - 1] = max;
    for (let i = out.length - 2; i >= 0; i--) if (out[i + 1] - out[i] < gap) out[i] = out[i + 1] - gap;
  }
  return out;
}

/**
 * "Onde o mercado gasta": each week's tokens as a 100% stacked, stepped area,
 * bottom-up by last-week share. Drawn in real pixels (measured), so hatches and
 * dots never stretch.
 */
export function MarketChart({ data, bands }: Props) {
  const pid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 322, h: 260 });
  const n = data.weeks.length;
  const [week, setWeek] = useState(n - 1);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const cw = w / n;

  // Cumulative bottoms per band per week, bottom-up.
  const stacks = useMemo(() => {
    const base = data.weeks.map(() => 0);
    return bands.map((b) => {
      const lo = [...base];
      b.shares.forEach((v, i) => (base[i] += v));
      return { band: b, lo, hi: [...base] };
    });
  }, [bands, data.weeks]);

  const y = (v: number) => h - Math.min(1, v) * h;

  const pathOf = (lo: number[], hi: number[]) => {
    let d = `M0 ${y(hi[0])}`;
    for (let i = 0; i < n; i++) d += ` H${(i + 1) * cw} ${i < n - 1 ? `V${y(hi[i + 1])}` : ''}`;
    d += ` V${y(lo[n - 1])}`;
    for (let i = n - 1; i >= 0; i--) d += ` H${i * cw} ${i > 0 ? `V${y(lo[i - 1])}` : ''}`;
    return `${d} Z`;
  };

  const lastMid = stacks.map((st) => (y(st.lo[n - 1]) + y(st.hi[n - 1])) / 2);
  const labelYs = spread([...lastMid].reverse(), LABEL_GAP, 6, h - 6).reverse();

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setWeek(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n))));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setWeek(e.key === 'Home' ? 0 : n - 1);
      return;
    }
    if (!d) return;
    e.preventDefault();
    setWeek((wk) => Math.max(0, Math.min(n - 1, wk + d)));
  };

  if (n < 2) {
    return (
      <div className={s.chartEmpty}>
        <p className={s.signage}>Série indisponível</p>
        <p>Não há semanas suficientes nos dados para desenhar a participação. A tabela ao lado continua valendo.</p>
      </div>
    );
  }

  const wk = data.weeks[week];
  const top = [...stacks].reverse();
  const readout = top.map((st) => `${st.band.label} ${shareOrDash(st.band.shares[week])}`).join(', ');
  const rightSide = week < n / 2;

  return (
    <div className={s.chart}>
      <div className={s.chartFrame}>
        <div className={s.yAxis} aria-hidden="true">
          <span style={{ top: 0 }}>100%</span>
          <span style={{ top: '50%' }}>50%</span>
          <span style={{ top: '100%' }}>0</span>
        </div>
        <div
          ref={plotRef}
          className={s.plot}
          tabIndex={0}
          role="group"
          aria-label={`Participação semanal por fornecedor, ${n} semanas. Setas mudam a semana.`}
          onPointerMove={pick}
          onPointerDown={(e) => {
            pick(e);
            setActive(true);
          }}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onKeyDown={onKey}
        >
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={s.svg} aria-hidden="true">
            <defs>
              {[5, 6].map((shade) => (
                <pattern key={shade} id={`${pid}-hatch${shade}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="5" height="5" style={{ fill: `var(--band-${shade})` }} />
                  <line x1="0" y1="0" x2="0" y2="5" style={{ stroke: 'var(--ink)', strokeOpacity: 0.14 }} strokeWidth="1" />
                </pattern>
              ))}
              {/* "Outros" has to read as data, never as the empty plot behind it: a
                  solid steel, hatched against the other bands' direction. */}
              <pattern id={`${pid}-outros`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect width="5" height="5" style={{ fill: 'var(--band-outros)' }} />
                <line x1="0" y1="0" x2="0" y2="5" style={{ stroke: 'var(--ink)', strokeOpacity: 0.25 }} strokeWidth="1" />
              </pattern>
            </defs>
            {stacks.map((st) => (
              <path
                key={st.band.slug}
                d={pathOf(st.lo, st.hi)}
                style={{
                  fill: fillOf(st.band, pid),
                  stroke: 'var(--ground)',
                  strokeWidth: 1,
                }}
              />
            ))}
            {stacks
              .filter((st) => st.band.tone === 'ref')
              .map((st) => (
                <path key="ref-outline" d={pathOf(st.lo, st.hi)} style={{ fill: 'none', stroke: 'var(--marca-deep)', strokeWidth: 1 }} />
              ))}
            {/* The stack always ends at 100%; its top edge is drawn so it never looks cut short. */}
            <line x1="0" x2={w} y1="0.5" y2="0.5" style={{ stroke: 'var(--rule-strong)' }} strokeWidth="1" />
            {[0.5].map((g) => (
              <line key={g} x1="0" x2={w} y1={y(g)} y2={y(g)} style={{ stroke: 'var(--ground)', strokeOpacity: 0.7 }} strokeDasharray="2 3" />
            ))}
            <line x1={(week + 0.5) * cw} x2={(week + 0.5) * cw} y1="0" y2={h} style={{ stroke: 'var(--ink)' }} strokeWidth="1" />
            <line x1={(week + 0.5) * cw} x2={(week + 0.5) * cw} y1="0" y2={h} style={{ stroke: 'var(--ground)' }} strokeWidth="1" transform="translate(1 0)" />
          </svg>
          <div
            className={`${s.floatReadout} ${active ? s.floatReadoutOn : ''}`}
            style={rightSide ? { left: `calc(${((week + 1) / n) * 100}% + 8px)` } : { right: `calc(${((n - week) / n) * 100}% + 8px)` }}
            aria-hidden="true"
          >
            <p className={s.readoutTitle}>Semana de {weekLabel(wk)}</p>
            <ul>
              {top.map((st) => (
                <li key={st.band.slug}>
                  <span>{st.band.label}</span>
                  <span className={s.data}>{shareOrDash(st.band.shares[week])}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ul className={s.directLabels} aria-hidden="true">
          {stacks.map((st, i) => (
            <li key={st.band.slug} style={{ top: labelYs[i] }} className={st.band.tone === 'ref' ? s.directRef : ''}>
              <svg className={s.leaderLine} width="12" height="2" viewBox="0 0 12 2" aria-hidden="true">
                <line x1="0" y1="1" x2="12" y2="1" />
              </svg>
              <span className={s.signage}>{st.band.label}</span> <span className={s.data}>{shareOrDash(st.band.shares[week])}</span>
            </li>
          ))}
        </ul>
        <div className={s.xAxis} aria-hidden="true">
          {monthTicks(data.weeks).map((t) => (
            <span key={t.index} style={{ left: `${(t.index / n) * 100}%` }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <p className={s.srOnly} aria-live="polite">
        Semana de {weekLabel(wk)}: {readout}.
      </p>
      <div className={s.legend}>
        <p className={s.readoutTitle}>
          Semana de {weekLabel(wk)}
          {week === n - 1 ? ' (a última)' : ''}
        </p>
        <ul>
          {top.map((st) => (
            <li key={st.band.slug} className={st.band.tone === 'ref' ? s.legendRef : ''}>
              <svg className={s.swatch} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <rect width="12" height="12" style={{ fill: fillOf(st.band, pid) === swatchOf(st.band) ? swatchOf(st.band) : fillOf(st.band, pid) }} />
                <rect x="0.5" y="0.5" width="11" height="11" style={{ fill: 'none', stroke: 'var(--rule-strong)' }} />
              </svg>
              <span className={s.signage}>{st.band.label}</span>
              <span className={s.data}>{shareOrDash(st.band.shares[week])}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
