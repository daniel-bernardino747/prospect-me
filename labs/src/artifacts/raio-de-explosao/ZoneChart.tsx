import type { CSSProperties } from 'react';

import { type LabelSpec, type Placed, placeLabels, polar, ringArc, route, wedge } from './chart';
import {
  CENTRE,
  type Collapsed,
  type EdgeState,
  type Exposure,
  type Graph,
  type Layout,
  OUTER_R,
  ringRadius,
  ROOT_R,
} from './data';
import s from './raio.module.css';

export type ChartMode = { kind: 'chaindrop'; exposure: Exposure } | { kind: 'whatif'; target: number };

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
  onPick: (node: number) => void;
  onHover: (node: number | null) => void;
}

/** Node radii in chart units at desktop scale; phones scale them by --k in CSS. */
const NODE_R = 9;
const HIT_R = 11;
const PHONE_PX = 340;
const DESK_PX = 720;
const PHONE_K = 1.7;
/** Labels stay inside the tick ring, so the sector names on the rim stay readable. */
const LABEL_R = OUTER_R + 14;

type NodeKind = 'root' | 'hit' | 'barred' | 'clean';
type EdgeKind = 'open' | 'barred' | 'neutral' | 'reach';

const f1 = (n: number) => Math.round(n * 10) / 10;
const plural = (k: number, one: string, many: string) => (k === 1 ? one : many);

