export function Ended({ company }: { company: string }) {
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
