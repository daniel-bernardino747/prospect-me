'use client';

/**
 * The screening demo as a short silent loop, right under the role on every
 * screen: it plays on its own, muted, and a visible key pauses it (WCAG 2.2.2),
 * so a reader who wants it still is one tap away rather than left with a
 * poster they never asked for.
 */
import { useRef, useState } from 'react';

import s from './techifide.module.css';

const MEDIA = '/techifide/media';

export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <figure className={s.hero}>
      <div className={s.heroFrame}>
        <video
          ref={video}
          className={s.heroVideo}
          width={1080}
          height={1350}
          poster={`${MEDIA}/cv-screen-poster.jpg`}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          aria-label="A synthetic CV dropping into the call sheet: eleven must-haves tied to the CV lines that show them, WebAssembly left to ask, then the interview questions."
        >
          <source src={`${MEDIA}/cv-screen.webm`} type="video/webm" />
          <source src={`${MEDIA}/cv-screen.mp4`} type="video/mp4" />
        </video>
        <button type="button" className={s.heroToggle} onClick={toggle} aria-pressed={paused}>
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
      <figcaption>
        A synthetic CV screened against this brief, every line checked word for word.{' '}
        <a href="#candidate">See it below</a>
      </figcaption>
    </figure>
  );
}
