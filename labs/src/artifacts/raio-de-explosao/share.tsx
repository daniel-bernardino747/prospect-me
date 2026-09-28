import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { OG_SIZE, type ShareModule, type ShareText } from '@/labs/share';

import { placeLabels, polar, ringArc, route, wedge } from './chart';
import {
  CENTRE,
  chainDropTargets,
  clockOf,
  collapse,
  dateBr,
  exposureAt,
  headline,
  layout,
  OUTER_R,
  type Piece,
  qualifier,
  type RaioData,
  ringRadius,
  ROOT_R,
  SHARE_KEYS,
  type State,
  stateOf,
  tabLine,
  whatIfHeadline,
} from './data';
import { loadRaio } from './load';
import { type ChartMode, chartState } from './scene';

/**
 * What a shared "Raio de explosão" link shows: the headline of that instant and
 * the zone chart drawn for it, on the page's chart paper, in its own type.
 */

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const C = {
  paper: '#EDEFEA',
  paperRaised: '#F7F8F5',
  ink: '#16181A',
  ink2: '#4A4F4B',
  rule: '#C5CAC2',
  ruleStrong: '#8C928A',
  fieldDot: '#AEB4AB',
  zona: '#A8105F',
  zonaHatch: 'rgba(168,16,95,0.42)',
  zonaWash: 'rgba(168,16,95,0.06)',
  barred: '#6B716A',
};

/** Each case's second sentence, as the page's deck says it, in plain text. */
const DECK: Record<string, string> = {
  stylelint: 'O keyv, onde o ataque começou, ficou de fora: ^5.6.0 não aceita 6.0.0.',
  got: 'O keyv ficou de fora: ^5.6.0 não aceita 6.0.0. A porta foi o cacheable-request, dependência direta.',
  eslint: 'Mesma família de pacotes, faixas mais antigas: nenhuma aceitava a versão infectada.',
};

interface View {
  data: RaioData;
  state: State;
  pieces: Piece[];
  sentence: string;
  qual: string;
  clock: string;
}

function view(search: Search): View {
  const data = loadRaio();
  const state = stateOf(data, { caso: one(search.caso), t: one(search.t), alvo: one(search.alvo) });
  const { g, entries, index, target } = state;
  const entry = entries[index];
  let pieces: Piece[];
  let qual: string;
  if (target !== null) {
    pieces = whatIfHeadline(g, target, collapse(g, [target]));
    qual = `hipótese, no grafo do ${g.preset.root.name} coletado em ${dateBr(data.fetchedAt)}`;
  } else {
    pieces = headline(data, g, entries, index, exposureAt(data, g, entry.at));
    qual = qualifier(entries, index);
  }
  const clock = entry.kind === 'removal' ? `~${clockOf(entry.at).slice(0, 5)}` : clockOf(entry.at);
  return { data, state, pieces, sentence: pieces.map((p) => p.v).join(''), qual, clock };
}

function describe(search: Search): ShareText {
  const v = view(search);
  const caso = v.state.g.preset.id;
  const rest =
    v.state.target !== null
      ? `Nenhum pacote aqui foi comprometido: é o grafo real do ${v.state.g.preset.root.name}, com todos os caminhos até o pacote escolhido.`
      : DECK[caso] ?? '';
  return {
    title: `Raio de explosão: ${v.sentence.replace(/\.$/, '')}`,
    description: `${v.qual.startsWith('npm') ? v.qual : `${v.qual.charAt(0).toUpperCase()}${v.qual.slice(1)}`}. ${rest} Dados públicos: IOCs do Datadog, deps.dev e o registro do npm.`,
  };
}

// ── The chart, as a static SVG ─────────────────────────────────────────────

