'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { STATES } from './data';
import s from './pix.module.css';
import { type Entry, resolveQuery, search, suggestions } from './find';
import { usePrinting } from './Sala';

interface Option {
  entry: Entry;
}

/**
 * The dispenser's search. A real GET form (`?q=`), so it works before and
 * without JavaScript; with it, a combobox over the whole index in the browser.
 */
export function Search({ index, capitals, initial }: { index: Entry[]; capitals: number[]; initial: string }) {
  const { pending, go } = usePrinting();
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const capitalSet = useMemo(() => new Set(capitals), [capitals]);

  const results = useMemo(() => (query.trim() ? search(index, query, capitalSet) : []), [index, query, capitalSet]);
  const hints = useMemo(
    () => (query.trim() && results.length === 0 ? suggestions(index, query) : []),
    [index, query, results.length],
  );
  const options: Option[] = (results.length ? results : hints).map((entry) => ({ entry }));
  const expanded = open && query.trim().length > 0;

  // Once the new ticket is out, the field is free for the next city.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      setQuery('');
      setChosen(null);
    }
    wasPending.current = pending;
  }, [pending]);

  const pick = (e: Entry) => {
    setOpen(false);
    setActive(-1);
    setQuery(e[1]);
    setChosen(e[1]);
    go(`c=${e[0]}`);
  };

  const announcement = !expanded
    ? ''
    : results.length
      ? `${results.length} ${results.length === 1 ? 'município encontrado' : 'municípios encontrados'}`
      : 'Nenhum município com esse nome';

  return (
    <form
      className={s.search}
      method="get"
      role="search"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (expanded && options[active]) return pick(options[active].entry);
        const r = resolveQuery(index, query, capitalSet);
        if (r.kind === 'one') return pick(r.entry);
        setOpen(true);
        setActive(0);
        input.current?.focus();
      }}
    >
      <label htmlFor={`${listId}-q`} className={s.searchLabel}>
        Qual é a sua cidade?
      </label>
      <div className={s.searchRow}>
        <div className={s.field}>
          <input
            ref={input}
            id={`${listId}-q`}
            name="q"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={`${listId}-list`}
            aria-activedescendant={expanded && options[active] ? `${listId}-${options[active].entry[0]}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Qual é a sua cidade?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(a + 1, options.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Escape') {
                if (expanded) e.preventDefault();
                setOpen(false);
                setActive(-1);
              }
            }}
          />
          <ul id={`${listId}-list`} role="listbox" aria-label="Municípios" className={s.listbox} hidden={!expanded}>
            {expanded && !results.length && (
              <>
                <li role="presentation" className={s.noMatch}>
                  Nenhum município com esse nome.
                </li>
                <li role="presentation" className={s.maybe}>
                  Talvez:
                </li>
              </>
            )}
            {expanded &&
              options.map(({ entry }, i) => (
                <li
                  key={entry[0]}
                  id={`${listId}-${entry[0]}`}
                  role="option"
                  aria-selected={i === active}
                  className={s.option}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(entry)}
                >
                  <span className={s.optionName}>{entry[1]}</span>
                  <span className={s.chip}>{entry[2]}</span>
                  <span className={s.optionState}>{STATES[entry[2]]}</span>
                </li>
              ))}
          </ul>
        </div>
        <button type="submit" className={s.printButton} aria-disabled={pending || undefined}>
          {pending ? 'Imprimindo…' : 'Imprimir'}
        </button>
      </div>
      <p className={s.srOnly} aria-live="polite">
        {pending && chosen ? `Imprimindo a senha de ${chosen}` : announcement}
      </p>
    </form>
  );
}
