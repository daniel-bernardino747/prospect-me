import { Barlow, Barlow_Condensed, League_Gothic } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';

import {
  bankShare,
  type FilaDaSafra as Data,
  harvestYear,
  KG_PER_SACK,
  perHectare,
  type Praca,
  type Queue,
  queueBuckets,
} from './data';
import { brl, brlCompact, dateBr, int, monthLabel, pct } from './format';
import { Finder } from './Finder';
import { loadFilaDaSafra } from './load';
import s from './fila.module.css';

const display = League_Gothic({ subsets: ['latin'], variable: '--font-display' });
const label = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-label' });
const prose = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-prose' });

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: a praça read as a timetable: the harvest's creditors depart month by month, and 30/04 is the revenda's gate. Refuses the data-journalism scroll and the KPI-card dashboard.
OWN-WORLD: lit goldenrod bed (echoing Tarken's amber), carbon and slate slabs, ivory prose panes, vermilion and bottle-green status plates, condensed gothic caps, raked plates.
STORY: the reader sees their praça's verdict in three timetable lines, then the departures board, then the detail behind each line, then the method.
FIRST VIEWPORT: praça name huge, then the three verdict lines, each with figure and a written status; "Trocar praça" in the top strip.
FORM: timetable (challenger rw-timetable-slide-rack), seed 03b6827d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

/** The praças Tarken takes its events to (tarken.ag bundle), offered first. */
const FEATURED = [5107925, 2919553, 4113700, 5208707, 5208004];
const DEFAULT = 5107925;

const COLUMNS = {
  fila: {
    title: 'A encruzilhada pós-colheita',
    url: 'https://education.tarken.ag/blog/encruzilhada-pos-colheita',
    quote: 'o produtor rural organiza suas contas por prioridade, pagando-as conforme a entrada de capital.',
  },
  sacas: {
    title: 'Para dar lucro, produtor de soja precisa de 60 sacas por hectare',
    url: 'https://education.tarken.ag/blog/lucro-para-o-produtor',
    quote: 'abaixo de 60, prejuízo; do 61º em diante, lucro.',
  },
  limite: {
    title: 'Qual é o limite de crédito na agricultura? 3 mil reais por hectare?',
    url: 'https://education.tarken.ag/blog/limite-de-credito',
    quote:
      'Se você trabalha numa revenda que oferece o pacote completo de insumos, os R$ 3.000 por hectare começam a fazer sentido.',
  },
} as const;

const BREAKEVEN_SACKS = 60;
const PACKAGE_PER_HA = 3000;

type Tone = 'stop' | 'go' | 'hold';

/** How the bank's queue sits against the revenda's 30/04, in the reader's words. */
function filaStatus(share: number): { tone: Tone; text: string } {
  if (share >= 0.5) return { tone: 'stop', text: 'Banco na frente' };
  if (share >= 0.2) return { tone: 'hold', text: 'Divide a janela' };
  return { tone: 'go', text: 'Banco depois' };
}

/**
 * Where the praça's soy was financed. Neutral on purpose: the public data
 * cannot say whether what sits outside the bank is revenda, barter or CPR.
 */
function bankStatus(share: number): { tone: Tone; text: string } {
  if (share >= 1) return { tone: 'hold', text: 'Tudo no banco' };
  return { tone: 'hold', text: share >= 0.5 ? 'Maioria no banco' : 'Maioria fora do banco' };
}

export default function FilaDaSafra({ searchParams }: ArtifactProps) {
  const data = loadFilaDaSafra();
  const praca = data.pracas[Number(searchParams.m)] ?? data.pracas[DEFAULT];
  const options = Object.values(data.pracas).map(({ id, name, uf }) => ({ id, name, uf }));
  const featured = FEATURED.flatMap((id) => (data.pracas[id] ? [{ id, name: data.pracas[id].name, uf: data.pracas[id].uf }] : []));
  const { complete } = data.safras;

  return (
    <main className={`${s.bed} ${display.variable} ${label.variable} ${prose.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <header className={s.strip}>
        <p className={s.mark}>
          <span>A fila da safra</span>
          <small>crédito rural na praça, pelas colunas de Luiz Tangari</small>
        </p>
        <Finder options={options} featured={featured} current={praca.id} />
      </header>

      <div className={s.sheet}>
        <section className={s.place} aria-labelledby="praca">
          <h1 id="praca">
            {praca.name}
            <span className={s.plateUf}>
              <span>{praca.uf}</span>
            </span>
          </h1>
          <p className={s.stamp}>
            Safra {complete} · colheita de {harvestYear(complete)} · contratos até {dateBr(data.sources.latestEmission)}
          </p>
        </section>

        <Verdict praca={praca} data={data} />
        <Board praca={praca} data={data} />
        <Financia praca={praca} data={data} />
        <Sacas praca={praca} />
        <Pacote praca={praca} data={data} />
        <Method data={data} />
      </div>

      <footer className={s.foot}>
        <p>
          As colunas citadas aqui são de Luiz Tangari, fundador da Tarken: governança de crédito para revendas e
          indústrias do agro.
        </p>
        <a className={s.footLink} href="https://tarken.ag">
          <span>Conhecer a Tarken</span>
        </a>
      </footer>
    </main>
  );
}

function Verdict({ praca, data }: { praca: Praca; data: Data }) {
  const { complete, measured, pamYear } = data.safras;
  const q = data.ufs[praca.uf]?.queue[complete];
  const share = bankShare(praca, measured, pamYear);
  const years = Object.keys(praca.yieldKgHa).sort();
  const lastYear = years.at(-1);
  const sacks = lastYear ? praca.yieldKgHa[lastYear] / KG_PER_SACK : null;

  return (
    <section className={s.timetable} aria-label={`Resumo de ${praca.name}`}>
      {q && q.total !== null && q.beforeCutoff !== null ? (
        <Line
          code={`Fila · ${praca.uf}`}
          href="#fila"
          figure={pct(q.beforeCutoff)}
          what={`do custeio bancário de soja de ${praca.uf} vence antes de 30/04, o prazo-safra da revenda`}
          scope={`estado · colheita de ${harvestYear(complete)}`}
          status={filaStatus(q.beforeCutoff)}
        />
      ) : (
        <Line
          code={`Fila · ${praca.uf}`}
          figure="—"
          what={`poucas operações de custeio de soja em ${praca.uf} para montar a fila`}
        />
      )}
      {share !== null ? (
        <Line
          code="Banco"
          href="#banco"
          figure={share >= 1 ? '100%' : pct(share)}
          what={`da soja plantada em ${praca.name} teve custeio bancário`}
          scope={`praça · safra ${measured}`}
          status={bankStatus(share)}
        />
      ) : (
        <Line code="Banco" figure="—" what={`o IBGE não registra área plantada de soja em ${praca.name} em ${pamYear}`} />
      )}
      {sacks !== null && lastYear ? (
        <Line
          code="60 sc"
          href="#sacas"
          figure={`${int(sacks)} sc/ha`}
          what={`rendimento da soja em ${praca.name}, contra a régua de 60 sacas`}
          scope={`praça · colheita de ${lastYear}`}
          status={
            sacks >= BREAKEVEN_SACKS
              ? { tone: 'go', text: `${int(sacks - BREAKEVEN_SACKS)} sc acima` }
              : { tone: 'stop', text: `${int(BREAKEVEN_SACKS - sacks)} sc abaixo` }
          }
        />
      ) : (
        <Line code="60 sc" figure="—" what={`o IBGE não registra produção de soja em ${praca.name}`} />
      )}
    </section>
  );
}

function Line({
  code,
  figure,
  what,
  scope,
  status,
  href,
}: {
  code: string;
  figure: string;
  what: string;
  scope?: string;
  status?: { tone: Tone; text: string };
  href?: string;
}) {
  const body = (
    <>
      <span className={s.code}>
        <span>{code}</span>
      </span>
      <span className={s.figure}>{figure}</span>
      <span className={s.what}>
        {what}
        {scope && <span className={s.scope}>{scope}</span>}
      </span>
      {status && (
        <span className={s.status} data-tone={status.tone}>
          <span>{status.text}</span>
        </span>
      )}
    </>
  );
  return href ? (
    <a className={s.line} href={href}>
      {body}
    </a>
  ) : (
    <div className={s.line}>{body}</div>
  );
}

function Board({ praca, data }: { praca: Praca; data: Data }) {
  const { complete, partial } = data.safras;
  const q = data.ufs[praca.uf]?.queue[complete];
  const next = data.ufs[praca.uf]?.queue[partial];
  const year = harvestYear(complete);

  return (
    <section id="fila" className={s.section} aria-labelledby="fila-h">
      <h2 id="fila-h">Quem a colheita de {year} paga, mês a mês</h2>
      <p className={s.lead}>
        Custeio bancário de soja em {praca.uf} por mês de vencimento. O prazo-safra da revenda vence em 30 de abril: o
        que vence antes disputa a colheita na frente dela.
      </p>
      {!q || q.total === null ? (
        <p className={s.pane}>Poucas operações de custeio de soja em {praca.uf} para mostrar os vencimentos.</p>
      ) : (
        <Departures queue={q} safra={complete} uf={praca.uf} />
      )}
      {next && next.total !== null && next.beforeCutoff !== null && (
        <p className={s.aside}>
          <strong>Colheita de {Number(year) + 1}, já contratada:</strong> {brlCompact(next.total)}, dos quais{' '}
          {pct(next.beforeCutoff)} vencem até 30 de abril. A fila ainda se forma: a maior parte do custeio de soja é
          contratada entre agosto e dezembro.
        </p>
      )}
      <p className={s.aside}>
        Vencimentos do estado: o Banco Central publica o município de cada contrato só para parte dos bancos.
      </p>
      <Column {...COLUMNS.fila} />
    </section>
  );
}

function Departures({ queue, safra, uf }: { queue: Queue; safra: string; uf: string }) {
  const rows = queueBuckets(queue, safra).filter((b) => b.amount !== 0);
  const max = Math.max(1, ...rows.map((b) => b.amount ?? 0));
  const cut = rows.findIndex((b) => !b.beforeCutoff);
  const before = queue.beforeCutoff ?? 0;

  return (
    <div className={s.board}>
      <div className={s.boardHead}>
        <span>Partidas · {uf}</span>
        <span>Total {brlCompact(queue.total ?? 0)}</span>
      </div>
      <table>
        <caption className={s.vh}>
          Custeio de soja em {uf} por mês de vencimento; {pct(before)} vence até 30 de abril
        </caption>
        <thead>
          <tr>
            <th scope="col">Vence</th>
            <th scope="col">Custeio</th>
            <th scope="col" className={s.barCol}>
              <span className={s.vh}>Proporção</span>
            </th>
            <th scope="col">Situação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => (
            <Row key={b.key} bucket={b} max={max} gate={i === cut} before={before} />
          ))}
          {cut === -1 && <Gate before={before} />}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  bucket,
  max,
  gate,
  before,
}: {
  bucket: { key: string; amount: number | null; beforeCutoff: boolean };
  max: number;
  gate: boolean;
  before: number;
}) {
  return (
    <>
      {gate && <Gate before={before} />}
      <tr data-before={bucket.beforeCutoff || undefined}>
        <th scope="row">{monthLabel(bucket.key)}</th>
        <td className={s.num}>{bucket.amount === null ? 'sigilo' : brlCompact(bucket.amount)}</td>
        <td className={s.barCol}>
          {bucket.amount !== null && <span className={s.bar} style={{ width: `${(bucket.amount / max) * 100}%` }} />}
        </td>
        <td>
          <span className={s.flag} data-tone={bucket.beforeCutoff ? 'stop' : 'go'}>
            {bucket.beforeCutoff ? 'Na frente' : 'Depois'}
          </span>
        </td>
      </tr>
    </>
  );
}

function Gate({ before }: { before: number }) {
  return (
    <tr className={s.gate}>
      <td colSpan={4}>
        <div>
          <span>30/04 · prazo-safra da revenda</span>
          <span>{pct(before)} vence antes</span>
        </div>
      </td>
    </tr>
  );
}

function Financia({ praca, data }: { praca: Praca; data: Data }) {
  const { measured, pamYear } = data.safras;
  const share = bankShare(praca, measured, pamYear);
  const planted = praca.plantedHa[pamYear];
  const financed = praca.custeio[measured]?.area ?? 0;
  if (share === null || !planted) return null;
  return (
    <section id="banco" className={s.section} aria-labelledby="banco-h">
      <h2 id="banco-h">Quanto da soja passou pelo banco</h2>
      <div className={s.split} role="img" aria-label={`${int(financed)} de ${int(planted)} hectares com custeio bancário`}>
        <span className={s.splitBank} style={{ flexBasis: `${Math.min(1, share) * 100}%` }}>
          <span>Banco {share >= 1 ? '100%' : pct(share)}</span>
        </span>
        {share < 1 && (
          <span className={s.splitRest}>
            <span>Fora do banco {pct(1 - share)}</span>
          </span>
        )}
      </div>
      <p className={s.lead}>
        {int(financed)} dos {int(planted)} hectares de soja plantados em {praca.name} tiveram custeio bancário na safra{' '}
        {measured}.
        {share < 1 &&
          ' O resto foi plantado com prazo-safra da revenda, barter com a trading, CPR ou caixa do produtor. Os dados públicos não dizem qual.'}
      </p>
      <p className={s.aside}>
        Área de custeio da safra {measured} (Banco Central) sobre a área plantada que o IBGE mediu na colheita de{' '}
        {pamYear}. O mesmo talhão pode ser financiado duas vezes, então o número é aproximado e nunca passa de 100%.
      </p>
    </section>
  );
}

function Sacas({ praca }: { praca: Praca }) {
  const years = Object.keys(praca.yieldKgHa).sort();
  if (years.length === 0) return null;
  const top = Math.max(80, ...years.map((y) => praca.yieldKgHa[y] / KG_PER_SACK)) * 1.05;
  const x = (v: number) => `${(v / top) * 100}%`;
  return (
    <section id="sacas" className={s.section} aria-labelledby="sacas-h">
      <h2 id="sacas-h">A régua das 60 sacas</h2>
      <div className={s.ruler}>
        {years.map((y, i) => {
          const sacks = praca.yieldKgHa[y] / KG_PER_SACK;
          const above = sacks >= BREAKEVEN_SACKS;
          return (
            <div key={y} className={s.rulerRow}>
              <span className={s.rulerYear}>{y}</span>
              <span className={s.rulerTrack}>
                <span className={s.rulerFill} data-tone={above ? 'go' : 'stop'} style={{ width: x(sacks) }} />
                <span className={s.rulerMark} style={{ left: x(BREAKEVEN_SACKS) }}>
                  {i === 0 && <span>60 sc</span>}
                </span>
              </span>
              <span className={s.rulerValue}>
                {int(sacks)} sc/ha
                <span data-tone={above ? 'go' : 'stop'}>
                  {int(Math.abs(sacks - BREAKEVEN_SACKS))} sc {above ? 'acima' : 'abaixo'}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className={s.aside}>Rendimento médio da soja no município: IBGE, Produção Agrícola Municipal. Uma saca tem 60 kg.</p>
      <Column {...COLUMNS.sacas} />
    </section>
  );
}

function Pacote({ praca, data }: { praca: Praca; data: Data }) {
  const { complete } = data.safras;
  const local = perHectare(praca.custeio[complete]);
  if (local === null) return null;
  const state = perHectare(
    Object.values(data.pracas)
      .filter((p) => p.uf === praca.uf && p.custeio[complete])
      .reduce((a, p) => ({ value: a.value + p.custeio[complete].value, area: a.area + p.custeio[complete].area }), {
        value: 0,
        area: 0,
      }),
  );
  const marks = [
    { key: 'pacote', text: 'Pacote completo', value: PACKAGE_PER_HA },
    ...(state !== null ? [{ key: 'uf', text: `Média ${praca.uf}`, value: state }] : []),
    { key: 'praca', text: praca.name, value: local },
  ].sort((a, b) => a.value - b.value);
  const top = Math.max(...marks.map((m) => m.value)) * 1.15;

  return (
    <section id="pacote" className={s.section} aria-labelledby="pacote-h">
      <h2 id="pacote-h">Custeio do banco por hectare</h2>
      <p className={s.lead}>
        Em {praca.name}, o banco financiou <strong>{brl(local)} por hectare</strong>:{' '}
        {local >= PACKAGE_PER_HA
          ? `${pct(local / PACKAGE_PER_HA - 1)} acima`
          : `${pct(1 - local / PACKAGE_PER_HA)} abaixo`}{' '}
        dos R$ 3.000 que a coluna usa para o pacote completo de insumos.
      </p>
      <ol className={s.scale}>
        {marks.map((m) => (
          <li key={m.key} data-mark={m.key}>
            <span className={s.scaleName}>{m.text}</span>
            <span className={s.scaleTrack}>
              <span className={s.scaleFill} style={{ width: `${(m.value / top) * 100}%` }} />
            </span>
            <span className={s.scaleValue}>{brl(m.value)}/ha</span>
          </li>
        ))}
      </ol>
      <p className={s.aside}>
        Média da safra {complete} entre quem tomou custeio de soja no banco
        {state !== null ? `; média de ${praca.uf}: ${brl(state)} por hectare` : ''}. O custeio paga insumos.
      </p>
      <Column {...COLUMNS.limite} />
    </section>
  );
}

function Column({ title, url, quote }: { title: string; url: string; quote: string }) {
  return (
    <figure className={s.column}>
      <blockquote>
        <p>“{quote}”</p>
      </blockquote>
      <figcaption>
        Luiz Tangari, <a href={url}>{title}</a>
      </figcaption>
    </figure>
  );
}

function Method({ data }: { data: Data }) {
  const { complete } = data.safras;
  return (
    <details className={s.method}>
      <summary>Como foi feito</summary>
      <ul>
        <li>
          Custeio de soja por município (valor e área): Matriz de Dados do Crédito Rural, do Banco Central, que cobre
          todos os contratos. A safra segue o plano safra, de julho a junho, pela data do contrato.
        </li>
        <li>
          Vencimentos: microdados do SICOR (Banco Central), que trazem o vencimento de cada contrato e o estado, mas o
          município só para parte dos bancos. Por isso a fila é mostrada por estado. A fila de uma colheita é todo
          custeio de soja que vence naquele ano, contratado em qualquer data: o pré-custeio assinado a partir de janeiro
          já é da colheita seguinte. Colheita de {harvestYear(complete)} completa. Meses com menos de 10 operações
          aparecem como sigilo, nunca como zero.
        </li>
        <li>
          O SICOR registra crédito rural de bancos e cooperativas. Não inclui o crédito da revenda nem CPR. É
          justamente o outro credor que a colheita paga.
        </li>
        <li>
          Complementa, não substitui, os relatórios por produtor (CPF/CNPJ): mostra a praça antes de qualquer consulta.
          Nenhum dado de produtor foi baixado; aqui só existem somas por município e por estado.
        </li>
        <li>Rendimento e área plantada: IBGE, Produção Agrícola Municipal (tabela 5457).</li>
      </ul>
      <p>
        Banco Central (SICOR, atualizado em {dateBr(new Date(data.sources.sicorLastModified).toISOString())}; Matriz de
        Dados do Crédito Rural) e IBGE.
      </p>
    </details>
  );
}
