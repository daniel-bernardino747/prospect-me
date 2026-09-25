/**
 * The data behind "A fila da safra", gathered once by
 * `scripts/tarken-fila-da-safra.ts` and shaped here.
 *
 * Two public sources, each used only where it is complete:
 * - SICOR microdata carry every contract's maturity and state, but their
 *   município link covers only some banks, so maturities are shown per UF.
 * - The MDCR (Bacen's official matrix) covers every contract per município,
 *   by issue month, value and area, but carries no maturity.
 */

/** Cells built from fewer operations than this are suppressed, never shown as zero. */
export const MIN_OPERATIONS = 10;

/** A sack of soy is 60 kg; Luiz Tangari's breakeven is 60 sacks per hectare. */
export const KG_PER_SACK = 60;

/** One maturity month of soy custeio in one UF, as DuckDB groups it. */
export interface MonthRow {
  uf: string;
  month: string;
  amount: number;
  operations: number;
}

export interface Queue {
  operations: number;
  total: number | null;
  /** Share of the harvest's custeio maturing on or before 30 April. */
  beforeCutoff: number | null;
  months: { month: string; amount: number | null }[];
}

/** Soy custeio issued in one praça and safra (MDCR). */
export interface Custeio {
  value: number;
  area: number;
}

export interface Praca {
  id: number;
  name: string;
  uf: string;
  custeio: Record<string, Custeio>;
  plantedHa: Record<string, number>;
  yieldKgHa: Record<string, number>;
}

export interface FilaDaSafra {
  generatedAt: string;
  sources: { sicorLastModified: string; latestEmission: string; mdcrFetchedAt: string };
  safras: {
    /** The last full plano safra, for maturities and R$/ha. */
    complete: string;
    /** The one being contracted now. */
    partial: string;
    /** The safra whose harvest the latest PAM measures, for the financed share. */
    measured: string;
    pamYear: string;
  };
  ufs: Record<string, { queue: Record<string, Queue> }>;
  pracas: Record<string, Praca>;
}

/** "2025/26" → "2026": the harvest that pays the safra's credit. */
export const harvestYear = (safra: string) => String(Number(safra.slice(0, 4)) + 1);

/** "2025/26" → "2026-04": the prazo-safra settlement month the columns name. */
export function cutoffMonth(safra: string): string {
  return `${harvestYear(safra)}-04`;
}

/** The plano safra runs July to June; an operation belongs to the safra it was issued in. */
export function safraOf(date: Date): string {
  const y = date.getUTCFullYear();
  const start = date.getUTCMonth() >= 6 ? y : y - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

/** The safra a PAM year measures: soy harvested in 2025 was financed in 2024/25. */
export const safraHarvestedIn = (year: string) => safraOf(new Date(Date.UTC(Number(year) - 1, 6, 1)));

const suppressed = (operations: number) => operations < MIN_OPERATIONS;

/**
 * The creditors a harvest pays: every soy custeio maturing in the harvest
 * year, whenever it was contracted. Queuing by contract date instead mixes in
 * the pre-custeio signed from January, which matures a year later. Soy custeio
 * barely matures between October and January, so the calendar year splits
 * harvests cleanly.
 */
export function buildQueue(rows: readonly MonthRow[], safra: string): Queue {
  const year = harvestYear(safra);
  const merged = new Map<string, { month: string; amount: number; operations: number }>();
  for (const r of rows) {
    if (!r.month.startsWith(year)) continue;
    const m = merged.get(r.month) ?? { month: r.month, amount: 0, operations: 0 };
    merged.set(r.month, { month: r.month, amount: m.amount + r.amount, operations: m.operations + r.operations });
  }
  const own = [...merged.values()].sort((a, b) => a.month.localeCompare(b.month));
  const operations = own.reduce((n, r) => n + r.operations, 0);
  const total = own.reduce((n, r) => n + r.amount, 0);
  if (suppressed(operations)) return { operations, total: null, beforeCutoff: null, months: [] };
  const cutoff = cutoffMonth(safra);
  const before = own.filter((r) => r.month <= cutoff).reduce((n, r) => n + r.amount, 0);
  return {
    operations,
    total,
    beforeCutoff: total > 0 ? before / total : null,
    months: own.map((r) => ({ month: r.month, amount: suppressed(r.operations) ? null : r.amount })),
  };
}

export interface Bucket {
  /** "2026-04". */
  key: string;
  amount: number | null;
  beforeCutoff: boolean;
}

/**
 * The chart's bars: one per month of the harvest year, empty months as zero
 * and a suppressed month as null. The queue holds only that year, so the bars
 * add up to its total.
 */
export function queueBuckets(queue: Queue, safra: string): Bucket[] {
  const year = harvestYear(safra);
  const cutoff = cutoffMonth(safra);
  const byMonth = new Map(queue.months.map((m) => [m.month, m.amount]));
  return Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    return { key, amount: byMonth.has(key) ? byMonth.get(key)! : 0, beforeCutoff: key <= cutoff };
  });
}

/**
 * Share of the praça's planted soy covered by bank custeio in the same season.
 * Financed area can exceed planted area (a field financed twice, soy planted
 * after soy), so a share above one is capped rather than shown as over 100%.
 */
export function bankShare(praca: Praca, safra: string, pamYear: string): number | null {
  const planted = praca.plantedHa[pamYear];
  const financed = praca.custeio[safra]?.area;
  if (!planted || financed === undefined) return null;
  return Math.min(1, financed / planted);
}

/** Custeio value per financed hectare, or null when the praça reported no area. */
export function perHectare(c: Custeio | undefined): number | null {
  return c && c.area > 0 ? c.value / c.area : null;
}

interface Sources {
  months: readonly MonthRow[];
  safras: FilaDaSafra['safras'];
  custeio: readonly { municipio: number; safra: string; value: number; area: number }[];
  pam: readonly { municipio: number; year: string; plantedHa?: number; kgHa?: number }[];
  names: ReadonlyMap<number, { name: string; uf: string }>;
}

export function buildUfs(months: readonly MonthRow[], safras: FilaDaSafra['safras']): FilaDaSafra['ufs'] {
  const ufs: FilaDaSafra['ufs'] = {};
  for (const uf of [...new Set(months.map((r) => r.uf))].sort()) {
    const own = months.filter((r) => r.uf === uf);
    ufs[uf] = { queue: { [safras.complete]: buildQueue(own, safras.complete), [safras.partial]: buildQueue(own, safras.partial) } };
  }
  return ufs;
}

/** Every named município with soy custeio or soy on record, shaped for the page. */
export function buildPracas(s: Pick<Sources, 'custeio' | 'pam' | 'names'>): Record<string, Praca> {
  const pracas: Record<string, Praca> = {};
  const praca = (id: number) => {
    const name = s.names.get(id);
    if (!name) return undefined;
    return (pracas[id] ??= { id, ...name, custeio: {}, plantedHa: {}, yieldKgHa: {} });
  };
  for (const c of s.custeio) {
    const p = praca(c.municipio);
    if (!p) continue;
    const prev = p.custeio[c.safra] ?? { value: 0, area: 0 };
    p.custeio[c.safra] = { value: prev.value + c.value, area: prev.area + c.area };
  }
  for (const r of s.pam) {
    const p = praca(r.municipio);
    if (!p) continue;
    if (r.plantedHa !== undefined) p.plantedHa[r.year] = r.plantedHa;
    if (r.kgHa !== undefined) p.yieldKgHa[r.year] = r.kgHa;
  }
  return Object.fromEntries(Object.entries(pracas).sort(([a], [b]) => Number(a) - Number(b)));
}
