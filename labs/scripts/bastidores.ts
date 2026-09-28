/**
 * Extracts the data behind /demo/bastidores from Daniel's own Claude Code session
 * files and this repository's git history, and writes the `data.json` the page
 * reads. Run it once more right before publishing, from the repo root or a
 * worktree:
 *
 *   node --no-warnings labs/scripts/bastidores.ts
 *
 * Then restart `labs dev` (data.json is cached in memory) and review the diff of
 * data.json before committing it.
 *
 * Where it reads (nothing here is a path: they are found at run time):
 * - The session: the one under ~/.claude/projects/<this repo's key>/ whose
 *   workflows include `showcase-research-design`, plus the same session id under
 *   sibling project keys (`…-labs`), which hold some workflow scripts. Override
 *   with BASTIDORES_SESSIONS (session directories separated by the platform's
 *   path delimiter).
 * - BASTIDORES_FROM (ISO, default the `/clear` that opened this work).
 * - BASTIDORES_DEPLOY (ISO, optional): when this page was deployed, if known.
 * - git: `labs-showcase` and every `worktree-wf_*` branch since BASTIDORES_FROM.
 *
 * Privacy (BRIEF, "Limpeza"): a whitelist. Only counts, timestamps, enumerated
 * results, tool and skill names, the public agent labels, Daniel's question
 * headers and option labels, commit subjects and repo paths under labs/ or docs/
 * leave the transcripts. The serialized file is scanned before it is kept; on any
 * hit the file is deleted and the script exits with an error.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type Bastidores,
  type BoardEvent,
  type Checkpoint,
  classify,
  type Commit,
  type LaneId,
  privacyProblems,
  publishable,
  type Run,
  runId,
  type Workflow,
} from '../src/artifacts/bastidores/data.ts';
import {
  isTypedPrompt,
  type Line,
  questionsOf,
  repoPath,
  resultOf,
  scriptFailuresOf,
  sentBackOf,
  spansOf,
  stallsOf,
  usageOf,
  workflowMeta,
} from '../src/artifacts/bastidores/extract.ts';

const OUT = fileURLToPath(new URL('../src/artifacts/bastidores/data.json', import.meta.url));
const HERE = dirname(fileURLToPath(import.meta.url));
const FROM = process.env.BASTIDORES_FROM ?? '2026-09-25T16:02:04Z';
const FROM_MS = Date.parse(FROM);
/** A pause longer than this splits an agent's card. */
const AGENT_GAP = 10 * 60_000;
/** The orchestrator works in short bursts between waits. */
const ORCH_GAP = 3 * 60_000;
/** A run still going at extraction, if its last line is this recent. */
const OPEN_WITHIN = 20 * 60_000;
const MARKER = 'showcase-research-design';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ── Where ────────────────────────────────────────────────────────────────

/** The main checkout, also from a worktree. */
const MAIN = resolve(dirname(resolve(HERE, git(HERE, 'rev-parse', '--git-common-dir').trim())));
const REPO_NAME = basename(MAIN);
const PROJECTS = join(homedir(), '.claude', 'projects');
const projectKey = (p: string) => p.replace(/[^A-Za-z0-9]/g, '-');

function sessionDirs(): string[] {
  if (process.env.BASTIDORES_SESSIONS) return process.env.BASTIDORES_SESSIONS.split(delimiter).filter(Boolean);
  const key = projectKey(MAIN);
  const project = join(PROJECTS, key);
  const found = readdirSync(project)
    .map((name) => join(project, name))
    .filter((dir) => {
      const wf = join(dir, 'workflows');
      if (!existsSync(wf) || !statSync(dir).isDirectory()) return false;
      return readdirSync(wf).some((f) => {
        if (!/^wf_.*\.json$/.test(f)) return false;
        try {
          return (JSON.parse(readFileSync(join(wf, f), 'utf8')) as { workflowName?: string }).workflowName === MARKER;
        } catch {
          return false;
        }
      });
    });
  if (found.length !== 1) throw new Error(`Expected one session with the ${MARKER} workflow, found ${found.length}; set BASTIDORES_SESSIONS`);
  const id = basename(found[0]);
  const siblings = readdirSync(PROJECTS)
    .filter((k) => k !== key && k.startsWith(key))
    .map((k) => join(PROJECTS, k, id))
    .filter(existsSync);
  return [found[0], ...siblings];
}