export function ZoneChart(props: Props) {
  const { g, L, c, mode, selected, holding, stepKey, intro } = props;
  const inView = new Set(c.nodes);
  const place = (n: number) => L.place.get(n)!;
  const at = (n: number) => polar(n === 0 ? 0 : ringRadius(place(n).ring, L.rings), place(n).angle);

  // ── States ───────────────────────────────────────────────────────────
  const gated = (e: number) => mode.kind === 'chaindrop' && props.hasMalicious(g.names[g.preset.edges[e][1]]);
  const edgeState = (e: number): EdgeState => (mode.kind === 'chaindrop' ? mode.exposure.edges[e] : 'none');
  const edgeKind = (e: number): EdgeKind => {
    if (mode.kind === 'whatif') return 'reach';
    const st = edgeState(e);
    return st === 'open' ? 'open' : st === 'barred' ? 'barred' : 'neutral';
  };
  const nodeKind = (n: number): NodeKind => {
    if (n === 0) return 'root';
    if (mode.kind === 'whatif') return n === mode.target ? 'hit' : 'clean';
    if (mode.exposure.resolved.has(n)) return 'hit';
    const into = c.edges.filter((e) => g.preset.edges[e][1] === n);
    if (props.hasMalicious(g.names[n]) && into.length > 0 && into.every((e) => edgeState(e) === 'barred')) return 'barred';
    return 'clean';
  };

  // Reached nodes, per door: the zone and its front.
  const reached = mode.kind === 'chaindrop' ? mode.exposure.reached : [mode.target];
  const zones = L.sectors
    .filter((sec) => sec.door >= 0)
    .map((sec) => {
      const mine = reached.filter((n) => g.door[n] === sec.door && inView.has(n));
      if (mine.length === 0) return { sec, deep: 0, near: 0 };
      const rings = mine.map((n) => place(n).ring);
      return { sec, deep: Math.max(...rings), near: Math.min(...rings) };
    });
  const nearest = zones.filter((z) => z.near > 0).sort((a, b) => a.near - b.near)[0];

  // ── Labels ───────────────────────────────────────────────────────────
  const versionShown = (n: number) =>
    mode.kind === 'chaindrop' && mode.exposure.resolved.has(n) ? mode.exposure.resolved.get(n)!.version : g.versions[n];
  const byPriority = [...c.nodes].sort((a, b) => {
    const rank = (n: number) => ({ root: 0, hit: 1, barred: 2, clean: 3 })[nodeKind(n)];
    return rank(a) - rank(b) || place(a).ring - place(b).ring || a - b;
  });
  const nodeSpec = (n: number, scale: number): LabelSpec => ({
    id: `n${n}`,
    at: at(n),
    clear: n === 0 ? ROOT_R : (nodeKind(n) === 'hit' ? HIT_R : NODE_R) * scale,
    lines: [g.names[n], nodeKind(n) === 'barred' ? `${versionShown(n)} · barrado` : versionShown(n)],
    face: 'code',
  });
  const frontSpec: LabelSpec[] = nearest
    ? [
        {
          id: 'front',
          at: polar(ringRadius(nearest.near, L.rings), nearest.sec.start + 4),
          clear: 8,
          lines: [`FRENTE · ${nearest.near} ${plural(nearest.near, 'SALTO', 'SALTOS')}`],
          face: 'label',
        },
      ]
    : [];
  const marks = (scale: number) => [
    { at: { x: CENTRE, y: CENTRE }, r: ROOT_R },
    ...c.nodes.filter((n) => n > 0).map((n) => ({ at: at(n), r: HIT_R * scale })),
    ...Array.from({ length: L.rings }, (_, i) => ({ at: polar(ringRadius(i + 1, L.rings), 0), r: 26 })),
  ];

  const phoneFirst = byPriority.filter((n) => n === 0 || nodeKind(n) !== 'clean');
  const phoneSpecs = phoneFirst.map((n) => nodeSpec(n, PHONE_K));
  // The front outranks the barred labels on a phone: it is the answer's distance.
  const hitCount = phoneFirst.filter((n) => nodeKind(n) !== 'barred').length;
  const phonePlaced = placeLabels(
    [...phoneSpecs.slice(0, hitCount), ...frontSpec, ...phoneSpecs.slice(hitCount)],
    PHONE_PX,
    12,
    marks(PHONE_K),
    [],
    LABEL_R,
  );
  const phoneNamed = new Set(phonePlaced.map((p) => p.id));
  const numberSpecs: LabelSpec[] = c.nodes
    .filter((n) => n > 0 && !phoneNamed.has(`n${n}`))
    .map((n) => ({ id: `k${n}`, at: at(n), clear: NODE_R * PHONE_K, lines: [String(place(n).ring)], face: 'label' }));
  const phoneNumbers = placeLabels(
    numberSpecs,
    PHONE_PX,
    11,
    marks(PHONE_K),
    phonePlaced.map((p) => p.box),
    LABEL_R,
  );

  const rangeSpecs: LabelSpec[] =
    mode.kind === 'chaindrop'
      ? c.edges
          .filter((e) => gated(e) && (edgeState(e) === 'open' || edgeState(e) === 'barred'))
          .map((e) => {
            const [from, to, req] = g.preset.edges[e];
            const r = route(place(from), place(to), L.rings);
            const v = mode.exposure.resolved.get(to)?.version;
            return {
              id: `e${e}`,
              at: r.mid,
              clear: 6,
              lines: [edgeState(e) === 'open' ? `${req} · aceitava ${v}` : `${req} · barrado`],
              face: 'code' as const,
            };
          })
      : [];
  const deskPlaced = placeLabels(
    [...byPriority.map((n) => nodeSpec(n, 1)), ...frontSpec, ...rangeSpecs],
    DESK_PX,
    12,
    marks(1),
    [],
    LABEL_R,
  );

  const labelBody = (id: string) => {
    if (id === 'front') return <span className={s.frontTag}>{frontSpec[0].lines[0]}</span>;
    if (id.startsWith('k')) return <span className={s.hopTag}>{place(Number(id.slice(1))).ring}</span>;
    if (id.startsWith('e')) {
      const e = Number(id.slice(1));
      const open = edgeState(e) === 'open';
      return <span className={open ? s.rangeOpen : s.rangeBarred}>{rangeSpecs.find((r) => r.id === id)!.lines[0]}</span>;
    }
    const n = Number(id.slice(1));
    const kind = nodeKind(n);
    return (
      <span className={`${s.nodeTag} ${s[`tag_${kind}`]}`}>
        <span>{g.names[n]}</span>
        <span className={s.tagVersion}>{kind === 'barred' ? `${versionShown(n)} · barrado` : versionShown(n)}</span>
      </span>
    );
  };

  // ── Drawing ──────────────────────────────────────────────────────────
  const hatchId = `hatch-${g.preset.id}`;
  const rimId = (i: number) => `rim-${g.preset.id}-${i}`;
  const outerHop = Math.max(...g.depth.filter(Number.isFinite));

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

      {/* HTML overlays: labels keep CSS pixel sizes at any chart width. */}
      {Array.from({ length: L.rings }, (_, i) => {
        const p = polar(ringRadius(i + 1, L.rings), 0);
        const last = i + 1 === L.rings && outerHop > L.rings;
        return (
          <span
            key={i}
            className={s.ringTag}
            aria-hidden="true"
            style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%` }}
          >
            {i === 0 ? '1 SALTO' : last ? `${i + 1}+` : i + 1}
          </span>
        );
      })}
      <div className={s.phoneLabels} aria-hidden="true">
        <Leaders placed={phonePlaced} />
        {[...phonePlaced, ...phoneNumbers].map((p) => (
          <span key={p.id} className={s.tag} style={{ left: `${p.left}%`, top: `${p.top}%` }}>
            {labelBody(p.id)}
          </span>
        ))}
      </div>
      <div className={s.deskLabels} aria-hidden="true">
        <Leaders placed={deskPlaced} />
        {deskPlaced.map((p) => (
          <span key={p.id} className={s.tag} style={{ left: `${p.left}%`, top: `${p.top}%` }}>
            {labelBody(p.id)}
          </span>
        ))}
      </div>
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
