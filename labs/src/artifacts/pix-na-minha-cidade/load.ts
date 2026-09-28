import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { derive, type Pix, type PixData, quantile, queueColumns, type QueueColumn } from './data';
import type { Entry } from './find';

export interface Loaded extends Pix {
  /** [ibge, name, uf], most payers first: what the browser searches. */
  index: Entry[];
  queue: { columns: QueueColumn[]; p99: number };
}

let cached: Loaded | undefined;

/**
 * Read on the server once per process and kept in memory; only the search
 * index and the chosen city's numbers reach the browser. Read rather than
 * imported so the compiler does not type a half-megabyte literal.
 */
export function loadPix(): Loaded {
  if (cached) return cached;
  const data = JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/pix-na-minha-cidade/data.json'), 'utf8'),
  ) as PixData;
  const pix = derive(data);
  const values = pix.cities.map((c) => c.value);
  cached = {
    ...pix,
    index: [...pix.cities].sort((a, b) => b.payers - a.payers).map((c): Entry => [c.ibge, c.name, c.uf]),
    queue: { columns: queueColumns(values), p99: quantile(values, 0.99) },
  };
  return cached;
}
