'use client';

import { type CSSProperties, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EVENT_NOTES, LANE_OUTCOME, resultNote, STATION_NOTES } from './anotacoes';
import s from './bastidores.module.css';
import { type BoardLayout, type CardPiece, layoutBoard, runSummary } from './board';
import {
  type Bastidores,
  clock,
  clockSec,
  CODE_ORDER,
  columns,
  day,
  duration,
  durationShort,
  int,
  LANES,
  pct,
  processed,
  type Run,
  runActiveMs,
  STATIONS,
  tokensShort,
  toolCalls,
  totals,
  waitEnd,
  waitMs,
} from './data';
import { useSelection } from './selection';
import { type ShareEntry, ShareBar } from './ShareBar';
import { commitId, findSelected, runTitle, type Selected, stopLabel } from './texts';

const ACROSS_PITCH = 20;
const DOWN_PITCH = 22;
const ROW = 44;
const HEAD = 48; // andon strip 28 + clock axis 20
const RAIL = 28;
const ENCAIXE_KEY = 'bastidores-encaixe';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const stock = (r: Run) => STATIONS[r.code].stock;

export function Quadro({ data, texts, fallback }: { data: Bastidores; texts: Record<string, ShareEntry>; fallback: ShareEntry }) {
  const layout = useMemo(() => layoutBoard(data, columns(data)), [data]);
  const [sel, setSel] = useSelection();
  const selected = useMemo(() => findSelected(data, sel), [data, sel]);
  const boards = useRef<HTMLDivElement>(null);
  const ficha = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);
  const [motion, setMotion] = useState(false);

  const replay = useCallback(() => {
    setPlay(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPlay(true)));
  }, []);

  // The encaixe: once per session, when the board first comes into view.
  useEffect(() => {
    let reduced = true;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {}
    setMotion(!reduced);
    if (reduced || !boards.current) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(ENCAIXE_KEY) === '1';
    } catch {}
    if (seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        try {
          sessionStorage.setItem(ENCAIXE_KEY, '1');
        } catch {}
        setPlay(true);
      },
      { threshold: 0.2 },
    );
    io.observe(boards.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => setPlay(false), layout.encaixeMs + 600);
    return () => clearTimeout(t);
  }, [play, layout.encaixeMs]);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, setSel]);

  const pick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-sel]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      setPlay(false);
      setSel(a.dataset.sel!);
      const f = ficha.current;
      if (f) {
        const r = f.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.85 || r.bottom < 0) {
          let smooth = false;
          try {
            smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          } catch {}
          f.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
        f.focus({ preventScroll: true });
      }
    },
    [setSel],
  );

  return (
    <>
      <div ref={boards} className={cx(s.boards, play && s.play)} onClick={pick}>
        <Across data={data} layout={layout} sel={sel} />
        <Down data={data} layout={layout} sel={sel} />
      </div>

      <div className={s.keyRow}>
        <Key data={data} />
        {motion && (
          <button type="button" className={s.replay} onClick={replay}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M12.5 5.5A5 5 0 1 0 13 9M12.8 2v3.8H9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
            </svg>
            Rever o encaixe
          </button>
        )}
      </div>

      <details className={s.list}>
        <summary>Ver o quadro como lista</summary>
        <ol onClick={pick}>
          {[...data.runs]
            .sort((a, b) => a.spans[0][0].localeCompare(b.spans[0][0]))
            .map((r) => (
              <li key={r.id}>
                <a href={`?r=${r.id}#ficha`} data-sel={r.id} aria-current={sel === r.id ? 'true' : undefined}>
                  <span className={s.swatch} data-stock={stock(r)} aria-hidden="true" />
                  <span className={s.mono}>{r.code}</span> {runSummary(r)}
                </a>
              </li>
            ))}
        </ol>
      </details>

      <section
        id="ficha"
        ref={ficha}
        tabIndex={-1}
        className={s.ficha}
        aria-labelledby="ficha-title"
      >
        <Ficha data={data} selected={selected} onClose={() => setSel(null)} />
        <ShareBar
          id="share-ficha"
          texts={texts}
          fallback={fallback}
          label={selected ? 'Compartilhar este cartão' : 'Compartilhar o quadro'}
        />
      </section>
    </>
  );
}