const readLines = (file: string): Line[] =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as Line];
      } catch {
        return [];
      }
    });
const readJson = <T>(file: string): T | null => {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
};
const ls = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);
const iso = (t: number) => new Date(t).toISOString();
const times = (lines: Line[]) => lines.flatMap((l) => (l.timestamp ? [Date.parse(l.timestamp)] : [])).filter((t) => t >= FROM_MS);

// ── Workflows ────────────────────────────────────────────────────────────

interface WorkflowState {
  runId: string;
  workflowName: string;
  startTime: number;
  durationMs: number;
  phases?: { title: string }[];
  args?: { slug?: string }[];
  logs?: unknown;
  workflowProgress?: { type: string; agentId?: string; tokens?: number }[];
}
interface Journal {
  type: string;
  agentId?: string;
  label?: string;
  phase?: string;
  result?: unknown;
}
interface Meta {
  agentType?: string;
  name?: string;
  spawnedWithWorktree?: boolean;
}

const dirs = sessionDirs();
const mainDir = dirs[0];
const mainJsonl = `${mainDir}.jsonl`;
const states = new Map<string, WorkflowState>();
const scripts = new Map<string, { name: string | null; phases: string[] }>();
for (const dir of dirs) {
  for (const f of ls(join(dir, 'workflows'))) {
    if (!/^wf_.*\.json$/.test(f)) continue;
    const s = readJson<WorkflowState>(join(dir, 'workflows', f));
    if (s?.runId) states.set(s.runId, s);
  }
  for (const f of ls(join(dir, 'workflows', 'scripts'))) {
    const m = /-(wf_[a-z0-9-]+)\.js$/.exec(f);
    if (m) scripts.set(m[1], workflowMeta(readFileSync(join(dir, 'workflows', 'scripts', f), 'utf8')));
  }
}

const asOf = Date.now();
const runs: Run[] = [];
const events: BoardEvent[] = [];
const workflows: Workflow[] = [];
let model: string | null = null;

interface Pending {
  run: Run;
  agentId: string;
  workflowId: string | null;
}
const pending: Pending[] = [];

function makeRun(p: {
  lines: Line[];
  code: Run['code'];
  lane: LaneId;
  label: string;
  slug: string | null;
  fallback: string;
  workflow: string | null;
  attempt: number;
  worktree: boolean;
  contextFinal: number | null;
  gap: number;
}): Run | null {
  const t = times(p.lines);
  if (t.length === 0) return null;
  const u = usageOf(p.lines.filter((l) => !l.timestamp || Date.parse(l.timestamp) >= FROM_MS), REPO_NAME);
  model ??= u.model;
  const run: Run = {
    id: runId(p.code, p.slug, p.attempt, p.fallback),
    lane: p.lane,
    code: p.code,
    label: p.label,
    workflow: p.workflow,
    attempt: p.attempt,
    spans: spansOf(t, p.gap).map(([s, e]) => [iso(s), iso(Math.max(e, s + 1000))]),
    turns: u.turns,
    tools: u.tools,
    skills: u.skills,
    toolErrors: u.toolErrors,
    tokens: u.tokens,
    contextFinal: p.contextFinal,
    charsWritten: u.charsWritten,
    files: u.files,
    worktree: p.worktree,
    result: {},
    flags: {},
  };
  if (u.blockedAt !== null) {
    run.flags.blocked = true;
    events.push({ at: iso(u.blockedAt), kind: 'bloqueio', run: run.id });
  }
  return run;
}

