'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';

import s from './pix.module.css';

interface Printing {
  /** A city change is on its way from the server. */
  pending: boolean;
  /** It has taken more than 8 s: say so, keep the old ticket. */
  failed: boolean;
  /** Navigate to `?{query}` without scrolling (the ticket is where the reader is). */
  go: (query: string) => void;
  retry: () => void;
}

const Ctx = createContext<Printing>({ pending: false, failed: false, go: () => {}, retry: () => {} });
export const usePrinting = () => useContext(Ctx);

const TOO_LONG = 8000;

/** The one piece of client state the room shares: is a ticket printing. */
export function SalaProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [late, setLate] = useState(false);
  const last = useRef('');

  const go = useCallback(
    (query: string) => {
      last.current = query;
      setLate(false);
      start(() => router.push(`${pathname}?${query}`, { scroll: false }));
    },
    [pathname, router],
  );

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setLate(true), TOO_LONG);
    return () => clearTimeout(t);
  }, [pending]);

  const retry = useCallback(() => go(last.current), [go]);
  return <Ctx.Provider value={{ pending, failed: pending && late, go, retry }}>{children}</Ctx.Provider>;
}

/** The dispenser's busy lamp at the slot's right end. */
export function BusyLamp() {
  const { pending, failed } = usePrinting();
  return <span className={s.lamp} data-on={pending && !failed ? '' : undefined} aria-hidden="true" />;
}

/** The slip under the slot when a ticket does not come out. */
export function PrintError() {
  const { failed, retry } = usePrinting();
  if (!failed) return null;
  return (
    <p className={s.slip} role="status">
      Não deu para imprimir agora.{' '}
      <button type="button" className={s.slipAction} onClick={retry}>
        Tentar de novo
      </button>
    </p>
  );
}

/**
 * The printer: on a client-driven city change, the old senha tears off and the
 * new one feeds out of the slot. First paint never animates; reduced motion
 * turns both into a crossfade (in CSS).
 */
export function Printer({ id, children }: { id: number; children: ReactNode }) {
  const { pending } = usePrinting();
  const [current, setCurrent] = useState({ id, node: children, feed: 0 });
  const [leaving, setLeaving] = useState<{ key: number; node: ReactNode } | null>(null);

  if (current.id !== id) {
    setLeaving({ key: current.feed, node: current.node });
    setCurrent({ id, node: children, feed: current.feed + 1 });
  } else if (current.node !== children) {
    setCurrent({ ...current, node: children });
  }

  return (
    <div className={s.printer} aria-busy={pending}>
      {leaving && (
        <div key={`out-${leaving.key}`} className={s.tearing} aria-hidden="true" onAnimationEnd={() => setLeaving(null)}>
          {leaving.node}
        </div>
      )}
      <div key={current.feed} className={current.feed ? s.feeding : undefined}>
        {current.node}
      </div>
    </div>
  );
}

/** Re-mounts its children on a city change so CSS can play a one-off (the LED blink, the strip crossfade). */
export function OnChange({
  id,
  className,
  base,
  children,
}: {
  id: number;
  className: string;
  base?: string;
  children: ReactNode;
}) {
  const first = useRef(id);
  const classes = [base, id !== first.current ? className : undefined].filter(Boolean).join(' ');
  return (
    <div key={id} className={classes || undefined}>
      {children}
    </div>
  );
}
