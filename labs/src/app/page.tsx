/*
 * Direction contract (impeccable, seed 69cecd64)
 * THESIS: Labs is a departure hall; each showcase is a departure on a split-flap
 *   board, with its data source and period. Refuses the grid of project cards.
 * OWN-WORLD: black flap board in a dark housing, off-white flap glyphs, signal
 *   yellow (#f2c230) for the hall's signage, Overpass (highway-signage lineage).
 * STORY: the visitor sees five working demos at once, what data each runs on and
 *   when, picks one to board, or takes the yellow exit to the portfolio.
 * FIRST VIEWPORT: "Labs" in yellow signage type with a live Brasília clock at
 *   right; one honest line on what the demos are; the board rows below, titles
 *   as flaps. The portfolio band follows the last departure.
 * FORM: departure board, 4th of seven grounded candidates, seed key 69cecd64.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, and DESIGN.md
 */
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';

import { ARTIFACTS } from '@/artifacts';
import { listShowcases } from '@/labs/artifact';
import s from '@/labs/home/board.module.css';
import { Clock } from '@/labs/home/Clock';
import { Flaps } from '@/labs/home/Flaps';
import { Settle } from '@/labs/home/Settle';

const SITE = 'https://www.teamdbsolutions.com';

const signage = localFont({
  src: [
    { path: '../labs/fonts/overpass-latin-400-normal.woff', weight: '400' },
    { path: '../labs/fonts/overpass-latin-700-normal.woff', weight: '700' },
    { path: '../labs/fonts/overpass-latin-900-normal.woff', weight: '900' },
  ],
  variable: '--font-signage',
});

const flap = localFont({
  src: '../labs/fonts/overpass-mono-latin-700-normal.woff',
  weight: '700',
  variable: '--font-flap',
});

export const metadata: Metadata = {
  title: 'Labs · Daniel Bernardino',
  description: 'Demos conceituais de Daniel Bernardino, feitas com dados públicos.',
};

/**
 * Lists the showcases and points to the portfolio. Prospects are never listed:
 * that would tie companies to each other and to a search (ADR-0001, ADR-0002).
 */
export default function Home() {
  const showcases = listShowcases(ARTIFACTS);
  return (
    <div className={`${s.hall} ${signage.variable} ${flap.variable}`}>
      <main className={s.main}>
        <header className={s.header}>
          <h1 className={s.title}>Labs</h1>
          <Clock />
          <p className={s.lede}>
            Demos conceituais de Daniel Bernardino. Cada uma responde a uma pergunta com dados públicos e cita as fontes.
            Nenhuma é produto de empresa.
          </p>
        </header>

        <Settle className={s.board}>
          <div className={s.columns} aria-hidden="true">
            <span>Demo</span>
            <span>Fonte</span>
            <span>Dados de</span>
          </div>
          <ol className={s.rows}>
            {showcases.map((d) => (
              <li key={d.slug} data-row="">
                <Link href={`/demo/${d.slug}`} className={s.row}>
                  <span className={s.name}>
                    <Flaps text={d.title} size="lg" />
                  </span>
                  <span className={s.source}>
                    <span className={s.fieldLabel}>Fonte</span>
                    {d.provenance.source}
                  </span>
                  <span className={s.period}>
                    <span className={s.fieldLabel}>Dados de</span>
                    <Flaps text={d.provenance.period} size="md" />
                  </span>
                  <span className={s.summary}>{d.summary}</span>
                  <span className={s.status} aria-hidden="true">
                    Embarque
                    <svg viewBox="0 0 20 12" width="20" height="12">
                      <path d="M0 6h17M12 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Settle>
      </main>

      <a href={SITE} className={s.exit}>
        <span className={s.exitSign}>
          <svg viewBox="0 0 48 32" aria-hidden="true">
            <path d="M2 16h40M30 4l12 12-12 12" fill="none" stroke="currentColor" strokeWidth="5" />
          </svg>
          <span>
            <span className={s.exitHost}>teamdbsolutions.com</span>
            <span className={s.exitLabel}>Portfólio, experiência e contato de Daniel Bernardino</span>
          </span>
        </span>
      </a>
    </div>
  );
}
