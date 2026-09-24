import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Dossier, dossierSchema } from './schema.ts';

/** Gitignored: dossiers hold third-party contact details (ADR-0001). */
export const DOSSIER_DIR = fileURLToPath(new URL('../../dossiers', import.meta.url));

export const dossierPath = (slug: string) => join(DOSSIER_DIR, `${slug}.json`);
export const renderedPath = (slug: string) => join(DOSSIER_DIR, `${slug}.md`);

export function readRaw(slug: string): unknown {
  return JSON.parse(readFileSync(dossierPath(slug), 'utf8'));
}

export function readDossier(slug: string): Dossier {
  return dossierSchema.parse(readRaw(slug));
}

export function writeDossier(dossier: Dossier): void {
  writeFileSync(dossierPath(dossier.slug), `${JSON.stringify(dossier, null, 2)}\n`);
}