for (const dir of dirs) {
  for (const wfId of ls(join(dir, 'subagents', 'workflows'))) {
    const wdir = join(dir, 'subagents', 'workflows', wfId);
    const journal = existsSync(join(wdir, 'journal.jsonl')) ? (readLines(join(wdir, 'journal.jsonl')) as unknown as Journal[]) : [];
    const state = states.get(wfId) ?? null;
    const meta = scripts.get(wfId) ?? { name: state?.workflowName ?? null, phases: state?.phases?.map((p) => p.title) ?? [] };
    const name = state?.workflowName ?? meta.name ?? 'workflow';
    const results = new Map<string, unknown>();
    for (const j of journal) if (j.type === 'result' && j.agentId) results.set(j.agentId, j.result);
    const context = new Map<string, number>();
    for (const p of state?.workflowProgress ?? []) if (p.type === 'workflow_agent' && p.agentId && typeof p.tokens === 'number') context.set(p.agentId, p.tokens);

    const started = journal.filter((j) => j.type === 'started' && j.agentId && j.label);
    const attempts = new Map<string, number>();
    const wfRuns: Run[] = [];
    for (const j of started) {
      const label = j.label!;
      const { code, lane, slug } = classify(label);
      const attempt = (attempts.get(label) ?? 0) + 1;
      attempts.set(label, attempt);
      const file = join(wdir, `agent-${j.agentId}.jsonl`);
      const metaFile = readJson<Meta>(join(wdir, `agent-${j.agentId}.meta.json`));
      const lines = existsSync(file) ? readLines(file) : [];
      const run = makeRun({
        lines,
        code,
        lane,
        label,
        slug,
        fallback: slug ?? label.replace(/[^a-z0-9]+/g, '-'),
        workflow: name,
        attempt,
        worktree: metaFile?.spawnedWithWorktree === true,
        contextFinal: context.get(j.agentId!) ?? null,
        gap: AGENT_GAP,
      });
      if (!run) {
        console.warn(`  ${label}: no transcript, left out`);
        continue;
      }
      const result = results.get(j.agentId!);
      run.result = resultOf(result);
      if (!results.has(j.agentId!) && !state) run.flags.open = true;
      wfRuns.push(run);
      pending.push({ run, agentId: j.agentId!, workflowId: wfId });
      // The cross-review's verdicts mark the design cards it sent back.
      for (const back of sentBackOf(result)) {
        const lane = classify(`design:${back}`).lane;
        const design = [...wfRuns].reverse().find((r) => r.lane === lane && r.code === 'DE');
        if (design) design.result.revise = true;
        events.push({ at: run.spans.at(-1)![1], kind: 'devolvida', run: design?.id });
      }
      if (run.result.viable === false) events.push({ at: run.spans.at(-1)![1], kind: 'inviavel', run: run.id });
    }
    for (const s of stallsOf(state?.logs)) {
      const stalled = wfRuns.find((r) => r.label === s.label && r.attempt === s.attempt);
      const next = wfRuns.find((r) => r.label === s.label && r.attempt === s.attempt + 1);
      if (!stalled) continue;
      stalled.flags.stalledAfterS = s.seconds;
      events.push({ at: next ? next.spans[0][0] : stalled.spans.at(-1)![1], kind: 'reinicio', run: stalled.id });
    }
    for (const i of scriptFailuresOf(state?.logs)) {
      const slug = state?.args?.[i]?.slug;
      if (!slug) continue;
      const lane = classify(`research:${slug}`).lane;
      const last = [...wfRuns].reverse().find((r) => r.lane === lane);
      if (last) events.push({ at: last.spans.at(-1)![1], kind: 'erro-script', run: last.id });
    }
    runs.push(...wfRuns);
    if (wfRuns.length > 0) {
      const start = state ? state.startTime : Math.min(...wfRuns.map((r) => Date.parse(r.spans[0][0])));
      workflows.push({
        name,
        start: iso(start),
        end: state ? iso(state.startTime + state.durationMs) : null,
        phases: (state?.phases?.map((p) => p.title) ?? meta.phases).filter((p) => /^[A-Za-z0-9 +-]{1,40}$/.test(p)),
        agents: wfRuns.length,
      });
    }
  }

  // Agents the orchestrator spawned directly: the niche-research teammate and helpers.
  for (const f of ls(join(dir, 'subagents'))) {
    const m = /^agent-(.+)\.jsonl$/.exec(f);
    if (!m) continue;
    const meta = readJson<Meta>(join(dir, 'subagents', `agent-${m[1]}.meta.json`)) ?? {};
    let code: Run['code'];
    let lane: LaneId;
    let label: string;
    if (meta.name === 'nichos') [code, lane, label] = ['NI', 'nichos', 'nichos'];
    else if (['Explore', 'general-purpose', 'Plan'].includes(meta.agentType ?? '')) [code, lane, label] = ['EX', 'orquestrador', 'consulta'];
    else throw new Error(`Unknown direct agent (type "${meta.agentType}", name "${meta.name}"): map it in the script`);
    const n = runs.filter((r) => r.label === label).length + 1;
    const run = makeRun({
      lines: readLines(join(dir, 'subagents', f)),
      code,
      lane,
      label,
      slug: null,
      fallback: label,
      workflow: null,
      attempt: n,
      worktree: meta.spawnedWithWorktree === true,
      contextFinal: null,
      gap: AGENT_GAP,
    });
    if (!run) continue;
    if (asOf - Date.parse(run.spans.at(-1)![1]) < OPEN_WITHIN) run.flags.open = true;
    runs.push(run);
  }
}

