import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BotData } from './data';

let cached: BotData | undefined;

/** Read once on the server; `scripts/bot-whatsapp-ia-vs-jev.ts` is the only writer. */
export function loadBotData(): BotData {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'src/artifacts/bot-whatsapp-ia-vs-jev/data.json'), 'utf8'),
  ) as BotData;
  return cached;
}
