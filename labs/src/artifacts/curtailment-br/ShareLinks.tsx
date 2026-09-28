'use client';

import { type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import s from './curtailment.module.css';

interface Props {
  /** The absolute link to this day (`?dia=` only when the reader chose one). */
  url: string;
  /** Link title, for the native share sheet. */
  title: string;
  /** The short pt-BR text that goes with the link. */
  post: string;
  /** "16/08/2026", for the plate. */
  date: string;
}

const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/**
 * The share row under POR QUÊ: the reader has the sentence, the reason and the
 * named line, and this sends the day. Every destination is a plain link, so it
 * works without JavaScript; "Copiar link" is the day's own URL, copied when
 * scripts run. The native sheet appears only where the browser has one.
 */
export function ShareLinks({ url, title, post, date }: Props) {
  const native = useSyncExternalStore(
    () => () => {},
    canShare,
    () => false,
  );
  const [said, setSaid] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const say = (text: string) => {
    clearTimeout(timer.current);
    setSaid(text);
    timer.current = setTimeout(() => setSaid(''), 2400);
  };

  const copy = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!navigator.clipboard) return; // the link itself still opens the day
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      say('LINK COPIADO');
    } catch {
      say('NÃO DEU PARA COPIAR: SEGURE O LINK PARA COPIAR');
    }
  };

  const send = async () => {
    try {
      await navigator.share({ title, text: post, url });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say('NÃO DEU PARA ABRIR O COMPARTILHAMENTO');
    }
  };

  const text = `${post} ${url}`;
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(text)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: 'X', href: `https://x.com/intent/tweet?text=${encodeURIComponent(post)}&url=${encodeURIComponent(url)}` },
  ];

  return (
    <section className={s.share} aria-labelledby="compartilhar-h">
      <h2 className={s.plate} id="compartilhar-h">
        COMPARTILHAR {date}
      </h2>
      <ul className={s.shareRow}>
        {native && (
          <li>
            <button type="button" className={s.shareKey} onClick={send}>
              Enviar…
            </button>
          </li>
        )}
        <li>
          <a className={s.shareKey} href={url} onClick={copy}>
            Copiar link
          </a>
        </li>
        {links.map((l) => (
          <li key={l.label}>
            <a className={s.shareKey} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
              <span className={s.srOnly}> (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className={s.shareSaid} role="status" aria-live="polite">
        {said}
      </p>
    </section>
  );
}
