/**
 * Pix na minha cidade: the shape of data.json and every rule the page applies
 * to it. Pure, so the script, the server page and the tests share one truth.
 *
 * The metric (BRIEF.md): Pix sent by pessoas físicas resident in the município
 * divided by the pessoas físicas who sent at least one Pix that month
 * (`QT_PagadorPF / QT_PES_PagadorPF`), the FGV EAESP "Transações por Usuário".
 * Pessoa jurídica is excluded everywhere: companies pile up where their
 * headquarters are and distort a municipal ranking.
 */

/** One row of BCB `TransacoesPixPorMunicipio`, only the fields the page uses. */
export interface BcbRow {
  AnoMes: number;
  Municipio_Ibge: number | null;
  Municipio: string;
  VL_PagadorPF: number;
  QT_PagadorPF: number;
  QT_PES_PagadorPF: number;
}

/**
 * One município, stored as a tuple to keep data.json small:
 * [ibge, name, uf, population, payers (last month), pix (last month),
 *  average value per Pix in R$ (last month), Pix per payer ×10 for every month
 *  (null where the BCB has no row)].
 */
export type MunRow = [
  ibge: number,
  name: string,
  uf: string,
  pop: number,
  payers: number,
  pix: number,
  ticket: number,
  series: (number | null)[],
];

export interface PixData {
  /** When the script ran (YYYY-MM-DD). */
  fetchedAt: string;
  /** AnoMes of every closed month kept, oldest first; the last is the page's month. */
  months: number[];
  /** Brazil, per month: sum of PF Pix and sum of PF payers over every município. */
  brasil: { pix: number[]; payers: number[]; pop: number };
  /** The latest national MED (fraud) figures; there is no municipal cut. */
  med: { month: number; contestados: number; aceitas: number; devolucao: number };
  /** Sorted by the last month's Pix per payer, most first: index + 1 is the senha. */
  mun: MunRow[];
}

export const STATES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
};

/** The 27 capitals by IBGE code (Brasília for the DF). The script checks the names. */
export const CAPITALS: Record<number, string> = {
  1100205: 'Porto Velho',
  1200401: 'Rio Branco',
  1302603: 'Manaus',
  1400100: 'Boa Vista',
  1501402: 'Belém',
  1600303: 'Macapá',
  1721000: 'Palmas',
  2111300: 'São Luís',
  2211001: 'Teresina',
  2304400: 'Fortaleza',
  2408102: 'Natal',
  2507507: 'João Pessoa',
  2611606: 'Recife',
  2704302: 'Maceió',
  2800308: 'Aracaju',
  2927408: 'Salvador',
  3106200: 'Belo Horizonte',
  3205309: 'Vitória',
  3304557: 'Rio de Janeiro',
  3550308: 'São Paulo',
  4106902: 'Curitiba',
  4205407: 'Florianópolis',
  4314902: 'Porto Alegre',
  5002704: 'Campo Grande',
  5103403: 'Cuiabá',
  5208707: 'Goiânia',
  5300108: 'Brasília',
};

export const DEFAULT_CITY = 3550308;

/** Below this many payers the exact place in line is noise: say the decile instead. */
export const SMALL_SAMPLE = 2000;

// ---------------------------------------------------------------- the script

/**
 * The last month the page may show. The API already carries the running month,
 * partial (2026-09 had ~80% of August's volume on 25/09): a city would seem to
 * "fall" in it. Everything from the month of `today` on is cut.
 */
export function lastClosedMonth(today: Date): number {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  return m === 1 ? (y - 1) * 100 + 12 : y * 100 + (m - 1);
}

