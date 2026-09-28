import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ContaDeTokens } from './data';

let cached: ContaDeTokens | undefined;

/** Read once on the server; `scripts/conta-de-tokens.ts` is the only writer. */
export function loadContaDeTokens(): ContaDeTokens {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/conta-de-tokens/data.json'), 'utf8'),
  ) as ContaDeTokens;
  return cached;
}
