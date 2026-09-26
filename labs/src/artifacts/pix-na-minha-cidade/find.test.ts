import { describe, expect, it } from 'vitest';

import { type Entry, fold, resolveQuery, search, suggestions } from './find';

const INDEX: Entry[] = [
  [3550308, 'São Paulo', 'SP'],
  [3304557, 'Rio de Janeiro', 'RJ'],
  [3548708, 'São Bernardo do Campo', 'SP'],
  [3549904, 'São José dos Campos', 'SP'],
  [2211001, 'Teresina', 'PI'],
  [2201903, 'Bom Jesus', 'PI'],
  [4302402, 'Bom Jesus', 'RS'],
  [4202453, 'Bom Jesus', 'SC'],
  [3106200, 'Belo Horizonte', 'MG'],
  [3509502, 'Campinas', 'SP'],
  [5300108, 'Brasília', 'DF'],
  [3550704, 'São Sebastião', 'SP'],
  [3530607, 'Mogi das Cruzes', 'SP'],
  [4205407, 'Florianópolis', 'SC'],
  [1400704, 'Pacaraima', 'RR'],
];
const CAPITALS = new Set([3550308, 3304557, 2211001, 3106200, 5300108, 4205407]);

describe('fold', () => {
  it('ignores accents, case and punctuation', () => {
    expect(fold('  SÃO  Paulo - SP ')).toBe('sao paulo sp');
    expect(fold('Florianópolis')).toBe('florianopolis');
  });
});

describe('search', () => {
  it('matches without accents, biggest city first', () => {
    expect(search(INDEX, 'sao')[0][1]).toBe('São Paulo');
    expect(search(INDEX, 'sao paulo').map((e) => e[1])).toEqual(['São Paulo']);
  });

  it('puts name prefixes before word starts before substrings', () => {
    expect(search(INDEX, 'campo').map((e) => e[1])).toEqual([
      'São Bernardo do Campo',
      'São José dos Campos',
    ]);
    expect(search(INDEX, 'camp').map((e) => e[1])).toEqual(['Campinas', 'São Bernardo do Campo', 'São José dos Campos']);
  });

  it('lists a state for a bare UF, capital first', () => {
    const sc = search(INDEX, 'SC', CAPITALS);
    expect(sc.map((e) => e[1])).toEqual(['Florianópolis', 'Bom Jesus']);
    expect(search(INDEX, 'sp', CAPITALS)[0][1]).toBe('São Paulo');
  });

  it('narrows homonyms by a trailing UF', () => {
    expect(search(INDEX, 'bom jesus rs')).toEqual([[4302402, 'Bom Jesus', 'RS']]);
    expect(search(INDEX, 'Bom Jesus - SC')).toEqual([[4202453, 'Bom Jesus', 'SC']]);
  });

  it('caps the list at seven', () => {
    const many = Array.from({ length: 20 }, (_, i): Entry => [i, `Santa ${i}`, 'SP']);
    expect(search(many, 'santa')).toHaveLength(7);
  });

  it('returns nothing for an empty query', () => {
    expect(search(INDEX, '   ')).toEqual([]);
  });
});

describe('resolveQuery (the no-JS form)', () => {
  it('shows the one município an exact name names', () => {
    expect(resolveQuery(INDEX, 'teresina')).toEqual({ kind: 'one', entry: [2211001, 'Teresina', 'PI'] });
  });

  it('prefers the exact name over longer names that start with it', () => {
    expect(resolveQuery(INDEX, 'São Paulo')).toMatchObject({ kind: 'one', entry: [3550308, 'São Paulo', 'SP'] });
  });

  it('lists homonyms instead of picking one', () => {
    const r = resolveQuery(INDEX, 'bom jesus');
    expect(r.kind).toBe('many');
    expect(r.kind === 'many' && r.entries.map((e) => e[2])).toEqual(['PI', 'RS', 'SC']);
  });

  it('picks the homonym the UF names', () => {
    expect(resolveQuery(INDEX, 'bom jesus pi')).toMatchObject({ kind: 'one', entry: [2201903, 'Bom Jesus', 'PI'] });
  });

  it('lists partial matches', () => {
    expect(resolveQuery(INDEX, 'sao').kind).toBe('many');
  });

  it('suggests names by the longest shared prefix when nothing matches', () => {
    const r = resolveQuery(INDEX, 'Sao Pablo');
    expect(r).toMatchObject({ kind: 'none' });
    expect(r.kind === 'none' && r.suggestions.map((e) => e[1])).toEqual(['São Paulo']);
    expect(suggestions(INDEX, 'Sãx').map((e) => e[1])).toEqual([
      'São Paulo',
      'São Bernardo do Campo',
      'São José dos Campos',
    ]);
  });
});
