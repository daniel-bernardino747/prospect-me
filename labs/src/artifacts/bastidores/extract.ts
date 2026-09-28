/**
 * The pure half of `scripts/bastidores.ts`: turning transcript lines into the
 * whitelisted numbers of `data.json`. Nothing here returns free text from a
 * transcript: only counts, timestamps, enumerated values, tool and skill names,
 * and file paths that pass `repoPath`.
 */

import type { Question } from './data.ts';

/** A transcript line, as far as the whitelist reads it. */
export interface Line {
  type?: string;
  timestamp?: string;
  isMeta?: boolean;
  message?: {
    id?: string;
    content?: unknown;
    usage?: { input_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number };
    model?: string;
  };
  toolUseResult?: unknown;
}

interface Block {
  type?: string;
  id?: string;
  name?: string;
  text?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
  content?: unknown;
}

const blocks = (l: Line): Block[] => (Array.isArray(l.message?.content) ? (l.message!.content as Block[]) : []);

/**
 * A written file's path relative to the repository, or null. Kept only under
 * `labs/` or `docs/` of the repo or one of its build worktrees; `recon/` (third
 * parties' contacts), temp folders and anything outside the repo are dropped.
 */
export function repoPath(raw: unknown, repoName: string): string | null {
  if (typeof raw !== 'string') return null;
  const p = raw.replace(/\\/g, '/');
  const i = p.lastIndexOf(`/${repoName}/`);
  if (i < 0) return null;
  let rel = p.slice(i + repoName.length + 2);
  const wt = /^\.claude\/worktrees\/[^/]+\/(.*)$/.exec(rel);
  if (wt) rel = wt[1];
  if (rel.split('/').includes('..')) return null;
  if (!/^(labs|docs)\//.test(rel)) return null;
  if (!/^[A-Za-z0-9._/[\]() -]+$/.test(rel)) return null;
  return rel;
}

/** Working spans from a transcript's timestamps: a pause longer than `gapMs` splits them. */
export function spansOf(times: number[], gapMs: number): [number, number][] {
  const t = [...times].filter(Number.isFinite).sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (const x of t) {
    const last = out[out.length - 1];
    if (last && x - last[1] <= gapMs) last[1] = x;
    else out.push([x, x]);
  }
  return out;
}

export interface Usage {
  turns: number;
  tools: Record<string, number>;
  skills: string[];
  toolErrors: number;
  tokens: { input: number; cacheWrite: number; cacheRead: number };
  charsWritten: number;
  files: string[];
  blockedAt: number | null;
  model: string | null;
}

const SKILL = /^[a-z0-9][a-z0-9:_-]{0,60}$/i;
const TOOL = /^[A-Za-z0-9_-]{1,80}$/;

/**
 * What a slice of a transcript used. One API message spans several lines (one
 * per content block), so input tokens are summed once per `message.id`; output
 * tokens are never read (they undercount, BRIEF Achado 9).
 */
export function usageOf(lines: Line[], repoName: string): Usage {
  const seenMsg = new Set<string>();
  const seenTool = new Set<string>();
  const seenErr = new Set<string>();
  const seenBlock = new Set<string>();
  const u: Usage = {
    turns: 0,
    tools: {},
    skills: [],
    toolErrors: 0,
    tokens: { input: 0, cacheWrite: 0, cacheRead: 0 },
    charsWritten: 0,
    files: [],
    blockedAt: null,
    model: null,
  };
  const files = new Map<string, string>();
  const failed = new Set<string>();
  const skills = new Set<string>();
  for (const l of lines) {
    if (l.type === 'assistant' && l.message) {
      const id = l.message.id ?? `${l.timestamp}`;
      if (!seenMsg.has(id)) {
        seenMsg.add(id);
        u.turns++;
        const us = l.message.usage ?? {};
        u.tokens.input += us.input_tokens ?? 0;
        u.tokens.cacheWrite += us.cache_creation_input_tokens ?? 0;
        u.tokens.cacheRead += us.cache_read_input_tokens ?? 0;
        if (typeof l.message.model === 'string' && /^claude-[a-z0-9.-]+$/.test(l.message.model)) u.model = l.message.model;
      }
      blocks(l).forEach((b, i) => {
        const key = b.type === 'tool_use' && b.id ? b.id : `${id}:${i}:${b.type}:${(b.text ?? '').length}`;
        if (seenBlock.has(key)) return;
        seenBlock.add(key);
        if (b.type === 'text' && typeof b.text === 'string') u.charsWritten += b.text.length;
        if (b.type === 'tool_use' && typeof b.name === 'string') {
          if (b.id && seenTool.has(b.id)) return;
          if (b.id) seenTool.add(b.id);
          u.charsWritten += JSON.stringify(b.input ?? {}).length;
          const name = TOOL.test(b.name) ? b.name : 'outra';
          u.tools[name] = (u.tools[name] ?? 0) + 1;
          if (name === 'Skill' && typeof b.input?.skill === 'string' && SKILL.test(b.input.skill)) skills.add(b.input.skill);
          if (['Write', 'Edit', 'NotebookEdit', 'MultiEdit'].includes(name)) {
            const f = repoPath(b.input?.file_path ?? b.input?.notebook_path, repoName);
            if (f) files.set(b.id ?? `${id}:${i}`, f);
          }
        }
      });
    }
    if (l.type === 'user') {
      for (const b of blocks(l)) {
        if (b.type !== 'tool_result' || !b.is_error) continue;
        const key = b.tool_use_id ?? `${l.timestamp}`;
        failed.add(key);
        if (seenErr.has(key)) continue;
        seenErr.add(key);
        u.toolErrors++;
        // Read only to set a flag; the text itself never leaves.
        if (u.blockedAt === null && /safety classifier/i.test(JSON.stringify(b.content ?? '')) && l.timestamp) {
          u.blockedAt = Date.parse(l.timestamp);
        }
      }
    }
  }
  // A write that failed or was stopped did not touch the file.
  u.files = [...new Set([...files].filter(([k]) => !failed.has(k)).map(([, f]) => f))].sort();
  u.skills = [...skills].sort();
  return u;
}

/** A message Daniel typed (not a tool result, a notification, a command or an injected skill). */
export function isTypedPrompt(l: Line): boolean {
  if (l.type !== 'user' || l.isMeta) return false;
  const c = l.message?.content;
  const text =
    typeof c === 'string'
      ? c
      : Array.isArray(c) && c.length > 0 && (c as Block[]).every((b) => b.type === 'text')
        ? (c as Block[]).map((b) => b.text ?? '').join('')
        : null;
  if (text === null) return false;
  const t = text.trimStart();
  if (!t) return false;
  if (t.startsWith('<') || t.startsWith('[') || t.startsWith('#')) return false;
  if (/^(Another Claude session|Caveat:|This session is being continued)/.test(t)) return false;
  return true;
}

const REC = /\s*\((?:Recommended|Recomendad[oa])\)\s*$/i;

interface AskInput {
  questions?: { question?: string; header?: string; options?: { label?: string }[]; multiSelect?: boolean }[];
}

/**
 * The checkpoint's questions with Daniel's choices, matched by option label.
 * An answer that matches no option is counted as his own; its text is not kept.
 */
export function questionsOf(input: AskInput, answers: Record<string, string> | null, safe: (s: string) => boolean): Question[] {
  return (input.questions ?? []).map((q) => {
    const labels = (q.options ?? []).map((o) => String(o.label ?? ''));
    const clean = labels.map((l) => l.replace(REC, '').trim());
    const recIdx = labels.findIndex((l) => REC.test(l));
    const answer = answers && q.question ? answers[q.question] : undefined;
    const chosen: string[] = [];
    let own = false;
    if (typeof answer === 'string') {
      const whole = labels.findIndex((l) => l === answer.trim());
      if (whole >= 0) chosen.push(clean[whole]);
      else {
        for (const part of answer.split(/,\s*/)) {
          const i = labels.findIndex((l, k) => l === part.trim() || clean[k] === part.trim());
          if (i >= 0 && !chosen.includes(clean[i])) chosen.push(clean[i]);
          else if (part.trim()) own = true;
        }
      }
    }
    const header = String(q.header ?? '').trim();
    const question = typeof q.question === 'string' && q.question.length <= 160 && safe(q.question) ? q.question : null;
    const options = clean.map((o) => (safe(o) && o.length <= 80 ? o : '(opção omitida)'));
    return {
      header: safe(header) && header.length <= 40 ? header : 'Pergunta',
      question,
      options,
      recommended: recIdx >= 0 ? options[recIdx] : null,
      chosen: chosen.map((c) => (options.includes(c) ? c : '(opção omitida)')),
      ...(own ? { own: true } : {}),
    };
  });
}

export interface Stall {
  label: string;
  seconds: number;
  attempt: number;
}

/** "[stall] agent "build:x" stalled (no progress) after 2951s — retrying (1/5)": label, seconds, retry number. */
export function stallsOf(logs: unknown): Stall[] {
  if (!Array.isArray(logs)) return [];
  const out: Stall[] = [];
  for (const l of logs) {
    const m = typeof l === 'string' ? /^\[stall\] agent "([a-z0-9:-]+)" stalled .*?after (\d+)s .*?retrying \((\d+)\//.exec(l) : null;
    if (m) out.push({ label: m[1], seconds: Number(m[2]), attempt: Number(m[3]) });
  }
  return out;
}

/** "pipeline[0] failed: …": which pipeline index broke the script (the message is not kept). */
export function scriptFailuresOf(logs: unknown): number[] {
  if (!Array.isArray(logs)) return [];
  return logs.flatMap((l) => {
    const m = typeof l === 'string' ? /^pipeline\[(\d+)\] failed/.exec(l) : null;
    return m ? [Number(m[1])] : [];
  });
}

/** A workflow script's name and phase titles, from its `meta` block. */
export function workflowMeta(script: string): { name: string | null; phases: string[] } {
  const meta = /export const meta\s*=\s*\{([\s\S]*?)\n\}/.exec(script)?.[1] ?? '';
  const name = /name:\s*'([a-z0-9-]+)'/.exec(meta)?.[1] ?? null;
  const phases = [...meta.matchAll(/title:\s*'([^']{1,40})'/g)].map((m) => m[1]);
  return { name, phases };
}

/** Only the enumerated parts of an agent's structured result. */
export function resultOf(r: unknown): { viable?: boolean; done?: boolean; findings?: { P0: number; P1: number; P2: number; P3: number } } {
  if (!r || typeof r !== 'object') return {};
  const o = r as Record<string, unknown>;
  const out: ReturnType<typeof resultOf> = {};
  if (typeof o.viable === 'boolean') out.viable = o.viable;
  if (typeof o.done === 'boolean') out.done = o.done;
  if (Array.isArray(o.findings)) {
    const f = { P0: 0, P1: 0, P2: 0, P3: 0 };
    for (const x of o.findings) {
      const s = (x as { severity?: unknown })?.severity;
      if (s === 'P0' || s === 'P1' || s === 'P2' || s === 'P3') f[s]++;
    }
    out.findings = f;
  }
  return out;
}

/** The slugs a cross-review sent back (`verdicts[].revise`). */
export function sentBackOf(r: unknown): string[] {
  const v = (r as { verdicts?: unknown })?.verdicts;
  if (!Array.isArray(v)) return [];
  return v.flatMap((x) => {
    const o = x as { slug?: unknown; revise?: unknown };
    return o.revise === true && typeof o.slug === 'string' && /^[a-z0-9-]+$/.test(o.slug) ? [o.slug] : [];
  });
}
