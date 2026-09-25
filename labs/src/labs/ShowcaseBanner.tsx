/**
 * Shown on every showcase, on screen and in print: it is a demo, not a client's
 * product, so nothing on it reads as work done for someone (ADR-0002).
 */
export function ShowcaseBanner() {
  return (
    <aside className="labs-banner" role="note">
      <strong>Demo conceitual</strong> de Daniel Bernardino, construído com dados públicos. Não é produto nem trabalho
      para nenhuma empresa.
    </aside>
  );
}
