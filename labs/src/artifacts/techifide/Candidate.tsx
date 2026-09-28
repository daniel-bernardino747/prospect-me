/**
 * A synthetic candidate read against the role: each must-have is evidenced by
 * a line of the CV, checked word for word, or left for the interview. The CV
 * is written for the demo and is about no real person.
 */
import type { CandidateView } from './data';
import { HeroVideo } from './HeroVideo';
import { Rail } from './parts';
import s from './techifide.module.css';

/** "C07": the CV's own lanes, numbered like the ad's. */
const cvLabel = (line: number) => `C${String(line).padStart(2, '0')}`;
const cvLine = (quote: string, cv: CandidateView) => {
  const i = cv.lines.findIndex((l) => l.includes(quote));
  return i < 0 ? undefined : i;
};

export function Candidate({ candidate }: { candidate: CandidateView }) {
  const evidenced = candidate.evidence.filter((e) => e.quote).length;
  const toAsk = candidate.evidence.length - evidenced;
  const cited = new Set(
    [...candidate.evidence, ...candidate.questions].flatMap((x) => (x.quote ? (cvLine(x.quote, candidate) ?? []) : [])),
  );

  return (
    <section className={s.block} id="candidate" aria-labelledby="candidate-head">
      <h2 id="candidate-head" className={s.blockHead}>
        Screening a candidate
      </h2>
      <HeroVideo where="section" />
      <p className={s.lead}>
        A synthetic CV, written for this demo and about no real person, read against this role&rsquo;s must-haves the
        way the ad was read: a must-have counts only where a line of the CV says it, checked word for word. What the CV
        does not show, and what the call left open, become interview questions.
      </p>

      <p className={s.candidateSummary}>
        <span className={s.candidateName}>{candidate.label}</span>
        <span>
          <strong>{evidenced}</strong> of {candidate.evidence.length} must-haves shown in the CV
          {toAsk > 0 && (
            <>
              {' '}
              · <strong>{toAsk}</strong> to ask
            </>
          )}
        </span>
      </p>

      <ul className={s.dims}>
        {candidate.evidence.map((e) => {
          const line = e.quote ? cvLine(e.quote, candidate) : undefined;
          if (!e.quote) {
            return (
              <li key={e.value}>
                <p className={`${s.tieLine} ${s.evidenceRow}`}>
                  <span className={s.claimLabel}>{e.value}</span>
                  <Rail state="open" />
                  <span className={s.plate}>Ask</span>
                </p>
                <p className={s.notShown}>Not in the CV: ask about it in the interview.</p>
              </li>
            );
          }
          return (
            <li key={e.value}>
              <details className={s.claim}>
                <summary>
                  <span className={s.claimLabel}>{e.value}</span>
                  <Rail state="quoted" />
                  <span className={s.plate}>{line === undefined ? 'CV' : cvLabel(line)}</span>
                </summary>
                <div className={s.claimBody}>
                  <blockquote className={s.quote}>
                    <p>{e.quote}</p>
                    <footer>{line !== undefined ? <a href={`#c${line}`}>CV line {cvLabel(line)}</a> : 'From the CV'}</footer>
                  </blockquote>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <h3 className={s.subHead}>Interview questions</h3>
      <p className={s.lead}>
        One behavioural question for each dimension the intake call left open, in the same order, tied to the CV where
        it can be.
      </p>
      <ol className={s.qList}>
        {candidate.questions.map((q, i) => {
          const line = q.quote ? cvLine(q.quote, candidate) : undefined;
          return (
            <li key={q.dimension}>
              <span className={s.qNum}>{String(i + 1).padStart(2, '0')}</span>
              <p className={s.qText}>
                <span className={s.dimName}>{q.dimension}</span> {q.question}
                {line !== undefined && (
                  <a className={s.cvRef} href={`#c${line}`}>
                    {cvLabel(line)}
                  </a>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <h3 className={s.subHead}>{candidate.label}&rsquo;s CV (synthetic)</h3>
      <ol className={s.lanes}>
          {candidate.lines.map((line, i) => (
            <li key={i} id={`c${i}`} data-cited={cited.has(i) ? '' : undefined}>
              <span className={s.laneNum}>{cvLabel(i)}</span>
              <span className={s.laneText}>{line}</span>
            </li>
          ))}
      </ol>
    </section>
  );
}
