import { describe, expect, it } from 'vitest';

import { channelLink } from './render.ts';

describe('channelLink', () => {
  it('opens a profile', () => {
    const ch = { kind: 'linkedin' as const, value: 'https://www.linkedin.com/in/someone/', findingId: 'f' };
    expect(channelLink(ch)).toBe('[https://www.linkedin.com/in/someone/](https://www.linkedin.com/in/someone/)');
  });

  it('opens the mail client with the approach in it, keeping the note', () => {
    const ch = { kind: 'email' as const, value: 'contato@example.com (caixa institucional)', findingId: 'f' };
    expect(channelLink(ch, { subject: 'Olá, tudo?', body: 'a & b' })).toBe(
      '[contato@example.com](mailto:contato@example.com?subject=Ol%C3%A1%2C%20tudo%3F&body=a%20%26%20b) (caixa institucional)',
    );
  });

  it('leaves a value it cannot link as text', () => {
    expect(channelLink({ kind: 'other', value: 'pessoalmente no evento', findingId: 'f' })).toBe('pessoalmente no evento');
  });
});