// ── The orchestrator and Daniel ──────────────────────────────────────────

const main = readLines(mainJsonl).filter((l) => !l.timestamp || Date.parse(l.timestamp) >= FROM_MS);
const prompts = main.filter(isTypedPrompt).map((l) => l.timestamp!).filter(Boolean);

{
  const working = main.filter((l) => l.type === 'assistant' && l.timestamp);
  const spans = spansOf(working.map((l) => Date.parse(l.timestamp!)), ORCH_GAP);
  spans.forEach(([s, e], i) => {
    const slice = main.filter((l) => {
      const t = l.timestamp ? Date.parse(l.timestamp) : NaN;
      return t >= s && t <= e;
    });
    const u = usageOf(slice, REPO_NAME);
    model ??= u.model;
    runs.push({
      id: `or-${String(i + 1).padStart(2, '0')}`,
      lane: 'orquestrador',
      code: 'OR',
      label: 'orquestrador',
      workflow: null,
      attempt: 1,
      spans: [[iso(s), iso(Math.max(e, s + 20_000))]],
      turns: u.turns,
      tools: u.tools,
      skills: u.skills,
      toolErrors: u.toolErrors,
      tokens: u.tokens,
      contextFinal: null,
      charsWritten: u.charsWritten,
      files: u.files,
      worktree: false,
      result: {},
      flags: i === spans.length - 1 && asOf - e < OPEN_WITHIN ? { open: true } : {},
    });
  });
}

const checkpoints: Checkpoint[] = [];
{
  interface Ask {
    id: string;
    at: string;
    input: Record<string, unknown>;
  }
  const asks: Ask[] = [];
  for (const l of main) {
    if (l.type !== 'assistant' || !Array.isArray(l.message?.content)) continue;
    for (const b of l.message!.content as { type?: string; name?: string; id?: string; input?: Record<string, unknown> }[]) {
      if (b.type === 'tool_use' && b.name === 'AskUserQuestion' && b.id && !asks.some((a) => a.id === b.id)) {
        asks.push({ id: b.id, at: l.timestamp!, input: b.input ?? {} });
      }
    }
  }
  asks.forEach((a, i) => {
    let answeredAt: string | null = null;
    let answers: Record<string, string> | null = null;
    let interrupted = false;
    for (const l of main) {
      if (l.type !== 'user' || !Array.isArray(l.message?.content)) continue;
      const hit = (l.message!.content as { type?: string; tool_use_id?: string }[]).some(
        (b) => b.type === 'tool_result' && b.tool_use_id === a.id,
      );
      if (!hit) continue;
      const r = l.toolUseResult as { answers?: Record<string, string> } | undefined;
      if (r && typeof r === 'object' && r.answers && typeof r.answers === 'object') {
        answeredAt = l.timestamp!;
        answers = r.answers;
      } else interrupted = true;
      break;
    }
    const resumedAt = answeredAt ? null : (prompts.find((p) => Date.parse(p) > Date.parse(a.at)) ?? null);
    checkpoints.push({
      id: `d${i + 1}`,
      at: a.at,
      answeredAt,
      resumedAt,
      status: answeredAt ? 'respondida' : interrupted || resumedAt ? 'interrompida' : 'pendente',
      questions: questionsOf(a.input, answers, publishable),
    });
  });
}

