import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RaioData } from './data';

let cached: RaioData | undefined;

/** Read once on the server; the page hands it whole to the chart (about 10 KB). */
export function loadRaio(): RaioData {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/raio-de-explosao/data.json'), 'utf8'),
  ) as RaioData;
  return cached;
}
