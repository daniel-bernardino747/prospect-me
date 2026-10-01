import { Atkinson_Hyperlegible_Next, Barlow_Semi_Condensed, Doto, Red_Hat_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import type { ArtifactProps } from '@/labs/artifact';

import { Chamada } from './Chamada';
import {
  answer,
  answerText,
  type BotData,
  cell,
  dateLabel,
  guiches,
  MODE_LABEL,
  MODES,
  orderedTasks,
  parseQuery,
  pct,
  PERSONA_LABEL,
  PERSONAS,
  QUEUE_LETTER,
  queryString,
  ranModes,
  receipt,
  seconds,
  taskCell,
  tickets,
  timesBuilt,
  usd,
  wait,
} from './data';
import { loadBotData } from './load';
import s from './painel.module.css';

const led = Doto({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-led', display: 'swap' });
const sign = Barlow_Semi_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-sign', display: 'swap' });
const text = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-text', display: 'swap' });
const thermal = Red_Hat_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-thermal', display: 'swap' });

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: The benchmark is the clinic's waiting room: every case is a ticket called and the four bots are service windows answering the same patient. It refuses the SaaS chatbot landing and the leaderboard dashboard.
OWN-WORLD: Verde-água painted wall (#A8D8CA) over a darker barrado band; one black LED housing with amber dot-matrix figures (Doto) and red failure LEDs; thermal-paper tickets and receipts (Red Hat Mono); Barlow Semi Condensed signage; a laminated notice held by tape; hazard tape marks test data.
STORY: The reader sees who solved how much with the difficult patient and what guardrails change, finds where each window fails, reads what reached the patient, then calls tickets to read the four conversations side by side.
FIRST VIEWPORT: The answer sentence full width on the wall; the LED panel with four windows by four columns directly under it.
FORM: waiting-room ticket panel, candidate 3 of 7; seed bc5faa75.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const REPO = 'https://github.com/daniel-bernardino747/zap-bench';
const PORTFOLIO = 'https://www.teamdbsolutions.com';

function Led({ value, tone = 'amber', size = 'md' }: { value: string; tone?: 'amber' | 'red' | 'dim'; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`${s.led} ${s[`led_${tone}`]} ${s[`led_${size}`]}`}>{value}</span>;
}

function Tape({ children }: { children: React.ReactNode }) {
  return (
    <p className={s.tape} role="note">
      <span>{children}</span>
    </p>
  );
}

function firstTicket(data: BotData, tarefa?: string): string {
  const list = tickets(data);
  return (list.find((t) => !tarefa || t.tarefa === tarefa) ?? list[0]).id;
}

function Panel({ data }: { data: BotData }) {
  const windows = guiches(data);
  const defaultScenario = parseQuery({}, data).scenario;
  return (
    <section className={s.housing} aria-labelledby="painel-titulo">
      <div className={s.silkscreen}>
        <h2 id="painel-titulo" className={s.silkTitle}>
          Painel de atendimento
        </h2>
        <p className={s.silkNote}>casos resolvidos, em % · toque num número para ver as conversas</p>
      </div>
      {data.synthetic && <Tape>Painel em teste · dados do cérebro falso, sem IA</Tape>}
      {data.split === 'dev' && <Tape>Prévia · números da dev, que favorecem o Jev</Tape>}
      <p className={s.boardLegend} aria-hidden="true">
        <span>Sem guardrails: padrão · difícil</span>
        <span>Com guardrails: padrão · difícil</span>
      </p>
      <table className={s.board}>
        <caption className={s.srOnly}>
          Porcentagem de casos resolvidos por cada atendente, sem e com guardrails, com o paciente padrão e com o difícil.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={s.boardCorner}>
              Guichê
            </th>
            {MODES.map((m) => (
              <th key={m} scope="colgroup" colSpan={2} className={s.boardMode}>
                {MODE_LABEL[m]}
              </th>
            ))}
          </tr>
          <tr className={s.boardPersonas}>
            <td aria-hidden="true" />
            {MODES.flatMap((m) =>
              PERSONAS.map((p) => (
                <th key={`${m}${p}`} scope="col">
                  {p === 'padrao' ? 'Padrão' : 'Difícil'}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => (
            <tr key={w.id}>
              <th scope="row" className={s.window}>
                <Led value={String(w.number)} size="lg" />
                <span className={s.windowName}>
                  {w.label}
                  <small>{w.model}</small>
                </span>
              </th>
              {MODES.flatMap((m) =>
                PERSONAS.map((p) => {
                  const c = cell(data, w.id, m, p);
                  const value = pct(c);
                  const base = p === 'dificil' ? pct(cell(data, w.id, m, 'padrao')) : null;
                  const drop = value !== null && base !== null ? value - base : null;
                  return (
                    <td key={`${m}${p}`} className={s.boardCell}>
                      {value === null ? (
                        <span className={s.notRun}>não rodou</span>
                      ) : (
                        <a
                          className={s.cellLink}
                          href={queryString({ scenario: defaultScenario, persona: p, mode: m })}
                          aria-label={`${w.label}, ${MODE_LABEL[m]}, ${PERSONA_LABEL[p]}: ${value}%, ${c!.passed} de ${c!.runs}. Ver conversas`}
                        >
                          <Led value={`${value}%`} size="lg" />
                          <span className={s.cellMeta}>
                            <span className={s.cellMetaLong}>
                              {c!.passed} de {c!.runs}
                            </span>
                            <span className={s.cellMetaShort}>
                              {c!.passed}/{c!.runs}
                            </span>
                            {drop !== null && drop !== 0 && (
                              <span className={`${drop < 0 ? s.dropDown : s.dropUp} ${s.cellDrop}`}>
                                {drop > 0 ? '+' : '−'}
                                {Math.abs(drop)} com o difícil
                              </span>
                            )}
                          </span>
                        </a>
                      )}
                    </td>
                  );
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function WindowLegend({ data }: { data: BotData }) {
  return (
    <p className={s.windowLegend}>
      {guiches(data).map((w) => (
        <span key={w.id}>
          <Led value={String(w.number)} size="sm" /> {w.label}
        </span>
      ))}
    </p>
  );
}

function Queues({ data }: { data: BotData }) {
  const windows = guiches(data);
  const modes = ranModes(data);
  const cols = { '--cols': windows.length } as React.CSSProperties;
  return (
    <section className={s.section} aria-labelledby="filas-titulo">
      <h2 id="filas-titulo" className={s.h2}>
        Onde cada um erra, fila por fila
      </h2>
      <p className={s.lede}>
        {`Cada fila é um tipo de caso. Os números são do paciente difícil, ${modes.length === 2 ? 'sem e com guardrails' : MODE_LABEL[modes[0]].toLowerCase()}. Toque num número para ler as conversas daquela fila.`}
      </p>
      <WindowLegend data={data} />
      <div className={s.queues} style={cols} role="table" aria-label="Acerto por tipo de caso, paciente difícil">
        <div className={s.queueHead} role="row">
          <span role="columnheader">Fila</span>
          {windows.map((w) => (
            <span key={w.id} role="columnheader">
              <Led value={String(w.number)} size="sm" /> <span className={s.queueHeadName}>{w.label}</span>
            </span>
          ))}
        </div>
        {orderedTasks(data).map((t) => {
          const scenario = firstTicket(data, t.id);
          return (
            <div key={t.id} className={s.queueRow} role="row">
              <span className={s.queueName} role="rowheader">
                <span className={s.queueButton} aria-hidden="true">
                  {QUEUE_LETTER[t.id]}
                </span>
                <span>
                  {t.label}
                  <small>
                    {t.scenarios} {t.scenarios === 1 ? 'caso' : 'casos'} × {data.repeats}
                  </small>
                </span>
              </span>
              {windows.map((w) => {
                const byMode = Object.fromEntries(MODES.map((m) => [m, pct(taskCell(data, w.id, t.id, m, 'dificil'))]));
                return (
                  <span key={w.id} className={s.queueCell} role="cell" data-label={w.number}>
                    {modes.every((m) => byMode[m] === null) ? (
                      <span className={s.notRunWall}>não rodou</span>
                    ) : (
                      modes.map((m) => {
                        const v = byMode[m];
                        return (
                          <a
                            key={m}
                            className={s.queueLink}
                            href={queryString({ scenario, persona: 'dificil', mode: m })}
                            aria-label={`${w.label}, ${t.label}, ${MODE_LABEL[m]}: ${v ?? '—'}%. Ver conversas`}
                          >
                            <span className={s.arrowText}>{m === 'bruto' ? 'sem' : 'com'}</span>
                            <span className={v !== null && v < 50 ? s.badFigure : s.figure}>{v ?? '—'}%</span>
                          </a>
                        );
                      })
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Receipts({ data }: { data: BotData }) {
  const cols = { '--cols': guiches(data).length } as React.CSSProperties;
  return (
    <section className={s.section} aria-labelledby="ocorrencias-titulo">
      <h2 id="ocorrencias-titulo" className={s.h2}>
        O que chegou ao paciente
      </h2>
      <p className={s.lede}>
        Toda informação precisa vir de uma função da clínica: preço, convênio, horário, política. Sem guardrails, o que o
        atendente escreve sai. Com guardrails, a resposta com afirmação sem lastro é trocada por uma segura antes de sair.
      </p>
      <div className={s.receipts} style={cols}>
        {guiches(data).map((w) => {
          const r = receipt(data, w.id);
          return (
            <article key={w.id} className={s.receipt} aria-label={`Ocorrências do guichê ${w.number}, ${w.label}`}>
              <header className={s.receiptHead}>
                <span>Guichê {w.number}</span>
                <strong>{w.label}</strong>
              </header>
              <dl className={s.receiptTotals}>
                <div>
                  <dt>Sem guardrails, saíram</dt>
                  <dd>{r.runsBruto ? r.totalBruto : <span className={s.notRun}>não rodou</span>}</dd>
                </div>
                <div>
                  <dt>Com guardrails, escreveu</dt>
                  <dd>{r.totalGenerated}</dd>
                </div>
                <div>
                  <dt>Com guardrails, saíram</dt>
                  <dd>{r.totalSent}</dd>
                </div>
              </dl>
              {r.lines.length ? (
                <table className={s.receiptLines}>
                  <thead>
                    <tr>
                      <th scope="col">Ocorrência</th>
                      <th scope="col">sem</th>
                      <th scope="col">com</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.lines.map((l) => (
                      <tr key={l.kind}>
                        <th scope="row">{l.label}</th>
                        <td>{r.runsBruto ? l.bruto : '—'}</td>
                        <td>
                          {l.sent}
                          {l.generated > l.sent && <small> ({l.generated - l.sent} barradas)</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={s.receiptEmpty}>Nenhuma afirmação sem lastro.</p>
              )}
              {r.runsBruto > 0 && (
                <p className={s.receiptFoot}>
                  Agiu sem confirmação: <strong>{r.unconfirmed}</strong> <span>(sem guardrails, em {r.runsBruto} execuções)</span>
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const WAIT_ROWS: { label: string; value: (v: NonNullable<ReturnType<typeof wait>>) => string }[] = [
  { label: 'Mensagens do bot por conversa', value: (v) => v.messages.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
  { label: 'Funções chamadas por caso', value: (v) => v.tools.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
  { label: 'Espera típica (p50)', value: (v) => seconds(v.p50) },
  { label: 'Espera longa (p95)', value: (v) => seconds(v.p95) },
  { label: 'Custo por conversa', value: (v) => usd(v.cost) },
];

function Waits({ data }: { data: BotData }) {
  const windows = guiches(data);
  return (
    <section className={s.section} aria-labelledby="espera-titulo">
      <h2 id="espera-titulo" className={s.h2}>
        Quanto custa cada atendimento
      </h2>
      <p className={s.lede}>
        No WhatsApp oficial, cada mensagem do bot é cobrada. Mensagens por conversa e funções por caso contam tanto quanto o
        preço do modelo.
      </p>
      <div className={s.waitHousing}>
        <table className={s.waitTable}>
          <caption className={s.srOnly}>Mensagens, funções, espera e custo por atendente, sem e com guardrails.</caption>
          <thead>
            <tr>
              <td aria-hidden="true" />
              {windows.map((w) => (
                <th key={w.id} scope="col">
                  <Led value={String(w.number)} size="sm" /> <span className={s.waitHeadName}>{w.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          {ranModes(data).map((m) => (
            <tbody key={m}>
              <tr className={s.waitModeRow}>
                <th scope="colgroup" colSpan={windows.length + 1}>
                  {MODE_LABEL[m]}
                </th>
              </tr>
              {WAIT_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {windows.map((w) => {
                    const v = wait(data, w.id, m);
                    return <td key={w.id}>{v ? <Led value={row.value(v)} size="sm" /> : <span className={s.notRun}>não rodou</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

function Notice({ data }: { data: BotData }) {
  return (
    <section className={s.notice} aria-labelledby="aviso-titulo">
      <span className={`${s.noticeTape} ${s.noticeTapeLeft}`} aria-hidden="true" />
      <span className={`${s.noticeTape} ${s.noticeTapeRight}`} aria-hidden="true" />
      <h2 id="aviso-titulo" className={s.noticeTitle}>
        Como foi medido
      </h2>
      <ul className={s.noticeList}>
        <li>
          A clínica, a <strong>Odonto Exemplo</strong>, é fictícia. Os pacientes também: são simulados, não pessoas reais.
        </li>
        <li>
          Os atendentes usam as mesmas funções da clínica (consultar serviço, verificar convênio, políticas, buscar horários,
          agendar, remarcar, cancelar, chamar humano) e não recebem os dados da clínica: todo fato tem de sair de uma função, e
          o código confere.
        </li>
        <li>
          O paciente difícil escreve sem acento, abrevia, manda várias mensagens curtas e desiste se tiver de repetir algo. Nas
          conversas, ele é interpretado por <code>{data.patient.model}</code>, um modelo de fora da comparação.
        </li>
        <li>
          Com guardrails, agendar, remarcar e cancelar só acontecem depois de um sim do paciente a um dia e hora citados, e a
          resposta com afirmação sem lastro é trocada por uma segura. Sem guardrails, nada disso é barrado; só medido.
        </li>
        {data.brains.some((b) => b.id === 'jev-redator') && (
          <li>
            O <strong>Jev + redator</strong> é o Jev decidindo e chamando as funções, com um LLM que só reescreve a mensagem
            dele. Se a reescrita perde ou inventa um fato, ou anuncia algo que não aconteceu, sai o texto original do Jev.
          </li>
        )}
        {data.split === 'dev' ? (
          <li>
            <strong>Prévia:</strong> estes são os casos de ajuste ({data.scenarios.length} cenários, {data.repeats}{' '}
            {data.repeats === 1 ? 'execução' : 'execuções'} cada). As regras do Jev foram corrigidas olhando exatamente
            estas conversas, e os prompts dos LLMs não; por isso os números favorecem o Jev. Os números publicáveis vêm de
            outro conjunto, o de validação.
          </li>
        ) : (
          <li>
            Só os casos de validação ({data.scenarios.length} cenários, {data.repeats}{' '}
            {data.repeats === 1 ? 'execução' : 'execuções'} cada). Prompts e regras foram ajustados em outro conjunto.
          </li>
        )}
        <li>
          Não mede: pacientes reais, outras clínicas, a naturalidade do texto (o juiz ainda não rodou) nem diferença pequena
          como verdade; os números não têm casa decimal por isso.
        </li>
      </ul>
      <p className={s.noticeMeta}>
        Rodada de {dateLabel(data.runAt)}. Modelos:{' '}
        {data.brains.map((b, i) => (
          <span key={b.id}>
            {i > 0 && ', '}
            {b.label} (<code>{b.model}</code>)
          </span>
        ))}
        .
      </p>
      <p className={s.noticeLinks}>
        <a href={REPO}>Código, cenários e dados no GitHub</a>
        <a href={PORTFOLIO}>Daniel Bernardino</a>
      </p>
    </section>
  );
}

/**
 * /demo/bot-whatsapp-ia-vs-jev: the same clinic patients answered by three LLM
 * bots and one Jev bot, measured by code. Everything renders on the server; the
 * ticket being called is in the query string.
 */
export default function BotWhatsappIaVsJev({ searchParams }: ArtifactProps) {
  const data = loadBotData();
  // Test data and the dev preview never go live, even if the branch is merged by mistake.
  if ((data.synthetic || data.split !== 'validation') && process.env.NODE_ENV === 'production') notFound();

  const q = parseQuery(searchParams, data);
  const a = answer(data);

  return (
    <div className={`${s.wall} ${led.variable} ${sign.variable} ${text.variable} ${thermal.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      {data.synthetic && <Tape>Dados de teste · cérebro falso e paciente por regras · não publicar</Tape>}
      {data.split === 'dev' && <Tape>Prévia · casos em que o Jev foi ajustado · não publicar</Tape>}
      <header className={s.top}>
        <h1 className={s.answer}>{answerText(a)}</h1>
        <p className={s.meta}>
          Bot de WhatsApp para uma clínica odontológica fictícia, construído {timesBuilt(data)} e medido pelos mesmos casos.
          Rodada de {dateLabel(data.runAt)}.
        </p>
      </header>
      <Panel data={data} />
      <Queues data={data} />
      <Receipts data={data} />
      <Waits data={data} />
      <Chamada data={data} q={q} />
      <Notice data={data} />
    </div>
  );
}