// ── git ──────────────────────────────────────────────────────────────────

const commits: Commit[] = [];
{
  const branches = git(MAIN, 'for-each-ref', '--format=%(refname:short)', 'refs/heads/')
    .split('\n')
    .map((b) => b.trim())
    .filter((b) => b === 'labs-showcase' || /^worktree-wf_[a-z0-9-]+$/.test(b));
  branches.sort((a, b) => (a === 'labs-showcase' ? -1 : b === 'labs-showcase' ? 1 : a.localeCompare(b)));
  const seen = new Set<string>();
  for (const branch of branches) {
    const out = git(MAIN, 'log', '--first-parent', `--since=${FROM}`, '--numstat', '--format=%x1e%h%x1f%aI%x1f%P%x1f%s', branch);
    for (const chunk of out.split('\x1e').filter((c) => c.trim())) {
      const [head, ...rest] = chunk.split('\n');
      const [hash, at, parents, subject] = head.split('\x1f');
      if (seen.has(hash)) continue;
      seen.add(hash);
      let insertions = 0;
      let deletions = 0;
      let filesChanged = 0;
      const files = new Set<string>();
      for (const row of rest) {
        const m = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(row.trim());
        if (!m) continue;
        filesChanged++;
        insertions += m[1] === '-' ? 0 : Number(m[1]);
        deletions += m[2] === '-' ? 0 : Number(m[2]);
        const f = repoPath(`/${REPO_NAME}/${m[3]}`, REPO_NAME);
        if (f) files.add(f);
      }
      commits.push({
        hash,
        at: new Date(at).toISOString(),
        subject: publishable(subject) && subject.length <= 120 ? subject : '(assunto omitido)',
        branch: /^[a-z0-9_-]+$/.test(branch) ? branch : 'branch',
        merge: parents.trim().split(' ').length > 1,
        filesChanged,
        insertions,
        deletions,
        files: [...files].sort(),
      });
    }
  }
  commits.sort((a, b) => a.at.localeCompare(b.at));
}

if (process.env.BASTIDORES_DEPLOY) events.push({ at: new Date(process.env.BASTIDORES_DEPLOY).toISOString(), kind: 'deploy' });

// ── Write, then scan ─────────────────────────────────────────────────────

runs.sort((a, b) => a.spans[0][0].localeCompare(b.spans[0][0]) || a.id.localeCompare(b.id));
const ids = new Set<string>();
for (const r of runs) {
  if (ids.has(r.id)) throw new Error(`Duplicate run id ${r.id}`);
  ids.add(r.id);
}
events.sort((a, b) => a.at.localeCompare(b.at));
workflows.sort((a, b) => a.start.localeCompare(b.start));

const data: Bastidores = {
  asOf: iso(asOf),
  from: new Date(FROM).toISOString(),
  tz: 'America/Sao_Paulo',
  model: model ? String(model).replace(/\[.*\]$/, '') : null,
  runs,
  prompts,
  checkpoints,
  commits,
  events,
  workflows,
};

const json = `${JSON.stringify(data, null, 1)}\n`;
writeFileSync(OUT, json);
const problems = privacyProblems(json, [userInfo().username, basename(homedir())]);
if (problems.length > 0) {
  rmSync(OUT);
  console.error('data.json failed the privacy scan and was deleted:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `data.json: ${runs.length} runs, ${checkpoints.length} checkpoints, ${commits.length} commits, ${events.length} events, ${(json.length / 1024).toFixed(1)} KB`,
);
