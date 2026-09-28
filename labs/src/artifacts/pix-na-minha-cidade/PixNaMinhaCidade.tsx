import { Archivo, Martian_Mono } from 'next/font/google';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { ArtifactProps } from '@/labs/artifact';
import { shareQuery, shareUrl } from '@/labs/share';

import type { CardData } from './card';
import {
  type City,
  decilePhrase,
  monthName,
  monthShort,
  monthStamp,
  pickCity,
  SHARE_KEYS,
  SLUG,
  sentence,
  shareText,
  shown,
  slugify,
} from './data';
import { brl, dateBr, dec1, dec2, int } from './format';
import { type Loaded, loadPix } from './load';
import s from './pix.module.css';
import { OnChange, PrintError, Printer, SalaProvider, BusyLamp } from './Sala';
import { resolveQuery, type Resolution } from './find';
import { Search } from './Search';
import { ledText, Segmentos } from './Segmentos';
import { ShareRow } from './ShareRow';

const print = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-print' });
const thermal = Martian_Mono({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-thermal' });

/** Survives the build, so the render can be audited against what was decided (grep c189c88b). */
const DIRECTION = `<!--
THESIS: Your city's place in Brazil's Pix habit is a senha: a queue ticket printed from a dispenser, number big, place in line under it, source in the fine print. Refuses the "Wrapped" gradient story card and the data-journalism dashboard.
OWN-WORLD: A repartição waiting room in its other canonical paint scheme: a warm "gelo" wall over an ochre-brown oil barra with a dark brown filete; a tomato-red molded dispenser with a maroon slot; cool thermal paper with ESC/POS print modes (double-width Archivo numerals, Martian Mono lines, reverse-print chips, dotted leaders, torn zigzag edge); a black LED caller panel in red seven-segment digits with ghost cells.
STORY: The reader sees São Paulo's ticket (38 Pix por usuário, Brasil 43, senha 2.805 de 5.571), types their own city into the dispenser, watches a new ticket print, and posts it.
FIRST VIEWPORT: 390px (banner counted at 56px): a 132px red dispenser holding the title and search, the senha hanging from its slot (city, number, the Brasil sentence, the place-in-line rows, torn edge), the share button under the torn edge; the second strip (bars, 12 months, valor médio, fine print) prints below the fold. 1440px: dispenser + ticket left (440px), LED panel "2805" and the whole queue plotted right.
FORM: senha de fila (thermal ticket + caller panel), 7th of 7 grounded candidates; seed c189c88b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const PAGE = 'labs.teamdbsolutions.com/demo/pix-na-minha-cidade';
const BCB_DATASET = 'https://dadosabertos.bcb.gov.br/dataset/pix';
const FGV_STUDY = 'https://portal.fgv.br/sites/default/files/uploads/fgv-eaesp-estudo-geografia-do-pix-2.pdf';
const IBGE_TABLE = 'https://sidra.ibge.gov.br/tabela/6579';
const RECORD_URL = 'https://www.metropoles.com/brasil/r-18689-bilhoes-pix-bate-recorde-diario-de-operacao-diz-banco-central';
const FINE_PRINT =
  'Fonte: Banco Central do Brasil, Estatísticas do Pix (dadosabertos.bcb.gov.br/dataset/pix), ODbL. Nomes e população: IBGE. Métrica: FGV EAESP, Geografia do Pix 2. Médias por usuário; só pessoas físicas; município de residência de quem paga.';

/** The place-in-line rows, the same on the ticket and in the PNG. */
function positionRows(c: City): [string, string][] {
  const rows: [string, string][] = [];
  if (c.small) rows.push(['SENHA NO BRASIL', decilePhrase(c.rank, c.total)]);
  else {
    rows.push(['SENHA NO BRASIL', `${int(c.rank)} / ${int(c.total)}`]);
    rows.push([`NO ESTADO (${c.uf})`, `${int(c.stateRank)} / ${int(c.stateTotal)}`]);
  }
  if (c.capitalRank) rows.push(['ENTRE AS CAPITAIS', `${c.capitalRank} / 27`]);
  return rows;
}

function cardData(p: Loaded, c: City): CardData {
  const last = p.data.months[p.data.months.length - 1];
  return {
    name: c.name,
    uf: c.uf,
    number: String(shown(c.value)),
    unit: `Pix por usuário em ${monthName(last)} de ${Math.floor(last / 100)}`,
    sentence: sentence(c.name, c.value, p.brasil.value, last),
    stamp: monthStamp(last),
    outlier: c.outlier,
    rows: positionRows(c),
    bars: [
      { label: c.name, value: c.value, shown: dec1(c.value), brasil: false },
      { label: 'Brasil', value: p.brasil.value, shown: dec1(p.brasil.value), brasil: true },
    ],
    series: {
      city: c.series,
      brasil: p.brasil.series,
      caption: `12 MESES: ${c.name.toUpperCase()} × BRASIL`,
      from: monthShort(p.data.months[0]),
      to: monthShort(last),
    },
    ticket: brl(c.ticket),
    finePrint: FINE_PRINT,
    url: `${PAGE}?c=${c.ibge}`,
    fileName: `pix-${slugify(c.name)}-${c.uf.toLowerCase()}.png`,
    shareTitle: `Pix na minha cidade: ${c.name}`,
    shareText: shareText(c.name, c.value, last),
  };
}

export default function PixNaMinhaCidade({ searchParams }: ArtifactProps) {
  const p = loadPix();
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const found: Resolution | undefined = q ? resolveQuery(p.index, q, new Set(p.capitals.map((c) => c.ibge))) : undefined;
  const picked =
    found?.kind === 'one'
      ? { city: p.byIbge.get(found.entry[0])!, notFound: false }
      : pickCity(p, searchParams.c);
  const city = picked.city;
  const last = p.data.months[p.data.months.length - 1];
  const card = cardData(p, city);

  return (
    <main data-sala="" className={`${s.sala} ${print.variable} ${thermal.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <SalaProvider>
        <div className={s.room}>
          <div className={s.counter}>
            <header className={s.housing}>
              <h1 className={s.title}>Pix na minha cidade</h1>
              <Search
                index={p.index}
                capitals={p.capitals.map((c) => c.ibge)}
                initial={found && found.kind !== 'one' ? q : ''}
                current={{ ibge: city.ibge, label: `${city.name} - ${city.uf}` }}
              />
              <div className={s.slot}>
                <BusyLamp />
              </div>
            </header>

            <PrintError />
            {picked.notFound && (
              <p className={s.slip} role="status">
                Não achamos esse município. Mostrando {city.name}.
              </p>
            )}
            {found && found.kind !== 'one' && <Found found={found} q={q} />}

            <div className={s.hang}>
              <Printer id={city.ibge}>
                <div className={s.paperShadow}>
                  <Senha p={p} city={city} rows={card.rows} />
                </div>
              </Printer>
            </div>

            <ShareRow
              card={card}
              url={shareUrl(SLUG, shareQuery(SHARE_KEYS, { c: String(city.ibge) }))}
              text={card.shareText}
            />
            <noscript>
              <style>{'[data-share-row]{display:none!important}'}</style>
              <p className={s.noJsLink}>
                Link desta senha: <span>https://{PAGE}?c={city.ibge}</span>
              </p>
            </noscript>

            <OnChange id={city.ibge} className={s.crossfade} base={s.stripSlot}>
              <div className={s.paperShadow}>
                <Strip p={p} city={city} card={card} />
              </div>
            </OnChange>
          </div>

          <p className={s.context}>
            Em 4 de setembro de 2026 o Pix bateu recorde: 318.073.816 transações em um dia (Banco Central,{' '}
            <a href={RECORD_URL} rel="noreferrer">
              via Metrópoles
            </a>
            ).
          </p>

          <section className={s.fila} aria-labelledby="fila-title">
            <OnChange id={city.ibge} className={s.blink}>
              <Led city={city} month={last} />
            </OnChange>
            <h2 id="fila-title" className={s.wallTitle}>
              A fila inteira
            </h2>
            <p className={s.wallSub}>
              {int(city.total)} municípios, do que mais usa Pix por usuário ao que menos usa.
            </p>
            <Queue p={p} city={city} />
          </section>
        </div>

        <Capitals p={p} city={city} />
        <Method p={p} />
      </SalaProvider>
    </main>
  );
}

function Found({ found, q }: { found: Exclude<Resolution, { kind: 'one' }>; q: string }) {
  const entries = found.kind === 'many' ? found.entries : found.suggestions;
  return (
    <nav className={s.found} aria-label={`Resultados para ${q}`}>
      <p className={s.foundHead}>
        {found.kind === 'many' ? `Qual destes? (“${q}”)` : 'Nenhum município com esse nome. Talvez:'}
      </p>
      <ul>
        {entries.map((e) => (
          <li key={e[0]}>
            <Link href={`?c=${e[0]}`} scroll={false} className={s.foundLink}>
              <span className={s.optionName}>{e[1]}</span>
              <span className={s.chip}>{e[2]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The last word and the UF chip never part. */
function CityName({ name, uf, id }: { name: string; uf: string; id?: string }) {
  const at = name.lastIndexOf(' ');
  return (
    <h2 id={id} className={s.city}>
      {at > 0 && `${name.slice(0, at)} `}
      <span className={s.keep}>
        {at > 0 ? name.slice(at + 1) : name}
        <span className={s.chip}>
          <span className={s.srOnly}>, </span>
          {uf}
        </span>
      </span>
    </h2>
  );
}

function Senha({ p, city, rows }: { p: Loaded; city: City; rows: [string, string][] }) {
  const last = p.data.months[p.data.months.length - 1];
  return (
    <article className={`${s.paper} ${s.senha}`} aria-labelledby="ticket-city">
      <p className={s.ticketHead}>
        <span>PIX NA MINHA CIDADE</span>
        <span>{monthStamp(last)}</span>
      </p>
      <CityName id="ticket-city" name={city.name} uf={city.uf} />
      <p className={s.number}>
        <span aria-hidden="true">{shown(city.value)}</span>
        <span className={s.srOnly}>{shown(city.value)} Pix por usuário, em média</span>
      </p>
      <p className={s.unit} aria-hidden="true">
        Pix por usuário em {monthName(last)} de {Math.floor(last / 100)}
      </p>
      <p className={s.sentence}>{sentence(city.name, city.value, p.brasil.value, last)}</p>
      {city.outlier && (
        <p className={s.warn}>
          <b>ATENÇÃO</b> Números afetados por pessoas que não moram no município (ex.: fronteira).
        </p>
      )}
      <dl className={s.rows}>
        {rows.map(([k, v]) => (
          <div key={k} className={s.row} data-phrase={/\d/.test(v.split(' ')[0]) ? undefined : ''}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className={s.source}>FONTE: BCB · ODbL · {monthStamp(last)}</p>
    </article>
  );
}

/** Two series on one 56px plot: the city solid, Brasil dotted. */
function Sparkline({ city, brasil, name }: { city: (number | null)[]; brasil: number[]; name: string }) {
  const all = [...city.filter((v): v is number => v !== null), ...brasil];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const H = 56;
  const W = 100;
  const x = (i: number) => (i / (brasil.length - 1)) * W;
  const y = (v: number) => H - 5 - ((v - lo) / span) * (H - 10);
  const path = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`;
      pen = true;
    });
    return d;
  };
  const lastCity = [...city].reverse().find((v): v is number => v !== null) ?? 0;
  const firstCity = city.find((v): v is number => v !== null) ?? 0;
  const lastBr = brasil[brasil.length - 1];
  let yc = y(lastCity);
  let yb = y(lastBr);
  if (Math.abs(yc - yb) < 14) {
    const mid = (yc + yb) / 2;
    const up = lastCity >= lastBr;
    yc = mid + (up ? -7 : 7);
    yb = mid + (up ? 7 : -7);
  }
  return (
    <div className={s.spark}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${name}: de ${dec1(firstCity)} para ${dec1(lastCity)} Pix por usuário em 12 meses; Brasil: de ${dec1(brasil[0])} para ${dec1(lastBr)}.`}
      >
        <path d={path(brasil)} className={s.sparkBrasil} />
        <path d={path(city)} className={s.sparkCity} />
      </svg>
      <span className={s.sparkEnd} style={{ top: `${yc}px` }} aria-hidden="true">
        {shown(lastCity)}
      </span>
      <span className={`${s.sparkEnd} ${s.sparkEndBr}`} style={{ top: `${yb}px` }} aria-hidden="true">
        BR {shown(lastBr)}
      </span>
    </div>
  );
}

function Strip({ p, city, card }: { p: Loaded; city: City; card: CardData }) {
  const max = Math.max(city.value, p.brasil.value) * 1.15;
  return (
    <section className={`${s.paper} ${s.strip}`} aria-label={`Detalhes da senha de ${city.name}`}>
      <div className={s.bars}>
        <p className={s.barLabel}>
          {city.name} <b>{dec1(city.value)}</b>
        </p>
        <div className={s.bar} style={{ width: `${(city.value / max) * 100}%` }} />
        <p className={s.barLabel}>
          Brasil <b>{dec1(p.brasil.value)}</b>
        </p>
        <div className={`${s.bar} ${s.barBrasil}`} style={{ width: `${(p.brasil.value / max) * 100}%` }} />
      </div>
      <p className={s.sparkCaption}>{card.series.caption}</p>
      <Sparkline city={city.series} brasil={p.brasil.series} name={city.name} />
      <p className={s.sparkMonths} aria-hidden="true">
        <span>{card.series.from}</span>
        <span>{card.series.to}</span>
      </p>
      <dl className={s.rows}>
        <div className={s.row}>
          <dt>VALOR MÉDIO POR PIX</dt>
          <dd>{brl(city.ticket)}</dd>
        </div>
      </dl>
      <p className={s.fine}>
        Fonte: Banco Central do Brasil, Estatísticas do Pix (<a href={BCB_DATASET}>dadosabertos.bcb.gov.br/dataset/pix</a>),
        ODbL. Nomes e população: IBGE. Métrica: FGV EAESP, Geografia do Pix 2. Médias por usuário; só pessoas físicas;
        município de residência de quem paga.
      </p>
      <p className={s.fine}>
        {PAGE}?c={city.ibge}
      </p>
      <p className={s.keepIt}>GUARDE SUA SENHA</p>
    </section>
  );
}

function Led({ city, month }: { city: City; month: number }) {
  return (
    <div className={s.led}>
      <span className={s.ledLabel} aria-hidden="true">
        SENHA
      </span>
      <div className={s.ledRow} aria-hidden="true">
        <Segmentos text={ledText(city.rank, city.small)} className={s.segments} />
        <span className={s.ledOf}>de {int(city.total)}</span>
      </div>
      <p className={s.ledLine} aria-hidden="true">
        {city.small
          ? 'posição exata omitida: poucos usuários'
          : `${city.name} · ${shown(city.value)} Pix por usuário em ${monthShort(month)}`}
      </p>
      <p className={s.srOnly}>
        {city.small
          ? `${city.name} está ${decilePhrase(city.rank, city.total)}, entre ${int(city.total)} municípios.`
          : `Senha ${int(city.rank)} de ${int(city.total)} municípios.`}
      </p>
    </div>
  );
}

const Q_W = 558;
const Q_H = 200;
const Q_BASE = 184;

function Queue({ p, city }: { p: Loaded; city: City }) {
  const { columns, p99 } = p.queue;
  const n = columns.length;
  const yOf = (v: number) => Q_BASE - (Math.min(v, p99) / p99) * (Q_BASE - 4);
  const col = Math.floor((city.rank - 1) / 10);
  const pct = (i: number) => ((i + 0.5) / n) * 100;
  const front = p.capitals[0];
  const back = p.capitals[p.capitals.length - 1];
  // Only the front and the back of the capitals are named under the roll: the
  // chosen city already carries its own label above, and a third name collides
  // with these on a phone (São Paulo sits close to Florianópolis).
  const labelled = new Set([front.ibge, back.ibge]);
  return (
    <figure className={s.roll}>
      <div className={s.plot}>
        <p
          className={s.cityMark}
          style={{ left: `${pct(col)}%`, '--y': yOf(city.value) / Q_H, '--at': col / (n - 1) } as CSSProperties}
          aria-hidden="true">
          <span>
            {city.name} · {shown(city.value)}
            {city.small ? '' : ` · ${int(city.rank)}º`}
          </span>
        </p>
        <svg viewBox={`0 0 ${Q_W} ${Q_H}`} preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
          {columns.map((c, i) => {
            const y = yOf(c.median);
            return (
              <g key={c.from}>
                <rect x={i * (Q_W / n)} y={y} width={Q_W / n} height={Q_BASE - y} className={s.qBar} />
                {c.median > p99 && <rect x={i * (Q_W / n)} y={y} width={Q_W / n} height={3} className={s.qCap} />}
              </g>
            );
          })}
          <rect
            x={col * (Q_W / n) - 1}
            y={yOf(city.value)}
            width={3}
            height={Q_BASE - yOf(city.value)}
            className={s.qCity}
          />
          <line x1={0} x2={Q_W} y1={yOf(p.brasil.value)} y2={yOf(p.brasil.value)} className={s.qBrasil} />
          <line x1={0} x2={Q_W} y1={Q_BASE + 0.5} y2={Q_BASE + 0.5} className={s.qBase} />
          {p.capitals.map((c) => (
            <rect
              key={c.ibge}
              x={Math.floor((c.rank - 1) / 10) * (Q_W / n)}
              y={Q_BASE + 4}
              width={1.5}
              height={6}
              className={c.ibge === city.ibge ? s.qCity : s.qTick}
            />
          ))}
        </svg>
        <p className={s.brasilMark} style={{ '--y': yOf(p.brasil.value) / Q_H } as CSSProperties} aria-hidden="true">
          Brasil {shown(p.brasil.value)}
        </p>
      </div>
      <div className={s.capitalMarks} aria-hidden="true">
        {p.capitals
          .filter((c) => labelled.has(c.ibge))
          .map((c) => (
            <span
              key={c.ibge}
              style={{ left: `${pct(Math.floor((c.rank - 1) / 10))}%` }}
              data-end={c.rank / c.total > 0.7 ? '' : undefined}
              data-start={c.rank / c.total < 0.08 ? '' : undefined}
            >
              {c.name}
            </span>
          ))}
      </div>
      <p className={s.axis} aria-hidden="true">
        <span>frente da fila</span>
        <span>fim da fila</span>
      </p>
      <figcaption className={s.queueText}>
        {city.small
          ? `${city.name} está ${decilePhrase(city.rank, city.total)}.`
          : `${city.name} está em ${int(city.rank)}º.`}{' '}
        {city.ibge === front.ibge
          ? `É a capital mais à frente.`
          : `${front.name}, a capital mais à frente, em ${int(front.rank)}º.`}{' '}
        Traços sob a linha: as 27 capitais. Valores acima de {dec1(p.queue.p99)} cortados no topo.
      </figcaption>
    </figure>
  );
}

function Capitals({ p, city }: { p: Loaded; city: City }) {
  const max = Math.max(...p.capitals.map((c) => c.value));
  const rows: ({ kind: 'city'; c: City } | { kind: 'brasil' })[] = [];
  let placed = false;
  for (const c of p.capitals) {
    if (!placed && c.value < p.brasil.value) {
      rows.push({ kind: 'brasil' });
      placed = true;
    }
    rows.push({ kind: 'city', c });
  }
  if (!placed) rows.push({ kind: 'brasil' });
  return (
    <section className={s.capitals} aria-labelledby="capitais-title">
      <h2 id="capitais-title" className={s.wallTitle}>
        As 27 capitais
      </h2>
      <p className={s.wallSub}>Pix por usuário em {monthName(p.data.months[p.data.months.length - 1])}, pessoas físicas.</p>
      <ol className={`${s.paper} ${s.capitalList}`}>
        {rows.map((r) =>
          r.kind === 'brasil' ? (
            <li key="brasil" className={s.brasilRow}>
              <span className={s.capRank} />
              <span className={s.capName}>Brasil</span>
              <span className={s.capBar}>
                <span style={{ width: `${(p.brasil.value / max) * 100}%` }} />
              </span>
              <span className={s.capValue}>{dec1(p.brasil.value)}</span>
            </li>
          ) : (
            <li key={r.c.ibge} data-current={r.c.ibge === city.ibge ? '' : undefined}>
              <Link
                href={`?c=${r.c.ibge}`}
                className={s.capLink}
                aria-current={r.c.ibge === city.ibge ? 'true' : undefined}
              >
                <span className={s.capRank}>{r.c.capitalRank}</span>
                <span className={s.capName}>
                  {r.c.name} <span className={s.chip}>{r.c.uf}</span>
                </span>
                <span className={s.capBar} aria-hidden="true">
                  <span style={{ width: `${(r.c.value / max) * 100}%` }} />
                </span>
                <span className={s.capValue}>{dec1(r.c.value)}</span>
              </Link>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function Method({ p }: { p: Loaded }) {
  const months = p.data.months;
  const last = months[months.length - 1];
  const med = p.data.med;
  return (
    <section className={s.method} aria-labelledby="metodo-title">
      <h2 id="metodo-title" className={s.wallTitle}>
        Como a senha é calculada
      </h2>
      <h3>A métrica</h3>
      <p>
        Pix enviados por pessoas físicas que moram no município, divididos pelo número de pessoas físicas que enviaram
        pelo menos um Pix no mês (<code>QT_PagadorPF / QT_PES_PagadorPF</code>), em {monthName(last)} de{' '}
        {Math.floor(last / 100)}, o último mês fechado. É a métrica “Transações por Usuário” do estudo{' '}
        <a href={FGV_STUDY}>Geografia do Pix 2</a> (FGV EAESP, 2025). É uma média: não diz quanto cada pessoa usou.
      </p>
      <p>
        A senha é a posição do município nessa métrica entre {int(p.cities.length)} municípios, do que mais usa ao que
        menos usa. Abaixo de {int(2000)} usuários a posição exata oscila demais, e a senha mostra só a faixa (“entre os
        10% que mais usam”).
      </p>
      <h3>Por que só pessoas físicas</h3>
      <p>
        Pix de empresas se acumula onde fica a sede, não onde as pessoas moram: somado, faz municípios pequenos parecerem
        os que mais usam. O município é o de cadastro de quem paga, não o lugar onde o Pix aconteceu. Em cidades de
        fronteira ou de turismo há mais usuários do que moradores estimados, e o ticket avisa.
      </p>
      <h3>A média do Brasil</h3>
      <p>
        Soma dos Pix de pessoas físicas de todos os municípios dividida pela soma dos usuários: {dec1(p.brasil.value)} em{' '}
        {monthName(last)}. Supõe que cada pessoa é contada em um só município; se alguém for contado em dois, a média sai
        um pouco mais baixa.
      </p>
      <h3>Fontes</h3>
      <ul>
        <li>
          Fonte: Banco Central do Brasil — Estatísticas do Pix (<a href={BCB_DATASET}>dadosabertos.bcb.gov.br/dataset/pix</a>
          ), ODbL. Transações por município, {monthShort(months[0])} a {monthShort(last)}.
        </li>
        <li>
          Nomes e população estimada 2026: IBGE, <a href={IBGE_TABLE}>tabela 6579</a>.
        </li>
        <li>
          Métrica: FGV EAESP, <a href={FGV_STUDY}>Geografia do Pix 2</a> (junho de 2025).
        </li>
        <li>
          Recorde de 4/9/2026 (318.073.816 transações, R$ 186,89 bilhões): Banco Central, via{' '}
          <a href={RECORD_URL}>Metrópoles</a>. Os dados abertos só têm séries mensais.
        </li>
        <li>
          Golpes: desde fevereiro de 2026 vale o MED 2.0, que rastreia o dinheiro de um Pix contestado. Não há dado de
          fraude por município. No Brasil, em {monthName(med.month)} de {Math.floor(med.month / 100)} (último mês
          publicado), {int(med.contestados)} Pix foram contestados, {int(med.aceitas)} contestações foram aceitas e{' '}
          o percentual de devolução foi de {dec2(med.devolucao)}% (BCB, Estatísticas de Fraudes no Pix, ODbL).
        </li>
      </ul>
      <p className={s.methodFoot}>
        Dados obtidos em {dateBr(p.data.fetchedAt)}; não se atualizam sozinhos. Os dados derivados desta página estão sob
        ODbL (ver <code>DATA-LICENSE</code> no repositório). Demo conceitual de Daniel Bernardino, sem relação com o Banco
        Central, o IBGE ou a FGV.
      </p>
    </section>
  );
}