function chartSvg(v: View): string {
  const { data, state } = v;
  const { g, entries, index, target } = state;
  const entry = entries[index];
  const whatIf = target !== null;
  const exposure = exposureAt(data, g, entry.at);
  const c = collapse(g, whatIf ? [target] : chainDropTargets(data, g));
  const L = layout(g, c);
  const mode: ChartMode = whatIf ? { kind: 'whatif', target } : { kind: 'chaindrop', exposure };
  const cs = chartState(g, L, c, mode, (pkg) => Boolean(data.malicious[pkg]));
  const { place, at, gated, nodeKind: kind } = cs;
  const st = cs.edgeState;
  const zones = cs.zones.filter((z) => z.near > 0);

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">`,
    `<defs><pattern id="h" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="${C.zonaHatch}" stroke-width="3"/></pattern></defs>`,
  );
  for (const z of zones) {
    const d = wedge(ringRadius(z.deep, L.rings) + 18, z.sec.start, z.sec.end);
    out.push(`<path d="${d}" fill="${C.zonaWash}"/><path d="${d}" fill="url(#h)"/>`);
  }
  for (let k = 1; k <= L.rings; k++) {
    out.push(
      `<circle cx="${CENTRE}" cy="${CENTRE}" r="${ringRadius(k, L.rings)}" fill="none" stroke="${k === 1 ? C.ruleStrong : C.rule}" stroke-width="${k === 1 ? 2.6 : 2}"/>`,
    );
  }
  for (let i = 0; i < 36; i++) {
    const a = polar(OUTER_R, i * 10);
    const b = polar(OUTER_R + (i % 3 === 0 ? 16 : 8), i * 10);
    out.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${C.ruleStrong}" stroke-width="2"/>`);
  }
  for (const sec of L.sectors) {
    const a = polar(ROOT_R, sec.start);
    const b = polar(OUTER_R, sec.start);
    out.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${C.ruleStrong}" stroke-width="2" stroke-dasharray="2 9"/>`);
  }
  for (const d of L.field) {
    const p = polar(ringRadius(d.ring, L.rings), d.angle);
    out.push(`<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${C.fieldDot}"/>`);
  }
  for (const z of zones) {
    out.push(
      `<path d="${ringArc(ringRadius(z.near, L.rings), z.sec.start, z.sec.end)}" fill="none" stroke="${C.zona}" stroke-width="8"/>`,
    );
  }
  for (const e of c.edges) {
    const [from, to] = g.preset.edges[e];
    const r = route(place(from), place(to), L.rings);
    const s = st(e);
    if (s === 'open' || whatIf) {
      out.push(`<path d="${r.d}" fill="none" stroke="${C.zona}" stroke-width="7" stroke-linecap="round"/>`);
    } else if (s === 'barred') {
      out.push(`<path d="${r.d}" fill="none" stroke="${C.barred}" stroke-width="3" stroke-dasharray="10 8"/>`);
    } else {
      out.push(`<path d="${r.d}" fill="none" stroke="${C.ink}" stroke-width="3.5"/>`);
    }
  }
  for (const e of c.edges.filter(gated)) {
    const [from, to] = g.preset.edges[e];
    const r = route(place(from), place(to), L.rings);
    const dir = r.last.to > r.last.from ? -1 : 1;
    const q = polar(r.last.to + dir * 26, r.last.angle);
    const s = st(e);
    // Shut: across the edge; open: along it.
    const across = s !== 'open';
    const a = r.last.angle + (across ? 90 : 0);
    const u = { x: Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180) };
    const colour = s === 'open' ? C.zona : s === 'barred' ? C.ink : C.ruleStrong;
    out.push(
      `<line x1="${q.x - u.x * 17}" y1="${q.y - u.y * 17}" x2="${q.x + u.x * 17}" y2="${q.y + u.y * 17}" stroke="${colour}" stroke-width="6"/>`,
      `<circle cx="${q.x}" cy="${q.y}" r="5" fill="${colour}"/>`,
    );
  }
  out.push(`<circle cx="${CENTRE}" cy="${CENTRE}" r="${ROOT_R}" fill="${C.ink}"/>`);
  for (const n of c.nodes.filter((x) => x > 0)) {
    const p = at(n);
    const k = kind(n);
    if (k === 'hit') {
      out.push(
        `<circle cx="${p.x}" cy="${p.y}" r="27" fill="none" stroke="${C.zona}" stroke-width="2.5"/>`,
        `<circle cx="${p.x}" cy="${p.y}" r="17" fill="${C.zona}"/>`,
      );
    } else if (k === 'barred') {
      out.push(
        `<circle cx="${p.x}" cy="${p.y}" r="17" fill="${C.paper}" stroke="${C.barred}" stroke-width="3.5" stroke-dasharray="6 5"/>`,
      );
    } else {
      out.push(`<circle cx="${p.x}" cy="${p.y}" r="13" fill="${C.paper}" stroke="${C.ink}" stroke-width="3.5"/>`);
    }
  }
  out.push('</svg>');
  return out.join('');
}

