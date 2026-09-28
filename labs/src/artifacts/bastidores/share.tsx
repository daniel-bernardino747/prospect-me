import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { OG_SIZE, type ShareModule } from '@/labs/share';

import { layoutBoard } from './board';
import {
  type Bastidores,
  BREAK_UNITS,
  clock,
  columns,
  day,
  dayYear,
  duration,
  int,
  LANES,
  processed,
  runActiveMs,
  shippedLines,
  STATIONS,
  tokensShort,
  toolCalls,
  totals,
  waitMs,
} from './data';
import { loadBastidores } from './load';
import { findSelected, runTitle, type Selected, shareWords, stopLabel } from './texts';

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const C = {
  parede: '#BEBCB4',
  quadro: '#F2F2EE',
  lip: '#E4E1D6',
  ink: '#141414',
  ink2: '#2E2D2A',
  muted: '#3F3E3A',
  tick: '#9C9A93',
  parada: '#F4C300',
};
const STOCK: Record<string, string> = {
  orquestrador: '#D6D5CF',
  nichos: '#E4E1D6',
  pesquisa: '#D9BC8C',
  design: '#EBA3B5',
  critica: '#F2F2EE',
  build: '#8DB6DE',
  polimento: '#A7D3B0',
  deploy: '#EE9A5A',
  parou: '#141414',
};
const STRIPES = `repeating-linear-gradient(-45deg, ${C.parada} 0px, ${C.parada} 7px, ${C.ink} 7px, ${C.ink} 14px)`;

const dir = join(process.cwd(), 'src/artifacts/bastidores/fonts');
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 900; style: 'normal' }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(join(dir, 'overpass-latin-400-normal.woff')).then((data) => ({ name: 'Overpass', data, weight: 400 as const, style: 'normal' as const })),
    readFile(join(dir, 'overpass-latin-700-normal.woff')).then((data) => ({ name: 'Overpass', data, weight: 700 as const, style: 'normal' as const })),
    readFile(join(dir, 'overpass-latin-900-normal.woff')).then((data) => ({ name: 'Overpass', data, weight: 900 as const, style: 'normal' as const })),
    readFile(join(dir, 'overpass-mono-latin-500-normal.woff')).then((data) => ({ name: 'Overpass Mono', data, weight: 500 as const, style: 'normal' as const })),
    readFile(join(dir, 'overpass-mono-latin-700-normal.woff')).then((data) => ({ name: 'Overpass Mono', data, weight: 700 as const, style: 'normal' as const })),
  ]));

const bastidores: ShareModule = {
  keys: ['r'],
  describe(search) {
    const data = loadBastidores();
    const sel = findSelected(data, one(search.r));
    if (!sel) return undefined;
    const w = shareWords(data, sel);
    return { title: w.title, description: w.description };
  },
  async image(search: Search) {
    const data = loadBastidores();
    const sel = findSelected(data, one(search.r));
    return new ImageResponse(<Og data={data} sel={sel} />, { ...OG_SIZE, fonts: await loadFonts() });
  },
};

export default bastidores;

// ── The image ────────────────────────────────────────────────────────────

const mono = { fontFamily: 'Overpass Mono' } as const;

function Og({ data, sel }: { data: Bastidores; sel: Selected | null }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: C.parede,
        color: C.ink,
        fontFamily: 'Overpass',
        padding: '40px 48px 30px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.9 }}>Bastidores</div>
        <div style={{ display: 'flex', ...mono, fontSize: 20, fontWeight: 500, color: C.ink2, marginTop: 4 }}>Demo conceitual · Daniel Bernardino</div>
      </div>
      <Headline data={data} sel={sel} />
      <MiniBoard data={data} sel={sel} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, ...mono, fontSize: 17, fontWeight: 500, color: C.ink2 }}>
        <div style={{ display: 'flex' }}>Fonte: a sessão de trabalho de Daniel no Claude Code e o git deste repositório</div>
        <div style={{ display: 'flex' }}>{`até ${dayYear(data.asOf)}`}</div>
      </div>
    </div>
  );
}

