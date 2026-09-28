import type { CSSProperties } from 'react';

import { type Placed, polar, ringArc, route, wedge } from './chart';
import { CENTRE, type Collapsed, type Graph, type Layout, OUTER_R, ringRadius, ROOT_R } from './data';
import s from './raio.module.css';
import { type ChartMode, chartLabels, chartState } from './scene';

export type { ChartMode };

interface Props {
  g: Graph;
  L: Layout;
  c: Collapsed;
  mode: ChartMode;
  hasMalicious: (pkg: string) => boolean;
  selected: number | null;
  /** Gates that hold (refuse a version just published) on this step. */
  holding: ReadonlySet<number>;
  stepKey: string;
  /** Set after the reader switches preset: the new paths draw from the root out. */
  intro: boolean;
  title: string;
  desc: string;
  fetchedAt: string;
  /** Each path node's ledger id ("4b"), shared with CAMINHO. */
  ids: ReadonlyMap<number, string>;
  onPick: (node: number) => void;
  onHover: (node: number | null) => void;
}

type EdgeKind = 'open' | 'barred' | 'neutral' | 'reach';

const f1 = (n: number) => Math.round(n * 10) / 10;
const plural = (k: number, one: string, many: string) => (k === 1 ? one : many);

export function ZoneChart(props: Props) {
  const { g, L, c, mode, selected, holding, stepKey, intro, ids } = props;
  const cs = chartState(g, L, c, mode, props.hasMalicious);
  const { place, at, gated, edgeState, nodeKind, versionShown, zones } = cs;
  const edgeKind = (e: number): EdgeKind => {
    if (mode.kind === 'whatif') return 'reach';
    const st = edgeState(e);
    return st === 'open' ? 'open' : st === 'barred' ? 'barred' : 'neutral';
  };
  const layers = {
    small: chartLabels(cs, ids, 'small'),
    phone: chartLabels(cs, ids, 'phone'),
    desk: chartLabels(cs, ids, 'desk'),
  };

  const labelBody = (id: string, text: Map<string, string[]>) => {
    const lines = text.get(id) ?? [];
    if (id === 'front') {
      return (
        <span className={s.frontTag}>
          {lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </span>
      );
    }
    if (id.startsWith('k')) {
      return (
        <span className={s.hopTag} data-kind={nodeKind(Number(id.slice(1)))}>
          {lines[0]}
        </span>
      );
    }
    if (id.startsWith('e')) {
      const open = edgeState(Number(id.slice(1))) === 'open';
      return <span className={open ? s.rangeOpen : s.rangeBarred}>{lines[0]}</span>;
    }
    const n = Number(id.slice(1));
    return (
      <span className={`${s.nodeTag} ${s[`tag_${nodeKind(n)}`]}`}>
        {lines.map((l, i) => (
          <span key={i} className={i > 0 && i === lines.length - 1 ? s.tagVersion : undefined}>
            {l}
          </span>
        ))}
      </span>
    );
  };
  // ── Drawing ──────────────────────────────────────────────────────────
  const hatchId = `hatch-${g.preset.id}`;
  const rimId = (i: number) => `rim-${g.preset.id}-${i}`;

  return (
    <div className={s.chartBox} data-mode={mode.kind}>
      <svg
        className={s.chart}
        viewBox="0 0 1000 1000"
        role="img"
        aria-labelledby={`t-${g.preset.id} d-${g.preset.id}`}
        data-intro={intro ? 'on' : undefined}
      >
        <title id={`t-${g.preset.id}`}>{props.title}</title>
        <desc id={`d-${g.preset.id}`}>{props.desc}</desc>
        <defs>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" className={s.hatchLine} />
          </pattern>
          {zones.map((z, i) => (
            <clipPath key={i} id={`zone-${g.preset.id}-${i}`}>
              <circle cx={CENTRE} cy={CENTRE} className={s.zoneClip} style={{ r: z.deep ? ringRadius(z.deep, L.rings) + 18 : 0 } as CSSProperties} />
            </clipPath>
          ))}
          {L.sectors.map((sec, i) => (
            <path key={i} id={rimId(i)} d={ringArc(470, sec.start + 2, sec.end - 2)} />
          ))}
        </defs>

        {/* The zone: one hatched wedge per door with a reached package. */}
        {zones.map((z, i) => (
          <g key={i} clipPath={`url(#zone-${g.preset.id}-${i})`} className={s.zone}>
            <path d={wedge(OUTER_R, z.sec.start, z.sec.end)} className={s.zoneWash} />
            <path d={wedge(OUTER_R, z.sec.start, z.sec.end)} fill={`url(#${hatchId})`} className={s.zoneFill} />
          </g>
        ))}

        {/* Rings, rim ticks, sector boundaries. */}
        {Array.from({ length: L.rings }, (_, i) => (
          <circle
            key={i}
            cx={CENTRE}
            cy={CENTRE}
            r={ringRadius(i + 1, L.rings)}
            className={i === 0 ? s.ringFirst : s.ring}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {Array.from({ length: 36 }, (_, i) => {
          const len = i % 3 === 0 ? 12 : 6;
          const a = polar(OUTER_R, i * 10);
          const b = polar(OUTER_R + len, i * 10);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={s.tick} vectorEffect="non-scaling-stroke" />;
        })}
        {L.sectors.map((sec, i) => {
          const a = polar(ROOT_R, sec.start);
          const b = polar(OUTER_R, sec.start);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={s.boundary} vectorEffect="non-scaling-stroke" />;
        })}
        {L.sectors.map((sec, i) => (
          <text key={i} className={`${s.rimText} ${sec.end - sec.start < 50 ? s.rimNarrow : ''}`}>
            <textPath href={`#${rimId(i)}`} startOffset="50%" textAnchor="middle">
              {sec.door >= 0 ? g.names[sec.door] : `outras ${sec.count} ${plural(sec.count ?? 0, 'direta', 'diretas')}`}
            </textPath>
          </text>
        ))}

        {/* The field: every package off the paths, at its true distance. */}
        <g className={s.field} aria-hidden="true">
          {L.field.map((d) => {
            const p = polar(ringRadius(d.ring, L.rings), d.angle);
            return <circle key={d.node} cx={p.x} cy={p.y} className={s.fieldDot} />;
          })}
        </g>

        {/* The front: the ring the nearest reached package sits on. */}
        {zones.map((z, i) => {
          const d = ringArc(ringRadius(z.near || 1, L.rings), z.sec.start, z.sec.end);
          return (
            <path
              key={i}
              d={d}
              className={s.front}
              data-on={z.near > 0 ? 'on' : undefined}
              vectorEffect="non-scaling-stroke"
              style={{ d: `path("${d}")` } as CSSProperties}
            />
          );
        })}

        {/* Edges, then gates. */}
        <g key={`${g.preset.id}-${mode.kind === 'whatif' ? mode.target : 'cd'}`}>
          {c.edges.map((e) => {
            const [from, to] = g.preset.edges[e];
            const r = route(place(from), place(to), L.rings);
            const kind = edgeKind(e);
            const hop = place(to).ring;
            return (
              <g key={e} style={{ '--hop': hop } as CSSProperties}>
                <path d={r.d} className={kind === 'barred' ? s.edgeBarred : s.edgeBase} vectorEffect="non-scaling-stroke" />
                <path
                  d={r.d}
                  pathLength={1}
                  className={s.edgeHot}
                  data-on={kind === 'open' || kind === 'reach' ? 'on' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
          {c.edges.filter(gated).map((e) => {
            const [from, to] = g.preset.edges[e];
            const r = route(place(from), place(to), L.rings);
            const st = edgeState(e);
            const dir = r.last.to > r.last.from ? -1 : 1;
            const q = polar(r.last.to, r.last.angle);
            const state = st === 'open' ? 'open' : st === 'barred' ? 'shut' : 'notyet';
            return (
              <g
                key={holding.has(e) ? `${e}-${stepKey}` : e}
                className={s.gate}
                data-state={state}
                data-hold={holding.has(e) ? 'on' : undefined}
                style={
                  {
                    transform: `translate(${f1(q.x)}px, ${f1(q.y)}px) rotate(${f1(r.last.angle)}deg) translateY(calc(var(--k) * ${-dir * 24}px)) scale(var(--k))`,
                  } as CSSProperties
                }
              >
                <g className={s.gateArm}>
                  <line x1={-11} y1={0} x2={11} y2={0} vectorEffect="non-scaling-stroke" />
                </g>
                <circle r={3} className={s.gatePivot} />
              </g>
            );
          })}
        </g>

        {/* Nodes. */}
        <circle cx={CENTRE} cy={CENTRE} r={ROOT_R} className={s.rootDisc} />
        {c.nodes
          .filter((n) => n > 0)
          .map((n) => {
            const p = at(n);
            const kind = nodeKind(n);
            return (
              <g key={n} className={s.node} data-kind={kind} data-selected={selected === n ? 'on' : undefined}>
                {kind === 'hit' && <circle cx={p.x} cy={p.y} className={s.halo} vectorEffect="non-scaling-stroke" />}
                <circle cx={p.x} cy={p.y} className={s.nodeDot} vectorEffect="non-scaling-stroke" />
                <circle cx={p.x} cy={p.y} className={s.selRing} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
      </svg>

      {/* HTML overlays: labels keep CSS pixel sizes at any chart width, one set per size. */}
      {(
        [
          ['small', s.labelsSmall],
          ['phone', s.labelsPhone],
          ['desk', s.labelsDesk],
        ] as const
      ).map(([key, cls]) => {
        const { placed, text, rings: shown } = layers[key];
        return (
          <div key={key} className={cls} aria-hidden="true">
            {shown.map((ring) => {
              const p = polar(ring.r, ring.angle);
              return (
                <span key={ring.k} className={s.ringTag} style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%` }}>
                  {ring.text}
                </span>
              );
            })}
            <Leaders placed={placed} />
            {placed.map((p) => (
              <span key={p.id} className={s.tag} style={{ left: `${p.left}%`, top: `${p.top}%` }}>
                {labelBody(p.id, text)}
              </span>
            ))}
          </div>
        );
      })}
      {c.nodes
        .filter((n) => n > 0)
        .map((n) => {
          const p = at(n);
          const kind = nodeKind(n);
          const state = kind === 'hit' ? (mode.kind === 'whatif' ? 'alvo' : 'infectado') : kind === 'barred' ? 'barrado' : 'no caminho';
          return (
            <button
              key={n}
              type="button"
              className={s.nodeHit}
              style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%` }}
              aria-label={`${g.names[n]} ${versionShown(n)}, ${place(n).ring} ${plural(place(n).ring, 'salto', 'saltos')}, ${state}. Ver todos os caminhos até ele.`}
              aria-pressed={mode.kind === 'whatif' && mode.target === n}
              onClick={() => props.onPick(n)}
              onMouseEnter={() => props.onHover(n)}
              onMouseLeave={() => props.onHover(null)}
              onFocus={() => props.onHover(n)}
              onBlur={() => props.onHover(null)}
            />
          );
        })}
      <p className={s.legendCorner}>
        <span>
          {g.preset.nodes.length} NO GRAFO · {c.nodes.length - 1} NO CAMINHO
        </span>
        <a href="#metodo" className={s.legendLink}>
          Faixas do grafo coletado em {props.fetchedAt} (deps.dev); raiz resolvida no instante escolhido
        </a>
      </p>
    </div>
  );
}

/** Hairlines from a mark to a label that had to sit away from it. */
function Leaders({ placed }: { placed: readonly Placed[] }) {
  const lines = placed.filter((p) => p.leader);
  if (lines.length === 0) return null;
  return (
    <svg className={s.leaders} viewBox="0 0 100 100" preserveAspectRatio="none">
      {lines.map((p) => (
        <line key={p.id} {...p.leader!} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
