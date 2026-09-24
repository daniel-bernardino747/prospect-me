import { describe, expect, it } from 'vitest';

import { type RecheckDeps, runRecheck } from './recheck.ts';

function deps(overrides: Partial<RecheckDeps>): RecheckDeps {
  const unused = () => Promise.reject(new Error('not expected in this test'));
  return { http: unused, dns: unused, gh: unused, ...overrides };
}

describe('runRecheck', () => {
  it('holds while a broken page is still broken', async () => {
    const result = await runRecheck(
      { kind: 'http', url: 'https://acme.com.br/contato', expect: { status: 500 } },
      deps({ http: async () => ({ status: 500, body: '' }) }),
    );
    expect(result.held).toBe(true);
  });

  it('fails once the page is fixed', async () => {
    const result = await runRecheck(
      { kind: 'http', url: 'https://acme.com.br/contato', expect: { status: 500 } },
      deps({ http: async () => ({ status: 200, body: 'ok' }) }),
    );
    expect(result).toEqual({ held: false, observed: 'status 200, expected 500' });
  });

  it('checks absence and presence of text', async () => {
    const http = async () => ({ status: 200, body: 'peça seu orçamento' });
    expect(
      (await runRecheck({ kind: 'http', url: 'https://x.test', expect: { absent: 'orçamento' } }, deps({ http }))).held,
    ).toBe(false);
    expect(
      (await runRecheck({ kind: 'http', url: 'https://x.test', expect: { contains: 'orçamento' } }, deps({ http }))).held,
    ).toBe(true);
  });

  it('reads DNS absence as a value, not an error', async () => {
    const result = await runRecheck(
      { kind: 'dns', name: 'acme.com.br', type: 'MX', expect: 'absent' },
      deps({ dns: async () => [] }),
    );
    expect(result.held).toBe(true);
  });

  it('compares gh output', async () => {
    const result = await runRecheck(
      { kind: 'gh', endpoint: 'repos/acme/challenge/contents', jq: '.[].name', expect: { contains: 'senior.md' } },
      deps({ gh: async () => 'README.md\njunior.md' }),
    );
    expect(result.held).toBe(false);
  });

  it('treats a check that cannot run as not held', async () => {
    const result = await runRecheck(
      { kind: 'http', url: 'https://acme.com.br', expect: { status: 200 } },
      deps({ http: () => Promise.reject(new Error('timeout')) }),
    );
    expect(result).toEqual({ held: false, observed: 'could not run: timeout' });
  });
});
