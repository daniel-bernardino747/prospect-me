import { describe, expect, it } from 'vitest';

import { ARTIFACTS } from '@/artifacts';

import { type Prospect, prospectTitle, registryProblems, resolveProspect, resolveShowcase, type Showcase } from './artifact';

const prospect = (over: Partial<Prospect> = {}): Prospect => ({
  kind: 'prospect',
  slug: 'acme-thing',
  company: 'Acme',
  title: 'Thing',
  expiresAt: '2026-11-23T23:59:00-03:00',
  locale: 'pt-BR',
  load: async () => ({ default: () => null }),
  ...over,
});

const showcase = (over: Partial<Showcase> = {}): Showcase => ({
  kind: 'showcase',
  slug: 'demo-thing',
  title: 'Demo',
  summary: 'What the demo does.',
  load: async () => ({ default: () => null }),
  ...over,
});

describe('resolveProspect', () => {
  const registry = [prospect(), showcase()];

  it('does not know a slug that is not registered', () => {
    expect(resolveProspect('other', new Date('2026-10-01T00:00:00Z'), registry)).toEqual({ kind: 'unknown' });
  });

  it('serves an artifact before it expires', () => {
    expect(resolveProspect('acme-thing', new Date('2026-11-24T02:58:00Z'), registry).kind).toBe('live');
  });

  it('ends an artifact from its expiry on, honouring the offset', () => {
    expect(resolveProspect('acme-thing', new Date('2026-11-24T02:59:00Z'), registry).kind).toBe('ended');
    expect(resolveProspect('acme-thing', new Date('2027-01-01T00:00:00Z'), registry).kind).toBe('ended');
  });

  it('does not serve a showcase at a prospect route', () => {
    expect(resolveProspect('demo-thing', new Date('2026-10-01T00:00:00Z'), registry)).toEqual({ kind: 'unknown' });
  });
});

describe('resolveShowcase', () => {
  const registry = [prospect(), showcase()];

  it('serves a registered showcase, with no end', () => {
    expect(resolveShowcase('demo-thing', registry)?.slug).toBe('demo-thing');
  });

  it('does not serve a prospect at a showcase route, where it would be indexed', () => {
    expect(resolveShowcase('acme-thing', registry)).toBeUndefined();
    expect(resolveShowcase('other', registry)).toBeUndefined();
  });
});

describe('registryProblems', () => {
  it('accepts a well-formed registry', () => {
    expect(registryProblems([prospect(), prospect({ slug: 'acme-other' }), showcase()])).toEqual([]);
  });

  it('refuses duplicate slugs, bad slugs and expiries without an offset', () => {
    expect(registryProblems([prospect(), prospect()])).toHaveLength(1);
    expect(registryProblems([prospect({ slug: 'Acme Thing' })])).toHaveLength(1);
    expect(registryProblems([prospect({ expiresAt: '2026-11-23' })])).toHaveLength(1);
    expect(registryProblems([prospect({ expiresAt: 'soon-03:00' })])).toHaveLength(1);
  });

  it('refuses a slug shared by a prospect and a showcase', () => {
    expect(registryProblems([prospect(), showcase({ slug: 'acme-thing' })])).toHaveLength(1);
  });

  it('refuses a showcase without a summary, which is its search description', () => {
    expect(registryProblems([showcase({ summary: ' ' })])).toHaveLength(1);
  });

  it('refuses a prospect whose locale the chrome does not speak', () => {
    expect(registryProblems([prospect({ locale: 'fr' as Prospect['locale'] })])).toHaveLength(1);
  });

  it('holds for the registry Labs actually serves', () => {
    expect(registryProblems(ARTIFACTS)).toEqual([]);
  });
});

describe('locale', () => {
  it('titles a prospect in the language of its reader', () => {
    expect(prospectTitle(prospect())).toBe('Thing · protótipo independente');
    expect(prospectTitle(prospect({ locale: 'en' }))).toBe('Thing · independent prototype');
  });

  it('keeps the Tarken prospect in Portuguese', () => {
    const tarken = ARTIFACTS.find((a): a is Prospect => a.kind === 'prospect' && a.slug === 'tarken-fila-da-safra');
    expect(tarken?.locale).toBe('pt-BR');
  });
});
