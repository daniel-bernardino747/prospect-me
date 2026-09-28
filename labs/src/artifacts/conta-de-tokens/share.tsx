import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { OG_SIZE, type ShareModule } from '@/labs/share';

import {
  answer,
  cacheWords,
  DEFAULT_SCENARIO,
  dateLabel,
  flapWidth,
  parseScenario,
  providerLabel,
  ratioTag,
  type Scenario,
  SHARE_KEYS,
  sharePct,
  shareText,
  usd,
  VOLUME_LABEL,
  VOLUME_WORDS,
} from './data';
import { loadContaDeTokens } from './load';

type Search = Parameters<ShareModule['image']>[0];

// The page's own tokens (DESIGN.md), light sheet: the OG is the first viewport, lit.
const C = {
  ground: '#C7CFD8',
  ink: '#0D1826',
  ink2: '#2E3A48',
  muted: '#3D4959',
  railInk: '#D6DDE4',
  housing: '#15171A',
  housingRaised: '#1D2024',
  housingRule: '#2C3036',
  housingLabel: '#9AA3AE',
  housingLabelStrong: '#D6DDE4',
  housingEdge: '#4A5058',
  flapFace: '#F2F1EC',
  flapLower: '#E6E5DF',
  flapBlank: '#CFCEC8',
  hinge: 'rgba(0, 0, 0, 0.22)',
  marca: '#D4F23A',
};

const SIGN = 'Chivo';
const FLAP = 'Chivo Mono';

const FONT_DIR = join(process.cwd(), 'src/artifacts/conta-de-tokens/fonts');
let fonts: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']> | undefined;

/** Static OFL weights beside this file (Satori reads ttf, not the variable woff2 next/font serves). */
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        [SIGN, 500, 'Chivo-Medium.ttf'],
        [SIGN, 700, 'Chivo-Bold.ttf'],
        [FLAP, 400, 'ChivoMono-Regular.ttf'],
        [FLAP, 600, 'ChivoMono-SemiBold.ttf'],
      ] as const
    ).map(async ([name, weight, file]) => {
      const b = await readFile(join(FONT_DIR, file));
      return { name, weight, style: 'normal' as const, data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer };
    }),
  );
  return fonts;
}

const isDefault = (s: Scenario) =>
  s.volume === DEFAULT_SCENARIO.volume &&
  s.output === DEFAULT_SCENARIO.output &&
  s.cache === DEFAULT_SCENARIO.cache &&
  s.ref === DEFAULT_SCENARIO.ref;

// ---------------------------------------------------------------------------
// The split-flap cell, as on the page: face over lower half, a faint seam.

const FLAP_SIZE = 72;
const CELL_W = Math.round(FLAP_SIZE * 0.82);
const CELL_H = Math.ceil((FLAP_SIZE * 1.32) / 4) * 4;
const SEP_W = Math.round(FLAP_SIZE * 0.42);
const CELL_GAP = Math.round(FLAP_SIZE * 0.08);

