'use client';

import { useEffect, useState } from 'react';

import { shareUrl } from '@/labs/share';

import s from './bastidores.module.css';
import { useSelection } from './selection';

export interface ShareEntry {
  /** The share text for this state. */
  short: string;
  title: string;
}

/**
 * Share links for the current state of the board: the page, or the selected
 * card. Plain links first (they work without JavaScript); the native share
 * sheet and "Copiar link" join them once the page is interactive.
 */
export function ShareBar({
  texts,
  fallback,
  label,
  id,
}: {
  /** Share words per selection id; `fallback` for the whole board. */
  texts: Record<string, ShareEntry>;
  fallback: ShareEntry;
  label: string;
  id: string;
}) {
  const [sel] = useSelection();
  const entry = (sel && texts[sel]) || fallback;
  const url = shareUrl('bastidores', sel ? `r=${encodeURIComponent(sel)}` : '');
  const [canShare, setCanShare] = useState(false);
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle');
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  useEffect(() => {
    if (copy === 'idle') return;
    const t = setTimeout(() => setCopy('idle'), 2400);
    return () => clearTimeout(t);
  }, [copy]);

  const text = `${entry.short} ${url}`;
  return (
    <div className={s.share} role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className={s.shareLabel}>
        {label}
      </span>
      <div className={s.shareRow}>
        {canShare && (
          <button
            type="button"
            className={s.shareBtn}
            onClick={() => navigator.share({ title: entry.title, text: entry.short, url }).catch(() => {})}
          >
            <Glyph d="M7 9.5 12 4.5l5 5M12 4.5V15M5 13v6h14v-6" />
            Compartilhar
          </button>
        )}
        <button
          type="button"
          className={s.shareBtn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopy('done');
            } catch {
              setCopy('failed');
            }
          }}
        >
          <Glyph d={copy === 'done' ? 'M5 12.5l4.5 4.5L19 7.5' : 'M9 9h10v10H9zM5 15V5h10'} />
          Copiar link
        </button>
        <a className={s.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a
          className={s.shareBtn}
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          className={s.shareBtn}
          href={`https://x.com/intent/post?text=${encodeURIComponent(entry.short)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </a>
      </div>
      <span className={s.shareStatus} aria-live="polite">
        {copy === 'done' ? 'Link copiado.' : copy === 'failed' ? `Não deu para copiar. O link: ${url}` : ''}
      </span>
    </div>
  );
}

function Glyph({ d }: { d: string }) {
  return (
    <svg className={s.shareGlyph} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}
