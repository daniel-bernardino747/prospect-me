/**
 * The data behind "Bastidores", extracted by `scripts/bastidores.ts` from Daniel's
 * own session files and the git history, and every rule the page applies to it.
 * Pure and client-safe. Every figure on the page and in the OG image comes from
 * here; prose comes from `anotacoes.ts`, written by hand.
 */

// ── The file ─────────────────────────────────────────────────────────────

/** The card stock a run is printed on: its phase. */
export type Code = 'OR' | 'EX' | 'NI' | 'PE' | 'DE' | 'CR' | 'DE2' | 'BU' | 'PO' | 'DP';

export type LaneId =
  | 'daniel'
  | 'orquestrador'
  | 'nichos'
  | 'conta-de-tokens'
  | 'raio-de-explosao'
  | 'curtailment-br'
  | 'pix-na-minha-cidade'
  | 'bastidores'
  | 'arte';

export interface Run {
  /** Short and derived from the label ("pe-pix", "bu-conta-2"); never an agent id. */
  id: string;
  lane: LaneId;
  code: Code;
  /** The public label the workflow gave the agent ("research:pix-na-minha-cidade"). */
  label: string;
  /** The workflow's name, or null for the orchestrator and its direct helpers. */
  workflow: string | null;
  /** 1 for the first agent with this label in its workflow, 2 for the restart… */
  attempt: number;
  /** When it was working, ISO UTC. A pause of more than ten minutes splits a span. */
  spans: [string, string][];
  turns: number;
  tools: Record<string, number>;
  skills: string[];
  toolErrors: number;
  /** Input tokens processed, once per API message. Output tokens are not kept (BRIEF, Achado 9). */
  tokens: { input: number; cacheWrite: number; cacheRead: number };
  /** The workflow state's `tokens`: about the context size on the last turn. */
  contextFinal: number | null;
  /** Characters of text and tool input the agent wrote: the stated proxy for output. */
  charsWritten: number;
  /** Repo-relative, only under labs/ or docs/. */
  files: string[];
  worktree: boolean;
  result: {
    viable?: boolean;
    revise?: boolean;
    done?: boolean;
    findings?: { P0: number; P1: number; P2: number; P3: number };
  };
  flags: {
    /** A tool call stopped by a safety classifier. */
    blocked?: boolean;
    /** The workflow found it stalled after this many seconds and restarted it. */
    stalledAfterS?: number;
    /** Still working when the data was extracted. */
    open?: boolean;
    /** The transcript is gone: drawn dashed, never estimated. */
    incomplete?: boolean;
  };
}

export interface Question {
  header: string;
  question: string | null;
  options: string[];
  /** The option the orchestrator marked as recommended, if any. */
  recommended: string | null;
  chosen: string[];
  /** Daniel typed his own answer; its text is not kept. */
  own?: boolean;
}

export interface Checkpoint {
  id: string;
  at: string;
  /** When the answer arrived; null if it never did through the question. */
  answeredAt: string | null;
  /** Unanswered: the session ended, and Daniel's next message is here. */
  resumedAt: string | null;
  status: 'respondida' | 'interrompida' | 'pendente';
  questions: Question[];
}

export interface Commit {
  hash: string;
  at: string;
  subject: string;
  branch: string;
  merge: boolean;
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: string[];
}

export type EventKind = 'bloqueio' | 'inviavel' | 'devolvida' | 'erro-script' | 'reinicio' | 'deploy';

export interface BoardEvent {
  at: string;
  kind: EventKind;
  run?: string;
}

export interface Workflow {
  name: string;
  start: string;
  end: string | null;
  phases: string[];
  agents: number;
}

export interface Bastidores {
  asOf: string;
  from: string;
  tz: 'America/Sao_Paulo';
  model: string | null;
  runs: Run[];
  /** Messages Daniel typed to the orchestrator: when, never what. */
  prompts: string[];
  checkpoints: Checkpoint[];
  commits: Commit[];
  events: BoardEvent[];
  workflows: Workflow[];
}

// ── Stations and lanes ───────────────────────────────────────────────────

