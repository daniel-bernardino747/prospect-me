import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Artifacts read their data from disk on the server (see each `load.ts`).
  outputFileTracingIncludes: {
    '/[slug]': ['./src/artifacts/**/data.json'],
    '/demo/[slug]': ['./src/artifacts/**/data.json'],
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
