import { Sofia_Sans_Condensed, Sofia_Sans_Extra_Condensed } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';

import { AD_KEYS, type AdKey, type AdView, type Contradiction, isScored, type TechifideData } from './data';
import { loadTechifide } from './load';
import { Rail } from './parts';
import s from './techifide.module.css';
import { day, firstScreen, laneLabel, laneOf } from './view';
import { CallSheet } from './CallSheet';
import { Candidate } from './Candidate';

const legend = Sofia_Sans_Extra_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-legend' });
const prose = Sofia_Sans_Condensed({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-prose' });

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: the ad is the jackfield. Its lines are numbered lanes; every claim on the page is tied to its lane, and what the ad does not say is a gapped tie: a question for the intake call. Refuses the HR-tech score dashboard and the "X of 11" coverage headline.
OWN-WORLD: black glass, one signal amber for every mark, ivory prose; one condensed grotesque (Sofia Sans Extra Condensed legends, Sofia Sans Condensed prose); link rails whose stroke carries state: unbroken quoted, gapped open, cross-ticked worth confirming, doubled selected.
STORY: the CEO sees their own ad's role, must-haves and the call's open questions, taps any claim to see the ad line behind it, then runs the intake call on the page and leaves with the filled Techi-job-offer and the Role Fit Profile. It prepares the call, never replaces it.
FIRST VIEWPORT: ad keys in the strip; role in one line; must-haves tied to lanes; the count knocked out of an amber plate beside "questions your intake call still has to answer"; the first three questions.
FORM: normalled jackfield (challenger operate-b-normalled-jackfield), seed 7eeda6ee.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const AD_LABELS: Record<AdKey, string> = { fullstack: 'Fullstack', ml: 'ML', qa: 'QA' };

export default function Techifide({ searchParams }: ArtifactProps) {
  const data = loadTechifide();
  const key = AD_KEYS.find((k) => k === searchParams.ad) ?? 'fullstack';
  const ad = data.ads[key];
  const screen = firstScreen(ad);

  return (
    <main className={`${s.glass} ${legend.variable} ${prose.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <header className={s.strip}>
        <p className={s.mark}>Intake call sheet</p>
        <nav aria-label="Techifide ads" className={s.keys}>
          {AD_KEYS.map((k) => (
            <a key={k} href={`?ad=${k}`} className={s.key} aria-current={k === key ? 'page' : undefined}>
              {AD_LABELS[k]}
            </a>
          ))}
        </nav>
      </header>

      <div className={s.sheet}>
        <div className={s.legendColumn}>
          <section className={s.role} aria-labelledby="role">
            <h1 id="role">{ad.title}</h1>
            <p className={s.meta}>
              {screen.role.split(' · ').slice(1).join(' · ')} · posted {day(ad.datePosted)} ·{' '}
              <a href="#lanes">the ad, {ad.lanes.length} lanes</a>
            </p>
          </section>

          <section className={s.musts} aria-labelledby="musts">
            <h2 id="musts" className={s.legendHead}>
              Must-haves
            </h2>
            <ul>
              {screen.mustHaves.map((m) => {
                const lane = laneOf(m.quote, ad);
                return (
                  <li key={m.quote}>
                    <a href={lane === undefined ? '#lanes' : `#l${lane}`}>
                      <span>{m.value}</span>
                      {lane !== undefined && <span className={s.laneTag}>{laneLabel(lane)}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className={s.work}>
          <CallSheet key={ad.key} ad={ad} dimensions={data.dimensions} template={data.sources.template} />
          {ad.candidate && <Candidate candidate={ad.candidate} />}
          {ad.contradictions.length > 0 && <Confirm ad={ad} contradictions={ad.contradictions} />}
          <Lanes ad={ad} />
          <Sources ad={ad} data={data} />
        </div>
      </div>

      <footer className={s.foot}>
        <p>
          How this was made: an LLM (Claude) read each ad once and proposed the fields, levels and questions; code kept
          only quotes found word for word in the ad; Daniel Bernardino reviewed every question by hand. What the call
          adds stays in this browser and is never sent anywhere.
        </p>
      </footer>
    </main>
  );
}

function Confirm({ ad, contradictions }: { ad: AdView; contradictions: Contradiction[] }) {
  return (
    <section className={s.block} aria-labelledby="confirm">
      <h2 id="confirm" className={s.blockHead}>
        Worth confirming
      </h2>
      <ul className={s.dims}>
        {contradictions.map((c) => {
          const [a, b] = c.quotes.map((q) => laneOf(q, ad));
          return (
            <li key={c.quotes[0]}>
              <p className={s.confirmNote}>{c.note}</p>
              <details className={s.claim}>
                <summary>
                  <span className={s.claimLabel}>
                    {a !== undefined ? laneLabel(a) : '—'} and {b !== undefined ? laneLabel(b) : '—'}
                  </span>
                  <Rail state="confirm" />
                  <span className={s.plate}>Confirm</span>
                </summary>
                <div className={s.claimBody}>
                  {c.quotes.map((q, i) => {
                    const lane = i === 0 ? a : b;
                    return (
                      <blockquote key={q} className={s.quote}>
                        <p>{q}</p>
                        <footer>{lane !== undefined && <a href={`#l${lane}`}>Lane {laneLabel(lane)}</a>}</footer>
                      </blockquote>
                    );
                  })}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Lanes({ ad }: { ad: AdView }) {
  const cited = new Set(
    [
      ...ad.brief.flatMap((f) => f.items.map((i) => i.quote)),
      ...ad.dimensions.flatMap((d) => (isScored(d) ? [d.quote] : [])),
      ...ad.contradictions.flatMap((c) => c.quotes),
    ].flatMap((q) => laneOf(q, ad) ?? []),
  );
  return (
    <section className={s.block} id="lanes" aria-labelledby="lanes-head">
      <h2 id="lanes-head" className={s.blockHead}>
        The ad, lane by lane
      </h2>
      <p className={s.lead}>
        As captured on {day(ad.capturedAt)} from <a href={ad.url}>techifide.careers-page.com</a>. A ring marks a
        lane something above is tied to.
      </p>
      <ol className={s.lanes}>
        {ad.lanes.map((line, i) => (
          <li key={i} id={`l${i}`} data-cited={cited.has(i) ? '' : undefined}>
            <span className={s.laneNum}>{laneLabel(i)}</span>
            <span className={s.laneText}>{line}</span>
            <a className={s.back} href="#musts">
              Back to must-haves
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Sources({ ad, data }: { ad: AdView; data: TechifideData }) {
  const { roleFit, screening, submitVacancy, template } = data.sources;
  return (
    <section className={s.block} aria-labelledby="sources">
      <h2 id="sources" className={s.blockHead}>
        Sources
      </h2>
      <ul className={s.sources}>
        <li>
          <a href={ad.url}>{ad.title}</a>, Techifide&rsquo;s ad on Manatal. Captured on {day(ad.capturedAt)}.
        </li>
        <li>
          <a href={roleFit.url}>Techifide Role Fit Assessment</a>: the eleven dimensions and their descriptions.
          Captured on {day(roleFit.capturedAt)}.
        </li>
        <li>
          <a href={screening.url}>Candidate Screening and Evaluation</a>: &ldquo;{screening.quote}&rdquo; Captured on{' '}
          {day(screening.capturedAt)}.
        </li>
        <li>
          <a href={submitVacancy.url}>Submit a Vacancy</a>: &ldquo;{submitVacancy.quote}&rdquo; Captured on{' '}
          {day(submitVacancy.capturedAt)}.
        </li>
        <li>
          <a href={template.url}>Techi-job-offer.docx</a>: the {template.fields.length} fields of the vacancy brief.
          Captured on {day(template.capturedAt)}.
        </li>
      </ul>
    </section>
  );
}
