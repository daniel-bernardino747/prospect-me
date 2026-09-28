'use client';

/**
 * The screening demo as a short silent loop. On a wide screen it sits in the
 * fixed legend column; on a phone it opens the candidate section, so the first
 * screen keeps the call's questions. Rendered in one place only, so the file
 * is fetched once, and never autoplayed for a reader who asked for less motion.
 */
import { useEffect, useState } from 'react';

import s from './techifide.module.css';

const WIDE = '(min-width: 64rem)';
const MEDIA = '/techifide/media';

export function HeroVideo({ where }: { where: 'column' | 'section' }) {
  const [show, setShow] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setShow(wide.matches === (where === 'column'));
      setStill(calm.matches);
    };
    update();
    wide.addEventListener('change', update);
    calm.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      calm.removeEventListener('change', update);
    };
  }, [where]);

  if (!show) return null;
  return (
    <figure className={where === 'column' ? s.heroColumn : s.heroSection}>
      <video
        className={s.heroVideo}
        width={1080}
        height={1350}
        poster={`${MEDIA}/cv-screen-poster.jpg`}
        muted
        playsInline
        loop={!still}
        autoPlay={!still}
        controls={still}
        preload={still ? 'none' : 'auto'}
        aria-label="A synthetic CV dropping into the call sheet: eleven must-haves tied to the CV lines that show them, WebAssembly left to ask, then the interview questions."
      >
        <source src={`${MEDIA}/cv-screen.webm`} type="video/webm" />
        <source src={`${MEDIA}/cv-screen.mp4`} type="video/mp4" />
      </video>
      <figcaption>
        A synthetic CV screened against this brief, every line checked word for word.{' '}
        {where === 'column' && <a href="#candidate">See it below</a>}
      </figcaption>
    </figure>
  );
}
