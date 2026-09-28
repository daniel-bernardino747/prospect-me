'use client';

import { useEffect, useRef, useState } from 'react';

import { type CardData, type Faces, renderCard } from './card';
import s from './pix.module.css';
import { usePrinting } from './Sala';

/** What the browser can do with a senha: share the image, share the link, or neither. */
type Mode = 'files' | 'link' | 'download';

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

function detect(): Mode {
  if (typeof navigator.share !== 'function') return 'download';
  try {
    const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' });
    return navigator.canShare?.({ files: [probe] }) ? 'files' : 'link';
  } catch {
    return 'link';
  }
}

/**
 * Where the senha leaves the page. The buttons need JavaScript and appear on
 * hydration ("Compartilhar senha" where the browser has a share sheet, "Baixar
 * imagem" where it has none; "Copiar link" always). The WhatsApp, LinkedIn and
 * X links are plain links in the server HTML, so they work without it; their
 * preview is this city's own OG image.
 */
export function ShareRow({ card, url, text }: { card: CardData; url: string; text: string }) {
  const { pending } = usePrinting();
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [slip, setSlip] = useState({ text: '', shown: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setMode(detect()), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const say = (message: string) => {
    clearTimeout(timer.current);
    setSlip({ text: message, shown: true });
    timer.current = setTimeout(() => setSlip((p) => ({ ...p, shown: false })), 1560);
  };

  const image = async () => new File([await renderCard(card, await faces())], card.fileName, { type: 'image/png' });

  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await image();
      const href = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = href;
      a.download = card.fileName;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      say('IMAGEM SALVA');
    } catch {
      say('NÃO DEU PARA GERAR A IMAGEM');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (mode === 'download') return download();
    if (busy) return;
    setBusy(true);
    try {
      const file = mode === 'files' ? await image() : undefined;
      const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
      await navigator.share({ ...(files && { files }), title: card.shareTitle, text: card.shareText, url });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') say('NÃO DEU PARA COMPARTILHAR');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      say('LINK COPIADO');
    } catch {
      window.prompt('Copie o link:', url);
    }
  };

  const via = encodeURIComponent(url);
  const says = encodeURIComponent(text);
  const off = pending || undefined;
  // Mid-print the links still carry the previous city: out of reach until the new one is out.
  const linkOff = off && ({ 'aria-disabled': true, tabIndex: -1 } as const);

  return (
    <div className={s.share} data-share="" data-printing={off ? '' : undefined} aria-busy={off}>
      <div className={s.shareRow} data-share-row="" data-ready={mode ? '' : undefined}>
        <button
          type="button"
          className={s.shareButton}
          onClick={share}
          aria-busy={busy || undefined}
          aria-disabled={off}
          disabled={!mode || pending}
        >
          {busy ? 'Imprimindo…' : mode === 'download' ? 'Baixar imagem' : 'Compartilhar senha'}
        </button>
        <button type="button" className={s.linkButton} onClick={copy} disabled={!mode || pending}>
          Copiar link
        </button>
        <p className={s.printedSlip} role="status" aria-live="polite" data-shown={slip.shown ? '' : undefined}>
          {slip.text}
        </p>
      </div>
      <p className={s.sendVia}>
        <span className={s.sendLabel}>Enviar por</span>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" {...linkOff}>
          WhatsApp
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${via}`} target="_blank" rel="noreferrer" {...linkOff}>
          LinkedIn
        </a>
        <a href={`https://x.com/intent/post?text=${says}&url=${via}`} target="_blank" rel="noreferrer" {...linkOff}>
          X
        </a>
        {mode && mode !== 'download' && (
          <button type="button" className={s.sendButton} onClick={download} disabled={pending}>
            Baixar imagem
          </button>
        )}
      </p>
    </div>
  );
}
