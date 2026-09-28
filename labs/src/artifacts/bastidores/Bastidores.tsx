import { Overpass, Overpass_Mono } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';

import s from './bastidores.module.css';
import {
  answerSentence,
  type Bastidores as Data,
  clock,
  CODE_ORDER,
  day,
  dayYear,
  duration,
  int,
  pct,
  runActiveMs,
  STATIONS,
  tokensShort,
  totals,
  waitMs,
} from './data';
import { loadBastidores } from './load';
import { Quadro } from './Quadro';
import { SelectionProvider } from './selection';
import { type ShareEntry, ShareBar } from './ShareBar';
import { findSelected, selectionIds, shareWords, stopLabel } from './texts';

const sheet = Overpass({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-sheet', display: 'swap' });
const code = Overpass_Mono({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-code', display: 'swap' });

/** Survives the build, so the render can be audited against what was decided (seed ec0a855b). */
const DIRECTION = `<!--
THESIS: An orchestration of agents is a production line, and directing it is levelling the work and stopping the line when a human must decide. The page is a heijunka board: one row per line of work, one pigeonhole per five minutes, one printed card per agent run, and a yellow-black stop band across the whole board wherever the line waited for Daniel. It refuses the dark trace viewer (terminal replay, tokyo-night spans) and the pastel SaaS Gantt.
OWN-WORLD: Concrete-grey shop wall (#BEBCB4); a white enamel board (#F2F2EE) ruled in black; flat cardstock cards in eight phase stocks with Overpass Mono codes; andon yellow (#F4C300) only for the human; black cards for lines that stopped. Overpass for words, Overpass Mono for codes and figures. Square board, 3px card corners.
STORY: The visitor reads how long, how many agents and how often Daniel decided; watches the cards slot in pitch by pitch and the line halt at each stop band; opens a card to check one agent; leaves through a row's end to the showcase it produced.
FIRST VIEWPORT: title plate and answer sentence on the wall; the andon strip and the board's first pitches beneath, with the first stop band visible.
FORM: heijunka levelling board with andon stops, candidate 6 of 7; seed ec0a855b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default function Bastidores({ searchParams }: ArtifactProps) {
  const data = loadBastidores();
  const pieces = answerSentence(data);
  const initial = findSelected(data, one(searchParams.r))?.id ?? null;
  const ids = selectionIds(data);
  const texts: Record<string, ShareEntry> = {};
  for (const id of ids) {
    const w = shareWords(data, findSelected(data, id));
    texts[id] = { short: w.short, title: w.title };
  }
  const page = shareWords(data, null);
  const fallback: ShareEntry = { short: page.short, title: page.title };

  return (
    <main className={`${s.chao} ${sheet.variable} ${code.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <SelectionProvider initial={initial} valid={ids}>
        <header className={s.wall}>
          <div className={s.plate}>
            <p className={s.title}>Bastidores</p>
            <p className={s.subtitle}>
              Como estas cinco demos foram feitas por agentes de IA, e onde a linha parou para Daniel decidir.
            </p>
          </div>
          <div className={s.answerBlock}>
            <h1 className={s.answer}>
              {pieces.map((p, i) =>
                p.t === 'text' ? (
                  <span key={i}>{p.v}</span>
                ) : (
                  <span key={i} className={p.t === 'fig' ? s.fig : p.t === 'human' ? s.figHuman : s.figStop}>
                    {p.v}
                  </span>
                ),
              )}
            </h1>
          </div>
          <div className={s.wallFoot}>
            <ul className={s.legend} aria-label="Como ler o quadro">
              <li>
                <Swatch kind="card" /> agente trabalhando
              </li>
              <li>
                <Swatch kind="stop" /> a linha parou: Daniel decidiu
              </li>
              <li>
                <Swatch kind="black" /> a linha parou sozinha
              </li>
            </ul>
            <ShareBar id="share-top" texts={texts} fallback={fallback} label="Compartilhar" />
          </div>
        </header>

        <section className={s.board} aria-labelledby="quadro">
          <h2 id="quadro" className={s.visuallyHidden}>
            O quadro
          </h2>
          <Quadro data={data} texts={texts} fallback={fallback} />
        </section>
      </SelectionProvider>

      <div className={s.sheet}>
        <Paradas data={data} />
        <Livro data={data} />
        <Metodo data={data} />
        <footer className={s.footer}>
          <p>
            Demo conceitual de Daniel Bernardino. Os dados são reais e dele: a sessão de trabalho e o git deste repositório.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Swatch({ kind }: { kind: 'card' | 'stop' | 'black' }) {
  return (
    <svg className={s.legendSwatch} viewBox="0 0 22 14" width="22" height="14" aria-hidden="true">
      {kind === 'card' && (
        <>
          <rect x="0.5" y="0.5" width="21" height="13" rx="2" fill="#D9BC8C" stroke="#141414" strokeOpacity="0.35" />
          <text x="3" y="10" fontSize="7.5" fontWeight="700" fontFamily="var(--font-code), monospace" fill="#141414">
            PE
          </text>
        </>
      )}
      {kind === 'stop' && (
        <>
          <defs>
            <pattern id="lg-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#F4C300" />
              <rect width="3" height="6" fill="#141414" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="22" height="14" fill="url(#lg-stripe)" />
        </>
      )}
      {kind === 'black' && (
        <path d="M0.5 0.5h17l4 4v9h-21z" fill="#141414" />
      )}
    </svg>
  );
}

function Paradas({ data }: { data: Data }) {
  const t = totals(data);
  return (
    <section className={s.paradas} aria-labelledby="paradas">
      <h2 id="paradas" className={s.h2}>
        Onde a linha parou
      </h2>
      <div className={s.paradasGrid}>
        <ol className={s.stops}>
          {data.checkpoints.map((cp) => (
            <li key={cp.id} className={s.stop}>
              <div className={s.stopHead}>
                <a className={s.stopCode} href={`?r=${cp.id}#ficha`}>
                  {stopLabel(cp)}
                </a>
                <span className={s.stopWhen}>
                  {day(cp.at)} {clock(cp.at)}
                </span>
                <span className={s.stopWait}>{duration(waitMs(cp, data.asOf))}</span>
                {cp.status !== 'respondida' && (
                  <span className={s.stopStatus}>
                    {cp.status === 'interrompida' ? 'sem resposta: a sessão terminou; Daniel voltou depois' : 'esperando resposta'}
                  </span>
                )}
              </div>
              <ul className={s.stopQs}>
                {cp.questions.map((q, i) => (
                  <li key={i}>
                    <strong>{q.header}:</strong>{' '}
                    {q.chosen.length > 0 ? (
                      <span className={s.chosenInline}>{q.chosen.join(', ')}</span>
                    ) : (
                      <span className={s.muted}>{q.own ? 'resposta própria' : 'sem resposta'}</span>
                    )}
                    {q.options.filter((o) => !q.chosen.includes(o)).length > 0 && (
                      <span className={s.entre}>
                        {' '}
                        entre {q.options.filter((o) => !q.chosen.includes(o)).join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <aside className={s.paradasSide}>
          <p>
            A linha esperou <strong className={s.mono}>{duration(t.waitMs)}</strong> no total
            {t.longestWait ? (
              <>
                ; a maior parada foi a <strong className={s.mono}>{stopLabel(t.longestWait)}</strong>, de{' '}
                <strong className={s.mono}>{duration(waitMs(t.longestWait, data.asOf))}</strong>
              </>
            ) : null}
            .
          </p>
          {t.withRecommendation > 0 && (
            <p>
              Em <strong className={s.mono}>{t.followedRecommendation}</strong> de{' '}
              <strong className={s.mono}>{t.withRecommendation}</strong> perguntas com uma opção recomendada pelo orquestrador, Daniel
              escolheu a recomendada.
            </p>
          )}
          <p className={s.note}>
            Uma parada longa não é trabalho parado por falta de decisão: é a sessão esperando, às vezes de um dia para o outro. O
            quadro encurta esses trechos, mas mantém as listras.
          </p>
        </aside>
      </div>
    </section>
  );
}

function Livro({ data }: { data: Data }) {
  const t = totals(data);
  const maxTool = Math.max(...t.tools.map(([, n]) => n));
  const maxPhase = Math.max(...t.byPhase.map((p) => p.processed));
  const tools = t.tools.slice(0, 12);
  const rest = t.tools.slice(12).reduce((a, [, n]) => a + n, 0);
  return (
    <section className={s.livro} aria-labelledby="livro">
      <h2 id="livro" className={s.h2}>
        Livro de bordo
      </h2>
      <div className={s.livroGrid}>
        <table className={s.table}>
          <caption>Chamadas de ferramenta</caption>
          <thead>
            <tr>
              <th scope="col">ferramenta</th>
              <th scope="col" className={s.num}>
                chamadas
              </th>
              <th scope="col">
                <span className={s.visuallyHidden}>proporção</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tools.map(([name, n]) => (
              <tr key={name}>
                <th scope="row" className={s.mono}>
                  {name}
                </th>
                <td className={s.num}>{int(n)}</td>
                <td>
                  <span className={s.bar} style={{ width: `${Math.max(2, (n / maxTool) * 100)}%` }} />
                </td>
              </tr>
            ))}
            {rest > 0 && (
              <tr>
                <th scope="row" className={s.muted}>
                  outras {t.tools.length - 12}
                </th>
                <td className={s.num}>{int(rest)}</td>
                <td />
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">total</th>
              <td className={s.num}>{int(t.toolCalls)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <table className={s.table}>
          <caption>Tokens processados por fase</caption>
          <thead>
            <tr>
              <th scope="col">fase</th>
              <th scope="col" className={s.num}>
                tokens
              </th>
              <th scope="col">parte lida do cache</th>
            </tr>
          </thead>
          <tbody>
            {CODE_ORDER.map((c) => t.byPhase.find((p) => p.code === c))
              .filter((p) => p !== undefined)
              .map((p) => (
                <tr key={p.code}>
                  <th scope="row">
                    <span className={s.swatch} data-stock={STATIONS[p.code].stock} data-code={p.code} aria-hidden="true" />
                    {STATIONS[p.code].label}
                  </th>
                  <td className={s.num}>{tokensShort(p.processed)}</td>
                  <td>
                    <span className={s.phaseBar} data-stock={STATIONS[p.code].stock} style={{ width: `${Math.max(3, (p.processed / maxPhase) * 100)}%` }}>
                      <span className={s.cacheHatch} style={{ width: `${(p.cacheRead / p.processed) * 100}%` }} />
                    </span>
                    <span className={s.barLabel}>{pct(p.cacheRead / p.processed)}</span>
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">total</th>
              <td className={s.num}>{tokensShort(t.tokensProcessed)}</td>
              <td>{pct(t.tokensCacheRead / t.tokensProcessed)} leitura de cache</td>
            </tr>
          </tfoot>
        </table>

        <div className={s.tempo}>
          <h3 className={s.h3}>Tempo</h3>
          <dl className={s.figures}>
            <dt>relógio com alguém trabalhando</dt>
            <dd>{duration(t.activeMs)}</dd>
            <dt>soma do tempo de cada agente</dt>
            <dd>{duration(t.agentMs)}</dd>
            <dt>do primeiro pedido ao fim do quadro</dt>
            <dd>{duration(t.spanMs)}</dd>
            {t.longestRun && (
              <>
                <dt>agente mais longo</dt>
                <dd>
                  {duration(runActiveMs(t.longestRun))}
                  <small className={s.mono}>{t.longestRun.label}</small>
                </dd>
              </>
            )}
            <dt>agentes reiniciados por parar de progredir</dt>
            <dd>{t.restarts}</dd>
            <dt>commits</dt>
            <dd>{t.commits}</dd>
          </dl>
          <p className={s.tempoLine}>
            Em média, <strong className={s.mono}>{(t.agentMs / Math.max(1, t.activeMs)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</strong>{' '}
            agentes trabalhando ao mesmo tempo enquanto a linha andava.
          </p>
        </div>
      </div>
      <div className={s.livroNotes}>
        <p>
          <strong>Sem tokens de saída.</strong> Nos transcritos, o número de tokens de saída é um instantâneo do meio da resposta e
          fica muito abaixo do real. A página mostra o que é confiável, os tokens de entrada processados (inclusive os lidos do cache),
          e, como aproximação do que foi produzido, os caracteres escritos.
        </p>
        <p>
          <strong>Sem custo em dólar.</strong> A sessão rodou num plano de assinatura; converter tokens em dólar pelo preço de tabela
          seria uma fatura inventada. O preço por modelo está na <a href="/demo/conta-de-tokens">Conta de tokens</a>.
        </p>
      </div>
    </section>
  );
}

function Metodo({ data }: { data: Data }) {
  return (
    <section className={s.metodo} aria-labelledby="metodo">
      <h2 id="metodo" className={s.h2}>
        Como foi medido
      </h2>
      <div className={s.metodoGrid}>
        <div className={s.prose}>
          <p>
            Na produção enxuta, qualquer pessoa pode parar a linha quando algo precisa de decisão; aqui, as paradas são as perguntas
            que o orquestrador fez a Daniel. O quadro é um quadro de nivelamento: uma fileira por linha de trabalho, uma coluna por
            cinco minutos, um cartão por agente, na cor da fase.
          </p>
          <p>
            Os números saem de dois lugares: os arquivos da sessão de trabalho do Claude Code na máquina de Daniel (o estado e o
            diário de cada workflow, o transcrito de cada agente e o do orquestrador) e o histórico git deste repositório. Um script
            os lê uma vez e grava um arquivo de dados; a página não consulta nada ao abrir.
          </p>
          <p>
            <strong>Lista branca, não lista negra.</strong> Do transcrito só saem contagens, horários, resultados enumerados (viável
            ou não, devolvida ou não, concluída ou não), nomes de ferramentas e de skills, os rótulos públicos dos agentes, os títulos
            e as opções das perguntas a Daniel e caminhos de arquivo dentro de <code>labs/</code> ou <code>docs/</code>. Nunca o
            texto de prompts ou respostas, o raciocínio, entradas e saídas de ferramentas, ids ou caminhos da máquina. No fim, o
            arquivo é varrido atrás de nome de usuário, e-mail, chave de API, telefone e ids; se algo aparece, o arquivo é apagado.
          </p>
          <p>
            Tokens processados são a entrada de cada chamada ao modelo, contada uma vez por mensagem, com a parte lida do cache. Um
            cartão cobre as colunas de cinco minutos em que o agente trabalhou; a linha fina embaixo marca os minutos exatos. Pausas
            de mais de dez minutos dividem o cartão. As frases sobre cada fase e cada evento foram escritas à mão.
          </p>
        </div>
        <div className={s.metodoSide}>
          <p>
            Dados extraídos em <span className={s.mono}>{dayYear(data.asOf)}, {clock(data.asOf)}</span> (horário de Brasília). O
            quadro para aí; a publicação desta página veio depois.
          </p>
          <p>
            Modelo: <span className={s.mono}>{data.model ?? 'não registrado'}</span>, em todos os agentes.
          </p>
          <h3 className={s.h3}>Referências</h3>
          <ul className={s.refs}>
            <li>
              <a href="https://www.infoq.com/news/2026/09/observability-ai-agents/">InfoQ, traces de sessão e controle de custo de agentes</a>{' '}
              (set 2026)
            </li>
            <li>
              <a href="https://github.com/es617/claude-replay">claude-replay</a>, replay de transcritos (MIT)
            </li>
            <li>
              <a href="https://arize.com/blog/open-source-coding-agent-tracing/">Arize, tracing de agentes de código</a>
            </li>
            <li>
              <a href="https://www.splunk.com/en_us/products/tokenomics.html">Splunk Tokenomics</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
