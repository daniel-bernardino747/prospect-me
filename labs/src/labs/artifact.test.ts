import { describe, expect, it } from 'vitest';

import { ARTIFACTS } from '@/artifacts';

import { type Artifact, registryProblems, resolveArtifact } from './artifact';

const artifact = (over: Partial<Artifact> = {}): Artifact => ({
  slug: 'acme-thing',
  company: 'Acme',
  title: 'Thing',
  expiresAt: '2026-11-23T23:59:00-03:00',
  load: async () => ({ default: () => null }),
  ...over,
});

describe('resolveArtifact', () => {
  const registry = [artifact()];

  it('does not know a slug that is not registered', () => {
    expect(resolveArtifact('other', new Date('2026-10-01T00:00:00Z'), registry)).toEqual({ kind: 'unknown' });
  });

  it('serves an artifact before it expires', () => {
    expect(resolveArtifact('acme-thing', new Date('2026-11-24T02:58:00Z'), registry).kind).toBe('live');
  });

  it('ends an artifact from its expiry on, honouring the offset', () => {
    expect(resolveArtifact('acme-thing', new Date('2026-11-24T02:59:00Z'), registry).kind).toBe('ended');
    expect(resolveArtifact('acme-thing', new Date('2027-01-01T00:00:00Z'), registry).kind).toBe('ended');
  });
});

describe('registryProblems', () => {
  it('accepts a well-formed registry', () => {
    expect(registryProblems([artifact(), artifact({ slug: 'acme-other' })])).toEqual([]);
  });

  it('refuses duplicate slugs, bad slugs and expiries without an offset', () => {
    expect(registryProblems([artifact(), artifact()])).toHaveLength(1);
    expect(registryProblems([artifact({ slug: 'Acme Thing' })])).toHaveLength(1);
    expect(registryProblems([artifact({ expiresAt: '2026-11-23' })])).toHaveLength(1);
    expect(registryProblems([artifact({ expiresAt: 'soon-03:00' })])).toHaveLength(1);
  });

  it('holds for the registry Labs actually serves', () => {
    expect(registryProblems(ARTIFACTS)).toEqual([]);
  });
});
