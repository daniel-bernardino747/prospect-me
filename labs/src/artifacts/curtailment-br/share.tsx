import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { OG_SIZE, type ShareModule } from '@/labs/share';

import { boardDay, decodePoints, lampFrame } from './board';
import {
  answer,
  cutMw,
  cutShare,
  type Day,
  dateBr,
  engrave,
  hourClock,
  mw,
  PATAMARES,
  pctFine,
  pctWhole,
  pickDay,
  shareCopy,
  weekday,
} from './data';
import { loadCurtailment } from './load';

/**
 * The link preview, drawn as the page's first screen: the day's sentence in
 * Atkinson with its figures in B612, the lit mimic board at the peak, the reason
 * busbar and the recorder strip. Everything on it comes from `data.json`.
 */

const DEFAULT_DAY = '2026-08-16';
const FONTS = 'src/artifacts/curtailment-br/fonts';

// The page's tokens (DESIGN.md), as Satori takes them.
const C = {
  console: '#a9c3b5',
  consoleDeep: '#93b1a2',
  enamel: '#dde6df',
  enamelRaised: '#eaf0eb',
  jointLand: '#c6d3ca',
  jointSea: '#9cb7a9',
  borderUf: '#4b5b53',
  ink: '#16201b',
  ink2: '#3e4d46',
  plate: '#161b19',
  plateInk: '#f1f4ef',
  bezel: '#1e2723',
  socket: '#2e3a34',
  glassOff: '#6f8078',
  sobra: '#f4b02a',
  rede: '#d63a22',
};

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | undefined;
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        ['Atkinson', 'AtkinsonHyperlegibleNext-Bold.ttf', 700],
        ['B612', 'B612-Bold.ttf', 700],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      data: await readFile(join(process.cwd(), FONTS, file)),
      weight,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const f1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---------------------------------------------------------------------------
// The board, as one SVG: the same tiles, borders and lamps the page draws at the peak.

/** The west edge holds no lamp (Paracatu, MG, is the westernmost at x = 64); the top band is the empty plate rail. */
const CROP_X = 48;
/** Lamps a little larger than on the page, all by the same factor, so they still read in a thumbnail. */
const LAMP_GAIN = 1.25;

