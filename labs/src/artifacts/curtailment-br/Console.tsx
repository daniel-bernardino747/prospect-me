'use client';

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  type BoardDay,
  type DecodedPoint,
  decodePoints,
  lampFrame,
  offMap,
  pulses,
  stepBand,
  stepLine,
} from './board';
import { engrave, type Glass, gwh, hourClock, hourProse, mw, PATAMARES, substation } from './data';
import { LampGlyph } from './LampGlyph';
import s from './curtailment.module.css';

const STEP_MS = 250;
const STEP_MS_REDUCED = 500;
const POOL = 12;
const LIVE_EVERY = 6;
/**
 * Desktop crops the board to where it has lamps: the plate rail on top (the
 * legend lives in the margin column there) and the empty west band. Paracatu
 * (MG) is the westernmost lamp, at x = 64 with a bezel of at most 13.
 */
const CROP_WEST = 48;
/** States listed by name under POR ESTADO; the rest fold into one row. */
const UF_ROWS = 6;

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

const pct = (share: number) => `${Math.round(share * 100)}%`;
const f0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const f1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Day energy for a point: GWh with one decimal, MWh below 100 MWh so nothing reads as "0,0 GWh". */
const energy = (mwh: number) => (mwh >= 100 ? gwh(mwh) : mwh > 0 ? `${f0.format(Math.max(1, mwh))} MWh` : '0 MWh');
const sourceWord = (source: 'eol' | 'fv') => (source === 'eol' ? 'EÓLICA' : 'SOLAR');

interface Props {
  board: BoardDay;
  head: ReactNode;
  deck: ReactNode;
  reasons: ReactNode;
  share: ReactNode;
}

