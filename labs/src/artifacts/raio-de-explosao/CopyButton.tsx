'use client';

import { useState } from 'react';

import s from './raio.module.css';

/** Copies a command; says so in words, and says so when the browser refuses. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  return (
    <button
      type="button"
      className={s.copy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState('done');
        } catch {
          setState('failed');
        }
        setTimeout(() => setState('idle'), 1800);
      }}
    >
      <span aria-live="polite">{state === 'done' ? 'Copiado' : state === 'failed' ? 'Selecione e copie' : 'Copiar'}</span>
    </button>
  );
}
