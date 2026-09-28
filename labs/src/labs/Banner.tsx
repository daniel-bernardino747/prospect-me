import type { Locale } from './artifact';

/**
 * Shown on every artifact, on screen and in print, so a page forwarded or saved
 * as PDF still says what it is (ADR-0001, Labs).
 */
export function Banner({ company, locale }: { company: string; locale: Locale }) {
  return (
    <aside className="labs-banner" role="note">
      {locale === 'en' ? (
        <>
          <strong>Independent prototype</strong> by Daniel Bernardino, built from public data. Not affiliated with or
          produced by {company}.
        </>
      ) : (
        <>
          <strong>Protótipo independente</strong> de Daniel Bernardino, construído a partir de dados públicos. Não é
          afiliado à {company} nem produzido por ela.
        </>
      )}
    </aside>
  );
}
