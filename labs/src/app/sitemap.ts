import type { MetadataRoute } from 'next';

import { ARTIFACTS } from '@/artifacts';

export const ORIGIN = 'https://labs.teamdbsolutions.com';

/** Only showcases: a prospect is never listed, since that would tie it to a search (ADR-0001). */
export default function sitemap(): MetadataRoute.Sitemap {
  return ARTIFACTS.filter((a) => a.kind === 'showcase').map((a) => ({ url: `${ORIGIN}/demo/${a.slug}` }));
}
