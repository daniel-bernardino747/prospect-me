import { Atkinson_Hyperlegible_Next, B612 } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';
import { shareQuery, shareUrl } from '@/labs/share';

import { boardDay, clockProse, heatRuns, offMapShare, solarCentreHour } from './board';
import { Console } from './Console';
import {
  answer,
  cutMw,
  type Day,
  dateBr,
  dayMonth,
  deck,
  gwh,
  heat,
  pctFine,
  pickDay,
  plateDate,
  shareCopy,
  sobraShare,
  sundaysLead,
  weekday,
  worstDays,
  worstWeek,
} from './data';
import { type DayRow, DaySelector } from './DaySelector';
import { LampGlyph } from './LampGlyph';
import { NotFoundPlate } from './NotFoundPlate';
import { loadCurtailment } from './load';
import { ShareLinks } from './ShareLinks';
import s from './curtailment.module.css';

// Next ships no metric overrides for this face, so it cannot build an adjusted fallback.
const text = Atkinson_Hyperlegible_Next({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-text',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
});
const engrave = B612({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-engrave' });
// Figures are B612 with tabular digits, not B612 Mono: the mono face gives the
// pt-BR separators a full cell ("40. 740", "10: 30"). See DESIGN.md, desvios.

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: the day the ONS cut 400 GWh, shown on the operator's own instrument, a mosaic mimic board, where each plant is a lamp that lights with its cut and an annunciator names the reason. Refuses the dark-glow energy dashboard and the cream scrollytelling essay.
OWN-WORLD: instrument-green console enamel, a Northeast built from 0.25° square tiles with stepped coasts, black-bezelled lamps in two warm glasses (amber "sobrou energia", red with a breaker bar "a rede não aguentou"), black laminate plates with white engraved caps, a strip-chart recorder under a square pushbutton.
STORY: the reader gets the sentence, sees the board already lit at 10h30, presses play to watch the cut rise with the sun, reads which annunciator windows are lit, and leaves with surplus vs. named line.
FIRST VIEWPORT: the h1 alone on top, then the lit board as the largest thing on screen (≥300px of it at 390×664), a 64px collapsed dock under the thumb (pushbutton, clock window, MW readout, 16px recorder strip); the deck sentence waits below the map as the first line of POR QUÊ. The play pushbutton is the primary action.
FORM: grounded direction 3 of 7 (control-room mosaic mimic board); seed key 47e938dc.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const DEFAULT_DAY = '2026-08-16';
const SLUG = 'curtailment-br';
const REPO = 'https://github.com/daniel-bernardino747/prospect-me/blob/master/labs/src/artifacts/curtailment-br';
const SCRIPT = 'https://github.com/daniel-bernardino747/prospect-me/blob/master/labs/scripts/curtailment-br.ts';

/** Marks the page as scripted before first paint, so the dock opens collapsed with no layout shift. */
const JS_FLAG = `document.documentElement.setAttribute('data-cbr-js','')`;

export default function Curtailment({ searchParams }: ArtifactProps) {
  const data = loadCurtailment();
  const { day, found } = pickDay(data.days, searchParams.dia, DEFAULT_DAY);
  const board = boardDay(data, day);
  const a = answer(day);
  const d = deck(day);
  const worst = worstDays(data.days, 5);
  const week = worstWeek(data.days);
  const solar = solarCentreHour(data);
  const outside = offMapShare(board.points, day.cutMwh);
  // The link carries `?dia=` only when the reader picked a day that exists.
  const link = shareUrl(SLUG, shareQuery(['dia'], found && searchParams.dia ? { dia: day.date } : {}));
  const copy = shareCopy(day);
  const rows: DayRow[] = data.days.map((x) => ({
    date: x.date,
    cutMwh: x.cutMwh,
    sunday: weekday(x.date) === 0,
    heat: heatRuns(Array.from({ length: 48 }, (_, t) => heat(cutMw(x, t)))),
  }));

  const head = (
    <>
      {!found && <NotFoundPlate date={dateBr(DEFAULT_DAY)} />}
      <div className={s.dayRow}>
        <span className={s.plate}>{plateDate(day.date)}</span>
        <a className={s.link} href="#dias">
          Trocar dia
          <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
            <path d="M6 1.5v8M2.5 6.5 6 10l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </a>
      </div>
      <h1 className={s.answer}>
        {a.lead}
        <span className={`${s.fig} ${s.figCut}`}>{a.cut}</span>
        {a.middle}
        {a.gen && <span className={`${s.fig} ${s.figGen}`}>{a.gen}</span>}
        {a.tail}
      </h1>
    </>
  );

  const deckNode = (
    <p className={s.deck}>
      Às {d.hour}, <span className={`${s.fig} ${s.figCut}`}>{d.peakShare}</span>
      {d.first}
      <span className={`${s.fig} ${s.figCut}`}>{d.reasonShare}</span>
      {d.second}
    </p>
  );

  return (
    <div className={`${s.board} ${text.variable} ${engrave.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />

      <Console
        key={day.date}
        board={board}
        head={head}
        deck={deckNode}
        reasons={<ReasonBar day={day} />}
        share={<ShareLinks url={link} title={copy.title} post={copy.post} date={dateBr(day.date)} />}
      />

      <section className={s.section} id="dias" aria-labelledby="dias-h">
        <span className={s.plate}>
          OUTROS DIAS · {dayMonth(data.sources.firstDay)} A {dateBr(data.sources.lastDay)}
        </span>
        <h2 className={s.headline} id="dias-h">
          {sundaysLead(data.days) ? 'Os domingos acendem primeiro.' : 'Cada linha é um dia; cada coluna, meia hora.'}
        </h2>
        <p className={s.body}>
          Cada linha é um dia, cada coluna uma meia hora; quanto mais escura a casa, mais megawatts cortados no país
          naquele horário. Escolha uma linha para ver o dia no painel.
        </p>
        <DaySelector rows={rows} current={day.date} worst={worst.map((x) => x.date)} />
        {week && (
          <p className={s.body}>
            A semana mais cortada do intervalo foi de {dayMonth(week.from)} a {dateBr(week.to)}:{' '}
            <span className={s.num}>{gwh(week.cutMwh)}</span> deixaram de ser gerados, {pctFine(week.cutMwh / week.refMwh)}{' '}
            do que eólicas e solares podiam produzir naqueles sete dias.
          </p>
        )}
      </section>

      <section className={`${s.section} ${s.method}`} id="metodo" aria-labelledby="metodo-h">
        <h2 className={s.headline} id="metodo-h">
          Método e fontes: o que é este número, e o que ele não é.
        </h2>
        <div className={s.methodBody}>
          <p>
            <strong>Corte</strong> é a geração não realizada que o ONS apura quando manda uma usina eólica ou solar
            gerar menos do que podia (<em>constrained-off</em>, campo <code>val_geracaonaorealizadaapurada</code>). É um{' '}
            <strong>corte estimado pelo ONS</strong> a partir da geração de referência, não desperdício medido, e o
            próprio ONS avisa que os dados passam por consistência e podem ser revistos depois de publicados.
          </p>
          <p>
            Os dados foram baixados em {dateBr(data.fetchedAt)} e a página congela esse retrato: cobre de{' '}
            {dateBr(data.sources.firstDay)} a {dateBr(data.sources.lastDay)}, meia hora a meia hora, e não é o número
            atual. Cobre só as usinas despachadas pelo ONS (Tipo I, II-B e II-C); <strong>não inclui geração
            distribuída</strong> (telhados).
          </p>
          <p>
            Cada ponto do mapa é um conjunto de usinas ou uma usina, como o ONS publica o corte. O conjunto está no
            centro das suas usinas, pelas coordenadas da ANEEL; um conjunto espalhado por dezenas de quilômetros vira um
            ponto só. O que cai fora do recorte do Nordeste e do norte de Minas fica na placa &ldquo;fora do mapa&rdquo;:
            neste dia, {pctFine(outside)} do corte.
          </p>
          <p>
            Os horários são os do arquivo do ONS, que não declara o fuso; tratamos como horário de Brasília porque o
            centro da geração solar possível cai às {solar ? clockProse(solar) : '—'}, perto do meio-dia solar do
            Nordeste nesse fuso. &ldquo;Sobrou energia&rdquo; é a razão ENE (energética); &ldquo;a rede não
            aguentou&rdquo; junta CNF (confiabilidade) e REL (indisponibilidade externa).{' '}
            {sobraShare(day) > 0 && <>Neste dia, {pctFine(sobraShare(day))} do corte foi ENE.</>}
          </p>
          <ul className={s.credits}>
            <li>
              Fonte: ONS, Dados Abertos (CC-BY):{' '}
              <a className={s.link} href="https://dados.ons.org.br/dataset/restricao_coff_eolica_usi">
                restrição de eólicas
              </a>{' '}
              e{' '}
              <a className={s.link} href="https://dados.ons.org.br/dataset/restricao_coff_fotovoltaica">
                de fotovoltaicas
              </a>
              , atualizados pelo ONS em {dateBr(data.sources.onsModified)}. Alterações: agregamos por dia e por ponto;
              convertemos MWmed de meia hora em MWh; posicionamos cada conjunto no centro das suas usinas.
            </li>
            <li>
              Contém dados do{' '}
              <a className={s.link} href="https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel">
                SIGA/ANEEL
              </a>
              , sob{' '}
              <a className={s.link} href="https://opendatacommons.org/licenses/odbl/1-0/">
                ODbL
              </a>
              ; a tabela de coordenadas derivada está disponível sob ODbL{' '}
              <a className={s.link} href={`${REPO}/data.json`}>
                no código desta página
              </a>
              .
            </li>
            <li>
              Contornos:{' '}
              <a className={s.link} href="https://www.naturalearthdata.com/">
                Natural Earth
              </a>{' '}
              (domínio público), redesenhados em casas de 0,25°.
            </li>
            <li>
              Demo conceitual de Daniel Bernardino, sem cliente e sem vínculo com o ONS ou a ANEEL.{' '}
              <a className={s.link} href={SCRIPT}>
                Script de coleta
              </a>
              .
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function ReasonBar({ day }: { day: Day }) {
  const total = day.cutMwh;
  if (total <= 0) return <p className={s.body}>Nenhum corte neste dia.</p>;
  const rede = day.byReason.CNF + day.byReason.REL + day.byReason.PAR;
  const parts = [
    { code: 'ENE', mwh: day.byReason.ENE, glass: 'sobra' },
    { code: 'CNF', mwh: day.byReason.CNF, glass: 'rede' },
    { code: 'REL', mwh: day.byReason.REL, glass: 'rede' },
    ...(day.byReason.PAR > 0 ? [{ code: 'PAR', mwh: day.byReason.PAR, glass: 'rede' }] : []),
  ].filter((p) => p.mwh > 0);
  const f1 = (mwh: number) => gwh(mwh).replace(' GWh', '');
  return (
    <figure className={s.reasons}>
      <div className={s.busbar} role="img" aria-label={parts.map((p) => `${p.code} ${gwh(p.mwh)}`).join(', ')}>
        {parts.map((p) => (
          <span key={p.code} className={s.bus} data-glass={p.glass} style={{ flexGrow: p.mwh }} />
        ))}
      </div>
      <figcaption>
        <span className={s.busLabels}>
          {parts.map((p, i) => (
            <span key={p.code}>
              {i > 0 && ' · '}
              {p.code} {f1(p.mwh)}
            </span>
          ))}{' '}
          GWh
        </span>
        <span className={s.busKey}>
          <span className={s.keyItem}>
            <LampGlyph glass="sobra" /> ENE: sobrou energia
          </span>
          <span className={s.keyItem}>
            <LampGlyph glass="rede" /> CNF, REL: a rede não aguentou
          </span>
        </span>
        <span className={s.busNote}>
          {rede > 0
            ? `${gwh(rede)} ${rede >= 2000 ? 'vieram' : 'veio'} de limites da rede (${parts
                .filter((p) => p.glass === 'rede')
                .map((p) => `${p.code} ${f1(p.mwh)}`)
                .join(' + ')}).`
            : 'Nada veio de limites da rede neste dia.'}
        </span>
      </figcaption>
    </figure>
  );
}
