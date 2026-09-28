const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 5571 → "5.571" */
export const int = (v: number) => whole.format(v);
/** 38.13 → "38,1" */
export const dec1 = (v: number) => oneDecimal.format(v);
/** 13.19 → "13,19" */
export const dec2 = (v: number) => twoDecimals.format(v);
/** 243 → "R$ 243" */
export const brl = (v: number) => `R$ ${whole.format(v)}`;

/** "2026-09-25" → "25/09/2026" */
export function dateBr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