export const STATIONS: Record<Code, { label: string; stock: string }> = {
  OR: { label: 'Orquestrador', stock: 'orquestrador' },
  EX: { label: 'Consulta do orquestrador', stock: 'nichos' },
  NI: { label: 'Pesquisa de nichos', stock: 'nichos' },
  PE: { label: 'Pesquisa', stock: 'pesquisa' },
  DE: { label: 'Design', stock: 'design' },
  CR: { label: 'Crítica', stock: 'critica' },
  DE2: { label: 'Revisão do design', stock: 'design' },
  BU: { label: 'Build', stock: 'build' },
  PO: { label: 'Polimento e compartilhamento', stock: 'polimento' },
  DP: { label: 'Deploy', stock: 'deploy' },
};

/** Phase order for the key and the livro de bordo. */
export const CODE_ORDER: Code[] = ['OR', 'EX', 'NI', 'PE', 'DE', 'CR', 'DE2', 'BU', 'PO', 'DP'];

export interface LaneDef {
  id: LaneId;
  label: string;
  /** Two-letter key for the transposed board's header. */
  key: string;
  kind: 'daniel' | 'orquestrador' | 'nichos' | 'demo' | 'arte';
  /** Where the line's product lives, if it shipped one. */
  href?: string;
}

export const LANES: LaneDef[] = [
  { id: 'daniel', label: 'Daniel', key: 'Da', kind: 'daniel' },
  { id: 'orquestrador', label: 'Orquestrador', key: 'OR', kind: 'orquestrador' },
  { id: 'nichos', label: 'Nichos', key: 'NI', kind: 'nichos' },
  { id: 'conta-de-tokens', label: 'Conta de tokens', key: 'co', kind: 'demo', href: '/demo/conta-de-tokens' },
  { id: 'raio-de-explosao', label: 'Raio de explosão', key: 'ra', kind: 'demo', href: '/demo/raio-de-explosao' },
  { id: 'curtailment-br', label: 'Curtailment', key: 'cu', kind: 'demo', href: '/demo/curtailment-br' },
  { id: 'pix-na-minha-cidade', label: 'Pix na cidade', key: 'px', kind: 'demo', href: '/demo/pix-na-minha-cidade' },
  { id: 'bastidores', label: 'Bastidores', key: 'ba', kind: 'demo', href: '/demo/bastidores' },
  { id: 'arte', label: 'Direção de arte', key: 'AD', kind: 'arte' },
];

/** The slug a label names; caixa-preta shares the lane its replacement took. */
const SLUG_LANE: Record<string, LaneId> = {
  'conta-de-tokens': 'conta-de-tokens',
  'raio-de-explosao': 'raio-de-explosao',
  'curtailment-br': 'curtailment-br',
  'pix-na-minha-cidade': 'pix-na-minha-cidade',
  'caixa-preta': 'bastidores',
  bastidores: 'bastidores',
};

const SHORT: Record<string, string> = {
  'conta-de-tokens': 'conta',
  'raio-de-explosao': 'raio',
  'curtailment-br': 'curtailment',
  'pix-na-minha-cidade': 'pix',
  'caixa-preta': 'caixa-preta',
  bastidores: 'bastidores',
};

const LABEL_RULES: [RegExp, Code][] = [
  [/^research:([a-z0-9-]+)$/, 'PE'],
  [/^design:([a-z0-9-]+)$/, 'DE'],
  [/^revise:([a-z0-9-]+)$/, 'DE2'],
  [/^build:([a-z0-9-]+)$/, 'BU'],
  [/^critique:([a-z0-9-]+)$/, 'CR'],
  [/^(?:fix|polish|share):([a-z0-9-]+)$/, 'PO'],
  [/^deploy:([a-z0-9-]+)$/, 'DP'],
];

/**
 * The station and lane of a workflow agent's label. An unknown label throws: the
 * extraction breaks rather than dropping a card into a silent "other" (BRIEF).
 */
export function classify(label: string): { code: Code; lane: LaneId; slug: string | null } {
  if (label === 'art-director') return { code: 'CR', lane: 'arte', slug: null };
  if (label === 'deploy') return { code: 'DP', lane: 'orquestrador', slug: null };
  for (const [re, code] of LABEL_RULES) {
    const m = re.exec(label);
    if (!m) continue;
    const lane = SLUG_LANE[m[1]];
    if (!lane) throw new Error(`Unknown showcase slug in agent label "${label}"`);
    return { code, lane, slug: m[1] };
  }
  throw new Error(`Unknown agent label "${label}": map it in data.ts before extracting`);
}

export function runId(code: Code, slug: string | null, attempt: number, fallback: string): string {
  const base = `${code.toLowerCase()}-${slug ? SHORT[slug] : fallback}`;
  return attempt > 1 ? `${base}-${attempt}` : base;
}

