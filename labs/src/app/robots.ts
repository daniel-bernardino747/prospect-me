import type { MetadataRoute } from 'next';

import { ORIGIN } from './sitemap';

/** Crawlers may read `/demo/` and nothing else (ADR-0002). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/demo/', disallow: '/' },
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
