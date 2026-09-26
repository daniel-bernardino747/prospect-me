'use client';

import { useState } from 'react';

import s from './curtailment.module.css';

/** `?dia=` asked for a day outside the snapshot: say so, show the default, let it be dismissed. */
export function NotFoundPlate({ date }: { date: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <p className={s.notFound} role="status">
      <span>DIA NÃO ENCONTRADO · MOSTRANDO {date}</span>
      <button type="button" className={s.notFoundClose} onClick={() => setOpen(false)} aria-label="Fechar aviso">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>
    </p>
  );
}