function Fig({ children, human, first }: { children: string; human?: boolean; first?: boolean }) {
  return (
    <span
      style={{
        ...mono,
        fontWeight: 700,
        fontSize: '0.92em',
        margin: first ? '0 10px 0 0' : '0 10px',
        ...(human ? { borderBottom: `6px solid ${C.parada}` } : {}),
      }}
    >
      {children}
    </span>
  );
}

function Headline({ data, sel }: { data: Bastidores; sel: Selected | null }) {
  const t = totals(data);
  const demos = shippedLines(data).length;
  const box = { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', fontSize: 46, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.015em', marginTop: 24 } as const;
  if (!sel) {
    return (
      <div style={box}>
        <Fig first>{`${t.agents} agentes`}</Fig>
        <span>de IA fizeram</span>
        <Fig>{`${demos} demos`}</Fig>
        <span>em</span>
        <Fig>{`${t.phases} fases`}</Fig>
        <span style={{ marginRight: 14 }}>;</span>
        <span>Daniel decidiu em</span>
        <Fig human>{`${t.decided} ${t.decided === 1 ? 'ponto' : 'pontos'}`}</Fig>
        <span>e a linha parou por ele.</span>
      </div>
    );
  }
  if (sel.kind === 'run') {
    const r = sel.run;
    const stopped = r.result.viable === false;
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, gap: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 96,
            height: 64,
            padding: '0 12px',
            borderRadius: 4,
            background: stopped ? STOCK.parou : STOCK[STATIONS[r.code].stock],
            color: stopped ? C.quadro : C.ink,
            ...(r.code === 'CR' ? { borderTop: `6px solid ${C.ink}` } : {}),
            boxShadow: '0 2px 3px rgba(20,20,20,0.3)',
            ...mono,
            fontWeight: 700,
            fontSize: 34,
          }}
        >
          {r.code}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.015em' }}>{runTitle(r)}</div>
          <div style={{ display: 'flex', ...mono, fontSize: 26, fontWeight: 500, marginTop: 8 }}>
            {`${duration(runActiveMs(r))} · ${int(toolCalls(r))} chamadas · ${tokensShort(processed(r))} tokens`}
          </div>
        </div>
      </div>
    );
  }
  if (sel.kind === 'stop') {
    const cp = sel.cp;
    const chosen = cp.questions.map((q) => (q.chosen.length ? `${q.header}: ${q.chosen.join(', ')}` : q.header)).join(' · ');
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, gap: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 96,
            height: 64,
            borderRadius: 4,
            background: C.parada,
            border: `3px solid ${C.ink}`,
            ...mono,
            fontWeight: 700,
            fontSize: 34,
          }}
        >
          {stopLabel(cp)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>
            {cp.status === 'respondida'
              ? `A linha parou ${duration(waitMs(cp, data.asOf))}; Daniel decidiu`
              : cp.status === 'interrompida'
                ? `A linha parou ${duration(waitMs(cp, data.asOf))}: a sessão terminou`
                : 'A linha está parada, esperando Daniel'}
          </div>
          <div style={{ display: 'flex', fontSize: 24, marginTop: 8, lineHeight: 1.25, color: C.ink2 }}>
            {chosen.length > 110 ? `${chosen.slice(0, 109)}…` : chosen}
          </div>
        </div>
      </div>
    );
  }
  const c = sel.commit;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
      <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{c.subject}</div>
      <div style={{ display: 'flex', ...mono, fontSize: 24, fontWeight: 500, marginTop: 8 }}>
        {`${c.hash} · ${day(c.at)} ${clock(c.at)} · ${c.filesChanged} arquivos, +${int(c.insertions)}`}
      </div>
    </div>
  );
}