function boardSvg(day: Day): { svg: string; width: number; height: number; plates: { uf: string; mwh: number; x: number; y: number }[] } {
  const data = loadCurtailment();
  const board = boardDay(data, day);
  const { width: W, height: H, rail, ufs, seams, borders } = board.map;
  const vx = CROP_X;
  const vy = rail;
  const vw = W - CROP_X;
  const vh = H - rail;
  const lamps: string[] = [];
  for (const p of decodePoints(board)) {
    if (p.x === null || p.y === null) continue;
    const fr = lampFrame(p, board, board.peak);
    const g = LAMP_GAIN;
    const x = p.x.toFixed(1);
    const y = p.y.toFixed(1);
    let lamp = `<circle cx="${x}" cy="${y}" r="${(p.rb * g).toFixed(2)}" fill="${C.socket}" stroke="${C.bezel}" stroke-width="1.5"/>`;
    if (fr.rg > 0) lamp += `<circle cx="${x}" cy="${y}" r="${(fr.rg * g).toFixed(2)}" fill="${C.glassOff}"/>`;
    if (fr.rc > 0 && fr.glass) {
      const rc = fr.rc * g;
      lamp += `<circle cx="${x}" cy="${y}" r="${rc.toFixed(2)}" fill="${fr.glass === 'sobra' ? C.sobra : C.rede}"/>`;
      if (rc >= 4) {
        lamp += `<circle cx="${(p.x - 0.3 * rc).toFixed(1)}" cy="${(p.y - 0.3 * rc).toFixed(1)}" r="${(0.28 * rc).toFixed(2)}" fill="#fff" fill-opacity="0.25"/>`;
      }
      if (fr.glass === 'rede' && rc >= 3) {
        lamp += `<line x1="${(p.x - 0.7 * rc).toFixed(1)}" x2="${(p.x + 0.7 * rc).toFixed(1)}" y1="${y}" y2="${y}" stroke="${C.plate}" stroke-width="1.4"/>`;
      }
    }
    lamps.push(lamp);
  }
  const land = ufs.map((u) => `<path d="${u.d}"/>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">` +
    `<defs><clipPath id="land">${land}</clipPath></defs>` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${C.console}"/>` +
    `<path d="${seams}" fill="none" stroke="${C.jointSea}" stroke-width="0.6"/>` +
    `<g fill="${C.enamel}">${land}</g>` +
    `<path d="${seams}" fill="none" stroke="${C.jointLand}" stroke-width="0.6" clip-path="url(#land)"/>` +
    `<path d="${borders}" fill="none" stroke="${C.borderUf}" stroke-width="1.2"/>` +
    lamps.join('') +
    `</svg>`;

  // Engraved plates for the three states with the most cut on the map, at their tile centroids.
  const onMap = new Map<string, number>();
  for (const p of board.points) if (p.x !== null) onMap.set(p.uf, (onMap.get(p.uf) ?? 0) + p.cutMwh);
  const plates = [...onMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .flatMap(([uf, mwh]) => {
      const u = ufs.find((x) => x.uf === uf);
      return u ? [{ uf, mwh, x: (u.cx - vx) / vw, y: (u.cy - vy) / vh }] : [];
    });
  return { svg, width: vw, height: vh, plates };
}

// ---------------------------------------------------------------------------
// Pieces

const engraving = { fontFamily: 'B612', fontWeight: 700, letterSpacing: '0.08em' } as const;

function Plate({ children, size = 17 }: { children: string; size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        ...engraving,
        fontSize: size,
        lineHeight: 1,
        color: C.plateInk,
        background: C.plate,
        padding: '8px 12px 7px',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

/** The h1, word by word, so the two figures carry their underbars and nothing else breaks the flow. */
function Answer({ day }: { day: Day }) {
  const a = answer(day);
  const lead = `${WEEKDAYS[weekday(day.date)]}, ${dateBr(day.date)}: eólicas e solares deixaram de gerar`;
  const words: { text: string; bar?: string; pre?: string; post?: string }[] = [
    ...lead.split(' ').map((text) => ({ text })),
    { text: a.cut, bar: C.sobra },
    ...a.middle.trim().split(' ').map((text) => ({ text })),
  ];
  if (a.gen) {
    // "(401 GWh)." keeps its parentheses glued to the figure, outside its underbar.
    const open = words.pop()!;
    if (open.text !== '(') words.push({ text: open.text.replace(/\($/, '') });
    words.push({ text: a.gen, bar: C.ink2, pre: '(', post: a.tail });
  } else {
    words[words.length - 1].text += a.tail;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        fontFamily: 'Atkinson',
        fontWeight: 700,
        fontSize: 48,
        lineHeight: 1.14,
        letterSpacing: '-0.01em',
        color: C.ink,
        columnGap: 12,
        rowGap: 2,
      }}
    >
      {words
        .filter((w) => w.text)
        .map((w, i) =>
          w.bar ? (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
              {w.pre && <div style={{ display: 'flex' }}>{w.pre}</div>}
              <div style={{ display: 'flex', fontFamily: 'B612', fontSize: 44, borderBottom: `6px solid ${w.bar}` }}>
                {w.text}
              </div>
              {w.post && <div style={{ display: 'flex' }}>{w.post}</div>}
            </div>
          ) : (
            <div key={i} style={{ display: 'flex' }}>
              {w.text}
            </div>
          ),
        )}
    </div>
  );
}

function Glyph({ glass, size = 18 }: { glass: 'sobra' | 'rede'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="6" fill={C.socket} stroke={C.bezel} strokeWidth="1" />
      <circle cx="7" cy="7" r="4.4" fill={glass === 'sobra' ? C.sobra : C.rede} />
      {glass === 'rede' && <line x1="3.4" x2="10.6" y1="7" y2="7" stroke={C.plate} strokeWidth="1.6" />}
    </svg>
  );
}

/** The busbar: the day's cut split by reason, with the share in words under it. */
function Reasons({ day }: { day: Day }) {
  const ene = day.byReason.ENE;
  const rede = day.byReason.CNF + day.byReason.REL + day.byReason.PAR;
  // Shares of the rounded reason totals, so the two words always add up to 100%.
  const total = ene + rede;
  if (total <= 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height: 18, background: C.plate, borderRadius: 2, overflow: 'hidden' }}>
        {ene > 0 && <div style={{ display: 'flex', flexGrow: ene, minWidth: 6, background: C.sobra }} />}
        {rede > 0 && (
          <div
            style={{
              display: 'flex',
              flexGrow: rede,
              minWidth: 6,
              marginLeft: ene > 0 ? 2 : 0,
              background: C.rede,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', width: 20, height: 2, background: C.plate }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 28, ...engraving, fontSize: 17, color: C.ink }}>
        {ene > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph glass="sobra" />
            {`${pctFine(ene / total)} SOBROU ENERGIA`}
          </div>
        )}
        {rede > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph glass="rede" />
            {`${pctFine(rede / total)} A REDE NÃO AGUENTOU`}
          </div>
        )}
      </div>
    </div>
  );
}

const REC_H = 50;

/** The recorder strip: 48 half hours of national cut, amber under red, with the pen at the peak. */
function Recorder({ day, width: REC_W }: { day: Day; width: number }) {
  let peak = 0;
  for (let t = 1; t < PATAMARES; t++) if (cutMw(day, t) > cutMw(day, peak)) peak = t;
  const max = Math.max(1, ...Array.from({ length: PATAMARES }, (_, t) => cutMw(day, t)));
  const bw = REC_W / PATAMARES;
  const bars: string[] = [];
  for (let t = 0; t < PATAMARES; t++) {
    const s = (day.sobraMw[t] / max) * REC_H;
    const r = (day.redeMw[t] / max) * REC_H;
    const x = (t * bw).toFixed(2);
    const w = (bw + 0.3).toFixed(2);
    if (s > 0) bars.push(`<rect x="${x}" y="${(REC_H - s).toFixed(2)}" width="${w}" height="${s.toFixed(2)}" fill="${C.sobra}"/>`);
    if (r > 0) bars.push(`<rect x="${x}" y="${(REC_H - s - r).toFixed(2)}" width="${w}" height="${r.toFixed(2)}" fill="${C.rede}"/>`);
  }
  const rules = [12, 24, 36]
    .map((h) => `<line x1="${h * bw}" x2="${h * bw}" y1="0" y2="${REC_H}" stroke="${h === 24 ? C.consoleDeep : C.jointLand}" stroke-width="1"/>`)
    .join('');
  const pen = (peak + 0.5) * bw;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${REC_W} ${REC_H}" width="${REC_W}" height="${REC_H}">` +
    `<rect width="${REC_W}" height="${REC_H}" fill="${C.enamelRaised}"/>${rules}${bars.join('')}` +
    `<line x1="${pen}" x2="${pen}" y1="0" y2="${REC_H}" stroke="${C.ink}" stroke-width="2.5"/>` +
    `</svg>`;
  const share = cutShare(day, peak);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'B612',
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1,
            color: C.plateInk,
            background: C.plate,
            padding: '6px 10px',
            borderRadius: 2,
          }}
        >
          {hourClock(peak)}
        </div>
        <div style={{ display: 'flex', fontFamily: 'B612', fontWeight: 700, fontSize: 24, color: C.ink }}>{mw(cutMw(day, peak))}</div>
        <div style={{ display: 'flex', ...engraving, fontSize: 15, color: C.ink2 }}>
          {share === null ? 'CORTADOS NO PICO' : `CORTADOS NO PICO · ${pctWhole(share)} DO POSSÍVEL`}
        </div>
      </div>
      <div style={{ display: 'flex', border: `1px solid ${C.consoleDeep}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} width={REC_W} height={REC_H} alt="" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function pick(search: Record<string, string | string[] | undefined>) {
  const data = loadCurtailment();
  return pickDay(data.days, search.dia, DEFAULT_DAY);
}

const share: ShareModule = {
  keys: ['dia'],

  describe(search) {
    const { day, found } = pick(search);
    if (!search.dia || !found) return undefined;
    const copy = shareCopy(day);
    return { title: copy.title, description: copy.description };
  },

  async image(search) {
    const { day } = pick(search);
    const map = boardSvg(day);
    const PANEL_H = 582;
    const mapH = PANEL_H - 12;
    const mapW = Math.round((mapH * map.width) / map.height);
    // The reading column: what the framed board leaves, less the gutters.
    const colW = 1200 - (mapW + 12) - 24 - 40 - 48;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: C.console,
            color: C.ink,
            fontFamily: 'Atkinson',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: colW + 48,
              padding: '28px 0 28px 48px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'flex' }}>
                <Plate size={15}>DEMO CONCEITUAL · DANIEL BERNARDINO</Plate>
              </div>
              <Answer day={day} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <Reasons day={day} />
              <Recorder day={day} width={colW - 2} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 24,
              right: 24,
              width: mapW + 12,
              height: PANEL_H,
              border: `6px solid ${C.consoleDeep}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(map.svg)}`} width={mapW} height={mapH} alt="" />
            {map.plates.map((p) => (
              <div
                key={p.uf}
                style={{
                  display: 'flex',
                  position: 'absolute',
                  left: p.x * mapW,
                  top: p.y * mapH,
                  transform: 'translate(-50%, -50%)',
                  gap: 6,
                  ...engraving,
                  fontSize: 14,
                  lineHeight: 1,
                  color: C.plateInk,
                  background: C.plate,
                  padding: '5px 7px 4px',
                  borderRadius: 2,
                }}
              >
                <div style={{ display: 'flex' }}>{p.uf}</div>
                <div style={{ display: 'flex', letterSpacing: 0 }}>{f1.format(p.mwh / 1000)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', position: 'absolute', right: 10, bottom: 10 }}>
              <Plate size={13}>{engrave('Fonte: ONS, Dados Abertos')}</Plate>
            </div>
          </div>
        </div>
      ),
      { ...OG_SIZE, fonts: await loadFonts() },
    );
  },
};

export default share;
