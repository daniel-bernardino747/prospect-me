import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { OG_SIZE, type ShareModule } from '@/labs/share';

import { type City, decilePhrase, monthName, monthStamp, pickCity, sentence, SHARE_KEYS, shown } from './data';
import { int } from './format';
import { loadPix } from './load';
import { SegmentosFlat, ledText } from './Segmentos';

/**
 * What a shared senha looks like in a WhatsApp, LinkedIn or X preview: the
 * dispenser, this city's ticket hanging from its slot and the LED caller panel
 * with its place in line, on the repartição wall (DESIGN.md). Light palette
 * only, as the PNG. `?c=` is the only state; without it, São Paulo, as the page.
 */

const C = {
  parede: '#E8E2D4',
  barra: '#B89F74',
  filete: '#6B5436',
  inkBarra: '#15130F',
  dispenser: '#D23A1E',
  /** The housing's lower lip: the page's inset rgb(0 0 0 / .18) over the red, flattened. */
  dispenserEdge: '#AC3018',
  slot: '#3A0F08',
  paper: '#F4F5F0',
  ink: '#1F1D1A',
  inkSoft: '#5A5750',
  panel: '#141311',
  bezel: '#2A2825',
  bezelLabel: '#B9B4AA',
  led: '#FF4A2E',
  ledGhost: '#2B1714',
  white: '#FFFFFF',
  shadow: 'rgb(60 44 24 / 0.35)',
};

/** Satori reads static TTFs, not next/font's variables: one file per weight and width used. */
const FONT_FILES = [
  ['Archivo', 500, 'Archivo-Medium.ttf'],
  ['Archivo', 800, 'Archivo-ExtraBold.ttf'],
  ['Archivo Expanded', 900, 'Archivo_Expanded-Black.ttf'],
  ['Martian Mono', 400, 'MartianMono-Regular.ttf'],
  ['Martian Mono', 700, 'MartianMono-Bold.ttf'],
  ['Martian Mono SemiExpanded', 700, 'MartianMono_SemiExpanded-Bold.ttf'],
] as const;

type Font = { name: string; data: Buffer; weight: 500 | 800 | 900 | 400 | 700; style: 'normal' };
let fonts: Promise<Font[]> | undefined;
function loadFonts(): Promise<Font[]> {
  const dir = join(process.cwd(), 'src/artifacts/pix-na-minha-cidade/fonts');
  fonts ??= Promise.all(
    FONT_FILES.map(async ([name, weight, file]) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(join(dir, file)),
    })),
  );
  return fonts;
}

type Search = Record<string, string | string[] | undefined>;

function cityFor(search: Search): City {
  return pickCity(loadPix(), search.c).city;
}

const THERMAL = 'Martian Mono';

/** A dotted-leader row, as on the ticket: key … value. */
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', fontFamily: THERMAL, fontSize: 21, color: C.ink }}>
      <span>{k}</span>
      <span
        style={{
          flex: 1,
          height: 4,
          margin: '0 10px 7px',
          backgroundImage: `radial-gradient(circle, ${C.inkSoft} 1.6px, transparent 1.8px)`,
          backgroundSize: '8px 4px',
          backgroundRepeat: 'repeat-x',
        }}
      />
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
}

/** The torn edge: 14px teeth along the ticket's bottom. */
function Teeth({ width }: { width: number }) {
  const n = Math.round(width / 14);
  const w = width / n;
  let d = `M0 0`;
  for (let i = 0; i < n; i++) d += ` L${(i + 0.5) * w} 8 L${(i + 1) * w} 0`;
  return (
    <svg width={width} height={10} viewBox={`0 0 ${width} 10`} style={{ display: 'flex' }}>
      <path d={`${d} Z`} fill={C.paper} />
    </svg>
  );
}