// ── Time ─────────────────────────────────────────────────────────────────

export const PITCH_MS = 5 * 60_000;
const ms = (iso: string) => Date.parse(iso);

const clockFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const clockSecFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const dayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' });
const yearFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' });

/** "13:05", Brasília time. */
export const clock = (t: string | number) => clockFmt.format(new Date(t));
export const clockSec = (t: string | number) => clockSecFmt.format(new Date(t));
/** "25 set". */
export const day = (t: string | number) => dayFmt.format(new Date(t)).replace('.', '').replace(' de ', ' ');
export const dayYear = (t: string | number) => `${day(t)} ${yearFmt.format(new Date(t))}`;
/** Calendar day in Brasília, for comparing. */
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
const dayKey = (t: number) => dayKeyFmt.format(new Date(t));

/** "1 h 04 min", "25 min 46 s", "28 s", "2 d 18 h". */
export function duration(msv: number): string {
  const s = Math.max(0, Math.round(msv / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${s % 60 ? ` ${String(s % 60).padStart(2, '0')} s` : ''}`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${String(m % 60).padStart(2, '0')} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

/** Duration without seconds, for the sentence: "7 h 42 min". */
export function durationShort(msv: number): string {
  const m = Math.round(msv / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')} min`;
}

const nf = new Intl.NumberFormat('pt-BR');
export const int = (n: number) => nf.format(n);
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
/** "17,5 mi", "812 mil". */
export function tokensShort(n: number): string {
  if (n >= 1e9) return `${nf1.format(n / 1e9)} bi`;
  if (n >= 1e6) return `${nf1.format(n / 1e6)} mi`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} mil`;
  return int(n);
}
export const pct = (x: number) => `${nf1.format(x * 100)}%`;

// ── Sums ─────────────────────────────────────────────────────────────────

export const runStart = (r: Run) => ms(r.spans[0][0]);
export const runEnd = (r: Run) => ms(r.spans[r.spans.length - 1][1]);
export const runActiveMs = (r: Run) => r.spans.reduce((a, [s, e]) => a + (ms(e) - ms(s)), 0);
export const processed = (r: Run) => r.tokens.input + r.tokens.cacheWrite + r.tokens.cacheRead;
export const toolCalls = (r: Run) => Object.values(r.tools).reduce((a, b) => a + b, 0);
export const isAgent = (r: Run) => r.code !== 'OR';

/** How long the line waited on a checkpoint: to the answer, to Daniel's return, or to `asOf`. */
export function waitMs(c: Checkpoint, asOf: string): number {
  return ms(c.answeredAt ?? c.resumedAt ?? asOf) - ms(c.at);
}
export const waitEnd = (c: Checkpoint, asOf: string) => c.answeredAt ?? c.resumedAt ?? asOf;

/** Length of the union of intervals. */
function union(intervals: [number, number][]): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const [s, e] of sorted) {
    if (!cur || s > cur[1]) {
      if (cur) total += cur[1] - cur[0];
      cur = [s, e];
    } else cur[1] = Math.max(cur[1], e);
  }
  if (cur) total += cur[1] - cur[0];
  return total;
}

export interface Totals {
  /** Wall-clock time with at least one agent or the orchestrator working. */
  activeMs: number;
  /** Sum of every agent's working time. */
  agentMs: number;
  /** From the first to the last thing on the board. */
  spanMs: number;
  firstAt: number;
  lastAt: number;
  days: number;
  agents: number;
  phases: number;
  checkpoints: number;
  decided: number;
  questions: number;
  answered: number;
  followedRecommendation: number;
  withRecommendation: number;
  waitMs: number;
  longestWait: Checkpoint | null;
  toolCalls: number;
  tools: [string, number][];
  tokensProcessed: number;
  tokensCacheRead: number;
  byPhase: { code: Code; processed: number; cacheRead: number; runs: number }[];
  commits: number;
  filesTouched: number;
  notViable: number;
  sentBack: number;
  restarts: number;
  blocked: number;
  toolErrors: number;
  longestRun: Run | null;
  open: number;
}

const totalsCache = new WeakMap<Bastidores, Totals>();

/** Every sum the page shows; computed once per data object. */
export function totals(d: Bastidores): Totals {
  let t = totalsCache.get(d);
  if (!t) totalsCache.set(d, (t = computeTotals(d)));
  return t;
}

function computeTotals(d: Bastidores): Totals {
  const agents = d.runs.filter(isAgent);
  const tools = new Map<string, number>();
  for (const r of d.runs) for (const [k, v] of Object.entries(r.tools)) tools.set(k, (tools.get(k) ?? 0) + v);
  const byPhase = CODE_ORDER.map((code) => {
    const rs = d.runs.filter((r) => r.code === code);
    return {
      code,
      runs: rs.length,
      processed: rs.reduce((a, r) => a + processed(r), 0),
      cacheRead: rs.reduce((a, r) => a + r.tokens.cacheRead, 0),
    };
  }).filter((p) => p.runs > 0);
  const answeredCps = d.checkpoints.filter((c) => c.status === 'respondida');
  const qs = d.checkpoints.flatMap((c) => c.questions);
  const answeredQs = answeredCps.flatMap((c) => c.questions);
  const withRec = answeredQs.filter((q) => q.recommended);
  const times = [
    ...d.runs.flatMap((r) => [runStart(r), runEnd(r)]),
    ...d.prompts.map(ms),
    ...d.checkpoints.flatMap((c) => [ms(c.at), ms(waitEnd(c, d.asOf))]),
    ...d.commits.map((c) => ms(c.at)),
  ];
  const firstAt = Math.min(...times);
  const lastAt = Math.max(...times);
  const files = new Set([...d.runs.flatMap((r) => r.files), ...d.commits.flatMap((c) => c.files)]);
  let longestWait: Checkpoint | null = null;
  for (const c of d.checkpoints) if (!longestWait || waitMs(c, d.asOf) > waitMs(longestWait, d.asOf)) longestWait = c;
  let longestRun: Run | null = null;
  for (const r of agents) if (!longestRun || runActiveMs(r) > runActiveMs(longestRun)) longestRun = r;
  const phaseCodes = new Set(agents.filter((r) => r.code !== 'EX').map((r) => r.code));
  return {
    activeMs: union(d.runs.flatMap((r) => r.spans.map(([s, e]) => [ms(s), ms(e)] as [number, number]))),
    agentMs: agents.reduce((a, r) => a + runActiveMs(r), 0),
    spanMs: lastAt - firstAt,
    firstAt,
    lastAt,
    days: new Set(times.map(dayKey)).size,
    agents: agents.length,
    phases: phaseCodes.size,
    checkpoints: d.checkpoints.length,
    decided: answeredCps.length,
    questions: qs.length,
    answered: answeredQs.length,
    followedRecommendation: withRec.filter((q) => q.recommended && q.chosen.includes(q.recommended)).length,
    withRecommendation: withRec.length,
    waitMs: d.checkpoints.reduce((a, c) => a + waitMs(c, d.asOf), 0),
    longestWait,
    toolCalls: [...tools.values()].reduce((a, b) => a + b, 0),
    tools: [...tools.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    tokensProcessed: d.runs.reduce((a, r) => a + processed(r), 0),
    tokensCacheRead: d.runs.reduce((a, r) => a + r.tokens.cacheRead, 0),
    byPhase,
    commits: d.commits.length,
    filesTouched: files.size,
    notViable: d.runs.filter((r) => r.result.viable === false).length,
    sentBack: d.runs.filter((r) => r.result.revise === true).length,
    restarts: d.runs.filter((r) => r.flags.stalledAfterS !== undefined).length,
    blocked: d.runs.filter((r) => r.flags.blocked).length,
    toolErrors: d.runs.reduce((a, r) => a + r.toolErrors, 0),
    longestRun,
    open: d.runs.filter((r) => r.flags.open).length,
  };
}

/** The lines of work that reached a build: the showcases this board made. */
export function shippedLines(d: Bastidores): LaneId[] {
  return LANES.filter((l) => l.kind === 'demo' && d.runs.some((r) => r.lane === l.id && r.code === 'BU')).map((l) => l.id);
}

// ── The answer sentence ──────────────────────────────────────────────────

export type Piece = { t: 'text' | 'fig' | 'human' | 'stop'; v: string };

const COUNT_WORDS = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const countFem = (n: number) => COUNT_WORDS[n] ?? String(n);

/**
 * The first-viewport sentence, generated from the data (BRIEF). Clauses about a
 * refusal or a send-back drop out when the data has none.
 */
export function answerSentence(d: Bastidores): Piece[] {
  const t = totals(d);
  const demos = shippedLines(d).length;
  const p: Piece[] = [];
  const text = (v: string) => p.push({ t: 'text', v });
  const fig = (v: string) => p.push({ t: 'fig', v });
  text('Em ');
  fig(durationShort(t.activeMs));
  text(t.days > 1 ? ` de trabalho, espalhadas por ${t.days} dias, ` : ' de trabalho, ');
  fig(`${t.agents} agentes`);
  text(` de IA pesquisaram, desenharam e construíram ${demos === 1 ? 'esta' : 'estas'} `);
  fig(demos === 1 ? 'demo' : `${demos} demos`);
  text(' em ');
  fig(`${t.phases} fases`);
  text('; Daniel decidiu em ');
  p.push({ t: 'human', v: `${t.decided} ${t.decided === 1 ? 'ponto' : 'pontos'}` });
  text(t.decided > 0 ? ' — os agentes pararam e esperaram por ele' : '');
  const tail: Piece[][] = [];
  if (t.notViable > 0) {
    tail.push([
      { t: 'text', v: `${t.notViable === 1 ? 'uma pesquisa' : `${countFem(t.notViable)} pesquisas`} ${t.notViable === 1 ? 'concluiu' : 'concluíram'} que ${t.notViable === 1 ? 'uma demo' : 'as demos'} ` },
      { t: 'stop', v: t.notViable === 1 ? 'não era viável' : 'não eram viáveis' },
    ]);
  }
  if (t.sentBack > 0) {
    tail.push([
      { t: 'text', v: `uma revisão cruzada devolveu ${t.sentBack === 1 ? 'uma direção' : `as ${t.sentBack} primeiras direções`}` },
    ]);
  }
  tail.forEach((clause, i) => {
    text(i === 0 ? (t.decided > 0 ? ' —, ' : ', ') : ' e ');
    p.push(...clause);
  });
  text('.');
  // Merge neighbouring text pieces.
  return p.reduce<Piece[]>((acc, x) => {
    const last = acc[acc.length - 1];
    if (x.v === '') return acc;
    if (last && last.t === 'text' && x.t === 'text') last.v += x.v;
    else acc.push({ ...x });
    return acc;
  }, []);
}

export const plain = (pieces: Piece[]) => pieces.map((x) => x.v).join('');

// ── The board's time axis ────────────────────────────────────────────────

export type Column =
  | { kind: 'pitch'; start: number }
  | { kind: 'break'; from: number; to: number; wait: boolean };

/** A pitch is 1 unit wide; a break is this many. */
export const BREAK_UNITS = 1.2;
/** Idle pitches (no agent, no wait) collapse from this many in a row. */
const IDLE_COLLAPSE = 4;
/** A wait longer than this many pitches keeps its head and tail and collapses its middle. */
const WAIT_KEEP_HEAD = 3;
const WAIT_KEEP_TAIL = 1;
const WAIT_COLLAPSE = 8;

/**
 * One column per five-minute pitch in Brasília time, with idle stretches
 * collapsed into a break. Short waits for Daniel stay whole: waiting is the
 * story. A wait of hours keeps its head and tail and breaks in the middle, on
 * the stop stripes.
 */
export function columns(d: Bastidores): Column[] {
  const busy: [number, number][] = [
    ...d.runs.flatMap((r) => r.spans.map(([s, e]) => [ms(s), ms(e)] as [number, number])),
    ...d.prompts.map((p) => [ms(p), ms(p) + 1] as [number, number]),
    ...d.commits.map((c) => [ms(c.at), ms(c.at) + 1] as [number, number]),
    ...d.checkpoints.map((c) => [ms(c.at), ms(c.at) + 1] as [number, number]),
    ...d.checkpoints.map((c) => [ms(waitEnd(c, d.asOf)) - 1, ms(waitEnd(c, d.asOf))] as [number, number]),
  ];
  const waits = d.checkpoints.map((c) => [ms(c.at), ms(waitEnd(c, d.asOf))] as [number, number]);
  const all = busy.flat();
  const t0 = Math.floor(Math.min(...all) / PITCH_MS) * PITCH_MS;
  const t1 = Math.ceil(Math.max(...all) / PITCH_MS) * PITCH_MS;
  const n = Math.max(1, (t1 - t0) / PITCH_MS);
  const overlaps = (list: [number, number][], s: number) => list.some(([a, b]) => a < s + PITCH_MS && b > s);
  const state: ('busy' | 'wait' | 'idle')[] = [];
  for (let i = 0; i < n; i++) {
    const s = t0 + i * PITCH_MS;
    state.push(overlaps(busy, s) ? 'busy' : overlaps(waits, s) ? 'wait' : 'idle');
  }
  const out: Column[] = [];
  let i = 0;
  while (i < n) {
    const kind = state[i];
    let j = i;
    while (j < n && state[j] === kind) j++;
    const len = j - i;
    const at = (k: number) => t0 + k * PITCH_MS;
    if (kind === 'idle' && len >= IDLE_COLLAPSE) {
      out.push({ kind: 'break', from: at(i), to: at(j), wait: false });
    } else if (kind === 'wait' && len >= WAIT_COLLAPSE) {
      for (let k = i; k < i + WAIT_KEEP_HEAD; k++) out.push({ kind: 'pitch', start: at(k) });
      out.push({ kind: 'break', from: at(i + WAIT_KEEP_HEAD), to: at(j - WAIT_KEEP_TAIL), wait: true });
      for (let k = j - WAIT_KEEP_TAIL; k < j; k++) out.push({ kind: 'pitch', start: at(k) });
    } else {
      for (let k = i; k < j; k++) out.push({ kind: 'pitch', start: at(k) });
    }
    i = j;
  }
  return out;
}

export interface Axis {
  columns: Column[];
  /** Left edge of each column, in units. */
  offsets: number[];
  width: number;
  /** Position of an instant, in units. */
  at: (t: number | string) => number;
}

export function axis(cols: Column[]): Axis {
  const offsets: number[] = [];
  let x = 0;
  for (const c of cols) {
    offsets.push(x);
    x += c.kind === 'pitch' ? 1 : BREAK_UNITS;
  }
  const width = x;
  const at = (tv: number | string) => {
    const t = typeof tv === 'string' ? ms(tv) : tv;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const [from, to, w] = c.kind === 'pitch' ? [c.start, c.start + PITCH_MS, 1] : [c.from, c.to, BREAK_UNITS];
      if (t < from) return offsets[i];
      if (t <= to) return offsets[i] + ((t - from) / (to - from)) * w;
    }
    return width;
  };
  return { columns: cols, offsets, width, at };
}

/** Agents working in each column (the andon strip's number). */
export function workingPerColumn(d: Bastidores, cols: Column[]): number[] {
  return cols.map((c) => {
    if (c.kind === 'break') return 0;
    const s = c.start;
    return d.runs.filter(
      (r) => isAgent(r) && r.spans.some(([a, b]) => ms(a) < s + PITCH_MS && ms(b) > s),
    ).length;
  });
}

// ── Privacy ──────────────────────────────────────────────────────────────

/** Longest free-text field allowed in the file. */
export const MAX_TEXT = 200;

const FORBIDDEN: [RegExp, string][] = [
  [/dannk/i, 'Windows username'],
  [/iasquare/i, 'e-mail name'],
  [/Users/, '"Users" (a home path)'],
  [/C:/, 'a Windows drive'],
  [/AppData/i, 'AppData'],
  [/@/, 'an "@" (e-mail or handle)'],
  [/sk-/, 'an API key prefix'],
  [/Bearer/i, 'a bearer token'],
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, 'a UUID'],
  [/\b(?:req|msg|toolu)_[A-Za-z0-9]/, 'an API id'],
  [/\+55/, 'a phone number'],
  [/\d{10,}/, 'a long digit run'],
  [/dossi/i, 'the word dossier'],
  [/recon\//, 'a recon path'],
  [/scratchpad/i, 'a scratchpad path'],
  [/\.claude\//, 'a .claude path'],
];

/** Everything wrong with a serialized data file, or nothing. `extra` adds local names to refuse. */
export function privacyProblems(json: string, extra: string[] = []): string[] {
  const problems: string[] = [];
  for (const [re, what] of FORBIDDEN) {
    const m = re.exec(json);
    if (m) problems.push(`${what}: …${json.slice(Math.max(0, m.index - 30), m.index + 30)}…`);
  }
  for (const word of extra) {
    if (word && json.toLowerCase().includes(word.toLowerCase())) problems.push(`local name "${word.slice(0, 2)}…"`);
  }
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string' && v.length > MAX_TEXT) problems.push(`${path}: ${v.length} characters of text`);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(JSON.parse(json), '$');
  return problems;
}

/** True when a short string can be published as is. */
export const publishable = (s: string) => privacyProblems(JSON.stringify(s)).length === 0;
