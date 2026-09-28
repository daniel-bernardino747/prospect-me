'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type Selection = [string | null, (id: string | null) => void];

const Ctx = createContext<Selection>([null, () => {}]);

/**
 * The selected card (`?r=`): a run, a stop (`d2`) or a commit (`c-4ee9ea9`). It
 * lives in the URL so a shared link opens on the same card; without JavaScript
 * every card is a plain link to its own state.
 */
export function SelectionProvider({
  initial,
  valid,
  children,
}: {
  initial: string | null;
  valid: string[];
  children: ReactNode;
}) {
  const [sel, setSel] = useState<string | null>(initial);
  const set = useCallback(
    (id: string | null) => {
      const next = id && valid.includes(id) ? id : null;
      setSel(next);
      try {
        const url = new URL(window.location.href);
        if (next) url.searchParams.set('r', next);
        else url.searchParams.delete('r');
        url.hash = '';
        window.history.replaceState(window.history.state, '', url);
      } catch {
        // The selection still works; only the address bar is stale.
      }
    },
    [valid],
  );
  useEffect(() => {
    const onPop = () => {
      const r = new URL(window.location.href).searchParams.get('r');
      setSel(r && valid.includes(r) ? r : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [valid]);
  return <Ctx.Provider value={[sel, set]}>{children}</Ctx.Provider>;
}

export const useSelection = () => useContext(Ctx);
