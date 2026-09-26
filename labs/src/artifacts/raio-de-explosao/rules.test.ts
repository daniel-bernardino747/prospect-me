import { describe, expect, it } from 'vitest';

import { acceptedVersions, parseIocCsv, resolveAt, shadowingVersion } from './rules';

describe('acceptedVersions: the range is the gate', () => {
  it('lets the ChainDrop versions through the stylelint and got ranges', () => {
    expect(acceptedVersions('^11.1.5', ['11.1.6'])).toEqual(['11.1.6']);
    expect(acceptedVersions('^6.1.23', ['6.1.24'])).toEqual(['6.1.24']);
    expect(acceptedVersions('^2.5.0', ['2.5.1'])).toEqual(['2.5.1']);
    expect(acceptedVersions('^13.0.18', ['13.0.20'])).toEqual(['13.0.20']);
  });

  it('bars keyv 6.0.0 behind a caret on 5.x: a major is never accepted', () => {
    expect(acceptedVersions('^5.6.0', ['6.0.0'])).toEqual([]);
    expect(acceptedVersions('^4.5.4', ['6.0.0'])).toEqual([]);
  });

  it('bars the eslint 10.8.0 chain, whose ranges sit on older majors', () => {
    expect(acceptedVersions('^8.0.0', ['11.1.6'])).toEqual([]);
    expect(acceptedVersions('^4.0.0', ['6.1.24'])).toEqual([]);
  });

  it('honours the range eslint 10.10.0 wrote to skip the infected version', () => {
    expect(acceptedVersions('11.1.5 || >11.1.6 <12', ['11.1.6'])).toEqual([]);
    expect(acceptedVersions('11.1.5 || >11.1.6 <12', ['11.1.7'])).toEqual(['11.1.7']);
  });

  it('keeps tilde and exact pins shut against a patch outside them', () => {
    expect(acceptedVersions('~11.1.5', ['11.1.6'])).toEqual(['11.1.6']);
    expect(acceptedVersions('11.1.5', ['11.1.6'])).toEqual([]);
  });

  it('accepts nothing through a spec that is not a range', () => {
    expect(acceptedVersions('npm:other@^1.0.0', ['1.0.1'])).toEqual([]);
    expect(acceptedVersions('github:user/repo', ['1.0.0'])).toEqual([]);
  });

  it('does not let a prerelease through a plain caret', () => {
    expect(acceptedVersions('^5.6.0', ['5.7.0-rc.1'])).toEqual([]);
  });
});

describe('resolveAt', () => {
  const versions = [
    { version: '17.14.0', publishedAt: '2026-07-01T00:00:00Z' },
    { version: '17.14.1', publishedAt: '2026-07-20T01:00:57Z' },
    { version: '17.15.0-beta.1', publishedAt: '2026-07-30T00:00:00Z' },
    { version: '17.15.0', publishedAt: '2026-09-04T00:00:00Z' },
  ];

  it('picks the newest stable version already published at the instant', () => {
    expect(resolveAt(versions, '2026-08-04T10:15:00Z')).toBe('17.14.1');
    expect(resolveAt(versions, '2026-09-05T00:00:00Z')).toBe('17.15.0');
    expect(resolveAt(versions, '2026-06-01T00:00:00Z')).toBeNull();
  });
});

describe('shadowingVersion', () => {
  const bad = { version: '2.5.1', publishedAt: '2026-08-04T10:10:44Z' };

  it('finds a newer clean version the range would have picked instead', () => {
    const all = [bad, { version: '2.6.0', publishedAt: '2026-07-01T00:00:00Z' }];
    expect(shadowingVersion('^2.5.0', bad, all)).toBe('2.6.0');
  });

  it('ignores versions published later or outside the range', () => {
    const all = [
      bad,
      { version: '2.5.2', publishedAt: '2026-08-05T00:00:00Z' },
      { version: '3.0.0', publishedAt: '2026-07-01T00:00:00Z' },
    ];
    expect(shadowingVersion('^2.5.0', bad, all)).toBeNull();
  });
});

describe('parseIocCsv', () => {
  it('reads the Datadog layout, versions split by " | "', () => {
    const csv = 'ecosystem,package,versions\r\nnpm,keyv,6.0.0\nnpm,@arv-bedrock/auth,1.1.7 | 1.1.8\npypi,x,1\n\n';
    const out = parseIocCsv(csv);
    expect(out.get('keyv')).toEqual(['6.0.0']);
    expect(out.get('@arv-bedrock/auth')).toEqual(['1.1.7', '1.1.8']);
    expect(out.has('x')).toBe(false);
  });
});
