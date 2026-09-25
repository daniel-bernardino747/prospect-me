import { describe, expect, it } from 'vitest';

import { search } from './Finder';

const options = [
  { id: 1, name: 'Luís Eduardo Magalhães', uf: 'BA' },
  { id: 2, name: 'Rio Verde', uf: 'GO' },
  { id: 3, name: 'Lucas do Rio Verde', uf: 'MT' },
  { id: 4, name: 'Sorriso', uf: 'MT' },
];

describe('praça search', () => {
  it('ignores accents and case', () => {
    expect(search(options, 'luis ed').map((o) => o.id)).toEqual([1]);
  });

  it('puts names that start with the query before names that contain it', () => {
    expect(search(options, 'rio verde').map((o) => o.id)).toEqual([2, 3]);
  });

  it('returns nothing for an empty query', () => {
    expect(search(options, '  ')).toEqual([]);
  });
});
