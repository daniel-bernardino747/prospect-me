import type { Glass } from './data';
import s from './curtailment.module.css';

/** The lamp as a small inline glyph: amber, or red with its breaker bar; an empty socket when off. */
export function LampGlyph({ glass, size = 14 }: { glass: Glass | null; size?: number }) {
  return (
    <svg className={s.glyph} viewBox="0 0 14 14" width={size} height={size} aria-hidden="true">
      <circle cx="7" cy="7" r="6" className={s.glyphBezel} />
      {glass && <circle cx="7" cy="7" r="4.4" data-glass={glass} className={s.glyphLit} />}
      {glass === 'rede' && <line x1="3.4" x2="10.6" y1="7" y2="7" className={s.glyphBar} />}
    </svg>
  );
}
