import { writeFileSync } from 'node:fs';

import { readCorpus } from './corpus.ts';
import { dossierSchema, unknownAccomplishments } from './dossier/schema.ts';
import { readDossier, readRaw, renderedPath, writeDossier } from './dossier/store.ts';
import { runRecheck } from './recheck.ts';
import { renderDossier } from './render.ts';

// CORPUS_REPO may be set in the repository's .env; its absence is fine.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {}

const USAGE = `Usage: npm run recon -- <command> <slug>

  validate <slug>   schema, cross-references and Corpus ids; exit 1 on any failure
  recheck <slug>    run every perishable finding's re-check and record the result
  render <slug>     write dossiers/<slug>.md from the JSON`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function validate(slug: string) {
  const result = dossierSchema.safeParse(readRaw(slug));
  if (!result.success) {
    fail(result.error.issues.map((i) => `${i.path.join('.') || '(dossier)'}: ${i.message}`).join('\n'));
  }
  const eligible = new Set(readCorpus().accomplishments.map((a) => a.id));
  const unknown = unknownAccomplishments(result.data, eligible);
  if (unknown.length) {
    fail(`Accomplishments absent from the Corpus or without a Metric: ${unknown.join(', ')}`);
  }
  console.log(`${slug}: valid (${result.data.phase})`);
}

async function recheck(slug: string) {
  const dossier = readDossier(slug);
  const perishable = dossier.findings.filter((f) => f.perishable && f.recheck);
  let failed = 0;
  for (const finding of perishable) {
    const result = await runRecheck(finding.recheck!);
    finding.lastRecheck = { at: new Date().toISOString(), held: result.held };
    if (!result.held) failed += 1;
    console.log(`${result.held ? 'ok    ' : 'FALHOU'} ${finding.id} — ${result.observed}`);
  }
  writeDossier(dossier);
  if (failed) fail(`${failed} perishable finding(s) no longer hold. Rewrite what cites them before sending.`);
  console.log(`${perishable.length} re-check(s) held.`);
}

function render(slug: string) {
  writeFileSync(renderedPath(slug), renderDossier(readDossier(slug)));
  console.log(renderedPath(slug));
}

const [command, slug] = process.argv.slice(2);
if (!command || !slug) fail(USAGE);

switch (command) {
  case 'validate':
    validate(slug);
    break;
  case 'recheck':
    await recheck(slug);
    break;
  case 'render':
    render(slug);
    break;
  default:
    fail(USAGE);
}
