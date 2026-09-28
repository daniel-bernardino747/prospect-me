import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Bastidores } from './data';

let cached: Bastidores | undefined;

/** Read once on the server (about 60 KB). After re-running the extraction, restart the server. */
export function loadBastidores(): Bastidores {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/bastidores/data.json'), 'utf8'),
  ) as Bastidores;
  return cached;
}
