import { describe, expect, it } from 'vitest';

import { shareQuery, shareUrl } from './share';

describe('shareQuery', () => {
  it('keeps only the keys that change what a shared link shows, in a stable order', () => {
    expect(shareQuery(['c', 'caso'], { caso: 'got', utm_source: 'x', c: '3550308' })).toBe('c=3550308&caso=got');
  });

  it('drops empty and repeated values, so a link has one state', () => {
    expect(shareQuery(['c', 't'], { c: '', t: ['1', '2'] })).toBe('t=1');
  });

  it('is empty when the page has no shared state', () => {
    expect(shareQuery([], { c: '1' })).toBe('');
  });
});

describe('shareUrl', () => {
  it('builds the absolute link to a showcase, with its state', () => {
    expect(shareUrl('pix-na-minha-cidade', 'c=3550308')).toBe(
      'https://labs.teamdbsolutions.com/demo/pix-na-minha-cidade?c=3550308',
    );
    expect(shareUrl('raio-de-explosao', '')).toBe('https://labs.teamdbsolutions.com/demo/raio-de-explosao');
  });
});
