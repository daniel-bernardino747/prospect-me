import type { Locale } from './artifact';

export function Ended({ company, locale }: { company: string; locale: Locale }) {
  if (locale === 'en') {
    return (
      <main className="labs-ended" lang="en">
        <h1>This prototype has ended</h1>
        <p>
          It was an independent prototype by Daniel Bernardino, built from public data and not affiliated with{' '}
          {company}. It was online for a limited time and is no longer available.
        </p>
      </main>
    );
  }
  return (
    <main className="labs-ended">
      <h1>Este protótipo foi encerrado</h1>
      <p>
        Era um protótipo independente de Daniel Bernardino, feito com dados públicos e sem afiliação com a {company}.
        Ele ficou no ar por tempo limitado e não está mais disponível.
      </p>
    </main>
  );
}
