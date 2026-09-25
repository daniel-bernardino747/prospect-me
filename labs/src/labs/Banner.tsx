/**
 * Shown on every artifact, on screen and in print, so a page forwarded or saved
 * as PDF still says what it is (ADR-0001, Labs).
 */
export function Banner({ company }: { company: string }) {
  return (
    <aside className="labs-banner" role="note">
      <strong>Protótipo independente</strong> de Daniel Bernardino, construído a partir de dados públicos. Não é
      afiliado à {company} nem produzido por ela.
    </aside>
  );
}