function Flaps({ value, width }: { value: string; width: number }) {
  const glyphs = value.padStart(width, ' ').split('');
  return (
    <div style={{ display: 'flex', gap: CELL_GAP }}>
      {glyphs.map((ch, i) => {
        const w = ch === '.' || ch === ',' ? SEP_W : CELL_W;
        return (
          // Two flat halves under one glyph, a faint seam, and a 2px drop as the
          // cell's depth. No clipping and no shadow filter: each render stays well
          // under a second.
          <div
            key={i}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: w,
              height: CELL_H + 2,
              paddingBottom: 2,
              borderRadius: 2,
              background: 'rgba(0, 0, 0, 0.55)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: w,
                height: CELL_H / 2,
                borderRadius: '2px 2px 0 0',
                background: ch === ' ' ? C.flapBlank : C.flapFace,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: CELL_H / 2,
                width: w,
                height: CELL_H / 2,
                borderRadius: '0 0 2px 2px',
                background: ch === ' ' ? C.flapBlank : C.flapLower,
              }}
            />
            {ch === ' ' ? null : (
              <div style={{ display: 'flex', fontFamily: FLAP, fontWeight: 600, fontSize: FLAP_SIZE, lineHeight: 1, color: C.ink }}>{ch}</div>
            )}
            {ch === ' ' ? null : (
              <div style={{ position: 'absolute', left: 0, top: CELL_H / 2 - 0.5, width: w, height: 1, background: C.hinge }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const signage = (size: number, color: string) =>
  ({ fontFamily: SIGN, fontWeight: 700, fontSize: size, letterSpacing: size * 0.1, textTransform: 'uppercase', color }) as const;

function Plate({
  label,
  name,
  value,
  width,
  edge,
  tag,
}: {
  label: string;
  name: string;
  value: string;
  width: number;
  edge: string;
  tag?: string | null;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px 24px 26px',
        gap: 22,
        background: C.housingRaised,
        border: `1px solid ${C.housingRule}`,
        borderLeft: `6px solid ${edge}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, ...signage(15, C.housingLabel), lineHeight: 1.35 }}>
          <span>{label} ·&nbsp;</span>
          <span style={{ color: C.housingLabelStrong }}>{name}</span>
        </div>
        {tag ? (
          <div
            style={{
              display: 'flex',
              padding: '6px 9px',
              background: C.flapFace,
              borderRadius: 2,
              ...signage(15, C.ink),
              letterSpacing: 1.2,
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ display: 'flex', paddingBottom: 10, ...signage(18, C.housingLabel) }}>US$</div>
        <Flaps value={value} width={width} />
        <div style={{ display: 'flex', paddingBottom: 8, fontFamily: FLAP, fontSize: 20, color: C.housingLabel }}>/mês</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function image(search: Search) {
  const data = loadContaDeTokens();
  const sc = parseScenario(search, data);
  const a = answer(data, sc);
  const same = a.ref.id === a.leader.model.id;
  const width = flapWidth(same ? [a.refBill.total] : [a.refBill.total, a.leaderBill.total]);
  const leadLabel = providerLabel(data, a.leader.provider);
  const volume = VOLUME_WORDS[sc.volume];

  return loadFonts().then(
    (f) =>
      new ImageResponse(
        (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.ground, fontFamily: SIGN }}>
            {/* Headrail */}
            <div
              style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 56px',
                background: C.ink,
              }}
            >
              <div style={{ display: 'flex', ...signage(18, C.railInk) }}>Conta de tokens</div>
              <div style={{ display: 'flex', fontFamily: FLAP, fontSize: 18, color: C.railInk }}>
                dados {dateLabel(data.weeks.at(-1)!.end)}
              </div>
            </div>

            {/* The question and the scenario */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '34px 56px 30px' }}>
              <div style={{ display: 'flex', ...signage(16, C.muted) }}>
                Cenário ilustrativo · {VOLUME_LABEL[sc.volume]} tokens/mês · {sc.output}% saída · preços OpenRouter
              </div>
              <div
                style={{
                  display: 'flex',
                  marginTop: 10,
                  fontSize: 46,
                  fontWeight: 500,
                  letterSpacing: -0.7,
                  lineHeight: 1.1,
                  color: C.ink,
                }}
              >
                {`Quanto custa ${volume} por mês`}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 22, fontWeight: 500, color: C.ink2 }}>
                {`${cacheWords(a, sc)}. A ${leadLabel} ficou com `}
                <span style={{ fontFamily: FLAP, fontWeight: 600, margin: '0 6px', letterSpacing: -1 }}>{sharePct(a.leader.providerShare)}</span>
                {' dos tokens do OpenRouter na semana.'}
              </div>
            </div>

            {/* The board band */}
            <div style={{ display: 'flex', gap: 24, padding: '30px 56px', background: C.housing }}>
              <Plate
                label={same ? 'Sua referência, o mais usado' : 'Sua referência'}
                name={a.ref.name}
                value={usd(a.refBill.total)}
                width={width}
                edge={C.marca}
              />
              {same ? null : (
                <Plate
                  label="Mais usado"
                  name={a.leader.model.name}
                  value={usd(a.leaderBill.total)}
                  width={width}
                  edge={C.housingEdge}
                  tag={ratioTag(a.refBill.total, a.leaderBill.total)}
                />
              )}
            </div>

            {/* Byline and sources */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 32,
                padding: '0 56px',
              }}
            >
              <div style={{ display: 'flex', flexShrink: 0, ...signage(16, C.ink) }}>Demo conceitual · Daniel Bernardino</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  fontFamily: FLAP,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: C.muted,
                }}
              >
                <div style={{ display: 'flex' }}>Preços: catálogo público do OpenRouter, {dateLabel(data.sources.catalog.fetchedAt)}</div>
                <div style={{ display: 'flex' }}>
                  Source: OpenRouter (openrouter.ai/rankings), as of {data.sources.rankings.asOf}. CC BY 4.0
                </div>
              </div>
            </div>
          </div>
        ),
        { ...OG_SIZE, fonts: f },
      ),
  );
}

const share: ShareModule = {
  keys: SHARE_KEYS,
  describe(search) {
    const data = loadContaDeTokens();
    const sc = parseScenario(search, data);
    if (isDefault(sc)) return undefined;
    const { title, description } = shareText(data, sc);
    return { title, description };
  },
  image,
};

export default share;
