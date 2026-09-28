'use client';

import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { shareQuery, shareUrl } from '@/labs/share';

import s from './conta.module.css';

const SLUG = 'conta-de-tokens';

interface Props {
  /** The scenario as share params (only what differs from the default). */
  search: Record<string, string>;
  keys: readonly string[];
  /** One pt-BR line for the message that goes with the link. */
  text: string;
  title: string;
}

/**
 * "Compartilhar esta conta": the link to the scenario on screen. Every channel is
 * a plain link that works without JavaScript; the native sheet and "Copiar link"
 * need it, so the native key appears only once the browser offers it.
 */
export function ShareLinks({ search, keys, text, title }: Props) {
  const url = shareUrl(SLUG, shareQuery(keys, search));
  const [native, setNative] = useState(false);
  const [said, setSaid] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setNative(typeof navigator.share === 'function'), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const say = (msg: string) => {
    clearTimeout(timer.current);
    setSaid(msg);
    timer.current = setTimeout(() => setSaid(''), 2400);
  };

  const copy = async (e: MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      say('Link copiado');
    } catch {
      window.prompt('Copie o link:', url);
    }
  };

  const openSheet = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say('Não deu para abrir o compartilhamento');
    }
  };

  const enc = encodeURIComponent;
  const channels = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: 'X', href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
  ];

  return (
    <div className={s.shareRow} role="group" aria-labelledby="compartilhar-titulo">
      <p id="compartilhar-titulo" className={s.shareLabel}>
        Compartilhar esta conta
      </p>
      <ul className={s.shareKeys}>
        {native ? (
          <li>
            <button type="button" className={s.shareKey} onClick={openSheet}>
              Compartilhar…
            </button>
          </li>
        ) : null}
        <li>
          {/* Without JavaScript this is the link itself, to open or copy by hand. */}
          <a className={s.shareKey} href={url} onClick={copy}>
            Copiar link
          </a>
        </li>
        {channels.map((c) => (
          <li key={c.name}>
            <a className={s.shareKey} href={c.href} target="_blank" rel="noopener noreferrer">
              {c.name}
              <span className={s.srOnly}> (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className={s.shareSaid} role="status" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
