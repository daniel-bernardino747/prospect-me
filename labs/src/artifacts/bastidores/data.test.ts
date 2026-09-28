import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EVENT_NOTES, resultNote, STATION_NOTES } from './anotacoes';
import {
  answerSentence,
  axis,
  type Bastidores,
  classify,
  columns,
  duration,
  LANES,
  MAX_TEXT,
  plain,
  privacyProblems,
  type Run,
  runId,
  totals,
} from './data';
import { isTypedPrompt, questionsOf, repoPath, resultOf, sentBackOf, spansOf, stallsOf, usageOf } from './extract';

const raw = readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8');
const data = JSON.parse(raw) as Bastidores;

// ── Privacy: the file is public ──────────────────────────────────────────

describe('data.json privacy', () => {
  it.each(['dannk', '@', 'C:', 'Users', 'sk-', 'iasquare', 'recon/dossiers', 'AppData', 'toolu_', 'msg_', 'req_'])(
    'never contains %s',
    (needle) => {
      expect(raw.includes(needle)).toBe(false);
    },
  );

  it('has no free-text field longer than 200 characters', () => {
    const long: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'string') {
        if (v.length > 200) long.push(path);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    walk(data, '$');
    expect(long).toEqual([]);
    expect(MAX_TEXT).toBe(200);
  });

  it('passes the extraction scan, and the scan catches what it must', () => {
    expect(privacyProblems(raw)).toEqual([]);
    for (const bad of [
      'C:/Users/someone/x',
      'mail: someone@example.com',
      'key sk-or-v1-abc',
      'id 0f8fad5b-d9cb-469f-a165-70867728950e',
      'toolu_01ABC',
      '+55 11 91234-5678',
      '11912345678',
      'recon/dossiers/x.json',
      'x'.repeat(201),
    ]) {
      expect(privacyProblems(JSON.stringify({ s: bad })).length, bad).toBeGreaterThan(0);
    }
    expect(privacyProblems(JSON.stringify({ s: 'someone' }), ['someone']).length).toBe(1);
  });

  it('keeps only repo paths under labs/ and docs/', () => {
    for (const f of [...data.runs.flatMap((r) => r.files), ...data.commits.flatMap((c) => c.files)]) {
      expect(f).toMatch(/^(labs|docs)\//);
      expect(f).not.toContain('..');
    }
  });

  it('never carries ids from the transcripts: run ids are derived from labels', () => {
    for (const r of data.runs) expect(r.id).toMatch(/^[a-z0-9]+(-[a-z0-9-]+)?$/);
    expect(new Set(data.runs.map((r) => r.id)).size).toBe(data.runs.length);
  });

  it('stays small', () => {
    expect(raw.length).toBeLessThan(120_000);
  });
});

// ── The file's shape, for any snapshot ───────────────────────────────────

describe('data.json shape', () => {
  it('puts every run on a known lane with ordered spans', () => {
    const lanes = new Set(LANES.map((l) => l.id));
    for (const r of data.runs) {
      expect(lanes.has(r.lane), r.id).toBe(true);
      for (const [s, e] of r.spans) expect(Date.parse(e)).toBeGreaterThanOrEqual(Date.parse(s));
      for (let i = 1; i < r.spans.length; i++) expect(Date.parse(r.spans[i][0])).toBeGreaterThan(Date.parse(r.spans[i - 1][1]));
    }
  });

  it('answers checkpoints only with options that were offered', () => {
    for (const c of data.checkpoints) {
      for (const q of c.questions) for (const ch of q.chosen) expect(q.options).toContain(ch);
      if (c.status === 'respondida') expect(c.answeredAt).not.toBeNull();
    }
  });
});

// ── The answer sentence ──────────────────────────────────────────────────

const run = (over: Partial<Run> & Pick<Run, 'id' | 'code' | 'lane'>): Run => ({
  label: over.id,
  workflow: 'w',
  attempt: 1,
  spans: [['2026-09-25T16:40:00Z', '2026-09-25T16:50:00Z']],
  turns: 1,
  tools: { Bash: 2 },
  skills: [],
  toolErrors: 0,
  tokens: { input: 10, cacheWrite: 20, cacheRead: 70 },
  contextFinal: null,
  charsWritten: 0,
  files: [],
  worktree: false,
  result: {},
  flags: {},
  ...over,
});

const fixture = (over: Partial<Bastidores> = {}): Bastidores => ({
  asOf: '2026-09-25T18:00:00Z',
  from: '2026-09-25T16:00:00Z',
  tz: 'America/Sao_Paulo',
  model: 'claude-x',
  runs: [
    run({ id: 'or-01', code: 'OR', lane: 'orquestrador', spans: [['2026-09-25T16:00:00Z', '2026-09-25T16:10:00Z']] }),
    run({ id: 'pe-conta', code: 'PE', lane: 'conta-de-tokens', result: { viable: true } }),
    run({ id: 'pe-caixa-preta', code: 'PE', lane: 'bastidores', result: { viable: false } }),
    run({ id: 'de-conta', code: 'DE', lane: 'conta-de-tokens', result: { revise: true }, spans: [['2026-09-25T16:50:00Z', '2026-09-25T17:00:00Z']] }),
    run({ id: 'bu-conta', code: 'BU', lane: 'conta-de-tokens', spans: [['2026-09-25T17:00:00Z', '2026-09-25T17:30:00Z']] }),
  ],
  prompts: ['2026-09-25T16:01:00Z'],
  checkpoints: [
    {
      id: 'd1',
      at: '2026-09-25T16:10:00Z',
      answeredAt: '2026-09-25T16:32:00Z',
      resumedAt: null,
      status: 'respondida',
      questions: [{ header: 'Os 5', question: null, options: ['A', 'B'], recommended: 'A', chosen: ['A'] }],
    },
  ],
  commits: [],
  events: [],
  workflows: [],
  ...over,
});

describe('answerSentence', () => {
  it('names time, agents, demos, phases, decisions, the refusal and the send-back', () => {
    const pieces = answerSentence(fixture());
    expect(plain(pieces)).toBe(
      'Em 1 h 00 min de trabalho, 4 agentes de IA pesquisaram, desenharam e construíram esta demo em 3 fases; Daniel decidiu em 1 ponto — os agentes pararam e esperaram por ele —, uma pesquisa concluiu que uma demo não era viável e uma revisão cruzada devolveu uma direção.',
    );
    expect(pieces.find((p) => p.t === 'human')?.v).toBe('1 ponto');
    expect(pieces.find((p) => p.t === 'stop')?.v).toBe('não era viável');
  });

  it('drops the refusal and send-back clauses when the data has none', () => {
    const d = fixture();
    d.runs = d.runs.map((r) => ({ ...r, result: {} }));
    expect(plain(answerSentence(d))).toMatch(/esperaram por ele\.$/);
  });

  it('counts only answered checkpoints as decisions, and says "dias" across days', () => {
    const d = fixture({
      checkpoints: [
        { ...fixture().checkpoints[0], answeredAt: null, resumedAt: null, status: 'pendente' },
      ],
    });
    d.runs.push(run({ id: 'po-conta', code: 'PO', lane: 'conta-de-tokens', spans: [['2026-09-27T12:00:00Z', '2026-09-27T12:10:00Z']] }));
    const s = plain(answerSentence(d));
    expect(s).toContain('Daniel decidiu em 0 pontos,');
    expect(s).toContain('espalhadas por 2 dias');
  });

  it('reads the snapshot without inventing numbers', () => {
    const t = totals(data);
    const s = plain(answerSentence(data));
    expect(s).toMatch(/^Em \d+ h \d{2} min de trabalho/);
    expect(s).toContain(`${t.agents} agentes`);
    expect(s).toContain(`Daniel decidiu em ${t.decided} ponto`);
    expect(t.agents).toBe(data.runs.filter((r) => r.code !== 'OR').length);
  });
});

describe('totals', () => {
  it('sums processed tokens and the cache share, and agent time vs wall time', () => {
    const t = totals(fixture());
    expect(t.tokensProcessed).toBe(500);
    expect(t.tokensCacheRead).toBe(350);
    expect(t.activeMs).toBe(60 * 60_000);
    expect(t.agentMs).toBe(60 * 60_000);
    expect(t.followedRecommendation).toBe(1);
    expect(t.waitMs).toBe(22 * 60_000);
  });
});

// ── The board's axis ─────────────────────────────────────────────────────

describe('columns', () => {
  it('keeps a short wait whole and collapses idle hours into one break', () => {
    const cols = columns(fixture());
    // 16:00 → 17:30 is all busy or waiting: 18 pitches, no break.
    expect(cols.every((c) => c.kind === 'pitch')).toBe(true);
    expect(cols).toHaveLength(18);
    const d = fixture();
    d.runs.push(run({ id: 'po-conta', code: 'PO', lane: 'conta-de-tokens', spans: [['2026-09-25T22:00:00Z', '2026-09-25T22:10:00Z']] }));
    const c2 = columns(d);
    const breaks = c2.filter((c) => c.kind === 'break');
    expect(breaks).toHaveLength(1);
    expect(breaks[0]).toMatchObject({ wait: false });
  });

  it('breaks a wait of hours in the middle, on the stripes', () => {
    const d = fixture();
    d.checkpoints[0] = { ...d.checkpoints[0], answeredAt: null, resumedAt: '2026-09-26T16:10:00Z', status: 'interrompida' };
    const cols = columns(d);
    expect(cols.some((c) => c.kind === 'break' && c.wait)).toBe(true);
  });

  it('maps time monotonically onto the axis', () => {
    const a = axis(columns(data));
    let last = -1;
    for (const r of [...data.runs].sort((x, y) => x.spans[0][0].localeCompare(y.spans[0][0]))) {
      const x = a.at(r.spans[0][0]);
      expect(x).toBeGreaterThanOrEqual(last);
      last = x;
    }
    expect(a.at(data.asOf)).toBeLessThanOrEqual(a.width);
  });
});

// ── Extraction helpers ───────────────────────────────────────────────────

describe('extraction', () => {
  it('maps labels to stations and breaks on an unknown one', () => {
    expect(classify('research:pix-na-minha-cidade')).toMatchObject({ code: 'PE', lane: 'pix-na-minha-cidade' });
    expect(classify('research:caixa-preta')).toMatchObject({ code: 'PE', lane: 'bastidores' });
    expect(classify('art-director')).toMatchObject({ code: 'CR', lane: 'arte' });
    expect(classify('fix:raio-de-explosao').code).toBe('PO');
    expect(() => classify('mystery:thing')).toThrow();
    expect(() => classify('build:unknown-slug')).toThrow();
    expect(runId('BU', 'conta-de-tokens', 3, 'x')).toBe('bu-conta-3');
  });

  it('keeps repo paths under labs/ or docs/, from the repo or a worktree, and nothing else', () => {
    expect(repoPath('C:\\Users\\x\\Code\\prospect-me\\labs\\src\\a.ts', 'prospect-me')).toBe('labs/src/a.ts');
    expect(repoPath('C:/Users/x/Code/prospect-me/.claude/worktrees/wf_1-2/docs/adr/1.md', 'prospect-me')).toBe('docs/adr/1.md');
    expect(repoPath('C:/Users/x/Code/prospect-me/recon/dossiers/acme.json', 'prospect-me')).toBeNull();
    expect(repoPath('C:/Users/x/AppData/Local/Temp/scratchpad/a.png', 'prospect-me')).toBeNull();
    expect(repoPath('C:/Users/x/Code/prospect-me/labs/../recon/a', 'prospect-me')).toBeNull();
    expect(repoPath(42, 'prospect-me')).toBeNull();
  });

  it('counts input tokens once per message id and never reads output tokens', () => {
    const usage = { input_tokens: 5, cache_creation_input_tokens: 10, cache_read_input_tokens: 100, output_tokens: 999 };
    const u = usageOf(
      [
        { type: 'assistant', timestamp: 't1', message: { id: 'm1', usage, content: [{ type: 'text', text: 'abc' }] } },
        {
          type: 'assistant',
          timestamp: 't1',
          message: { id: 'm1', usage, content: [{ type: 'tool_use', id: 'u1', name: 'Write', input: { file_path: 'C:/x/prospect-me/labs/a.ts' } }] },
        },
        { type: 'user', timestamp: 't2', message: { content: [{ type: 'tool_result', tool_use_id: 'u1', is_error: false }] } },
        {
          type: 'assistant',
          timestamp: 't3',
          message: { id: 'm2', usage, content: [{ type: 'tool_use', id: 'u2', name: 'Write', input: { file_path: 'C:/x/prospect-me/labs/b.ts' } }] },
        },
        {
          type: 'user',
          timestamp: '2026-09-25T16:43:13Z',
          message: { content: [{ type: 'tool_result', tool_use_id: 'u2', is_error: true, content: 'stopped by a safety classifier' }] },
        },
      ],
      'prospect-me',
    );
    expect(u.turns).toBe(2);
    expect(u.tokens).toEqual({ input: 10, cacheWrite: 20, cacheRead: 200 });
    expect(u.tools).toEqual({ Write: 2 });
    expect(u.files).toEqual(['labs/a.ts']);
    expect(u.toolErrors).toBe(1);
    expect(u.blockedAt).toBe(Date.parse('2026-09-25T16:43:13Z'));
  });

  it('splits spans on long pauses', () => {
    expect(spansOf([12 * 60_000, 0, 60_000, 11 * 60_000], 9 * 60_000)).toEqual([
      [0, 60_000],
      [11 * 60_000, 12 * 60_000],
    ]);
  });

  it('matches answers to option labels and keeps no free text', () => {
    const qs = questionsOf(
      {
        questions: [
          { question: 'Onde?', header: 'Onde', options: [{ label: 'Labs (Recommended)' }, { label: 'Outro' }] },
          { question: 'Nichos?', header: 'Nichos', options: [{ label: 'IA' }, { label: 'Dev tools' }, { label: 'Pix' }] },
          { question: 'Livre?', header: 'Livre', options: [{ label: 'A' }] },
        ],
      },
      { 'Onde?': 'Labs (Recommended)', 'Nichos?': 'IA, Dev tools', 'Livre?': 'um texto meu' },
      () => true,
    );
    expect(qs[0]).toMatchObject({ options: ['Labs', 'Outro'], recommended: 'Labs', chosen: ['Labs'] });
    expect(qs[1].chosen).toEqual(['IA', 'Dev tools']);
    expect(qs[2]).toMatchObject({ chosen: [], own: true });
    expect(JSON.stringify(qs)).not.toContain('um texto meu');
  });

  it('tells typed prompts from tool results, notifications and injected text', () => {
    expect(isTypedPrompt({ type: 'user', message: { content: 'faça isso' } })).toBe(true);
    expect(isTypedPrompt({ type: 'user', message: { content: '<task-notification>…' } })).toBe(false);
    expect(isTypedPrompt({ type: 'user', message: { content: 'Another Claude session sent a message' } })).toBe(false);
    expect(isTypedPrompt({ type: 'user', isMeta: true, message: { content: 'x' } })).toBe(false);
    expect(isTypedPrompt({ type: 'user', message: { content: [{ type: 'tool_result' }] } })).toBe(false);
  });

  it('reads stalls, results and send-backs as enumerated values only', () => {
    expect(stallsOf(['[stall] agent "build:conta-de-tokens" stalled (no progress) after 2951s — retrying (1/5)', 'other'])).toEqual([
      { label: 'build:conta-de-tokens', seconds: 2951, attempt: 1 },
    ]);
    expect(resultOf({ viable: false, reason: 'long text' })).toEqual({ viable: false });
    expect(resultOf({ findings: [{ severity: 'P0' }, { severity: 'P2' }, { severity: 'X' }], verdict: 'x' })).toEqual({
      findings: { P0: 1, P1: 0, P2: 1, P3: 0 },
    });
    expect(sentBackOf({ verdicts: [{ slug: 'a', revise: true }, { slug: 'b', revise: false }] })).toEqual(['a']);
  });
});

describe('anotações', () => {
  it('are short, hand-written and present for every station and event', () => {
    for (const note of [...Object.values(STATION_NOTES), ...Object.values(EVENT_NOTES)]) {
      expect(note.length).toBeLessThanOrEqual(160);
    }
    for (const r of data.runs) expect(resultNote(r).length).toBeLessThanOrEqual(160);
  });

  it('formats durations the page way', () => {
    expect(duration(28_000)).toBe('28 s');
    expect(duration((25 * 60 + 46) * 1000)).toBe('25 min 46 s');
    expect(duration(64 * 60_000)).toBe('1 h 04 min');
  });
});