/** The `count` months ending at `last`, oldest first (AnoMes numbers). */
export function monthsEndingAt(last: number, count: number): number[] {
  const out: number[] = [];
  let y = Math.floor(last / 100);
  let m = last % 100;
  for (let i = 0; i < count; i++) {
    out.unshift(y * 100 + m);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

/** IBGE writes "São Paulo - SP"; the page shows the name and the UF apart. */
export function splitIbgeName(full: string): { name: string; uf: string } {
  const at = full.lastIndexOf(' - ');
  if (at < 0) throw new Error(`IBGE name without UF: ${full}`);
  return { name: full.slice(0, at), uf: full.slice(at + 3) };
}

export const perPayer = (pix: number, payers: number) => (payers > 0 ? pix / payers : 0);

/**
 * Joins the BCB rows to the IBGE population and names, keeping only `months`.
 * The BCB's "N/D / NAO INFORMADO" row (no IBGE code) is dropped, as is any
 * município with no payer in the last month (it has no metric to rank).
 */
export function buildData(
  rows: readonly BcbRow[],
  population: ReadonlyMap<number, { name: string; uf: string; pop: number }>,
  months: readonly number[],
  fetchedAt: string,
  med: PixData['med'],
): { data: PixData; dropped: string[] } {
  const last = months[months.length - 1];
  const index = new Map(months.map((m, i) => [m, i]));
  const byCity = new Map<number, (BcbRow | undefined)[]>();
  const dropped: string[] = [];
  const brasil = { pix: months.map(() => 0), payers: months.map(() => 0) };

  for (const r of rows) {
    const i = index.get(r.AnoMes);
    if (i === undefined) continue;
    if (!r.Municipio_Ibge) continue;
    if (!population.has(r.Municipio_Ibge)) {
      dropped.push(`${r.Municipio_Ibge} ${r.Municipio}: not in IBGE`);
      continue;
    }
    let slots = byCity.get(r.Municipio_Ibge);
    if (!slots) byCity.set(r.Municipio_Ibge, (slots = months.map(() => undefined)));
    if (slots[i]) throw new Error(`${r.Municipio_Ibge} ${r.AnoMes}: two rows`);
    slots[i] = r;
    brasil.pix[i] += r.QT_PagadorPF;
    brasil.payers[i] += r.QT_PES_PagadorPF;
  }

  const mun: MunRow[] = [];
  for (const [ibge, slots] of byCity) {
    const now = slots[slots.length - 1];
    const place = population.get(ibge)!;
    if (!now || now.QT_PES_PagadorPF <= 0) {
      dropped.push(`${ibge} ${place.name}: no payer in ${last}`);
      continue;
    }
    mun.push([
      ibge,
      place.name,
      place.uf,
      place.pop,
      now.QT_PES_PagadorPF,
      now.QT_PagadorPF,
      Math.round(now.QT_PagadorPF > 0 ? now.VL_PagadorPF / now.QT_PagadorPF : 0),
      slots.map((r) => (r && r.QT_PES_PagadorPF > 0 ? Math.round((r.QT_PagadorPF / r.QT_PES_PagadorPF) * 10) : null)),
    ]);
  }
  mun.sort(byQueue);

  let pop = 0;
  for (const p of population.values()) pop += p.pop;
  return { data: { fetchedAt, months: [...months], brasil: { ...brasil, pop }, med, mun }, dropped };
}

/** Most Pix per payer first; the IBGE code settles an exact tie, so the order is stable. */
export function byQueue(a: MunRow, b: MunRow): number {
  return perPayer(b[5], b[4]) - perPayer(a[5], a[4]) || a[0] - b[0];
}

// ---------------------------------------------------------------- the page

export interface City {
  ibge: number;
  name: string;
  uf: string;
  stateName: string;
  pop: number;
  payers: number;
  pix: number;
  /** Pix per payer in the last month, exact. */
  value: number;
  ticket: number;
  /** Pix per payer per month (one decimal), null where missing. */
  series: (number | null)[];
  rank: number;
  total: number;
  stateRank: number;
  stateTotal: number;
  /** Place among the 27 capitals, when it is one. */
  capitalRank?: number;
  small: boolean;
  outlier: boolean;
}

export interface Pix {
  data: PixData;
  brasil: { value: number; series: number[] };
  cities: City[];
  byIbge: Map<number, City>;
  capitals: City[];
}

/** Everything the page derives once per process from data.json. */
export function derive(data: PixData): Pix {
  const total = data.mun.length;
  const stateTotals = new Map<string, number>();
  for (const r of data.mun) stateTotals.set(r[2], (stateTotals.get(r[2]) ?? 0) + 1);
  const stateSeen = new Map<string, number>();
  let capitalSeen = 0;

  const cities = data.mun.map((r, i): City => {
    const [ibge, name, uf, pop, payers, pix, ticket, series] = r;
    const stateRank = (stateSeen.get(uf) ?? 0) + 1;
    stateSeen.set(uf, stateRank);
    return {
      ibge,
      name,
      uf,
      stateName: STATES[uf] ?? uf,
      pop,
      payers,
      pix,
      value: perPayer(pix, payers),
      ticket,
      series: series.map((v) => (v === null ? null : v / 10)),
      rank: i + 1,
      total,
      stateRank,
      stateTotal: stateTotals.get(uf)!,
      capitalRank: ibge in CAPITALS ? ++capitalSeen : undefined,
      small: isSmallSample(payers),
      outlier: isOutlier(payers, pop),
    };
  });

  const brasilSeries = data.brasil.pix.map((p, i) => perPayer(p, data.brasil.payers[i]));
  return {
    data,
    brasil: { value: brasilSeries[brasilSeries.length - 1], series: brasilSeries },
    cities,
    byIbge: new Map(cities.map((c) => [c.ibge, c])),
    capitals: cities.filter((c) => c.capitalRank !== undefined),
  };
}

export const isSmallSample = (payers: number) => payers < SMALL_SAMPLE;

/** More payers than estimated residents: people registered there who live elsewhere (a border town). */
export const isOutlier = (payers: number, pop: number) => pop > 0 && payers > pop;

/**
 * The ticket's city for `?c=`: the município, or the default and a notice when
 * the code is missing, malformed or unknown. Never a 404 (that is for the slug).
 */
export function pickCity(pix: Pix, c: string | string[] | undefined): { city: City; notFound: boolean } {
  const fallback = pix.byIbge.get(DEFAULT_CITY)!;
  if (c === undefined) return { city: fallback, notFound: false };
  const raw = Array.isArray(c) ? c[0] : c;
  const city = /^\d{7}$/.test(raw ?? '') ? pix.byIbge.get(Number(raw)) : undefined;
  return city ? { city, notFound: false } : { city: fallback, notFound: true };
}

/**
 * The place in line said without the exact number, for small samples:
 * "entre os 10% que mais usam" at the front, "entre os 30% que menos usam" at the back.
 */
export function decilePhrase(rank: number, total: number): string {
  const decile = Math.min(10, Math.max(1, Math.ceil((rank / total) * 10)));
  return decile <= 5 ? `entre os ${decile * 10}% que mais usam` : `entre os ${(11 - decile) * 10}% que menos usam`;
}

/** The number on the ticket: an average, rounded to a whole Pix. */
export const shown = (value: number) => Math.round(value);

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** 202608 → "agosto" */
export const monthName = (anoMes: number) => MONTH_NAMES[(anoMes % 100) - 1];
/** 202608 → "ago/26" */
export const monthShort = (anoMes: number) => `${MONTH_SHORT[(anoMes % 100) - 1]}/${String(anoMes).slice(2, 4)}`;
/** 202608 → "AGO/2026" */
export const monthStamp = (anoMes: number) =>
  `${MONTH_SHORT[(anoMes % 100) - 1].toUpperCase()}/${Math.floor(anoMes / 100)}`;

/**
 * The one sentence (PRODUCT.md): an average said as an average, the national
 * figure beside it, nothing that judges the gap.
 */
export function sentence(city: string, value: number, brasil: number, anoMes: number): string {
  return `Quem usa Pix em ${city} fez, em média, ${shown(value)} Pix em ${monthName(anoMes)}. A média do Brasil é ${shown(brasil)}.`;
}

/** What `navigator.share` sends with the image: "por usuário", never "fez {n} Pix". */
export function shareText(city: string, value: number, anoMes: number): string {
  return `${city}: ${shown(value)} Pix por usuário em ${monthName(anoMes)}. E a sua cidade?`;
}

/** "São Paulo" → "sao-paulo", for the PNG's file name. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------- the queue

export interface QueueColumn {
  /** First rank in the group (1-based). */
  from: number;
  /** Median Pix per payer of the group. */
  median: number;
}

/**
 * The whole line of 5.571 as columns of `size` consecutive ranks, each drawn
 * at its median, front of the queue first. `values` must already be in queue order.
 */
export function queueColumns(values: readonly number[], size = 10): QueueColumn[] {
  const out: QueueColumn[] = [];
  for (let i = 0; i < values.length; i += size) {
    const group = values.slice(i, i + size).sort((a, b) => a - b);
    const mid = group.length >> 1;
    const median = group.length % 2 ? group[mid] : (group[mid - 1] + group[mid]) / 2;
    out.push({ from: i + 1, median });
  }
  return out;
}

/** The q-quantile (0–1) by nearest rank. */
export function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const at = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[at];
}
