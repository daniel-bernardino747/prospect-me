/** Pieces the server page and the call sheet share. No state here. */
import type { ReactNode } from 'react';

import type { AdView } from './data';
import s from './techifide.module.css';
import { laneLabel, laneOf } from './view';

export { fieldName } from './view';

/** A tie from a claim to the ad. Its stroke carries the state; the plate beside it says it in words. */
export function Rail({ state }: { state: 'quoted' | 'open' | 'confirm' }) {
  return (
    <span className={s.rail} data-state={state} aria-hidden="true">
      {state === 'confirm' && <span className={s.tick} />}
    </span>
  );
}

/** The ad's own words in a hairline frame, with the lane they sit on. */
export function Quote({ ad, quote }: { ad: AdView; quote: string }) {
  const lane = laneOf(quote, ad);
  return (
    <blockquote className={s.quote}>
      <p>{quote}</p>
      <footer>{lane !== undefined ? <a href={`#l${lane}`}>Lane {laneLabel(lane)}</a> : 'From the ad'}</footer>
    </blockquote>
  );
}

/** A claim with its quote one tap away, and the lane it came from. */
export function Quoted({ ad, label, quote, children }: { ad: AdView; label: string; quote: string; children?: ReactNode }) {
  const lane = laneOf(quote, ad);
  return (
    <details className={s.claim}>
      <summary>
        <span className={s.claimLabel}>{label}</span>
        <Rail state="quoted" />
        {lane !== undefined && <span className={s.plate}>{laneLabel(lane)}</span>}
      </summary>
      <div className={s.claimBody}>
        {children}
        <Quote ad={ad} quote={quote} />
      </div>
    </details>
  );
}

/** Where the listing's metadata puts the role, outside the ad's text. */
export function listingWhere(ad: AdView): string | null {
  const { remote, applicantCountry, location } = ad.listing;
  return remote ? `remote, ${applicantCountry ?? location ?? 'location not stated'}` : location;
}
