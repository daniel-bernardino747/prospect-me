import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type CurtailmentData, dataProblems } from './data';

let cached: CurtailmentData | undefined;

/**
 * Read once on the server; the browser receives only the chosen day (see
 * `boardDay`). A malformed file fails loudly here, which fails the build's
 * prerender and the Vitest check, never a visitor's request.
 */
export function loadCurtailment(): CurtailmentData {
  if (cached) return cached;
  const data = JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/curtailment-br/data.json'), 'utf8'),
  ) as CurtailmentData;
  const problems = dataProblems(data);
  if (problems.length) throw new Error(`curtailment-br/data.json:\n${problems.join('\n')}`);
  cached = data;
  return data;
}