export function Console({ board, head, deck, reasons, share }: Props) {
  const points = useMemo(() => decodePoints(board), [board]);
  const onMap = useMemo(() => points.map((p, j) => ({ p, j })).filter((x) => x.p.x !== null), [points]);
  const { width: W, height: H, rail } = board.map;

  const [t, setT] = useState(board.peak);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [flash, setFlash] = useState<number[]>(() => board.windows.map(() => 0));
  const [live, setLive] = useState('');

  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const wide = useMedia('(min-width: 64rem)');
  const mounted = useMounted();

  const tRef = useRef(t);
  tRef.current = t;
  const playingRef = useRef(false);
  playingRef.current = playing;
  const touched = useRef(false);
  const played = useRef(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const glassEls = useRef<(SVGCircleElement | null)[]>([]);
  const litEls = useRef<(SVGCircleElement | null)[]>([]);
  const fleckEls = useRef<(SVGCircleElement | null)[]>([]);
  const barEls = useRef<(SVGLineElement | null)[]>([]);
  const pulseEls = useRef<(SVGCircleElement | null)[]>([]);

  const ids = useId();
  const recorderId = `${ids}-recorder`;
  const tagTitleId = `${ids}-tag`;

  // ---------------------------------------------------------------------------
  // Painting the lamps: attributes set directly, so 240 lamps update in one paint.

  const paint = useCallback(
    (at: number, f: number) => {
      for (const { p, j } of onMap) {
        const fr = lampFrame(p, board, at, f);
        glassEls.current[j]?.setAttribute('r', fr.rg.toFixed(2));
        const lit = litEls.current[j];
        if (lit) {
          lit.setAttribute('r', fr.rc.toFixed(2));
          lit.setAttribute('data-glass', fr.glass ?? 'none');
        }
        const fleck = fleckEls.current[j];
        if (fleck) {
          const on = fr.rc >= 4;
          fleck.setAttribute('r', on ? (0.28 * fr.rc).toFixed(2) : '0');
          fleck.setAttribute('cx', (-0.3 * fr.rc).toFixed(2));
          fleck.setAttribute('cy', (-0.3 * fr.rc).toFixed(2));
        }
        const bar = barEls.current[j];
        if (bar) {
          const on = fr.glass === 'rede' && fr.rc >= 3;
          const half = on ? 0.7 * fr.rc : 0;
          bar.setAttribute('x1', (-half).toFixed(2));
          bar.setAttribute('x2', half.toFixed(2));
        }
      }
    },
    [board, onMap],
  );

  useLayoutEffect(() => {
    if (!playingRef.current) paint(t, 0);
  }, [t, paint]);

  const firePulses = useCallback(
    (at: number) => {
      const chosen = pulses(points, board.k, at, POOL);
      chosen.forEach((j, n) => {
        const el = pulseEls.current[n];
        const p = points[j];
        if (!el || p.x === null) return;
        const glass = lampFrame(p, board, Math.min(PATAMARES - 1, at + 1)).glass ?? 'sobra';
        el.setAttribute('cx', String(p.x));
        el.setAttribute('cy', String(p.y));
        el.setAttribute('r', p.rb.toFixed(2));
        el.setAttribute('data-glass', glass);
        el.animate(
          [
            { transform: 'scale(1)', opacity: 0.6 },
            { transform: `scale(${((p.rb + 6) / p.rb).toFixed(3)})`, opacity: 0 },
          ],
          { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
        );
      });
    },
    [board, points],
  );

  // ---------------------------------------------------------------------------
  // Replay

  useEffect(() => {
    if (!playing) return;
    const step = reduced ? STEP_MS_REDUCED : STEP_MS;
    const from = tRef.current;
    const t0 = performance.now();
    let last = from;
    let raf = 0;
    if (!reduced) firePulses(from);
    const tick = (now: number) => {
      const pos = from + (now - t0) / step;
      if (pos >= PATAMARES - 1) {
        paint(PATAMARES - 1, 0);
        setT(PATAMARES - 1);
        setPlaying(false);
        return;
      }
      const at = Math.floor(pos);
      if (at !== last) {
        last = at;
        setT(at);
        if (!reduced) firePulses(at);
      }
      paint(at, reduced ? 0 : pos - at);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, paint, firePulses]);

  // Annunciator: a window that lights between patamares flashes (ISA-18.1), then holds.
  const prevT = useRef(t);
  useEffect(() => {
    const before = prevT.current;
    prevT.current = t;
    if (before === t || reduced) return;
    const newly = board.windows.map((w) => !w.glassAt[before] && Boolean(w.glassAt[t]));
    if (newly.some(Boolean)) setFlash((f) => f.map((k, i) => (newly[i] ? k + 1 : k)));
  }, [t, board.windows, reduced]);

  // Live region: on every scrub, every 3h while playing.
  useEffect(() => {
    if (playing && t % LIVE_EVERY !== 0) return;
    const cut = board.sobraMw[t] + board.redeMw[t];
    const ref = board.refMw[t];
    const active = board.windows.filter((w) => w.glassAt[t]).length;
    setLive(
      `${hourProse(t)}: ${f0.format(cut)} megawatts cortados${ref > 0 ? `, ${pct(cut / ref)} do possível` : ''}; ${active} ${
        active === 1 ? 'restrição ativa' : 'restrições ativas'
      }.`,
    );
  }, [t, playing, board]);

  // ---------------------------------------------------------------------------
  // Entrance: the lamp test, east to west, once, only if nobody has touched the board.

  useEffect(() => {
    const el = mapRef.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (touched.current || document.hidden) return;
        for (const { p, j } of onMap) {
          const lit = litEls.current[j];
          if (!lit || Number(lit.getAttribute('r')) <= 0) continue;
          const delay = (1 - p.x! / W) * 360;
          const off = [{ opacity: 0 }, { opacity: 0 }];
          lit.animate(off, { duration: 120, delay });
          fleckEls.current[j]?.animate(off, { duration: 120, delay });
          barEls.current[j]?.animate(off, { duration: 120, delay });
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onMap, reduced, W]);

  // ---------------------------------------------------------------------------
  // Controls

  const touch = () => {
    touched.current = true;
  };

  const togglePlay = () => {
    touch();
    setExpanded(true);
    if (playing) {
      setPlaying(false);
      return;
    }
    // The first play tells the day from midnight; after that it resumes, and from the end it restarts.
    if (!played.current || t >= PATAMARES - 1) setT(0);
    played.current = true;
    setPlaying(true);
  };

  const seek = (at: number) => {
    touch();
    setPlaying(false);
    setT(Math.max(0, Math.min(PATAMARES - 1, at)));
  };

  const openRecorder = () => {
    touch();
    setExpanded(true);
    requestAnimationFrame(() => rangeRef.current?.focus());
  };

  const onDockKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'k' || e.key === 'K' || (e.key === ' ' && target.tagName === 'INPUT')) {
      e.preventDefault();
      togglePlay();
    }
  };

  const onRangeKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      seek(t + (e.key === 'PageUp' ? 6 : -6));
    }
  };

  const paperDrag = useRef(false);
  const seekFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    seek(Math.floor(((e.clientX - box.left) / box.width) * PATAMARES));
  };

  // ---------------------------------------------------------------------------
  // Map picking

  const nearest = (clientX: number, clientY: number, minPx: number, pad: number): number | null => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    const unitsPerPx = W / svg.getBoundingClientRect().width;
    let best: number | null = null;
    let bestD = Infinity;
    for (const { p, j } of onMap) {
      const d = Math.hypot(p.x! - pt.x, p.y! - pt.y);
      if (d <= Math.max(p.rb + pad, minPx * unitsPerPx) && d < bestD) {
        best = j;
        bestD = d;
      }
    }
    return best;
  };

  const onMapClick = (e: ReactMouseEvent<SVGSVGElement>) => {
    const j = nearest(e.clientX, e.clientY, 22, 0);
    touch();
    setSelected((cur) => (j === null || cur === j ? null : j));
  };

  const onMapMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== 'mouse') return;
    setHover(nearest(e.clientX, e.clientY, 6, 2));
  };

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  const toggleWindow = (i: number) => {
    touch();
    setHighlight((cur) => (cur === i ? null : i));
    if (!wide && highlight !== i) {
      mapRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  // ---------------------------------------------------------------------------
  // Derived for render

  const initial = board.peak;
  const cut = board.sobraMw[t] + board.redeMw[t];
  const ref = board.refMw[t];
  const hi = highlight === null ? null : board.windows[highlight];
  const hiSet = useMemo(() => new Set(hi?.points ?? []), [hi]);
  const offRows = useMemo(() => offMap(points, board.restrictions, t), [points, board.restrictions, t]);
  const top20 = useMemo(
    () =>
      points
        .map((p, j) => ({ p, j }))
        .filter((x) => x.p.cutMwh > 0)
        .sort((a, b) => b.p.cutMwh - a.p.cutMwh)
        .slice(0, 20),
    [points],
  );
  const ufPlates = useMemo(() => {
    const onMapByUf = new Map<string, number>();
    for (const { p } of onMap) onMapByUf.set(p.uf, (onMapByUf.get(p.uf) ?? 0) + p.cutMwh);
    return board.map.ufs.filter((u) => onMapByUf.has(u.uf)).map((u) => ({ ...u, mwh: onMapByUf.get(u.uf)! }));
  }, [onMap, board.map.ufs]);
  const ufNow = useMemo(() => {
    const all = Object.entries(board.ufMw)
      .map(([uf, v]) => ({ uf, now: v[t], day: board.byUf[uf] ?? 0 }))
      .sort((a, b) => b.day - a.day);
    if (all.length <= UF_ROWS + 1) return { rows: all, rest: null };
    const rest = all.slice(UF_ROWS);
    return {
      rows: all.slice(0, UF_ROWS),
      rest: { n: rest.length, now: rest.reduce((s, u) => s + u.now, 0), day: rest.reduce((s, u) => s + u.day, 0) },
    };
  }, [board.ufMw, board.byUf, t]);

  // Lamps render once per day and highlight; the replay moves them by attribute, not by React.
  const lampNodes = useMemo(
    () =>
      onMap.map(({ p, j }) => {
          const fr = lampFrame(p, board, initial);
          const bar = fr.glass === 'rede' && fr.rc >= 3 ? 0.7 * fr.rc : 0;
          // One translated group per lamp, its parts at the origin and styled by
          // position (bezel, glass, lit, fleck, bar), so 240 lamps stay light in the HTML.
          return (
            <g key={p.id} transform={`translate(${p.x} ${p.y})`} data-on={hi && hiSet.has(p.i) ? '' : undefined}>
              <circle r={p.rb.toFixed(2)} />
              <circle ref={(el) => void (glassEls.current[j] = el)} r={fr.rg.toFixed(2)} />
              <circle ref={(el) => void (litEls.current[j] = el)} r={fr.rc.toFixed(2)} data-glass={fr.glass ?? 'none'} />
              <circle
                ref={(el) => void (fleckEls.current[j] = el)}
                cx={(-0.3 * fr.rc).toFixed(2)}
                cy={(-0.3 * fr.rc).toFixed(2)}
                r={fr.rc >= 4 ? (0.28 * fr.rc).toFixed(2) : 0}
              />
              <line ref={(el) => void (barEls.current[j] = el)} x1={(-bar).toFixed(2)} x2={bar.toFixed(2)} />
            </g>
          );
      }),
    [onMap, board, initial, hi, hiSet],
  );

  const sel = selected === null ? null : points[selected];
  const hov = hover === null ? null : points[hover];

  const tag = sel && (
    <PointTag
      point={sel}
      board={board}
      t={t}
      titleId={tagTitleId}
      onClose={() => setSelected(null)}
      reduced={reduced}
    />
  );

  return (
    <div className={s.console} data-expanded={expanded || undefined}>
      <div className={s.head}>{head}</div>

      <section className={s.panel} aria-label="Painel do dia: mapa do corte por ponto">
        <div
          className={s.mapWrap}
          ref={mapRef}
          style={
            {
              '--ar': `${W} / ${H}`,
              '--ar-crop': `${W - CROP_WEST} / ${(H - rail).toFixed(1)}`,
              '--crop-w': `${((W / (W - CROP_WEST)) * 100).toFixed(3)}%`,
              '--crop-h': `${((H / (H - rail)) * 100).toFixed(3)}%`,
              '--crop-x': `${((-CROP_WEST / (W - CROP_WEST)) * 100).toFixed(3)}%`,
              '--crop-y': `${((-rail / (H - rail)) * 100).toFixed(3)}%`,
            } as CSSProperties
          }
        >
          <div className={s.mapClip}>
          <div className={s.mapCanvas}>
          <svg
            ref={svgRef}
            className={s.map}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Mapa do Nordeste e do norte de Minas Gerais com ${onMap.length} pontos (usinas ou conjuntos). Cada ponto é uma lâmpada: o tamanho é quanto podia gerar no dia, a parte acesa é o que foi cortado no horário, âmbar quando sobrou energia e vermelha com uma barra quando a rede não aguentou.`}
            onClick={onMapClick}
            onPointerMove={onMapMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              {/* Each state's outline is written once and reused for the land seams' clip. */}
              <clipPath id={`${ids}-land`}>
                {board.map.ufs.map((u) => (
                  <use key={u.uf} href={`#${ids}-uf-${u.uf}`} />
                ))}
              </clipPath>
            </defs>
            <rect className={s.sea} width={W} height={H} />
            <path className={s.seamSea} d={board.map.seams} />
            <g className={s.land}>
              {board.map.ufs.map((u) => (
                <path key={u.uf} id={`${ids}-uf-${u.uf}`} d={u.d} />
              ))}
            </g>
            <path className={s.seamLand} d={board.map.seams} clipPath={`url(#${ids}-land)`} />
            <path className={s.borders} d={board.map.borders} />

            <g className={s.lamps} data-dim={hi ? '' : undefined}>
              {lampNodes}
            </g>
            <g className={s.pulses} aria-hidden="true">
              {Array.from({ length: POOL }, (_, n) => (
                <circle key={n} ref={(el) => void (pulseEls.current[n] = el)} r="0" cx="0" cy="0" />
              ))}
            </g>
            {sel && sel.x !== null && <circle className={s.ring} cx={sel.x} cy={sel.y!} r={sel.rb + 2.5} />}
          </svg>
          </div>
          </div>

          <div className={s.mapCanvas}>
          <div className={s.ufPlates} aria-hidden="true">
            {ufPlates.map((u) => (
              <span key={u.uf} className={s.ufPlate} style={{ left: `${(u.cx / W) * 100}%`, top: `${(u.cy / H) * 100}%` }}>
                {u.uf}
                <span className={s.ufPlateValue}> {f1.format(u.mwh / 1000)}</span>
              </span>
            ))}
          </div>

          {hov && hov.x !== null && (
            <span
              className={s.tooltip}
              data-edge={hov.x / W > 0.66 ? 'right' : hov.x / W < 0.33 ? 'left' : undefined}
              style={{ left: `${(hov.x / W) * 100}%`, top: `${(hov.y! / H) * 100}%` }}
              aria-hidden="true"
            >
              {hov.name}
              <span className={s.tooltipValue}>{lampNow(hov, board, t)}</span>
            </span>
          )}
          </div>

          <div className={s.rail} style={{ height: `${(rail / H) * 100}%` }}>
            {hi ? (
              <p className={s.hiPlate}>
                <span className={s.hiText} title={hi.label}>
                  DESTACANDO {hi.points.length} {hi.points.length === 1 ? 'PONTO' : 'PONTOS'}
                  {hi.onMap === 0 && hi.offUfs.length ? `, TODOS FORA DO MAPA (${hi.offUfs.join(', ')})` : ''}:{' '}
                  {engrave(hi.label)}
                </span>
                <button type="button" className={s.hiClear} onClick={() => setHighlight(null)}>
                  LIMPAR
                </button>
              </p>
            ) : (
              <Legend compact />
            )}
            <div className={s.railOff}>
              <OffMap rows={offRows} outline={hi?.offUfs ?? []} />
            </div>
          </div>

          <label className={s.pointPicker}>
            <span className={s.plate}>ESCOLHER PONTO</span>
            <select
              value={selected ?? ''}
              onChange={(e) => {
                touch();
                setSelected(e.target.value === '' ? null : Number(e.target.value));
              }}
              aria-label="Pontos com mais corte no dia (os 20 maiores)"
            >
              <option value="">Os 20 pontos com mais corte</option>
              {top20.map(({ p, j }) => (
                <option key={p.id} value={j}>
                  {p.name} ({p.uf}): {energy(p.cutMwh)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <aside className={s.margin} aria-label="Legenda e fora do mapa">
          <Legend />
          <OffMap rows={offRows} outline={hi?.offUfs ?? []} stacked />
          {wide && tag ? (
            tag
          ) : (
            <div className={s.ufList}>
              <span className={s.plate}>POR ESTADO · {hourProse(t)}</span>
              <table>
                <thead>
                  <tr>
                    <th scope="col">UF</th>
                    <th scope="col">Agora</th>
                    <th scope="col">No dia</th>
                  </tr>
                </thead>
                <tbody>
                  {ufNow.rows.map((u) => (
                    <tr key={u.uf}>
                      <th scope="row">{u.uf}</th>
                      <td>{mw(u.now)}</td>
                      <td>{gwh(u.day)}</td>
                    </tr>
                  ))}
                  {ufNow.rest && (
                    <tr className={s.ufRest}>
                      <th scope="row">Outros {ufNow.rest.n}</th>
                      <td>{mw(ufNow.rest.now)}</td>
                      <td>{gwh(ufNow.rest.day)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </aside>
      </section>

      <section className={s.why} aria-labelledby={`${ids}-why`}>
        <h2 className={s.plate} id={`${ids}-why`}>
          POR QUÊ
        </h2>
        {deck}
        {reasons}
        <div className={s.annunciator} role="group" aria-label="Restrições que cortaram no dia; toque para destacar os pontos">
          {board.windows.map((w, i) => {
            const g = w.glassAt[t];
            const now = w.mw[t];
            const max = Math.max(...w.mw);
            return (
              <button
                key={w.label}
                type="button"
                className={s.window}
                data-glass={g ?? 'off'}
                aria-pressed={highlight === i}
                aria-label={`${w.label}: ${gwh(w.mwh)} no dia; ${g ? `ativa às ${hourProse(t)}, ${mw(now)}` : `inativa às ${hourProse(t)}`}. ${
                  w.reason ? (w.reason === 'ENE' ? 'Sobrou energia.' : 'A rede não aguentou.') : 'Várias razões.'
                } Destacar os pontos no mapa.`}
                onClick={() => toggleWindow(i)}
              >
                <span key={flash[i]} className={s.windowLight} data-flash={flash[i] > 0 && !reduced ? '' : undefined} aria-hidden="true" />
                <span className={s.windowTag} aria-hidden="true">
                  {w.reason && w.reason !== 'ENE' && <span className={s.breaker} />}
                  {w.reason ?? 'VÁRIAS'}
                </span>
                <span className={s.windowName} aria-hidden="true">
                  {engrave(w.label)}
                </span>
                <span className={s.windowValue} aria-hidden="true">
                  {gwh(w.mwh)} NO DIA
                </span>
                <span className={s.windowMeter} aria-hidden="true" style={{ transform: `scaleX(${max > 0 ? now / max : 0})` }} />
              </button>
            );
          })}
        </div>
      </section>

      {share}

      <div className={s.dock} onKeyDown={onDockKey}>
        {!wide && tag}
        <div className={s.recRow}>
          <button
            type="button"
            className={s.strip}
            aria-expanded={expanded}
            aria-controls={recorderId}
            aria-label="Abrir o registrador do dia"
            onPointerDown={(e) => {
              if (e.pointerType !== 'mouse') openRecorder();
            }}
            onClick={openRecorder}
          >
            <Recorder board={board} t={t} strip />
          </button>
          <div
            className={s.recorder}
            id={recorderId}
            onPointerDown={(e) => {
              if (!mounted) return;
              paperDrag.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              seekFromPointer(e);
            }}
            onPointerMove={(e) => {
              if (paperDrag.current) seekFromPointer(e);
            }}
            onPointerUp={() => {
              paperDrag.current = false;
            }}
            onPointerCancel={() => {
              paperDrag.current = false;
            }}
          >
            <Recorder board={board} t={t} />
            <input
              ref={rangeRef}
              className={s.range}
              type="range"
              min={0}
              max={PATAMARES - 1}
              step={1}
              value={t}
              disabled={!mounted}
              aria-label="Horário do dia"
              aria-valuetext={`${hourProse(t)}, ${f0.format(cut)} megawatts cortados${ref > 0 ? `, ${pct(cut / ref)} do possível` : ''}`}
              onChange={(e) => seek(Number(e.target.value))}
              onKeyDown={onRangeKey}
            />
          </div>
        </div>
        <div className={s.ctlRow}>
          <button
            type="button"
            className={s.push}
            aria-pressed={playing}
            aria-label={playing ? 'Pausar' : 'Reproduzir o dia'}
            disabled={!mounted}
            onClick={togglePlay}
          >
            <span className={s.statusLamp} aria-hidden="true" />
            {playing ? (
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <rect x="2" y="1" width="3.5" height="12" fill="currentColor" />
                <rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3 1.5 14 8 3 14.5Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <span className={s.clock} aria-hidden="true">
            {hourClock(t)}
          </span>
          <span className={s.readout} aria-hidden="true">
            <span className={s.readoutMw}>{mw(cut)}</span>
            <span className={s.readoutNote}>{ref > 0 ? `CORTADOS · ${pct(cut / ref)} DO POSSÍVEL` : 'SEM GERAÇÃO POSSÍVEL'}</span>
          </span>
          <span className={s.noJs}>REPRODUÇÃO REQUER JAVASCRIPT</span>
        </div>
      </div>

      <p className={s.srOnly} aria-live="polite">
        {live}
      </p>
    </div>
  );
}

/** The point's current cut in words, from drawing levels: approximate, and it says so. */
function lampNow(p: DecodedPoint, board: BoardDay, t: number): string {
  const ref = p.series.ref[t];
  const cut = p.series.cut[t];
  if (ref <= 0) return 'não podia gerar neste horário';
  if (cut <= 0) return 'sem corte neste horário';
  const round = (v: number) => (v >= 20 ? Math.round(v / 10) * 10 : Math.round(v));
  return `≈ ${f0.format(round(cut))} de ${f0.format(round(ref))} MW cortados`;
}

function PointTag({
  point,
  board,
  t,
  titleId,
  onClose,
  reduced,
}: {
  point: DecodedPoint;
  board: BoardDay;
  t: number;
  titleId: string;
  onClose: () => void;
  reduced: boolean;
}) {
  const r = point.series.restriction[t];
  const cutNow = point.series.cut[t] > 0 && r >= 0 ? board.restrictions[r] : null;
  const share = point.refMwh > 0 ? point.cutMwh / point.refMwh : 0;
  return (
    <div className={s.tag} role="region" aria-labelledby={titleId} data-reduced={reduced ? '' : undefined}>
      <div className={s.tagHead}>
        <span className={s.tagHole} aria-hidden="true" />
        <h3 className={s.tagTitle} id={titleId}>
          {engrave(point.name)}
        </h3>
        <button type="button" className={s.tagClose} onClick={onClose} aria-label="Fechar ponto">
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
      <dl className={s.tagBody}>
        <div>
          <dt>Onde</dt>
          <dd>
            {point.uf} · {point.sub ? substation(point.sub) : 'subestação não informada'} · {sourceWord(point.source)}
            {point.x === null && ' · fora do mapa'}
          </dd>
        </div>
        <div>
          <dt>Corte no dia</dt>
          <dd>
            {energy(point.cutMwh)} ({pct(share)} do que podia gerar)
          </dd>
        </div>
        <div>
          <dt>Às {hourProse(t)}</dt>
          <dd className={s.tagNow} aria-live="polite">
            {cutNow ? (
              <>
                <LampGlyph glass={cutNow.reason === 'ENE' ? 'sobra' : 'rede'} />
                {cutNow.label} ({cutNow.reason})
              </>
            ) : point.series.ref[t] <= 0 ? (
              'Não podia gerar neste horário'
            ) : (
              'Sem corte neste horário'
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Legend({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className={s.legendStrip}>
        <span className={s.legendItem}>
          <LampGlyph glass="sobra" size={12} /> SOBROU ENERGIA
        </span>
        <span className={s.legendItem}>
          <LampGlyph glass="rede" size={12} /> A REDE NÃO AGUENTOU
        </span>
      </p>
    );
  }
  return (
    <div className={s.legend}>
      <span className={s.plate}>COMO LER UMA LÂMPADA</span>
      <div className={s.anatomy}>
        <svg viewBox="0 0 120 120" className={s.anatomyLamp} aria-hidden="true">
          <circle cx="60" cy="60" r="50" className={s.bezel} />
          <circle cx="60" cy="60" r="40" className={s.glass} />
          <circle cx="60" cy="60" r="26" className={s.lit} data-glass="sobra" />
          <circle cx="52" cy="52" r="7" className={s.fleck} />
        </svg>
        <ul className={s.anatomyList}>
          <li>
            <span className={s.anatomyKey} data-part="bezel" /> TAMANHO: QUANTO PODIA GERAR NO DIA
          </li>
          <li>
            <span className={s.anatomyKey} data-part="glass" /> VIDRO CINZA: PODIA GERAR AGORA
          </li>
          <li>
            <span className={s.anatomyKey} data-part="lit" /> ACESO: FOI CORTADO AGORA
          </li>
          <li>
            <span className={s.anatomyKey} data-part="socket" /> VAZIO: NÃO PODIA GERAR (NOITE)
          </li>
        </ul>
      </div>
      <p className={s.legendGlasses}>
        <span className={s.legendItem}>
          <LampGlyph glass="sobra" /> SOBROU ENERGIA · ENE
        </span>
        <span className={s.legendItem}>
          <LampGlyph glass="rede" /> A REDE NÃO AGUENTOU · CNF/REL
        </span>
      </p>
    </div>
  );
}

function OffMap({ rows, outline, stacked = false }: { rows: ReturnType<typeof offMap>; outline: string[]; stacked?: boolean }) {
  if (!rows.length) return null;
  return (
    <div className={stacked ? s.offStacked : s.offLine} role="group" aria-label="Fora do mapa: corte no dia por estado">
      <span className={s.offHead}>FORA DO MAPA</span>
      {rows.map((r) => (
        <span key={r.uf} className={s.offRow} data-outline={outline.includes(r.uf) ? '' : undefined}>
          <LampGlyph glass={r.glass as Glass | null} size={11} />
          <span>
            {r.uf} {f1.format(r.mwh / 1000)}
          </span>
        </span>
      ))}
      <span className={s.offUnit}>GWh no dia</span>
    </div>
  );
}

const PAPER_W = 480;
const PAPER_H = 100;

function Recorder({ board, t, strip = false }: { board: BoardDay; t: number; strip?: boolean }) {
  const { sobraMw, redeMw, refMw } = board;
  const cutMax = Math.max(1, ...sobraMw.map((v, i) => v + redeMw[i]));
  const max = strip ? cutMax : Math.max(1, ...refMw) * 1.04;
  const paths = useMemo(
    () => ({
      sobra: stepBand(sobraMw, max, PAPER_W, PAPER_H),
      rede: stepBand(redeMw, max, PAPER_W, PAPER_H, sobraMw),
      ref: stepLine(refMw, max, PAPER_W, PAPER_H),
    }),
    [sobraMw, redeMw, refMw, max],
  );
  const x = ((t + 0.5) / PATAMARES) * 100;
  return (
    <span className={strip ? s.paperStrip : s.paper} aria-hidden="true">
      <svg viewBox={`0 0 ${PAPER_W} ${PAPER_H}`} preserveAspectRatio="none" className={s.paperSvg}>
        {!strip &&
          [6, 12, 18, 24, 30, 36, 42].map((h) => (
            <line
              key={h}
              x1={(h / PATAMARES) * PAPER_W}
              x2={(h / PATAMARES) * PAPER_W}
              y1={0}
              y2={PAPER_H}
              className={h === 24 ? s.ruleMain : s.rule}
            />
          ))}
        <path d={paths.sobra} className={s.bandSobra} />
        <path d={paths.rede} className={s.bandRede} />
        {!strip && <path d={paths.ref} className={s.refLine} />}
      </svg>
      {strip && <span className={s.playhead} style={{ left: `${x}%` }} />}
      {!strip && (
        <>
          <span className={s.column} style={{ left: `${(t / PATAMARES) * 100}%`, width: `${100 / PATAMARES}%` }} />
          <span className={s.playhead} style={{ left: `${x}%` }} />
          <span className={s.ticks}>
            {['00', '03', '06', '09', '12', '15', '18', '21'].map((h, i) => (
              <span key={h} className={s.tick} data-major={i % 2 === 0 ? '' : undefined} style={{ left: `${(i * 6 / PATAMARES) * 100}%` }}>
                {h}h
              </span>
            ))}
            <span className={s.tickEnd}>23h30</span>
          </span>
        </>
      )}
    </span>
  );
}