function image(search: Search) {
  const p = loadPix();
  const city = cityFor(search);
  const last = p.data.months[p.data.months.length - 1];
  const n = String(shown(city.value));
  const br = shown(p.brasil.value);

  // Long names step down so the ticket keeps its number; the number steps down for 3 digits.
  const len = city.name.length;
  const cityPx = len <= 13 ? 52 : len <= 18 ? 44 : len <= 24 ? 36 : 30;
  const twoLines = len * cityPx * 0.56 > 392 - 70;
  const numberPx = (n.length >= 3 ? 180 : 250) - (twoLines ? 50 : 0);
  const sentencePx = city.outlier || city.small || len > 18 ? 27 : 31;

  const ledLine = city.small
    ? 'POSIÇÃO EXATA OMITIDA: POUCOS USUÁRIOS'
    : city.capitalRank
      ? `ENTRE AS CAPITAIS: ${city.capitalRank} / 27`
      : `NO ESTADO (${city.uf}): ${int(city.stateRank)} / ${int(city.stateTotal)}`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: C.parede,
        fontFamily: 'Archivo',
        color: C.ink,
      }}
    >
      {/* The wall: gelo over the ochre barra, split by the filete. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 468, height: 6, background: C.filete }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 474, bottom: 0, background: C.barra }} />

      {/* The dispenser, bleeding off the top edge. */}
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: -16,
          width: 500,
          height: 132,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 24px 14px',
          background: C.dispenser,
          borderRadius: 6,
          borderBottom: `3px solid ${C.dispenserEdge}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: C.white,
            fontFamily: 'Martian Mono SemiExpanded',
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>PIX NA MINHA CIDADE</span>
          <span>{monthStamp(last)}</span>
        </div>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, background: C.slot }} />
      </div>

      {/* The senha, hanging from the slot. */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 106,
          width: 452,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '22px 30px 20px',
            background: C.paper,
            boxShadow: `0 14px 22px ${C.shadow}`,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 }}>
            <span style={{ fontWeight: 800, fontSize: cityPx, lineHeight: 1.1 }}>{city.name}</span>
            <span
              style={{
                display: 'flex',
                padding: '3px 9px',
                background: C.ink,
                color: C.paper,
                fontFamily: THERMAL,
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {city.uf}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Archivo Expanded',
              fontWeight: 900,
              fontSize: numberPx,
              lineHeight: 0.82,
              letterSpacing: -numberPx * 0.02,
              marginTop: 14,
            }}
          >
            {n}
          </div>
          <div style={{ display: 'flex', marginTop: 12, fontFamily: THERMAL, fontSize: 17, whiteSpace: 'nowrap' }}>
            Pix por usuário em {monthName(last)} de {Math.floor(last / 100)}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 14,
              paddingTop: 12,
              borderTop: `2px dashed ${C.ink}`,
            }}
          >
            <Row k="MÉDIA DO BRASIL" v={String(br)} />
          </div>
        </div>
        <Teeth width={452} />
      </div>

      {/* The caller panel: the place in line. */}
      <div
        style={{
          position: 'absolute',
          left: 612,
          top: 48,
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 24px 18px',
          borderRadius: 6,
          background: C.panel,
          border: `6px solid ${C.bezel}`,
          color: C.bezelLabel,
          fontFamily: THERMAL,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: 2 }}>SENHA NO BRASIL</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 14 }}>
          <SegmentosFlat text={ledText(city.rank, city.small)} lit={C.led} ghost={C.ledGhost} width={330} />
          <span style={{ fontSize: 24, marginLeft: 20, marginBottom: 2, whiteSpace: 'nowrap' }}>de {int(city.total)}</span>
        </div>
        <span style={{ fontSize: 17, marginTop: 16 }}>{ledLine}</span>
      </div>

      {/* The one sentence, on the wall. */}
      <div
        style={{
          position: 'absolute',
          left: 612,
          top: 324,
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          color: C.inkBarra,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: sentencePx, lineHeight: 1.25 }}>
          {sentence(city.name, city.value, p.brasil.value, last)}
          {city.small ? ` ${city.name} está ${decilePhrase(city.rank, city.total)}.` : ''}
        </span>
        {city.outlier && (
          <span
            style={{
              display: 'flex',
              marginTop: 10,
              padding: '6px 10px',
              background: C.ink,
              color: C.paper,
              fontFamily: THERMAL,
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            ATENÇÃO Números afetados por pessoas que não moram no município (ex.: fronteira).
          </span>
        )}
      </div>

      {/* Fine print, on the barra. */}
      <div
        style={{
          position: 'absolute',
          left: 612,
          bottom: 30,
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: THERMAL,
          fontSize: 16,
          lineHeight: 1.55,
          color: C.inkBarra,
        }}
      >
        <span>Fonte: Banco Central do Brasil · ODbL · {monthShortLower(last)}</span>
        <span style={{ fontWeight: 700 }}>Demo conceitual · Daniel Bernardino</span>
      </div>
    </div>
  );
}

/** 202608 → "ago/2026" */
function monthShortLower(anoMes: number): string {
  return monthStamp(anoMes).toLowerCase();
}

const share: ShareModule = {
  keys: SHARE_KEYS,
  describe(search) {
    if (search.c === undefined) return undefined;
    const p = loadPix();
    const city = cityFor(search);
    const last = p.data.months[p.data.months.length - 1];
    const n = shown(city.value);
    const place = city.small
      ? `${city.name} está ${decilePhrase(city.rank, city.total)}, entre ${int(city.total)} municípios.`
      : `Senha ${int(city.rank)} de ${int(city.total)} municípios.`;
    return {
      title: `${city.name} (${city.uf}): ${n} Pix por usuário em ${monthName(last)} · Pix na minha cidade`,
      description: `${sentence(city.name, city.value, p.brasil.value, last).replace(
        ` em ${monthName(last)}.`,
        ` em ${monthName(last)} de ${Math.floor(last / 100)}.`,
      )} ${place} Dados abertos do Banco Central.`,
    };
  },
  async image(search) {
    return new ImageResponse(image(search), { ...OG_SIZE, fonts: await loadFonts() });
  },
};

export default share;
