'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState, useTransition } from 'react';

import s from './fila.module.css';

export interface PracaOption {
  id: number;
  name: string;
  uf: string;
}

const MAX_RESULTS = 8;

/** "Luís Eduardo" and "luis eduardo" are the same search. */
const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Names that start with the query first, then names that contain it. */
export function search(options: readonly PracaOption[], query: string): PracaOption[] {
  const q = fold(query);
  if (!q) return [];
  const starts: PracaOption[] = [];
  const contains: PracaOption[] = [];
  for (const o of options) {
    const name = fold(o.name);
    if (name.startsWith(q)) starts.push(o);
    else if (name.includes(q) || `${name} ${o.uf.toLowerCase()}`.includes(q)) contains.push(o);
  }
  const byName = (a: PracaOption, b: PracaOption) => a.name.localeCompare(b.name, 'pt-BR');
  return [...starts.sort(byName), ...contains.sort(byName)].slice(0, MAX_RESULTS);
}

/**
 * The praça search in the top strip. Choosing navigates to `?m=`, so the page
 * stays server-rendered and every praça has a link that can be forwarded.
 */
export function Finder({
  options,
  featured,
  current,
}: {
  options: PracaOption[];
  featured: PracaOption[];
  current: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const results = useMemo(() => search(options, query), [options, query]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const go = (id: number) => {
    setOpen(false);
    setQuery('');
    startTransition(() => router.push(`${pathname}?m=${id}`, { scroll: true }));
  };

  return (
    <div className={s.finder} ref={root}>
      <button
        ref={toggle}
        type="button"
        className={s.finderToggle}
        aria-expanded={open}
        aria-controls={`${listId}-panel`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{pending ? 'Carregando…' : open ? 'Fechar' : 'Trocar praça'}</span>
      </button>
      {open && (
        <div id={`${listId}-panel`} className={s.finderPanel}>
          <label className={s.finderField}>
            <span>Município</span>
            <input
              ref={input}
              type="search"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
              autoComplete="off"
              placeholder="Digite o nome, ex.: Rio Verde"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter' && results[active]) {
                  e.preventDefault();
                  go(results[active].id);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                  toggle.current?.focus();
                }
              }}
            />
          </label>
          {query && results.length === 0 && (
            <p className={s.finderEmpty}>Nenhum município com soja registrada com esse nome.</p>
          )}
          <ul id={listId} role="listbox" className={s.finderList} aria-label="Municípios">
            {(query ? results : featured).map((o, i) => (
              <li
                key={o.id}
                id={`${listId}-${o.id}`}
                role="option"
                aria-selected={query ? i === active : o.id === current}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(o.id)}
              >
                <span>{o.name}</span>
                <span className={s.finderUf}>{o.uf}</span>
              </li>
            ))}
          </ul>
          {!query && (
            <p className={s.finderHint}>
              Praças dos eventos da Tarken. Digite para buscar entre {options.length.toLocaleString('pt-BR')} municípios.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
