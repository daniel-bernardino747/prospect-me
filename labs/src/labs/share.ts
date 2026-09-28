import type { ImageResponse } from 'next/og';

import { ORIGIN } from './origin';

type Search = Record<string, string | string[] | undefined>;

/** Title and description of one shared state, e.g. a city on the Pix showcase. */
export interface ShareText {
  title: string;
  description: string;
}

/**
 * What a showcase shows when its link is shared (ADR-0002). Each showcase owns
 * its `share.tsx`, drawn in the page's own style; the route and the metadata are
 * shared, so every showcase gets the same OG and link behaviour.
 */
export interface ShareModule {
  /** Query keys that change what a shared link shows. Anything else is dropped from the OG. */
  keys: readonly string[];
  /** The state's own title and description, or undefined to keep the showcase's. */
  describe?: (search: Search) => ShareText | undefined;
  /** The 1200×630 image for the state. */
  image: (search: Search) => ImageResponse | Promise<ImageResponse>;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** The part of a query that defines a shared state, in a stable order, one value per key. */
export function shareQuery(keys: readonly string[], search: Search): string {
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = search[key];
    const one = Array.isArray(value) ? value[0] : value;
    if (one) query.set(key, one);
  }
  return query.toString();
}

/** The absolute link to a showcase in a given state. */
export function shareUrl(slug: string, query: string): string {
  return `${ORIGIN}/demo/${slug}${query ? `?${query}` : ''}`;
}
