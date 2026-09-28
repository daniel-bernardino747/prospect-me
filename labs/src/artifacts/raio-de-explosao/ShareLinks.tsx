'use client';

import { type MouseEvent, useEffect, useState } from 'react';

import { shareQuery, shareUrl } from '@/labs/share';

import { SHARE_KEYS } from './data';
import s from './raio.module.css';

const SLUG = 'raio-de-explosao';

/**
 * Share this instant. Every link is a plain link without JS; "Copiar link" then
 * opens the permalink itself, whose address can be copied. With JS it copies
 * and says so, and the phone's own share sheet is offered where there is one.
 */
export function ShareLinks({ state, sentence }: { state: Record<string, string | undefined>; sentence: string }) {
  const url = shareUrl(SLUG, shareQuery(SHARE_KEYS, state));
  const text = `${sentence} Raio de explosão, demo de Daniel Bernardino com dados públicos do npm:`;
  const [native, setNative] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);
  useEffect(() => setStatus(''), [url]);

  const copy = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Link copiado.');
    } catch {
      setStatus('Não deu para copiar: segure o link e copie.');
    }
  };
  const shareNative = async () => {
    try {
      await navigator.share({ title: 'Raio de explosão', text: sentence, url });
    } catch {
      // Closed the sheet: nothing to say.
    }
  };

  const q = encodeURIComponent;
  return (
    <section className={s.share} aria-labelledby="compartilhar">
      <h2 id="compartilhar" className={s.shareHead}>
        Compartilhar este instante
      </h2>
      <div className={s.shareRow}>
        {native && (
          <button type="button" className={s.shareBtn} onClick={shareNative}>
            Compartilhar…
          </button>
        )}
        <a href={url} className={s.shareBtn} onClick={copy}>
          Copiar link
        </a>
        <a
          href={`https://wa.me/?text=${q(`${text} ${url}`)}`}
          className={s.shareBtn}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp (abre em nova aba)"
        >
          WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}`}
          className={s.shareBtn}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn (abre em nova aba)"
        >
          LinkedIn
        </a>
        <a
          href={`https://x.com/intent/post?text=${q(text)}&url=${q(url)}`}
          className={s.shareBtn}
          target="_blank"
          rel="noreferrer"
          aria-label="X (abre em nova aba)"
        >
          X
        </a>
      </div>
      <p className={s.shareStatus} aria-live="polite">
        {status}
      </p>
    </section>
  );
}
