const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const percentFine = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** R$ 1,2 bi · R$ 340 mi · R$ 12 mil */
export const brlCompact = (v: number) => `R$ ${compact.format(v)}`;
export const brl = (v: number) => `R$ ${whole.format(v)}`;
export const pct = (v: number) => percent.format(v);
export const pctFine = (v: number) => percentFine.format(v);
export const int = (v: number) => whole.format(v);

/** "2026-04" → "abr/26" */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

/** "2026-09-18" → "18/09/2026" */
export function dateBr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export const monthName = (m: number) => MONTHS[m - 1];
