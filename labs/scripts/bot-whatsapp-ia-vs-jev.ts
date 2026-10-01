/**
 * Copies the latest `validation` round of zap-bench into the data the page reads.
 * Run by hand after a round (ADR-0002: gathered once, never on a schedule).
 *
 *   node --no-warnings labs/scripts/bot-whatsapp-ia-vs-jev.ts
 *
 * zap-bench owns the contract (`src/export/schema.ts` there) and refuses any round
 * that is not `validation`. ZAPBENCH_REPO points at its checkout; the default is
 * the sibling of the main prospect-me checkout, found through git so it also works
 * from a worktree. A round with its fake brain or rule patient comes out with
 * `synthetic: true`, which the page shows as test data and refuses to serve in
 * production.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/artifacts/bot-whatsapp-ia-vs-jev/data.json', import.meta.url));

function zapBenchRepo(): string {
  if (process.env.ZAPBENCH_REPO) return resolve(process.env.ZAPBENCH_REPO);
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: dirname(OUT),
    encoding: 'utf8',
  }).trim();
  return join(dirname(dirname(common)), 'zap-bench');
}

const repo = zapBenchRepo();
if (!existsSync(join(repo, 'src/cli.ts'))) {
  console.error(`zap-bench não encontrado em ${repo}; defina ZAPBENCH_REPO`);
  process.exit(1);
}

execFileSync(process.execPath, ['--no-warnings', 'src/cli.ts', 'export', 'latest', '--out', OUT], { cwd: repo, stdio: 'inherit' });

const data = JSON.parse(readFileSync(OUT, 'utf8')) as { synthetic: boolean; brains: { id: string }[] };
console.log(`cérebros: ${data.brains.map((b) => b.id).join(', ')}${data.synthetic ? ' (DADOS DE TESTE: a página não publica)' : ''}`);
