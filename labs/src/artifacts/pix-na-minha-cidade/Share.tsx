'use client';

import { useEffect, useRef, useState } from 'react';

import { type CardData, type Faces, renderCard } from './card';
import s from './pix.module.css';

type Mode = 'share' | 'download';

/** The real family names behind next/font's variables, loaded before drawing. */
async function faces(): Promise<Faces> {
  const root = document.querySelector('[data-sala]') ?? document.body;
  const style = getComputedStyle(root);
  const print = style.getPropertyValue('--font-print').trim() || 'sans-serif';
  const thermal = style.getPropertyValue('--font-thermal').trim() || 'monospace';
  await Promise.all([
    document.fonts.load(`900 100px ${print}`),
    document.fonts.load(`500 28px ${print}`),
    document.fonts.load(`800 42px ${print}`),
    document.fonts.load(`400 20px ${thermal}`),
    document.fonts.load(`700 20px ${thermal}`),
  ]);
  return { print, thermal };
}

function canShareFiles(): boolean {
  try {
    const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' });
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * "Compartilhar senha" and "Copiar link". Hidden until hydration (no dead
 * button without JavaScript: the link is printed as text instead, in <noscript>).
 */
export function Share({ card, query }: { card: CardData; query: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [slip, setSlip] = useState({ text: '', shown: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setMode(canShareFiles() ? 'share' : 'download'), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const say = (text: string) => {
    clearTimeout(timer.current);
    setSlip({ text, shown: true });
    timer.current = setTimeout(() => setSlip((p) => ({ ...p, shown: false })), 1560);
  };

  const link = () => `${window.location.origin}${window.location.pathname}?${query}`;

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await renderCard(card, await faces());
      const file = new File([blob], card.fileName, { type: 'image/png' });
      if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: card.shareTitle, text: card.shareText, url: link() });
        } catch (e) {
          if ((e as Error).name !== 'AbortError') throw e;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = card.fileName;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        say('IMAGEM SALVA');
      }
    } catch {
      say('NÃO DEU PARA GERAR A IMAGEM');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      say('LINK COPIADO');
    } catch {
      window.prompt('Copie o link:', link());
    }
  };

  return (
    <div className={s.shareRow} data-share-row="" data-ready={mode ? '' : undefined}>
      <button type="button" className={s.shareButton} onClick={share} aria-busy={busy || undefined} disabled={!mode}>
        {busy ? 'Imprimindo…' : mode === 'download' ? 'Baixar imagem' : 'Compartilhar senha'}
      </button>
      <button type="button" className={s.linkButton} onClick={copy} disabled={!mode}>
        Copiar link
      </button>
      <p className={s.printedSlip} role="status" data-shown={slip.shown ? '' : undefined}>
        {slip.text}
      </p>
    </div>
  );
}
