import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { FilaDaSafra } from './data';

let cached: FilaDaSafra | undefined;

/**
 * Read on the server, never shipped whole to the browser and never put in
 * `public/`, where it would outlive the artifact's expiry. Read rather than
 * imported so the compiler does not type a multi-megabyte literal.
 */
export function loadFilaDaSafra(): FilaDaSafra {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/tarken-fila-da-safra/data.json'), 'utf8'),
  ) as FilaDaSafra;
  return cached;
}
