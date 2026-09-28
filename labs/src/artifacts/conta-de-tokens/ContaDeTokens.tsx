import { Chivo, Chivo_Mono } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';

import { Conta, ContaBoundary } from './Conta';
import { answer, answerText, board, dateLabel, parseScenario, sharePct, usd } from './data';
import { loadContaDeTokens } from './load';
import s from './conta.module.css';

const sign = Chivo({ subsets: ['latin'], variable: '--font-sign', display: 'swap' });
const flap = Chivo_Mono({ subsets: ['latin'], variable: '--font-flap', display: 'swap' });

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: Tokens are a commodity with a price per million; the page is the exchange quote board that reprices them for your volume. It refuses the SaaS cost dashboard (dark cards, KPI tiles, donut) and the broadsheet price table.
OWN-WORLD: Blue-steel sheet (#C7CFD8, ink #0D1826) crossed by one full-bleed near-black board band (#15171A) where white split-flap quotes hang side by side on a black hinge; Chivo in sentences and tracked caps signage, Chivo Mono for every figure; one chartreuse highlighter (#D4F23A) that only ever means "your reference model", never as text on black.
STORY: The reader sees their bill on a frontier model beside the bill on the model the market uses most, learns the view is OpenRouter's, moves the cache fader, and watches which cells flip and which rows stay frozen.
FIRST VIEWPORT: headrail; kicker; answer sentence full width; the black board band with the two quotes; the cache fader directly under the band.
FORM: exchange quote board, horizontal, candidate 3 of 7; seed dee86e75.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const PORTFOLIO = 'https://www.teamdbsolutions.com';
const RANKINGS_DOC = 'https://openrouter.ai/docs/api/api-reference/datasets/daily-token-totals-for-top-50-models';

/**
 * /demo/conta-de-tokens: what a team's token volume costs on each model, beside
 * which models OpenRouter's traffic actually spends its tokens on. Everything
 * renders on the server from `data.json`; the client island adds the lever.
 */
export default function ContaDeTokens({ searchParams }: ArtifactProps) {
  const data = loadContaDeTokens();
  const initial = parseScenario(searchParams, data);
  const asOf = data.sources.rankings.asOf;
  const pricesDate = dateLabel(data.sources.catalog.fetchedAt);
  const dataDate = dateLabel(data.weeks.at(-1)!.end);
  const viaMirror = data.sources.rankings.via === 'mirror';

  return (
    <div className={`${s.sheet} ${sign.variable} ${flap.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />

      <header className={s.headrail}>
        <div className={`${s.wrap} ${s.headrailInner}`}>
          <span className={s.railName}>Conta de tokens</span>
          <a className={s.railMid} href="#fontes">
            Preços: catálogo OpenRouter · Participação: OpenRouter rankings
          </a>
          <span className={s.railDate}>dados {dataDate}</span>
        </div>
      </header>

      <main>
        <ContaBoundary fallback={<Fallback data={data} />}>
          <Conta data={data} initial={initial} />
        </ContaBoundary>

        <div className={`${s.wrap} ${s.closing}`}>
          <details className={s.notes} open>
            <summary className={s.notesSummary}>Como a conta é feita</summary>
            <div className={s.notesBody}>
              <p>
                Para cada modelo, a fatura do mês soma três partes: a entrada que não veio do cache, cobrada pelo preço de entrada; a entrada
                servida do cache, cobrada pelo preço de leitura do cache; e a saída, cobrada pelo preço de saída.
              </p>
              <p className={s.formula}>
                fatura = entrada × (1 − cache) × preço_entrada + entrada × cache × preço_cache + saída × preço_saída
              </p>
              <p>
                Fica de fora: a escrita no cache (os modelos que cobram por ela ficariam um pouco mais caros), preços de contexto longo e os
                preços em lote (<span className={s.data}>:batch</span>). Um modelo sem preço de leitura de cache no catálogo não muda com o
                controle de cache: a linha dele fica travada, com um cadeado.
              </p>
              <p>
                Os preços são do catálogo público do OpenRouter, lido em {pricesDate}. A participação vem do conjunto de dados diário do
                OpenRouter com os 50 modelos que mais processaram tokens em cada dia, mais uma linha “outros”
                {viaMirror ? ', lido da cópia pública das respostas (IAPS-AI) enquanto não há chave de acesso' : ''}; aqui ela é somada em{' '}
                {data.weeks.length} semanas de sete dias, a última terminando em {dataDate}. Não existe divisão entre entrada e saída nem taxa
                de cache por modelo nesses dados: a proporção de saída e o cache são hipóteses suas.
              </p>
              <p>
                A frase do topo é gerada a partir desses dados quando a página é construída; quando os dados forem buscados de novo, ela muda
                sozinha. Os números do cenário são ilustrativos: não são a fatura de ninguém.
              </p>
            </div>
          </details>

          <section id="fontes" className={s.sources} aria-labelledby="fontes-titulo">
            <h2 id="fontes-titulo" className={s.h3}>
              Fontes
            </h2>
            <ol>
              <li>
                <span className={s.srcMark}>¹</span> Preços: catálogo público do OpenRouter, {pricesDate}.{' '}
                <a href={data.sources.catalog.url}>{data.sources.catalog.url.replace('https://', '')}</a>
              </li>
              <li>
                <span className={s.srcMark}>²</span> Participação: Source: OpenRouter (openrouter.ai/rankings), as of {asOf}. Licença{' '}
                <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, conforme a{' '}
                <a href={RANKINGS_DOC}>documentação do conjunto de dados</a>.{' '}
                {viaMirror ? (
                  <>
                    As respostas cruas do endpoint <span className={s.data}>rankings-daily</span> foram lidas da cópia pública em{' '}
                    <a href={data.sources.rankings.mirror}>{data.sources.rankings.mirror?.replace('https://', '')}</a>, sem alteração.
                  </>
                ) : (
                  <>
                    Endpoint <span className={s.data}>{data.sources.rankings.url.replace('https://', '')}</span>.
                  </>
                )}
              </li>
              <li>
                Cobertura: {sharePct(data.coverage)} dos tokens da última semana têm preço no catálogo; o resto é a linha “outros” do
                OpenRouter e modelos que já saíram do catálogo.
              </li>
            </ol>
          </section>
        </div>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p>
            Demo conceitual de <a href={PORTFOLIO}>Daniel Bernardino</a>. Nenhuma marca citada aqui participou dela.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** What stays if the interactive part fails: the default case, as text and a table. */
function Fallback({ data }: { data: ReturnType<typeof loadContaDeTokens> }) {
  const sc = parseScenario({}, data);
  const b = board(data, sc, false);
  return (
    <div className={s.wrap}>
      <p className={s.kicker}>Cenário ilustrativo · preços e participação do OpenRouter (só o tráfego que passa por ele)</p>
      <h1 className={s.answer}>{answerText(answer(data, sc))}</h1>
      <p className={s.muted}>A parte interativa falhou; os números acima são do caso padrão.</p>
      <table className={s.table}>
        <caption className={s.srOnly}>Fatura mensal estimada por modelo, caso padrão</caption>
        <thead>
          <tr>
            <th scope="col">Modelo</th>
            <th scope="col">Fatura/mês</th>
          </tr>
        </thead>
        <tbody>
          {b.paid.map((r) => (
            <tr key={r.model.key}>
              <th scope="row">{r.model.name}</th>
              <td className={s.data}>US$ {usd(r.bill?.total ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
