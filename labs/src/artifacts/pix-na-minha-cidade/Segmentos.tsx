import { useId } from 'react';

/**
 * The caller panel's seven-segment digits, drawn by hand (no font): four
 * cells, hexagonal bars, a 6° lean, unlit segments as ghosts. Numbers under
 * 1.000 leave the leading cells as ghost 8s, never zeros.
 */

type Seg = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

const DIGITS: Record<string, Seg[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

// Cell 56 × 100; bar thickness 14 (14% of height), gap 4.
const T = 14;
const G = 4;
const L = 7;
const R = 49;
const TOP = 7;
const MID = 50;
const BOT = 93;

function horizontal(y: number): string {
  const x1 = L + G;
  const x2 = R - G;
  const h = T / 2;
  return `${x1},${y} ${x1 + h},${y - h} ${x2 - h},${y - h} ${x2},${y} ${x2 - h},${y + h} ${x1 + h},${y + h}`;
}

function vertical(x: number, y1: number, y2: number): string {
  const h = T / 2;
  const a = y1 + G;
  const b = y2 - G;
  return `${x},${a} ${x + h},${a + h} ${x + h},${b - h} ${x},${b} ${x - h},${b - h} ${x - h},${a + h}`;
}

const SEGMENTS: Record<Seg, string> = {
  a: horizontal(TOP),
  g: horizontal(MID),
  d: horizontal(BOT),
  f: vertical(L, TOP, MID),
  b: vertical(R, TOP, MID),
  e: vertical(L, MID, BOT),
  c: vertical(R, MID, BOT),
};

const ORDER: Seg[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const PITCH = 66;
/** tan(6°) × 100: how far the lean shifts the bottom of a cell. */
const LEAN = 10.5;

/** `text` is exactly 4 characters: digits, "-" or " " (a ghost cell). */
export function Segmentos({ text, className }: { text: string; className?: string }) {
  const cells = text.padStart(4, ' ').slice(-4).split('');
  const glow = `glow-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${PITCH * 4 - 10 + LEAN} 100`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {cells.map((ch, i) => (
        <g key={i} transform={`translate(${i * PITCH + LEAN} 0) skewX(-6)`}>
          {ORDER.map((seg) => (
            <polygon key={seg} points={SEGMENTS[seg]} data-ghost="" />
          ))}
          <g filter={`url(#${glow})`}>
            {(DIGITS[ch] ?? []).map((seg) => (
              <polygon key={seg} points={SEGMENTS[seg]} data-lit="" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

/** What the four cells show: the senha, or dashes when the exact place is withheld. */
export function ledText(rank: number, small: boolean): string {
  if (small) return '----';
  return String(rank).padStart(4, ' ').slice(-4);
}
