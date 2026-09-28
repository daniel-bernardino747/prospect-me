import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TechifideData } from './data';
import { OVERRIDES } from './overrides';
import { applyOverrides } from './view';

let cached: TechifideData | undefined;

/**
 * Read on the server, never put in `public/`, where it would outlive the
 * artifact's expiry. Daniel's overrides are applied here, so they hold across a
 * regenerated `data.json`. Read once: restart `labs dev` after regenerating.
 */
export function loadTechifide(): TechifideData {
  if (!cached) {
    const data = JSON.parse(
      readFileSync(join(process.cwd(), 'src/artifacts/techifide/data.json'), 'utf8'),
    ) as TechifideData;
    for (const key of Object.keys(data.ads) as (keyof TechifideData['ads'])[]) {
      data.ads[key] = applyOverrides(data.ads[key], OVERRIDES);
    }
    cached = data;
  }
  return cached;
}
