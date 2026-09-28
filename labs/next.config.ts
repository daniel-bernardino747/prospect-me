import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Artifacts read their data from disk on the server (see each `load.ts`).
  outputFileTracingIncludes: {
    '/[slug]': ['./src/artifacts/**/data.json'],
    '/demo/[slug]': ['./src/artifacts/**/data.json'],
    // A showcase's OG image may read its data and the fonts beside its `share.tsx`.
    '/demo/[slug]/og': ['./src/artifacts/**/data.json', './src/artifacts/**/fonts/*'],
  },
  // Nothing here surfaces in a search for the company's name (ADR-0001). The
  // header covers every response, including JSON and assets the meta tag cannot;
  // only showcases under `/demo/`, `robots.txt` and the sitemap are left out (ADR-0002).
  async headers() {
    return [
      {
        source: '/((?!demo/|robots\\.txt$|sitemap\\.xml$).*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default config;
