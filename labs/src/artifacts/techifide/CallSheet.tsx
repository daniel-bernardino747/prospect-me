'use client';

/**
 * The intake call, run on the page: the questions take a level and a note, the
 * template's empty fields take what the call says, and the Role Fit Profile
 * fills in as it goes. The sheet lives in this browser only.
 */
import { useEffect, useId, useRef, useState } from 'react';

import { type AdView, type Dimension, isScored, type TemplateSource } from './data';
import { fieldName, listingWhere, Quote, Quoted, Rail } from './parts';
import s from './techifide.module.css';
import { day, laneLabel, MUST_HAVE_FIELD, questions } from './view';
import {
  briefRows,
  exportText,
  fromLabel,
  initialWorksheet,
  isTouched,
  type Level,
  LEVELS,
  liveHeadline,
  MAX_TEXT,
  profileRows,
  restoreWorksheet,
  SCALE,
  type Source,
  sourceOf,
  type Worksheet as Sheet,
} from './worksheet';

interface Props {
  ad: AdView;
  dimensions: Dimension[];
  template: TemplateSource;
}

const storageKey = (ad: AdView) => `techifide-intake:${ad.key}`;

/** localStorage can be absent or refuse; the sheet then works and simply forgets. */
function load(ad: AdView): Sheet {
  try {
    return restoreWorksheet(window.localStorage.getItem(storageKey(ad)), ad);
  } catch {
    return initialWorksheet(ad);
  }
}

function save(ad: AdView, sheet: Sheet) {
  try {
    if (isTouched(ad, sheet)) window.localStorage.setItem(storageKey(ad), JSON.stringify(sheet));
    else window.localStorage.removeItem(storageKey(ad));
  } catch {
    // Nothing to do: the call still works, it is just not remembered.
  }
}

export function CallSheet({ ad, dimensions, template }: Props) {
  const [sheet, setSheet] = useState<Sheet>(() => initialWorksheet(ad));
  const [restored, setRestored] = useState(false);

  // Read after mount, so the server's render and the first paint agree.
  useEffect(() => {
    setSheet(load(ad));
    setRestored(true);
  }, [ad]);

  useEffect(() => {
    if (restored) save(ad, sheet);
  }, [ad, sheet, restored]);

  const setLevel = (name: string, level: Level | null) =>
    setSheet((prev) => ({ ...prev, dimensions: { ...prev.dimensions, [name]: { ...prev.dimensions[name], level } } }));
  const setNote = (name: string, note: string) =>
    setSheet((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: { ...prev.dimensions[name], note: note.slice(0, MAX_TEXT) } },
    }));
  const setField = (field: string, value: string) =>
    setSheet((prev) => ({ ...prev, fields: { ...prev.fields, [field]: value.slice(0, MAX_TEXT) } }));

  const controls = { sheet, setLevel, setNote };
  const touched = isTouched(ad, sheet);

  return (
    <>
      <Questions ad={ad} dimensions={dimensions} {...controls} />
      <Brief ad={ad} template={template} sheet={sheet} setField={setField} />
      <Dimensions ad={ad} dimensions={dimensions} {...controls} />
      <Profile ad={ad} dimensions={dimensions} template={template} sheet={sheet} onClear={() => setSheet(initialWorksheet(ad))} />
      {touched && (
        <nav className={s.bar} aria-label="Call sheet">
          <span>Call sheet in progress, kept in this browser.</span>
          <a href="#profile" className={s.barLink}>
            Profile
          </a>
        </nav>
      )}
      <PrintSheet ad={ad} dimensions={dimensions} sheet={sheet} />
    </>
  );
}

interface Controls {
  sheet: Sheet;
  setLevel: (name: string, level: Level | null) => void;
  setNote: (name: string, note: string) => void;
}

/**
 * Five keys and a note: the level this dimension of the role calls for. Native
 * radios, so the group is one tab stop and the arrow keys move within it.
 */
