/**
 * The shareable PNG (DESIGN.md, "The shareable PNG"): the ticket unrolled, the
 * senha and the second strip as one strip joined at a perforation, on the
 * dispenser red, 1080×1350, always in the light palette. The server builds
 * `CardData`; the browser measures, fits and draws it.
 */

export interface CardData {
  name: string;
  uf: string;
  /** "38": the rounded average. */
  number: string;
  unit: string;
  sentence: string;
  stamp: string;
  outlier: boolean;
  rows: [key: string, value: string][];
  bars: { label: string; value: number; shown: string; brasil: boolean }[];
  series: { city: (number | null)[]; brasil: number[]; caption: string; from: string; to: string };
  ticket: string;
  finePrint: string;
  url: string;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

export const W = 1080;
export const H = 1350;
const X0 = 150;
const X1 = 930;
const PAD = 40;
const CX0 = X0 + PAD;
const CX1 = X1 - PAD;
const LINE = 36;
const TICKET_TOP = 132;
/** The torn edge may not pass this line (DESIGN.md fit rule). */
export const EDGE_LIMIT = 1290;
export const NUMBER_MAX = 220;
export const NUMBER_MIN = 160;

export interface Counts {
  cityLines: number;
  sentenceLines: number;
  outlierLines: number;
  rows: number;
  fineLines: number;
}

/** Height of each block, top to bottom, for a given number size. */
function blocks(c: Counts, numberSize: number) {
  return {
    padTop: 36,
    city: c.cityLines * 48,
    number: Math.round(numberSize * 0.82),
    unit: LINE,
    sentence: 12 + c.sentenceLines * LINE,
    outlier: c.outlierLines ? 12 + c.outlierLines * 26 + 20 : 0,
    rule1: 24,
    rows: c.rows * LINE,
    perforation: 48,
    bars: 2 * (26 + 15) + 14,
    spark: 12 + 26 + 84 + 26,
    ticket: 12 + LINE,
    rule2: 24,
    fine: c.fineLines * 24,
    footer: 12 + LINE,
    padBottom: 20,
    teeth: 14,
  };
}

/** Where the torn edge ends for these counts and this number size. */
export function cardBottom(c: Counts, numberSize: number): number {
  return TICKET_TOP + Object.values(blocks(c, numberSize)).reduce((a, b) => a + b, 0);
}

/**
 * The fit rule: step the number down 20px at a time, to a floor of 160px,
 * until the torn edge clears 1290. The fine print never shrinks.
 */
export function fitNumber(c: Counts): number {
  let size = NUMBER_MAX;
  while (size > NUMBER_MIN && cardBottom(c, size) > EDGE_LIMIT) size -= 20;
  return Math.max(size, NUMBER_MIN);
}

/** Greedy word wrap on a measuring function. */
export function wrap(text: string, width: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const LIGHT = {
  dispenser: '#D23A1E',
  slot: '#3A0F08',
  paper: '#F4F5F0',
  paperShade: '#E7E9E2',
  ink: '#1F1D1A',
  inkSoft: '#5A5750',
  white: '#FFFFFF',
};

export interface Faces {
  print: string;
  thermal: string;
}

type Ctx = CanvasRenderingContext2D;

function setFont(ctx: Ctx, font: string, stretch: CanvasFontStretch = 'normal', spacing = '0px') {
  ctx.font = font;
  if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
}

function dashed(ctx: Ctx, y: number) {
  ctx.save();
  ctx.strokeStyle = LIGHT.ink;
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.moveTo(CX0, y);
  ctx.lineTo(CX1, y);
  ctx.stroke();
  ctx.restore();
}

/** Key ……… value, the thermal leader row. */
function leaderRow(ctx: Ctx, f: Faces, y: number, key: string, value: string, size: number) {
  setFont(ctx, `400 ${size}px ${f.thermal}`);
  ctx.fillStyle = LIGHT.ink;
  ctx.textAlign = 'left';
  ctx.fillText(key, CX0, y);
  const kw = ctx.measureText(key).width;
  setFont(ctx, `700 ${size}px ${f.thermal}`);
  ctx.textAlign = 'right';
  ctx.fillText(value, CX1, y);
  const vw = ctx.measureText(value).width;
  ctx.save();
  ctx.fillStyle = LIGHT.inkSoft;
  for (let x = CX0 + kw + 10; x < CX1 - vw - 10; x += 9) ctx.fillRect(x, y - 2, 3, 3);
  ctx.restore();
  ctx.textAlign = 'left';
}

/** Draws the card; resolves with the PNG. */
export async function renderCard(d: CardData, f: Faces): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';

  // Measure first, so the number can shrink before anything is drawn.
  const content = CX1 - CX0;
  setFont(ctx, `800 42px ${f.print}`);
  const chipW = 70;
  const cityLines = wrap(d.name, content - chipW, (s) => ctx.measureText(s).width);
  setFont(ctx, `500 28px ${f.print}`);
  const sentenceLines = wrap(d.sentence, content, (s) => ctx.measureText(s).width);
  setFont(ctx, `400 19px ${f.thermal}`);
  const outlierText = 'ATENÇÃO  Números afetados por pessoas que não moram no município (ex.: fronteira).';
  const outlierLines = d.outlier ? wrap(outlierText, content - 32, (s) => ctx.measureText(s).width) : [];
  setFont(ctx, `400 16px ${f.thermal}`);
  const fineLines = [...wrap(d.finePrint, content, (s) => ctx.measureText(s).width), d.url];
  const counts: Counts = {
    cityLines: cityLines.length,
    sentenceLines: sentenceLines.length,
    outlierLines: outlierLines.length,
    rows: d.rows.length,
    fineLines: fineLines.length,
  };
  const numberSize = fitNumber(counts);
  const b = blocks(counts, numberSize);

  // Ground and the dispenser's print.
  ctx.fillStyle = LIGHT.dispenser;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = LIGHT.white;
  setFont(ctx, `700 30px ${f.thermal}`, 'semi-expanded', '1.5px');
  ctx.fillText('PIX NA MINHA CIDADE', 96, 80);
  ctx.textAlign = 'right';
  ctx.fillText(d.stamp, 984, 80);
  ctx.textAlign = 'left';

  // Ticket paper with torn bottom, then the slot drawn over its top.
  const bottom = cardBottom(counts, numberSize);
  const edge = bottom - b.teeth;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowOffsetY = 16;
  ctx.shadowBlur = 28;
  ctx.fillStyle = LIGHT.paper;
  ctx.beginPath();
  ctx.moveTo(X0, TICKET_TOP);
  ctx.lineTo(X1, TICKET_TOP);
  ctx.lineTo(X1, edge);
  const tooth = 28;
  for (let x = X1; x > X0; x -= tooth) {
    ctx.lineTo(Math.max(X0, x - tooth / 2), edge + b.teeth);
    ctx.lineTo(Math.max(X0, x - tooth), edge);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = LIGHT.slot;
  ctx.beginPath();
  ctx.roundRect(110, 120, 860, 24, 12);
  ctx.fill();

  let y = TICKET_TOP + b.padTop;
  ctx.fillStyle = LIGHT.ink;

  // City + reverse-print UF chip after the last line.
  setFont(ctx, `800 42px ${f.print}`);
  cityLines.forEach((line, i) => {
    const base = y + 40 + i * 48;
    ctx.fillStyle = LIGHT.ink;
    ctx.fillText(line, CX0, base);
    if (i === cityLines.length - 1) {
      const x = CX0 + ctx.measureText(line).width + 14;
      ctx.fillRect(x, base - 30, 56, 36);
      ctx.fillStyle = LIGHT.paper;
      setFont(ctx, `700 22px ${f.thermal}`);
      ctx.textAlign = 'center';
      ctx.fillText(d.uf, x + 28, base - 4);
      ctx.textAlign = 'left';
      setFont(ctx, `800 42px ${f.print}`);
    }
  });
  y += b.city;

  // The number: double-width print.
  ctx.fillStyle = LIGHT.ink;
  setFont(ctx, `900 ${numberSize}px ${f.print}`, 'expanded', `${-0.02 * numberSize}px`);
  ctx.fillText(d.number, CX0 - numberSize * 0.03, y + b.number - numberSize * 0.02);
  y += b.number;
  setFont(ctx, `400 20px ${f.thermal}`);
  ctx.fillText(d.unit, CX0, y + 26);
  y += b.unit;

  setFont(ctx, `500 28px ${f.print}`);
  sentenceLines.forEach((line, i) => ctx.fillText(line, CX0, y + 12 + 27 + i * LINE));
  y += b.sentence;

  if (outlierLines.length) {
    const top = y + 12;
    ctx.fillStyle = LIGHT.ink;
    ctx.fillRect(CX0, top, content, b.outlier - 12);
    ctx.fillStyle = LIGHT.paper;
    setFont(ctx, `400 19px ${f.thermal}`);
    outlierLines.forEach((line, i) => ctx.fillText(line, CX0 + 16, top + 30 + i * 26));
    ctx.fillStyle = LIGHT.ink;
    y += b.outlier;
  }

  dashed(ctx, y + 12);
  y += b.rule1;
  d.rows.forEach(([k, v], i) => leaderRow(ctx, f, y + 26 + i * LINE, k, v, 21));
  y += b.rows;

  // Perforation: the join between the senha and the second strip.
  ctx.fillStyle = LIGHT.inkSoft;
  for (let x = X0 + 24; x < X1 - 16; x += 14) {
    ctx.beginPath();
    ctx.arc(x, y + 24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = LIGHT.dispenser;
  for (const x of [X0, X1]) {
    ctx.beginPath();
    ctx.arc(x, y + 24, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  y += b.perforation;

  // Comparison bars: solid for the city, hatched for Brasil.
  const max = Math.max(...d.bars.map((x) => x.value)) * 1.15;
  d.bars.forEach((bar, i) => {
    const top = y + i * 41;
    ctx.fillStyle = LIGHT.ink;
    setFont(ctx, `400 18px ${f.thermal}`);
    ctx.fillText(bar.label, CX0, top + 19);
    const lw = ctx.measureText(`${bar.label} `).width;
    setFont(ctx, `700 18px ${f.thermal}`);
    ctx.fillText(bar.shown, CX0 + lw, top + 19);
    const w = (bar.value / max) * content;
    if (bar.brasil) {
      ctx.fillStyle = LIGHT.paperShade;
      ctx.fillRect(CX0, top + 26, w, 15);
      ctx.save();
      ctx.beginPath();
      ctx.rect(CX0, top + 26, w, 15);
      ctx.clip();
      ctx.strokeStyle = LIGHT.ink;
      ctx.lineWidth = 2;
      for (let x = CX0 - 15; x < CX0 + w; x += 7) {
        ctx.beginPath();
        ctx.moveTo(x, top + 41);
        ctx.lineTo(x + 15, top + 26);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = LIGHT.ink;
      ctx.fillRect(CX0, top + 26, w, 15);
    }
  });
  y += b.bars;

  // Sparkline: 12 months, city solid, Brasil dotted.
  ctx.fillStyle = LIGHT.ink;
  setFont(ctx, `700 17px ${f.thermal}`);
  ctx.fillText(d.series.caption, CX0, y + 12 + 18);
  const plotTop = y + 12 + 26;
  const plotW = content - 70;
  const all = [...d.series.city.filter((v): v is number => v !== null), ...d.series.brasil];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const px = (i: number) => CX0 + (i / (d.series.brasil.length - 1)) * plotW;
  const py = (v: number) => plotTop + 84 - 6 - ((v - lo) / span) * 72;
  const line = (vals: (number | null)[], width: number, dash: number[]) => {
    ctx.save();
    ctx.strokeStyle = LIGHT.ink;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      if (pen) ctx.lineTo(px(i), py(v));
      else ctx.moveTo(px(i), py(v));
      pen = true;
    });
    ctx.stroke();
    ctx.restore();
  };
  line(d.series.brasil, 2.5, [3, 5]);
  line(d.series.city, 3.5, []);
  setFont(ctx, `700 17px ${f.thermal}`);
  const lastCity = [...d.series.city].reverse().find((v) => v !== null) ?? 0;
  const lastBr = d.series.brasil[d.series.brasil.length - 1];
  let yCity = py(lastCity) + 6;
  let yBr = py(lastBr) + 6;
  if (Math.abs(yCity - yBr) < 20) {
    const mid = (yCity + yBr) / 2;
    const up = lastCity >= lastBr;
    yCity = mid + (up ? -10 : 10);
    yBr = mid + (up ? 10 : -10);
  }
  ctx.fillText(d.bars[0].shown.split(',')[0], CX0 + plotW + 12, yCity);
  ctx.fillText(`BR ${d.bars[1].shown.split(',')[0]}`, CX0 + plotW + 12, yBr);
  setFont(ctx, `400 16px ${f.thermal}`);
  ctx.fillStyle = LIGHT.inkSoft;
  ctx.fillText(d.series.from, CX0, plotTop + 84 + 20);
  ctx.textAlign = 'right';
  ctx.fillText(d.series.to, CX0 + plotW, plotTop + 84 + 20);
  ctx.textAlign = 'left';
  y += b.spark;

  leaderRow(ctx, f, y + 12 + 26, 'VALOR MÉDIO POR PIX', d.ticket, 21);
  y += b.ticket;
  dashed(ctx, y + 12);
  y += b.rule2;

  ctx.fillStyle = LIGHT.inkSoft;
  setFont(ctx, `400 16px ${f.thermal}`);
  fineLines.forEach((l, i) => ctx.fillText(l, CX0, y + 18 + i * 24));
  y += b.fine;

  ctx.fillStyle = LIGHT.ink;
  setFont(ctx, `700 18px ${f.thermal}`, 'normal', '2px');
  ctx.textAlign = 'center';
  ctx.fillText('GUARDE SUA SENHA', (X0 + X1) / 2, y + 12 + 24);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/png'),
  );
}
