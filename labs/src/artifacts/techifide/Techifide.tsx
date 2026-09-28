import { Sofia_Sans_Condensed, Sofia_Sans_Extra_Condensed } from 'next/font/google';
import type { ReactNode } from 'react';

import type { ArtifactProps } from '@/labs/artifact';

import {
  AD_KEYS,
  type AdKey,
  type AdView,
  type Contradiction,
  type Dimension,
  type DimensionResult,
  isScored,
  type TechifideData,
} from './data';
import { loadTechifide } from './load';
import s from './techifide.module.css';
import { day, firstScreen, headline, laneLabel, laneOf, MUST_HAVE_FIELD, questions } from './view';

const legend = Sofia_Sans_Extra_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-legend' });
const prose = Sofia_Sans_Condensed({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-prose' });

/** Survives the build, so the render can be audited against what was decided. */
const DIRECTION = `<!--
THESIS: the ad is the jackfield. Its lines are numbered lanes; every claim on the page is tied to its lane, and what the ad does not say is a gapped tie: a question for the intake call. Refuses the HR-tech score dashboard and the "X of 11" coverage headline.
OWN-WORLD: black glass, one signal amber for every mark, ivory prose; one condensed grotesque (Sofia Sans Extra Condensed legends, Sofia Sans Condensed prose); link rails whose stroke carries state: unbroken quoted, gapped open, cross-ticked worth confirming, doubled selected.
STORY: the CEO sees his own ad's role, must-haves and the call's open questions, taps any claim to see the ad line behind it, and understands the tool prepares the call, never replaces it.
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
        <p className={s.mark}>Intake prep</p>
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
          <Questions ad={ad} />
          <Brief ad={ad} template={data.sources.template} />
          <Dimensions ad={ad} dimensions={data.dimensions} />
          {ad.contradictions.length > 0 && <Confirm ad={ad} contradictions={ad.contradictions} />}
          <Lanes ad={ad} />
          <Sources ad={ad} data={data} />
        </div>
      </div>

      <footer className={s.foot}>
        <p>
          How this was made: an LLM (Claude) read each ad once and proposed the fields, levels and questions; code kept
          only quotes found word for word in the ad; Daniel Bernardino reviewed every question by hand. It prepares the
          intake call and replaces none of it.
        </p>
      </footer>
    </main>
  );
}

/** A tie from a claim to the ad. Its stroke carries the state; the plate beside it says it in words. */
function Rail({ state }: { state: 'quoted' | 'open' | 'confirm' }) {
  return (
    <span className={s.rail} data-state={state} aria-hidden="true">
      {state === 'confirm' && <span className={s.tick} />}
    </span>
  );
}

function Questions({ ad }: { ad: AdView }) {
  const all = questions(ad);
  return (
    <section className={s.questions} id="questions" aria-labelledby="questions-head">
      <h2 id="questions-head" className={s.countHead}>
        <span className={s.count}>{all.length}</span>
        <span className={s.countText}>{headline(all.length).replace(/^\d+ /, '')}</span>
      </h2>
      <ol className={s.qList}>
        {all.map((q, i) => (
          <li key={q.name} id={`q-${i + 1}`}>
            <span className={s.qNum}>{String(i + 1).padStart(2, '0')}</span>
            <p className={s.qText}>
              <span className={s.dimName}>{q.name}</span> {q.question}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A claim with its quote one tap away, and the lane it came from. */
function Quoted({ ad, label, quote, children }: { ad: AdView; label: string; quote: string; children?: ReactNode }) {
  const lane = laneOf(quote, ad);
  return (
    <details className={s.claim}>
      <summary>
        <span className={s.claimLabel}>{label}</span>
        <Rail state="quoted" />
        {lane !== undefined && <span className={s.plate}>{laneLabel(lane)}</span>}
      </summary>
      <div className={s.claimBody}>
        {children}
        <blockquote className={s.quote}>
          <p>{quote}</p>
          <footer>
            {lane !== undefined ? (
              <a href={`#l${lane}`}>Lane {laneLabel(lane)}</a>
            ) : (
              'From the ad'
            )}
          </footer>
        </blockquote>
      </div>
    </details>
  );
}

function Brief({ ad, template }: { ad: AdView; template: TechifideData['sources']['template'] }) {
  return (
    <section className={s.block} aria-labelledby="brief">
      <h2 id="brief" className={s.blockHead}>
        Vacancy brief
      </h2>
      <p className={s.lead}>
        On the fields of Techifide&rsquo;s own template, <a href={template.url}>Techi-job-offer.docx</a>. A field
        the ad does not fill stays open for the call.
      </p>
      <dl className={s.fields}>
        {ad.brief.map((f) => (
          <div key={f.field} className={s.field}>
            <dt>{f.field === MUST_HAVE_FIELD ? 'Essential experience / attributes' : fieldName(f.field)}</dt>
            <dd>
              {f.items.length === 0 ? (
                <p className={s.tieLine}>
                  <span className={s.empty}>
                    {f.field.startsWith('Location') && listingWhere(ad)
                      ? `Not in the ad’s text; the listing says ${listingWhere(ad)}`
                      : 'Not in the ad'}
                  </span>
                  <Rail state="open" />
                  <span className={s.plate}>Open</span>
                </p>
              ) : (
                f.items.map((item) => <Quoted key={item.quote} ad={ad} label={item.value} quote={item.quote} />)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Where the listing's metadata puts the role, outside the ad's text. */
function listingWhere(ad: AdView): string | null {
  const { remote, applicantCountry, location } = ad.listing;
  return remote ? `remote, ${applicantCountry ?? location ?? 'location not stated'}` : location;
}

/** The template's labels, tidied for reading: "Location of the role(any travel required?)". */
function fieldName(field: string): string {
  return field.replace(/\s*\(/, ' (').replace(/\/ /g, ' / ');
}

function Dimensions({ ad, dimensions }: { ad: AdView; dimensions: Dimension[] }) {
  const order = questions(ad).map((q) => q.name);
  return (
    <section className={s.block} aria-labelledby="dimensions">
      <h2 id="dimensions" className={s.blockHead}>
        Role Fit, dimension by dimension
      </h2>
      <p className={s.lead}>
        Techifide&rsquo;s eleven published dimensions. A level appears only where a line of the ad states it; the
        rest are the call&rsquo;s questions.
      </p>
      <ul className={s.dims}>
        {ad.dimensions.map((d) => (
          <li key={d.name}>
            <DimensionRow ad={ad} d={d} description={dimensions.find((x) => x.name === d.name)?.description} n={order.indexOf(d.name) + 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DimensionRow({ ad, d, description, n }: { ad: AdView; d: DimensionResult; description?: string; n: number }) {
  if (isScored(d)) {
    return (
      <Quoted ad={ad} label={d.name} quote={d.quote}>
        <p className={s.reading}>
          <span className={s.level}>Level {d.score} of 5</span> {d.reading}.
        </p>
        {description && <p className={s.described}>Techifide: {description}</p>}
      </Quoted>
    );
  }
  return (
    <details className={s.claim}>
      <summary>
        <span className={s.claimLabel}>{d.name}</span>
        <Rail state="open" />
        <span className={s.plate}>Ask {String(n).padStart(2, '0')}</span>
      </summary>
      <div className={s.claimBody}>
        <p className={s.reading}>{d.question}</p>
        {description && <p className={s.described}>Techifide: {description}</p>}
        <p className={s.described}>
          <a href={`#q-${n}`}>Question {String(n).padStart(2, '0')} for the call</a>
        </p>
      </div>
    </details>
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