function MiniBoard({ data, sel }: { data: Bastidores; sel: Selected | null }) {
  const layout = layoutBoard(data, columns(data));
  const W = layout.axis.width;
  const LABEL = 156;
  const INNER = 1104 - 6 - LABEL;
  const ROWH = 27;
  const STRIP = 16;
  const x = (u: number) => (u / W) * INNER;
  const focus = sel?.kind === 'run' ? sel.run.id : sel?.kind === 'stop' ? sel.cp.id : null;
  const dim = focus !== null;
  const H = STRIP + LANES.length * ROWH;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
    <div
      style={{
        display: 'flex',
        width: 1104,
        height: H + 6,
        border: `3px solid ${C.ink}`,
        background: C.quadro,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: LABEL, borderRight: `2px solid ${C.ink}` }}>
        <div style={{ display: 'flex', height: STRIP, background: C.ink }} />
        {LANES.map((l) => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: ROWH,
              paddingLeft: 8,
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              borderTop: `2px solid ${C.lip}`,
              borderBottom: `1px solid ${C.ink}`,
            }}
          >
            {l.id === 'daniel' ? <div style={{ display: 'flex', width: 8, height: 8, background: C.parada, marginRight: 6, border: `1px solid ${C.ink}` }} /> : null}
            {l.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', position: 'relative', width: INNER, height: H }}>
        <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: INNER, height: STRIP, background: C.ink }} />
        {LANES.map((l, i) => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              position: 'absolute',
              left: 0,
              top: STRIP + i * ROWH,
              width: INNER,
              height: ROWH,
              borderTop: `2px solid ${C.lip}`,
              borderBottom: `1px solid ${C.ink}`,
            }}
          />
        ))}
        {layout.axis.columns.map((c, i) =>
          c.kind === 'break' ? (
            <div
              key={`b${i}`}
              style={{
                display: 'flex',
                position: 'absolute',
                left: x(layout.axis.offsets[i]),
                top: STRIP,
                width: Math.max(3, x(BREAK_UNITS)),
                height: H - STRIP,
                background: C.lip,
              }}
            />
          ) : null,
        )}
        {layout.bands.map((b) => (
          <div
            key={b.cp.id}
            style={{
              display: 'flex',
              position: 'absolute',
              left: x(b.from),
              top: 0,
              width: Math.max(5, x(b.to - b.from)),
              height: H,
              backgroundImage: STRIPES,
              opacity: dim && focus !== b.cp.id ? 0.45 : 1,
            }}
          />
        ))}
        {layout.pieces.map((pc, k) => {
          const r = pc.run;
          const stopped = r.result.viable === false;
          const on = focus === r.id;
          return (
            <div
              key={`${r.id}-${k}`}
              style={{
                display: 'flex',
                position: 'absolute',
                left: x(pc.from) + 1,
                top: STRIP + pc.lane * ROWH + 4 + pc.stack * 2,
                width: Math.max(3, x(pc.to - pc.from) - 2),
                height: ROWH - 8 - pc.stack * 2,
                borderRadius: 2,
                background: stopped ? STOCK.parou : STOCK[STATIONS[r.code].stock],
                ...(r.code === 'CR' ? { borderTop: `3px solid ${C.ink}` } : {}),
                ...(on ? { border: `3px solid ${C.ink}` } : {}),
                opacity: dim && !on ? 0.35 : 1,
              }}
            />
          );
        })}
        {layout.bands.map((b) => (
          <div
            key={`d${b.cp.id}`}
            style={{
              display: 'flex',
              position: 'absolute',
              left: x(b.from),
              top: STRIP + 3,
              width: Math.max(12, x(b.to - b.from)),
              height: ROWH - 6,
              background: C.parada,
              border: `2px solid ${C.ink}`,
              borderRadius: 2,
              ...(focus === b.cp.id ? { borderWidth: 4 } : {}),
            }}
          />
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', width: 1104, height: 6, background: '#B1AFA7' }} />
    </div>
  );
}