// ── The board, across (desktop) ─────────────────────────────────────────

function Across({ data, layout, sel }: { data: Bastidores; layout: BoardLayout; sel: string | null }) {
  const W = layout.axis.width;
  const p = (u: number) => `${(u / W) * 100}%`;
  const lanesH = LANES.length * ROW;
  const t = useMemo(() => totals(data), [data]);
  return (
    <div className={s.across} role="group" aria-label="O quadro: uma fileira por linha de trabalho, uma coluna por cinco minutos">
      <div className={s.labels}>
        <div className={s.labelsHead} style={{ height: HEAD }}>
          <span>agentes trabalhando</span>
          <span>horário de Brasília</span>
        </div>
        {LANES.map((l) => (
          <div key={l.id} className={s.rowLabel} style={{ height: ROW }}>
            {l.id === 'daniel' && <span className={s.humanKey} aria-hidden="true" />}
            {l.id === 'bastidores' && layout.replacedAt !== null ? (
              <span className={s.replacedLabel}>
                <s>caixa-preta</s> {l.label}
              </span>
            ) : (
              <span>{l.label}</span>
            )}
          </div>
        ))}
        <div className={s.rowLabel} style={{ height: RAIL }}>
          <span className={s.muted}>commits</span>
        </div>
      </div>

      <div className={s.scroller} tabIndex={0} aria-label="Quadro, role na horizontal">
        <div className={s.face} style={{ minWidth: W * ACROSS_PITCH, height: HEAD + lanesH + RAIL }}>
          <PitchRules layout={layout} along="x" top={HEAD} length={lanesH} scale={p} />
          {LANES.map((l, i) => (
            <div key={l.id} className={s.row} style={{ top: HEAD + i * ROW, height: ROW }} />
          ))}
          <AndonAcross layout={layout} scale={p} />
          <div className={s.clockRow} style={{ top: 28 }}>
            {layout.ticks.map((tk) => (
              <span key={tk.x} className={cx(s.tick, tk.strong && s.tickStrong)} style={{ left: p(tk.x) }}>
                {tk.label}
              </span>
            ))}
            {layout.axis.columns.map((c, i) =>
              c.kind === 'break' ? (
                <span key={i} className={s.breakLabel} style={{ left: p(layout.axis.offsets[i]) }}>
                  +{durationShort(c.to - c.from).replace(/ 00 min$/, '')}
                </span>
              ) : null,
            )}
          </div>
          {layout.bands.map((b) => (
            <span
              key={b.cp.id}
              className={cx(s.band, b.open && s.bandOpen)}
              style={{ left: p(b.from), width: p(b.to - b.from), top: HEAD, height: lanesH, '--d': `${b.delay}ms` } as CSSProperties}
              aria-hidden="true"
            />
          ))}
          {layout.replacedAt !== null && (
            <span className={s.replaced} style={{ left: p(layout.replacedAt), top: HEAD + LANES.findIndex((l) => l.id === 'bastidores') * ROW }} aria-hidden="true" />
          )}
          {layout.prompts.map((pr) => (
            <span key={pr.at} className={s.prompt} style={{ left: p(pr.x), top: HEAD + 6 }} title={`Daniel escreveu ao orquestrador, ${day(pr.at)} ${clock(pr.at)}`} aria-hidden="true" />
          ))}
          {layout.pieces.map((pc, k) => (
            <Card key={`${pc.run.id}-${k}`} pc={pc} sel={sel} style={{
              left: p(pc.from),
              width: p(pc.to - pc.from),
              top: HEAD + pc.lane * ROW + 5 + pc.stack * 4,
              height: ROW - 10 - pc.stack * 4,
            }} wide={(pc.to - pc.from) >= 6} punch={{ left: `${((pc.exactFrom - pc.from) / (pc.to - pc.from)) * 100}%`, width: `${((pc.exactTo - pc.exactFrom) / (pc.to - pc.from)) * 100}%` }} across />
          ))}
          {layout.bands.map((b) => (
            <Decision key={b.cp.id} b={b} data={data} sel={sel} style={{
              left: p(b.from),
              width: `max(${p(Math.max(b.to - b.from, 1))}, 20px)`,
              top: HEAD + 4,
              height: ROW - 8,
            }} wide={b.to - b.from >= 4.5} />
          ))}
          <div className={s.rail} style={{ top: HEAD + lanesH, height: RAIL }}>
            {layout.commits.map(({ commit, x, labelled }) => (
              <a
                key={commit.hash}
                href={`?r=${commitId(commit)}#ficha`}
                data-sel={commitId(commit)}
                className={cx(s.tag, labelled && s.tagLabelled)}
                style={{ left: p(x) }}
                aria-current={sel === commitId(commit) ? 'true' : undefined}
                aria-label={`Commit ${commit.hash}, ${day(commit.at)} ${clock(commit.at)}: ${commit.subject}`}
              >
                {labelled ? commit.hash : ''}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={s.caps}>
        <div style={{ height: HEAD }} />
        {LANES.map((l) => (
          <div key={l.id} className={s.cap} style={{ height: ROW }}>
            <Cap lane={l} data={data} />
          </div>
        ))}
        <div className={s.cap} style={{ height: RAIL }}>
          <span className={s.muted}>{t.commits} commits</span>
        </div>
      </div>
    </div>
  );
}

function AndonAcross({ layout, scale }: { layout: BoardLayout; scale: (u: number) => string }) {
  const ax = layout.axis;
  return (
    <div className={s.andon} aria-hidden="true">
      {ax.columns.map((c, i) => {
        const w = (i + 1 < ax.offsets.length ? ax.offsets[i + 1] : ax.width) - ax.offsets[i];
        const n = layout.working[i];
        return (
          <span
            key={i}
            className={cx(s.andonCell, layout.stopped[i] && s.andonStop, c.kind === 'break' && s.andonBreak)}
            style={{ left: scale(ax.offsets[i]), width: scale(w) }}
          >
            {c.kind === 'break' ? '//' : layout.stopped[i] && n === 0 ? '' : n === 0 ? <i className={s.dot} /> : layout.stopped[i] ? <b className={s.andonChip}>{n}</b> : n}
          </span>
        );
      })}
    </div>
  );
}

function PitchRules({
  layout,
  along,
  top,
  length,
  scale,
}: {
  layout: BoardLayout;
  along: 'x' | 'y';
  top: number;
  length: number;
  scale: (u: number) => string;
}) {
  const ax = layout.axis;
  return (
    <>
      {ax.columns.map((c, i) => {
        const pos = scale(ax.offsets[i]);
        if (c.kind === 'break') {
          const size = scale(BREAK_W(ax, i));
          return (
            <span
              key={i}
              className={cx(s.brk, along === 'y' && s.brkDown)}
              style={along === 'x' ? { left: pos, width: size, top, height: length } : { top: pos, height: size }}
              aria-hidden="true"
            />
          );
        }
        const minute = Number(clock(c.start).slice(3));
        const cls = minute === 0 ? s.ruleHour : minute % 30 === 0 ? s.ruleHalf : s.rule;
        return (
          <span
            key={i}
            className={cx(cls, along === 'y' && s.ruleDown)}
            style={along === 'x' ? { left: pos, top, height: length } : { top: pos }}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}

const BREAK_W = (ax: BoardLayout['axis'], i: number) => (i + 1 < ax.offsets.length ? ax.offsets[i + 1] : ax.width) - ax.offsets[i];

// ── The board, down (phone) ─────────────────────────────────────────────

function Down({ data, layout, sel }: { data: Bastidores; layout: BoardLayout; sel: string | null }) {
  const ax = layout.axis;
  const y = (u: number) => `${u * DOWN_PITCH}px`;
  const H = ax.width * DOWN_PITCH;
  const n = LANES.length;
  const lx = (i: number) => `${(i / n) * 100}%`;
  return (
    <div className={s.down} role="group" aria-label="O quadro: uma coluna por linha de trabalho, o tempo descendo em passos de cinco minutos">
      <div className={s.downHead}>
        <span className={s.downHeadClock}>h. Brasília</span>
        <div className={s.downKeys}>
          {LANES.map((l) => (
            <span key={l.id} className={s.downKey} aria-label={l.label} title={l.label}>
              {l.id === 'daniel' ? <i className={s.humanKey} aria-hidden="true" /> : null}
              <span aria-hidden="true">{l.key}</span>
            </span>
          ))}
        </div>
        <span className={s.downRailHead} aria-hidden="true">git</span>
      </div>
      <div className={s.downBody} style={{ height: H }}>
        <div className={s.downAndon} aria-hidden="true">
          {ax.columns.map((c, i) => {
            const k = layout.working[i];
            return (
              <span
                key={i}
                className={cx(s.andonCell, layout.stopped[i] && s.andonStop, c.kind === 'break' && s.andonBreak)}
                style={{ top: y(ax.offsets[i]), height: y(BREAK_W(ax, i)) }}
              >
                {c.kind === 'break' ? '//' : layout.stopped[i] && k === 0 ? '' : k === 0 ? <i className={s.dot} /> : layout.stopped[i] ? <b className={s.andonChip}>{k}</b> : k}
              </span>
            );
          })}
        </div>
        <div className={s.downClock} aria-hidden="true">
          {layout.ticks.map((tk) => (
            <span key={tk.x} className={cx(s.tickDown, tk.strong && s.tickStrong)} style={{ top: y(tk.x) }}>
              {tk.label.replace(' · ', '\n')}
            </span>
          ))}
          {ax.columns.map((c, i) =>
            c.kind === 'break' ? (
              <span key={i} className={s.breakLabelDown} style={{ top: y(ax.offsets[i]) }}>
                +{duration(c.to - c.from).replace(/ 0?0 min$/, '')}
              </span>
            ) : null,
          )}
        </div>
        <div className={s.downLanes}>
          <PitchRules layout={layout} along="y" top={0} length={H} scale={y} />
          {LANES.map((l, i) => (
            <span key={l.id} className={s.lane} style={{ left: lx(i), width: lx(1) }} aria-hidden="true" />
          ))}
          {layout.bands.map((b) => (
            <span
              key={b.cp.id}
              className={cx(s.band, s.bandDown, b.open && s.bandOpen)}
              style={{ top: y(b.from), height: `max(6px, ${y(b.to - b.from)})`, '--d': `${b.delay}ms` } as CSSProperties}
              aria-hidden="true"
            />
          ))}
          {layout.replacedAt !== null && (
            <span className={s.replacedDown} style={{ top: y(layout.replacedAt), left: lx(LANES.findIndex((l) => l.id === 'bastidores')), width: lx(1) }}>
              → ba
            </span>
          )}
          {layout.prompts.map((pr) => (
            <span key={pr.at} className={s.promptDown} style={{ top: y(pr.x), left: lx(0) }} aria-hidden="true" />
          ))}
          {layout.pieces.map((pc, k) => (
            <Card key={`${pc.run.id}-${k}`} pc={pc} sel={sel} style={{
              top: y(pc.from),
              height: `calc(${y(pc.to - pc.from)} - 3px)`,
              left: `calc(${lx(pc.lane)} + ${3 + pc.stack * 4}px)`,
              width: `calc(${lx(1)} - ${6 + pc.stack * 4}px)`,
            }} wide={false} punch={{ top: `${((pc.exactFrom - pc.from) / (pc.to - pc.from)) * 100}%`, height: `${((pc.exactTo - pc.exactFrom) / (pc.to - pc.from)) * 100}%` }} />
          ))}
          {layout.bands.map((b) => (
            <Decision key={b.cp.id} b={b} data={data} sel={sel} style={{
              top: y(b.from),
              height: `max(${y(Math.max(b.to - b.from, 1))}, 26px)`,
              left: 2,
              width: `calc(${lx(1)} - 4px)`,
            }} wide={false} />
          ))}
        </div>
        <div className={s.downRail}>
          {layout.commits.map(({ commit, x }) => (
            <a
              key={commit.hash}
              href={`?r=${commitId(commit)}#ficha`}
              data-sel={commitId(commit)}
              className={s.tagDown}
              style={{ top: y(x) }}
              aria-current={sel === commitId(commit) ? 'true' : undefined}
              aria-label={`Commit ${commit.hash}, ${day(commit.at)} ${clock(commit.at)}: ${commit.subject}`}
            />
          ))}
        </div>
      </div>
      <ol className={s.downCaps}>
        {LANES.filter((l) => l.kind === 'demo').map((l) => (
          <li key={l.id}>
            <span className={s.mono}>{l.key}</span> {l.label}: <Cap lane={l} data={data} />
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────

function Card({
  pc,
  sel,
  style,
  wide,
  punch,
  across,
}: {
  pc: CardPiece;
  sel: string | null;
  style: CSSProperties;
  wide: boolean;
  punch: CSSProperties;
  across?: boolean;
}) {
  const r = pc.run;
  const stopped = r.result.viable === false;
  const marks = pc.last && (r.result.revise || r.flags.blocked || r.flags.stalledAfterS !== undefined || r.worktree || r.toolErrors > 0);
  return (
    <a
      href={`?r=${r.id}#ficha`}
      data-sel={r.id}
      data-stock={stopped ? 'parou' : stock(r)}
      data-code={r.code}
      className={cx(
        s.card,
        across ? s.cardAcross : s.cardDown,
        !pc.first && s.cardCont,
        pc.last && r.flags.open && s.cardOpen,
        r.flags.incomplete && s.cardIncomplete,
        r.flags.blocked && pc.last && s.cardBlocked,
      )}
      style={{ ...style, '--d': `${pc.delay}ms` } as CSSProperties}
      aria-current={sel === r.id ? 'true' : undefined}
      aria-label={`${STATIONS[r.code].label}: ${runSummary(r)}`}
    >
      {pc.first && (
        <span className={s.code}>
          {r.code}
          {stopped && across && wide ? ' ■ inviável' : ''}
          {wide && !stopped && r.code !== 'OR' ? <span className={s.cardSlug}> · {STATIONS[r.code].label.split(' ')[0].toLowerCase()}</span> : null}
        </span>
      )}
      {marks && (across ? (pc.to - pc.from) >= 1.5 : true) && (
        <span className={s.marks} aria-hidden="true">
          {r.toolErrors > 0 && wide && (
            <span className={s.errs}>
              {r.toolErrors}
              <Mark d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
            </span>
          )}
          {r.result.revise && <Mark d="M8 1.5v4.5H2.5M4.5 4 2.5 6l2 2" />}
          {r.flags.stalledAfterS !== undefined && <Mark d="M8 4A3.4 3.4 0 1 0 8.4 6.5M8.3 1.2v3H5.3" />}
          {r.worktree && r.flags.stalledAfterS === undefined && !r.result.revise && <Mark d="M3 1v8M3 6c0-2.5 4-1.5 4-5" />}
        </span>
      )}
      <span className={s.punch} style={punch} aria-hidden="true" />
    </a>
  );
}

function Mark({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function Decision({ b, data, sel, style, wide }: { b: BoardLayout['bands'][number]; data: Bastidores; sel: string | null; style: CSSProperties; wide: boolean }) {
  const w = duration(waitMs(b.cp, data.asOf));
  const status = b.cp.status === 'respondida' ? 'Daniel decidiu' : b.cp.status === 'interrompida' ? 'sem resposta: a sessão terminou' : 'esperando resposta';
  return (
    <a
      href={`?r=${b.cp.id}#ficha`}
      data-sel={b.cp.id}
      className={cx(s.decision, b.cp.status !== 'respondida' && s.decisionOpen)}
      style={{ ...style, '--d': `${b.delay + 200}ms` } as CSSProperties}
      aria-current={sel === b.cp.id ? 'true' : undefined}
      aria-label={`Parada ${stopLabel(b.cp)}, ${day(b.cp.at)} ${clock(b.cp.at)}: a linha esperou ${w}; ${status}. ${b.cp.questions.map((q) => q.header).join(', ')}`}
    >
      <span className={s.decisionCode}>{stopLabel(b.cp)}</span>
      {wide && <span className={s.decisionWait}>{durationShort(waitMs(b.cp, data.asOf))}</span>}
    </a>
  );
}

function Cap({ lane, data }: { lane: (typeof LANES)[number]; data: Bastidores }) {
  const runs = data.runs.filter((r) => r.lane === lane.id);
  if (lane.kind === 'demo') {
    if (lane.id === 'bastidores') return <span className={s.here}>você está aqui</span>;
    const built = runs.some((r) => r.code === 'BU' && r.result.done);
    if (!built) return <span className={s.muted}>em construção</span>;
    return (
      <a className={s.capLink} href={lane.href}>
        no ar
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </a>
    );
  }
  if (lane.id === 'daniel') {
    const waited = data.checkpoints.reduce((a, c) => a + waitMs(c, data.asOf), 0);
    return (
      <span className={s.muted}>
        {LANE_OUTCOME.daniel} · <span className={s.mono}>{data.checkpoints.length}×</span>
        <span className={s.visuallyHidden}>, a linha esperou {duration(waited)}</span>
      </span>
    );
  }
  const active = runs.reduce((a, r) => a + runActiveMs(r), 0);
  return (
    <span className={s.muted}>
      {LANE_OUTCOME[lane.id]} · <span className={s.mono}>{duration(active).replace(/ \d+ s$/, '')}</span>
    </span>
  );
}

function Key({ data }: { data: Bastidores }) {
  const used = new Set(data.runs.map((r) => r.code));
  return (
    <ul className={s.key} aria-label="Legenda das cores dos cartões">
      {CODE_ORDER.filter((c) => used.has(c)).map((c) => (
        <li key={c}>
          <span className={s.swatch} data-stock={STATIONS[c].stock} data-code={c} aria-hidden="true" />
          <span className={s.mono}>{c}</span> {STATIONS[c].label}
        </li>
      ))}
      <li>
        <span className={s.swatchPrompt} aria-hidden="true" /> Daniel escreveu ao orquestrador
      </li>
      <li>
        <span className={s.swatchBreak} aria-hidden="true" /> intervalo sem atividade, encurtado
      </li>
    </ul>
  );
}

// ── Ficha ───────────────────────────────────────────────────────────────

function Ficha({ data, selected, onClose }: { data: Bastidores; selected: Selected | null; onClose: () => void }) {
  if (!selected) return <FichaTotals data={data} />;
  return (
    <div className={s.fichaBody}>
      <button type="button" className={s.close} onClick={onClose} aria-label="Fechar a ficha">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {selected.kind === 'run' && <FichaRun data={data} r={selected.run} />}
      {selected.kind === 'stop' && <FichaStop data={data} sel={selected} />}
      {selected.kind === 'commit' && <FichaCommit c={selected.commit} />}
    </div>
  );
}

function FichaRun({ data, r }: { data: Bastidores; r: Run }) {
  const s0 = r.spans[0][0];
  const e0 = r.spans[r.spans.length - 1][1];
  const p = processed(r);
  const tools = Object.entries(r.tools).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const maxTool = Math.max(1, ...data.runs.flatMap((x) => Object.values(x.tools)));
  const events = data.events.filter((e) => e.run === r.id);
  const stopped = r.result.viable === false;
  return (
    <>
      <header className={s.fichaHead}>
        <span className={s.fichaSwatch} data-stock={stopped ? 'parou' : stock(r)} data-code={r.code} aria-hidden="true">
          {r.code}
        </span>
        <div>
          <h2 id="ficha-title" className={s.fichaTitle}>
            {runTitle(r)}
          </h2>
          <p className={s.fichaMeta}>
            <span className={s.mono}>{r.label}</span>
            {r.workflow ? <> · workflow <span className={s.mono}>{r.workflow}</span></> : null}
            {r.worktree ? ' · worktree git própria' : ''}
          </p>
          <p className={s.fichaMeta}>
            <span className={s.mono}>
              {day(s0)} {clockSec(s0)} – {day(e0) !== day(s0) ? `${day(e0)} ` : ''}
              {clockSec(e0)}
            </span>{' '}
            (horário de Brasília) · <span className={s.mono}>{duration(runActiveMs(r))}</span> trabalhando
            {r.spans.length > 1 ? `, em ${r.spans.length} trechos` : ''}
          </p>
        </div>
      </header>
      <p className={s.fichaNote}>{STATION_NOTES[r.code]}</p>
      <div className={s.fichaGroups}>
        <div>
          <h3 className={s.fichaH}>Números</h3>
          <dl className={s.figures}>
            <dt>tokens processados</dt>
            <dd>
              {int(p)}
              <small>dos quais {pct(p ? r.tokens.cacheRead / p : 0)} leitura de cache</small>
            </dd>
            <dt>turnos</dt>
            <dd>{int(r.turns)}</dd>
            <dt>chamadas de ferramenta</dt>
            <dd>{int(toolCalls(r))}</dd>
            <dt>caracteres escritos</dt>
            <dd>{int(r.charsWritten)}</dd>
            <dt>erros de ferramenta</dt>
            <dd>{int(r.toolErrors)}</dd>
            {r.contextFinal !== null && (
              <>
                <dt>contexto no último turno</dt>
                <dd>{int(r.contextFinal)}</dd>
              </>
            )}
          </dl>
        </div>
        <div>
          <h3 className={s.fichaH}>Ferramentas</h3>
          {tools.length === 0 ? (
            <p className={s.muted}>Nenhuma chamada.</p>
          ) : (
            <ul className={s.tools}>
              {tools.map(([name, n]) => (
                <li key={name}>
                  <span className={s.mono}>{name}</span>
                  <Tally n={n} max={maxTool} />
                  <span className={s.toolN}>{n}</span>
                </li>
              ))}
            </ul>
          )}
          {r.skills.length > 0 && (
            <p className={s.fichaSmall}>
              skills: <span className={s.mono}>{r.skills.join(', ')}</span>
            </p>
          )}
        </div>
        <div>
          <h3 className={s.fichaH}>Resultado e arquivos</h3>
          <p>{resultNote(r)}</p>
          {events.map((e, i) => (
            <p key={i} className={s.fichaEvent}>
              <span className={s.mono}>{clock(e.at)}</span> {EVENT_NOTES[e.kind]}
            </p>
          ))}
          {r.flags.stalledAfterS !== undefined && (
            <p className={s.fichaSmall}>
              Sem progresso por <span className={s.mono}>{duration(r.flags.stalledAfterS * 1000)}</span> antes do reinício.
            </p>
          )}
          {r.files.length > 0 && (
            <ul className={s.files}>
              {r.files.slice(0, 8).map((f) => (
                <li key={f}>{f}</li>
              ))}
              {r.files.length > 8 && <li className={s.muted}>+ {r.files.length - 8}</li>}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function FichaStop({ data, sel }: { data: Bastidores; sel: Extract<Selected, { kind: 'stop' }> }) {
  const cp = sel.cp;
  const end = waitEnd(cp, data.asOf);
  return (
    <>
      <header className={s.fichaHead}>
        <span className={s.fichaSwatch} data-stock="parada" aria-hidden="true">
          {stopLabel(cp)}
        </span>
        <div>
          <h2 id="ficha-title" className={s.fichaTitle}>
            Parada {stopLabel(cp)}: {cp.status === 'respondida' ? 'Daniel decidiu' : cp.status === 'interrompida' ? 'a sessão terminou antes da resposta' : 'esperando Daniel'}
          </h2>
          <p className={s.fichaMeta}>
            perguntou <span className={s.mono}>{day(cp.at)} {clockSec(cp.at)}</span>
            {cp.answeredAt ? (
              <>
                {' '}· respondeu <span className={s.mono}>{clockSec(cp.answeredAt)}</span>
              </>
            ) : cp.resumedAt ? (
              <>
                {' '}· Daniel voltou <span className={s.mono}>{day(end)} {clockSec(end)}</span>
              </>
            ) : (
              ' · sem resposta até a extração'
            )}{' '}
            (horário de Brasília) · a linha esperou <span className={s.mono}>{duration(waitMs(cp, data.asOf))}</span>
          </p>
        </div>
      </header>
      <ol className={s.questions}>
        {cp.questions.map((q, i) => (
          <li key={i}>
            <p>
              <strong>{q.header}</strong>
              {q.question ? <span className={s.questionText}> {q.question}</span> : null}
            </p>
            <ul className={s.options}>
              {q.options.map((o) => (
                <li key={o} className={q.chosen.includes(o) ? s.chosen : s.notChosen}>
                  {o}
                  {q.recommended === o && <span className={s.rec}> (recomendada)</span>}
                </li>
              ))}
              {q.own && <li className={s.chosen}>uma resposta própria (o texto não é publicado)</li>}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}

function FichaCommit({ c }: { c: Bastidores['commits'][number] }) {
  return (
    <>
      <header className={s.fichaHead}>
        <span className={s.fichaSwatch} data-stock="commit" aria-hidden="true">
          git
        </span>
        <div>
          <h2 id="ficha-title" className={s.fichaTitle}>
            {c.subject}
          </h2>
          <p className={s.fichaMeta}>
            <span className={s.mono}>{c.hash}</span> · {day(c.at)} <span className={s.mono}>{clockSec(c.at)}</span> (horário de Brasília) ·{' '}
            <span className={s.mono}>{c.branch}</span>
            {c.merge ? ' · merge' : ''}
          </p>
          <p className={s.fichaMeta}>
            <span className={s.mono}>
              {c.filesChanged} arquivos, +{int(c.insertions)} −{int(c.deletions)}
            </span>
          </p>
        </div>
      </header>
      {c.files.length > 0 && (
        <ul className={s.files}>
          {c.files.slice(0, 8).map((f) => (
            <li key={f}>{f}</li>
          ))}
          {c.files.length > 8 && <li className={s.muted}>+ {c.files.length - 8}</li>}
        </ul>
      )}
    </>
  );
}

function FichaTotals({ data }: { data: Bastidores }) {
  const t = totals(data);
  return (
    <div className={s.fichaBody}>
      <h2 id="ficha-title" className={s.fichaTitle}>
        A ficha
      </h2>
      <p className={s.fichaNote}>Toque num cartão, numa parada ou num commit para ver o que aconteceu ali. Enquanto isso, a orquestração inteira:</p>
      <dl className={cx(s.figures, s.figuresWide)}>
        <dt>agentes</dt>
        <dd>{t.agents}</dd>
        <dt>chamadas de ferramenta</dt>
        <dd>{int(t.toolCalls)}</dd>
        <dt>tokens processados</dt>
        <dd>
          {tokensShort(t.tokensProcessed)}
          <small>{pct(t.tokensCacheRead / t.tokensProcessed)} leitura de cache</small>
        </dd>
        <dt>relógio com alguém trabalhando</dt>
        <dd>{duration(t.activeMs)}</dd>
        <dt>soma do tempo dos agentes</dt>
        <dd>{duration(t.agentMs)}</dd>
        <dt>paradas para Daniel</dt>
        <dd>{t.checkpoints}</dd>
      </dl>
    </div>
  );
}

function Tally({ n, max }: { n: number; max: number }) {
  if (n > 30) {
    return (
      <svg className={s.tally} viewBox="0 0 160 10" width="160" height="10" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="2" width={Math.max(4, (n / max) * 160)} height="6" fill="currentColor" />
      </svg>
    );
  }
  const groups = Math.ceil(n / 5);
  return (
    <svg className={s.tally} viewBox={`0 0 ${groups * 16} 10`} width={groups * 16} height="10" aria-hidden="true">
      {Array.from({ length: groups }, (_, g) => {
        const inGroup = Math.min(5, n - g * 5);
        const x0 = g * 16 + 1;
        return (
          <g key={g} stroke="currentColor" strokeWidth="1.5">
            {Array.from({ length: Math.min(4, inGroup) }, (_, k) => (
              <line key={k} x1={x0 + k * 3} x2={x0 + k * 3} y1="1" y2="9" />
            ))}
            {inGroup === 5 && <line x1={x0 - 1} x2={x0 + 10} y1="8" y2="2" />}
          </g>
        );
      })}
    </svg>
  );
}