// ── The image ──────────────────────────────────────────────────────────────

const FONT_DIR = join(process.cwd(), 'src/artifacts/raio-de-explosao/fonts');
let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 700 | 800 | 400; style: 'normal' }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(
    (
      [
        ['Display', 'SofiaSansExtraCondensed-ExtraBold.ttf', 800],
        ['Label', 'SofiaSansCondensed-Medium.ttf', 500],
        ['Label', 'SofiaSansCondensed-Bold.ttf', 700],
        ['Code', 'FragmentMono-Regular.ttf', 400],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      data: await readFile(join(FONT_DIR, file)),
      weight,
      style: 'normal' as const,
    })),
  ));

const CHART_PX = 540;

/** The headline, word by word, so figures, names and prose flow as one sentence in Satori's flexbox. */
function Headline({ pieces, size }: { pieces: Piece[]; size: number }) {
  // `glue`: no space before this word ("stylelint" then ".").
  const words: { text: string; t: Piece['t']; glue: boolean }[] = [];
  let open = true;
  for (const p of pieces) {
    p.v.split(' ').forEach((w, i) => {
      if (w) words.push({ text: w, t: p.t, glue: i === 0 && !open });
      open = false;
    });
    open = p.v.endsWith(' ');
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', fontSize: size, lineHeight: 0.98 }}>
      {words.map((w, i) => {
        const glued = words[i + 1]?.glue;
        return (
          <span
            key={i}
            style={{
              fontFamily: w.t === 'code' ? 'Code' : 'Display',
              fontSize: w.t === 'code' ? size * 0.62 : size,
              color: w.t === 'fig' ? C.zona : C.ink,
              marginRight: glued ? 0 : size * 0.2,
              letterSpacing: w.t === 'code' ? 0 : -0.5,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}

async function image(search: Search) {
  const v = view(search);
  const { g, target } = v.state;
  const whatIf = target !== null;
  const exposure = exposureAt(v.data, g, v.state.entries[v.state.index].at);
  const c = collapse(g, whatIf ? [target] : chainDropTargets(v.data, g));
  const L = layout(g, c);
  const reached = whatIf ? [target] : exposure.reached;
  const nearRing = reached.length ? Math.min(...reached.filter((n) => c.nodes.includes(n)).map((n) => L.place.get(n)!.ring)) : 0;
  const outras = L.sectors.find((sec) => sec.door === -1);
  const door = reached.length ? L.sectors.find((sec) => sec.door === g.door[reached[0]]) : undefined;
  const nodeAt = (n: number) => polar(ringRadius(L.place.get(n)!.ring, L.rings), L.place.get(n)!.angle);

  // Two labels only, so the thumbnail stays legible: the root, and the front.
  const specs = [
    {
      id: 'root',
      at: { x: CENTRE, y: CENTRE },
      clear: ROOT_R,
      lines: [`${g.names[0]} ${g.versions[0]}`],
      face: 'code' as const,
      fontPx: 20,
      mode: { kind: 'below' as const, toward: outras ? (outras.start + outras.end) / 2 : undefined },
    },
    ...(door && Number.isFinite(nearRing) && nearRing > 0
      ? [
          {
            id: 'front',
            at: polar(ringRadius(nearRing, L.rings), (door.start + door.end) / 2),
            clear: 0,
            lines: [`${whatIf ? 'ALVO' : 'FRENTE'} · ${nearRing} ${nearRing === 1 ? 'SALTO' : 'SALTOS'}`],
            face: 'label' as const,
            fontPx: 22,
            mode: { kind: 'arc' as const, r: ringRadius(nearRing, L.rings), from: door.start, to: door.end },
          },
        ]
      : []),
  ];
  const placed = placeLabels(specs, {
    px: CHART_PX,
    marks: [{ at: { x: CENTRE, y: CENTRE }, r: ROOT_R }, ...c.nodes.filter((n) => n > 0).map((n) => ({ at: nodeAt(n), r: 30 }))],
    // No sector names are drawn in the image: a label may reach the rim.
    limitR: 495,
  });

  const svg = chartSvg(v);
  const tab = tabLine(v.data, g);
  const size = v.sentence.length <= 64 ? 80 : v.sentence.length <= 90 ? 68 : 58;
  const label = { fontFamily: 'Label', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: C.paper,
          color: C.ink,
          padding: '36px 48px 34px 56px',
          fontFamily: 'Label',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 14,
            borderBottom: `2px solid ${C.ink}`,
            fontSize: 21,
            ...label,
          }}
        >
          <span>Demo conceitual · Daniel Bernardino</span>
          <span style={{ color: C.ink2 }}>
            Raio de explosão · 04·08·2026 {v.clock} UTC
          </span>
        </div>

        <div style={{ display: 'flex', flex: 1, marginTop: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 590, paddingTop: 22 }}>
            <Headline pieces={v.pieces} size={size} />
            <div style={{ display: 'flex', marginTop: 16, fontSize: 25, fontWeight: 500, color: C.ink2 }}>{v.qual}</div>
            <div style={{ display: 'flex', marginTop: 26 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: C.ink,
                  color: C.paper,
                  padding: '10px 16px',
                }}
              >
                <span style={{ fontFamily: 'Code', fontSize: 24 }}>
                  {g.preset.root.name} {g.preset.root.version}
                </span>
                <span style={{ fontSize: 17, marginTop: 4, ...label, letterSpacing: 1.2 }}>
                  {whatIf ? `e se: ${g.names[target]}` : tab.long}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flex: 1 }} />
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 500, color: C.ink2, lineHeight: 1.35, width: 560 }}>
              Dados públicos: IOCs do ChainDrop (Datadog Security Labs), deps.dev (CC BY 4.0) e registro do npm, coletados
              em {dateBr(v.data.fetchedAt)}.
            </div>
          </div>

          <div style={{ display: 'flex', position: 'relative', width: CHART_PX, height: CHART_PX, marginLeft: 'auto', marginTop: -8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws an <img>, not next/image */}
            <img
              alt=""
              width={CHART_PX}
              height={CHART_PX}
              src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`}
            />
            {placed.map((p) => {
              const front = p.id === 'front';
              return (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: p.box.x,
                    top: p.box.y,
                    display: 'flex',
                    padding: '2px 6px',
                    background: front ? C.zona : C.paperRaised,
                    color: front ? '#FFFFFF' : C.ink,
                    border: front ? 'none' : `1.5px solid ${C.ink}`,
                    fontFamily: front ? 'Label' : 'Code',
                    fontWeight: front ? 700 : 400,
                    fontSize: front ? 22 : 20,
                    letterSpacing: front ? 1.5 : 0,
                  }}
                >
                  {specs.find((sp) => sp.id === p.id)!.lines[0]}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}

const share: ShareModule = { keys: SHARE_KEYS, describe, image };
export default share;