function LevelControl({ name, description, sheet, setLevel, setNote }: Controls & { name: string; description?: string }) {
  const id = useId();
  const group = useRef<HTMLFieldSetElement>(null);
  const answer = sheet.dimensions[name];
  return (
    <div className={s.control}>
      {description && <p className={s.described}>Techifide: {description}</p>}
      <fieldset className={s.levelSet} ref={group}>
        <legend className={s.scaleLabel}>Level this role calls for</legend>
        <div className={s.levels}>
          {LEVELS.map((level) => (
            <label key={level} className={s.levelKey}>
              <input
                type="radio"
                name={`${id}-level`}
                value={level}
                checked={answer?.level === level}
                onChange={() => setLevel(name, level)}
              />
              <span>{level}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={s.scaleEnds} aria-hidden="true">
        <span>1 · {SCALE.low}</span>
        <span>{SCALE.high} · 5</span>
      </p>
      {answer?.level != null && (
        <button
          type="button"
          className={s.clearLevel}
          onClick={() => {
            setLevel(name, null);
            // The button leaves with the level; keyboard focus goes back to the keys.
            group.current?.querySelector('input')?.focus();
          }}
        >
          Clear level
        </button>
      )}
      <label className={s.noteLabel}>
        <span>Note from the call</span>
        <textarea
          rows={2}
          maxLength={MAX_TEXT}
          value={answer?.note ?? ''}
          onChange={(e) => setNote(name, e.target.value)}
          placeholder="What the hiring manager said"
        />
      </label>
    </div>
  );
}

/** The plate beside a dimension: its lane while the ad's level stands, the call's level once it changes. */
function sourcePlate(source: Source, level: Level | null, askNumber: number): string {
  if (source.kind === 'ad') return source.lane === undefined ? 'Ad' : laneLabel(source.lane);
  if (source.kind === 'call') return `Call ${level}`;
  return `Ask ${String(askNumber).padStart(2, '0')}`;
}

function Questions({ ad, dimensions, ...controls }: Controls & { ad: AdView; dimensions: Dimension[] }) {
  const all = questions(ad);
  const { count, text } = liveHeadline(ad, controls.sheet);
  return (
    <section className={s.questions} id="questions" aria-labelledby="questions-head">
      <h2 id="questions-head" className={s.countHead} aria-live="polite">
        <span className={s.count}>{count}</span>
        {count === 0 ? (
          <a className={s.countText} href="#profile">
            {text}: export it
          </a>
        ) : (
          <span className={s.countText}>{text}</span>
        )}
      </h2>
      <p className={s.hint}>Open a question to record its level during the call.</p>
      <ol className={s.qList}>
        {all.map((q, i) => {
          const level = controls.sheet.dimensions[q.name]?.level ?? null;
          return (
            <li key={q.name} id={`q-${i + 1}`} data-answered={level !== null ? '' : undefined}>
              <span className={s.qNum}>{String(i + 1).padStart(2, '0')}</span>
              <details className={s.qDetails}>
                <summary className={s.qText}>
                  <span className={s.dimName}>{q.name}</span> {q.question}
                  <span className={s.answered} data-open={level === null ? '' : undefined}>
                    {level === null ? 'Record' : `Call ${level}`}
                  </span>
                </summary>
                <LevelControl
                  name={q.name}
                  description={dimensions.find((d) => d.name === q.name)?.description}
                  {...controls}
                />
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Brief({
  ad,
  template,
  sheet,
  setField,
}: {
  ad: AdView;
  template: TemplateSource;
  sheet: Sheet;
  setField: (field: string, value: string) => void;
}) {
  return (
    <section className={s.block} aria-labelledby="brief">
      <h2 id="brief" className={s.blockHead}>
        Vacancy brief
      </h2>
      <p className={s.lead}>
        On the fields of Techifide&rsquo;s own template, <a href={template.url}>Techi-job-offer.docx</a>. What the ad
        does not fill, the call can.
      </p>
      <dl className={s.fields}>
        {ad.brief.map((f) => {
          const typed = sheet.fields[f.field] ?? '';
          const where = f.field.startsWith('Location') ? listingWhere(ad) : null;
          return (
            <div key={f.field} className={s.field}>
              <dt>{f.field === MUST_HAVE_FIELD ? 'Essential experience / attributes' : fieldName(f.field)}</dt>
              <dd>
                {f.items.length === 0 ? (
                  <>
                    <p className={s.tieLine}>
                      <span className={s.empty}>
                        {typed.trim()
                          ? 'From the call'
                          : where
                            ? `Not in the ad’s text; the listing says ${where}`
                            : 'Not in the ad'}
                      </span>
                      <Rail state={typed.trim() ? 'quoted' : 'open'} />
                      <span className={s.plate}>{typed.trim() ? 'Call' : 'Open'}</span>
                    </p>
                    <input
                      className={s.fieldInput}
                      aria-label={`${fieldName(f.field)}, from the call`}
                      maxLength={MAX_TEXT}
                      value={typed}
                      onChange={(e) => setField(f.field, e.target.value)}
                      placeholder="Add from the call"
                    />
                  </>
                ) : (
                  f.items.map((item) => <Quoted key={item.quote} ad={ad} label={item.value} quote={item.quote} />)
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function Dimensions({ ad, dimensions, ...controls }: Controls & { ad: AdView; dimensions: Dimension[] }) {
  const order = questions(ad).map((q) => q.name);
  return (
    <section className={s.block} aria-labelledby="dimensions">
      <h2 id="dimensions" className={s.blockHead}>
        Role Fit, dimension by dimension
      </h2>
      <p className={s.lead}>
        Techifide&rsquo;s eleven published dimensions. The ad sets a level only where one of its lines states it; the
        call can confirm or change any of them.
      </p>
      <ul className={s.dims}>
        {ad.dimensions.map((d) => {
          const level = controls.sheet.dimensions[d.name]?.level ?? null;
          const source = sourceOf(ad, controls.sheet, d.name);
          const description = dimensions.find((x) => x.name === d.name)?.description;
          return (
            <li key={d.name}>
              <details className={s.claim}>
                <summary>
                  <span className={s.claimLabel}>{d.name}</span>
                  <Rail state={source.kind === 'open' ? 'open' : 'quoted'} />
                  <span className={s.plate}>{sourcePlate(source, level, order.indexOf(d.name) + 1)}</span>
                </summary>
                <div className={s.claimBody}>
                  {isScored(d) ? (
                    <>
                      <p className={s.reading}>
                        <span className={s.level}>The ad: level {d.score} of 5</span> {d.reading}.
                      </p>
                      <Quote ad={ad} quote={d.quote} />
                    </>
                  ) : (
                    <p className={s.reading}>{d.question}</p>
                  )}
                  <LevelControl name={d.name} description={description} {...controls} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Meter({ level }: { level: Level | null }) {
  return (
    <span className={s.meter} aria-hidden="true">
      {LEVELS.map((l) => (
        <span key={l} data-on={level !== null && l <= level ? '' : undefined} />
      ))}
    </span>
  );
}

function Profile({
  ad,
  dimensions,
  template,
  sheet,
  onClear,
}: {
  ad: AdView;
  dimensions: Dimension[];
  template: TemplateSource;
  sheet: Sheet;
  onClear: () => void;
}) {
  const [status, setStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const rows = profileRows(ad, sheet, dimensions);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText(ad, sheet, dimensions, template));
      setStatus('Copied as text.');
    } catch {
      setStatus('Copying was blocked by the browser; use Print or .docx instead.');
    }
  };
  const docx = async () => {
    setStatus('Preparing the .docx…');
    try {
      const { downloadDocx } = await import('./exportDocx');
      await downloadDocx(ad, sheet, dimensions);
      setStatus('Downloaded.');
    } catch {
      setStatus('The .docx could not be built here; Print or Copy still work.');
    }
  };

  return (
    <section className={s.block} id="profile" aria-labelledby="profile-head">
      <h2 id="profile-head" className={s.blockHead}>
        Role Fit Profile
      </h2>
      <p className={s.lead}>
        The level each dimension of this role calls for, 1 ({SCALE.low.toLowerCase()}) to 5 (
        {SCALE.high.toLowerCase()}), in Techifide&rsquo;s published order, from the ad and from the call. It stays in this browser: nothing typed here is sent
        anywhere.
      </p>
      <ul className={s.profile}>
        {rows.map((row) => (
          <li key={row.name}>
            <span className={s.profileName}>{row.name}</span>
            <Meter level={row.level} />
            <span className={s.profileLevel}>{row.level ?? '–'}</span>
            <span className={s.profileFrom}>{row.level === null ? 'to confirm' : `from ${fromLabel(row.source)}`}</span>
            {row.note && <p className={s.profileNote}>{row.note}</p>}
          </li>
        ))}
      </ul>
      <div className={s.exports}>
        <button type="button" className={s.action} onClick={docx}>
          Download .docx
        </button>
        <button type="button" className={s.action} onClick={() => window.print()}>
          Print / PDF
        </button>
        <button type="button" className={s.action} onClick={copy}>
          Copy as text
        </button>
        <button
          type="button"
          className={s.clear}
          data-armed={confirmClear ? '' : undefined}
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            onClear();
            setConfirmClear(false);
            setStatus('Cleared: back to what the ad says.');
          }}
          onBlur={() => setConfirmClear(false)}
        >
          {confirmClear ? 'Tap again to clear this call' : 'Clear this call'}
        </button>
      </div>
      <p className={s.status} role="status">
        {status}
      </p>
    </section>
  );
}

/** What Print / PDF puts on paper: the filled template and the profile, light and plain. */
function PrintSheet({ ad, dimensions, sheet }: { ad: AdView; dimensions: Dimension[]; sheet: Sheet }) {
  const [today, setToday] = useState('');
  // The reader's date, set in the browser so the server render stays stable.
  useEffect(() => setToday(day(new Date().toISOString())), []);
  return (
    <div className={s.printSheet} aria-hidden="true">
      <h1>{ad.title}</h1>
      <p>
        {ad.url}
        {today && ` · prepared on ${today}`}
      </p>
      <h2>Vacancy brief (Techi-job-offer)</h2>
      <table>
        <tbody>
          {briefRows(ad, sheet).map((row) => (
            <tr key={row.field}>
              <th>{row.field}</th>
              <td>
                {row.values.length
                  ? row.values.map((v) => (
                      <div key={v.text}>
                        {v.text} <em>(from {v.from})</em>
                      </div>
                    ))
                  : <em>To confirm</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Role Fit Profile (1 = {SCALE.low.toLowerCase()}, 5 = {SCALE.high.toLowerCase()})</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Level</th>
            <th>Note from the call</th>
          </tr>
        </thead>
        <tbody>
          {profileRows(ad, sheet, dimensions).map((row) => (
            <tr key={row.name}>
              <th>{row.name}</th>
              <td>{row.level === null ? <em>To confirm</em> : `${row.level} (from ${fromLabel(row.source)})`}</td>
              <td>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
