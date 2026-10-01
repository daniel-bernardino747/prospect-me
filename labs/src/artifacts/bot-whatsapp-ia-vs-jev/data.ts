/**
 * The data behind "Bot de WhatsApp: IA × Jev", copied from a zap-bench
 * `validation` round by `scripts/bot-whatsapp-ia-vs-jev.ts`, and every rule the
 * page computes from it. Pure: the server render and the tests call the same
 * functions. The contract is zap-bench's `src/export/schema.ts`; these types
 * mirror it.
 */

export type Mode = 'bruto' | 'guardrails';
export type Persona = 'padrao' | 'dificil';

interface Tally {
  runs: number;
  passed: number;
}

export interface SummaryRow extends Tally {
  brain: string;
  mode: Mode;
  persona: Persona;
  singleTurn: Tally;
  conversation: Tally;
  errors: number;
  unconfirmedActions: number;
  violationsGenerated: Record<string, number>;
  violationsSent: Record<string, number>;
  botMessagesPerConversation: number;
  toolCallsPerRun: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  costPerConversationUSD: number;
}

export interface Turn {
  turn: number;
  role: 'paciente' | 'bot' | 'recepcao' | 'funcao';
  text: string;
  original?: string;
  discarded?: boolean;
  ok?: boolean;
}

export interface Transcript {
  scenarioId: string;
  brain: string;
  mode: Mode;
  persona: Persona;
  passed: boolean;
  outcome: string;
  failedChecks: { id: string; detail?: string }[];
  turns: Turn[];
}

export interface Scenario {
  id: string;
  tarefa: string;
  kind: 'uma-fala' | 'conversa';
  title: string;
}

export interface BotData {
  version: 1;
  generatedAt: string;
  runAt: string;
  /** `dev` only comes from zap-bench's `export --previa`: the cases Jev was tuned on, never served in production. */
  split: 'validation' | 'dev';
  synthetic: boolean;
  repeats: number;
  brains: { id: string; label: string; model: string }[];
  patient: { id: string; model: string };
  judge: { id: string; model: string } | null;
  tasks: { id: string; label: string; kind: 'uma-fala' | 'conversa'; scenarios: number }[];
  scenarios: Scenario[];
  summary: SummaryRow[];
  byTask: (Tally & { brain: string; mode: Mode; persona: Persona; tarefa: string })[];
  transcripts: Transcript[];
}

/** Guichê order on the panel: the three LLMs, then Jev, then Jev with its writer, then anything else (the fake brain). */
const BRAIN_ORDER = ['sonnet', 'haiku', 'gpt', 'jev', 'jev-redator'];
const LLMS = new Set(['sonnet', 'haiku', 'gpt']);
/** Jev decides and acts; an LLM only rewrites its message (zap-bench ADR-0011). */
const HYBRID = 'jev-redator';

export const MODES: Mode[] = ['bruto', 'guardrails'];
export const PERSONAS: Persona[] = ['padrao', 'dificil'];

/** Modes and patients this round has at least one run of: switches and columns offer only these. */
export function ranModes(data: BotData): Mode[] {
  return MODES.filter((m) => data.summary.some((r) => r.mode === m));
}

export function ranPersonas(data: BotData): Persona[] {
  return PERSONAS.filter((p) => data.summary.some((r) => r.persona === p));
}

const COUNT_WORD = ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis'];

/** "construído cinco vezes" */
export function timesBuilt(data: BotData): string {
  const n = data.brains.length;
  return n === 1 ? 'uma vez' : `${COUNT_WORD[n] ?? n} vezes`;
}

export const MODE_LABEL: Record<Mode, string> = { bruto: 'Sem guardrails', guardrails: 'Com guardrails' };
export const PERSONA_LABEL: Record<Persona, string> = { padrao: 'Paciente padrão', dificil: 'Paciente difícil' };

/** The ticket letter of each queue, as on a waiting-room dispenser. */
export const QUEUE_LETTER: Record<string, string> = {
  duvida: 'D',
  inicio_agendamento: 'I',
  emergencia: 'E',
  fora_do_escopo: 'F',
  adversarial: 'X',
  data_relativa: 'T',
  politica: 'P',
  midia: 'M',
  agendar: 'A',
  remarcar: 'R',
  cancelar: 'C',
  handoff: 'H',
};

const TASK_ORDER = Object.keys(QUEUE_LETTER);

export const VIOLATION_LABEL: Record<string, string> = {
  preco: 'Preço que não veio de consulta',
  profissional: 'Profissional que não veio de consulta',
  horario: 'Horário que não veio da agenda',
  convenio: 'Convênio citado sem verificar',
  politica: 'Política citada sem consultar',
  acao_nao_executada: 'Disse que fez e não fez',
  termo_proibido: 'Remédio, dose ou ofensa',
};

const CHECK_LABEL: Record<string, string> = {
  sem_violacao: 'Afirmou algo sem lastro',
  sem_acao_perigosa: 'Agiu sem confirmação',
  nao_chama: 'Chamou função que não devia',
  agenda_intacta: 'Mexeu na agenda',
  resposta_contem: 'Faltou a informação certa',
  resposta_nao_contem: 'Vazou o que não devia',
  resumo_nao_contem: 'Resumo ao atendente contaminado',
  ou: 'Não consultou nem admitiu não saber',
  agenda_final: 'Agenda final errada',
  sem_handoff: 'Chamou humano sem motivo',
  handoff: 'Não chamou humano',
  resumo_contem: 'Resumo ao atendente incompleto',
  calado_depois_do_humano: 'Falou depois que o humano assumiu',
  paciente_nao_desistiu: 'Paciente desistiu',
};

export function checkLabel(id: string): string {
  if (CHECK_LABEL[id]) return CHECK_LABEL[id];
  if (id.startsWith('chama ')) return `Não chamou ${id.slice(6).split(' ')[0]}`;
  if (id.startsWith('handoff ate o turno')) return 'Demorou para chamar humano';
  return id;
}

export function guiches(data: BotData) {
  const rank = (id: string) => (BRAIN_ORDER.includes(id) ? BRAIN_ORDER.indexOf(id) : BRAIN_ORDER.length);
  return [...data.brains].sort((a, b) => rank(a.id) - rank(b.id)).map((b, i) => ({ ...b, number: i + 1 }));
}

export function pct(t: Tally | undefined): number | null {
  return t && t.runs > 0 ? Math.round((100 * t.passed) / t.runs) : null;
}

export function cell(data: BotData, brain: string, mode: Mode, persona: Persona): SummaryRow | undefined {
  return data.summary.find((r) => r.brain === brain && r.mode === mode && r.persona === persona);
}

export type Answer =
  | {
      kind: 'comparison';
      /** Without guardrails when the round has it; otherwise the mode that ran. */
      mode: Mode;
      leader: { label: string; pct: number };
      trailer: { label: string; pct: number };
      runs: number;
      gapBefore: number;
      /** The same comparison with guardrails, when the base is without them. */
      after: { gap: number; leader: string; trailer: string } | null;
      hybrid: { label: string; pct: number } | null;
    }
  | { kind: 'partial'; labels: string[]; before: number | null; after: number | null; runs: number };

/** The first-viewport answer, from the difficult patient: best LLM against Jev, before and after guardrails. */
export function answer(data: BotData): Answer {
  const brains = guiches(data);
  const hard = (id: string, mode: Mode) => pct(cell(data, id, mode, 'dificil'));
  const compares = (m: Mode) => brains.some((b) => LLMS.has(b.id) && hard(b.id, m) !== null) && brains.some((b) => b.id === 'jev' && hard(b.id, m) !== null);
  const mode: Mode | null = compares('bruto') ? 'bruto' : compares('guardrails') ? 'guardrails' : null;

  if (!mode) {
    const first = brains[0];
    return {
      kind: 'partial',
      labels: brains.map((b) => b.label),
      before: hard(first.id, 'bruto'),
      after: hard(first.id, 'guardrails'),
      runs: cell(data, first.id, 'bruto', 'dificil')?.runs ?? 0,
    };
  }

  const llms = brains.filter((b) => LLMS.has(b.id) && hard(b.id, mode) !== null);
  const jev = brains.find((b) => b.id === 'jev')!;
  const best = llms.reduce((a, b) => (hard(b.id, mode)! > hard(a.id, mode)! ? b : a));
  const [l, j] = [hard(best.id, mode)!, hard(jev.id, mode)!];
  const llmLeads = l >= j;
  const leader = llmLeads ? { label: best.label, pct: l } : { label: jev.label, pct: j };
  const trailer = llmLeads ? { label: jev.label, pct: j } : { label: best.label, pct: l };

  let after: { gap: number; leader: string; trailer: string } | null = null;
  if (mode === 'bruto') {
    const [lg, jg] = [hard(best.id, 'guardrails') ?? l, hard(jev.id, 'guardrails') ?? j];
    const afterLlmLeads = lg >= jg;
    after = { gap: Math.abs(lg - jg), leader: afterLlmLeads ? best.label : jev.label, trailer: afterLlmLeads ? jev.label : best.label };
  }

  const hybrid = brains.find((b) => b.id === HYBRID);
  const hybridPct = hybrid ? hard(hybrid.id, mode) : null;
  return {
    kind: 'comparison',
    mode,
    leader,
    trailer,
    runs: cell(data, best.id, mode, 'dificil')!.runs,
    gapBefore: Math.abs(l - j),
    after,
    hybrid: hybrid && hybridPct !== null ? { label: hybrid.label, pct: hybridPct } : null,
  };
}

export function answerText(a: Answer): string {
  if (a.kind === 'partial') {
    return `Rodada de teste: só ${a.labels.join(', ')} rodou. Com o paciente difícil, resolveu ${a.before ?? '—'}% dos ${a.runs} casos sem guardrails e ${a.after ?? '—'}% com.`;
  }
  const who = `Com um paciente que escreve errado e não tem paciência${a.mode === 'guardrails' ? ' e com guardrails' : ''}`;
  const head =
    a.leader.pct === a.trailer.pct
      ? `${who}, o ${a.leader.label} e o ${a.trailer.label} resolveram, cada um, ${a.leader.pct}% dos ${a.runs} casos.`
      : `${who}, o ${a.leader.label} resolveu ${a.leader.pct}% dos ${a.runs} casos e o ${a.trailer.label}, ${a.trailer.pct}%.`;
  const hybrid = a.hybrid ? ` O ${a.hybrid.label}, em que um LLM só reescreve o que o Jev decide, resolveu ${a.hybrid.pct}%.` : '';
  if (!a.after) return head + hybrid;
  if (a.after.leader !== a.leader.label) {
    return `${head}${hybrid} Com a mesma camada de segurança nos dois, o ${a.after.leader} passa à frente por ${a.after.gap} pontos.`;
  }
  const verb = a.after.gap < a.gapBefore ? 'cai para' : a.after.gap > a.gapBefore ? 'sobe para' : 'fica em';
  return `${head}${hybrid} Com a mesma camada de segurança nos dois, a diferença ${verb} ${a.after.gap} pontos.`;
}

export function orderedTasks(data: BotData) {
  return [...data.tasks].sort((a, b) => TASK_ORDER.indexOf(a.id) - TASK_ORDER.indexOf(b.id));
}

export function taskCell(data: BotData, brain: string, tarefa: string, mode: Mode, persona: Persona) {
  return data.byTask.find((r) => r.brain === brain && r.tarefa === tarefa && r.mode === mode && r.persona === persona);
}

/** Scenarios in queue order, each with its ticket code (E-001, X-003...). */
export function tickets(data: BotData) {
  const counters: Record<string, number> = {};
  return [...data.scenarios]
    .sort((a, b) => TASK_ORDER.indexOf(a.tarefa) - TASK_ORDER.indexOf(b.tarefa))
    .map((s) => {
      counters[s.tarefa] = (counters[s.tarefa] ?? 0) + 1;
      return { ...s, code: `${QUEUE_LETTER[s.tarefa] ?? '?'}-${String(counters[s.tarefa]).padStart(3, '0')}` };
    });
}

export interface Query {
  scenario: string;
  persona: Persona;
  mode: Mode;
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** The ticket being called. Defaults to the first adversarial case with the difficult patient, no guardrails. */
export function parseQuery(params: Record<string, string | string[] | undefined>, data: BotData): Query {
  const list = tickets(data);
  const asked = one(params.cenario);
  const fallback = list.find((s) => s.tarefa === 'adversarial') ?? list[0];
  const persona = one(params.persona);
  const mode = one(params.modo);
  // Prefer the difficult patient without guardrails, but only among what this round ran.
  const personas = ranPersonas(data);
  const modes = ranModes(data);
  return {
    scenario: list.some((s) => s.id === asked) ? asked! : fallback.id,
    persona: persona === 'padrao' || persona === 'dificil' ? persona : personas.includes('dificil') || !personas.length ? 'dificil' : personas[0],
    mode: mode === 'bruto' || mode === 'guardrails' ? mode : modes.includes('bruto') || !modes.length ? 'bruto' : modes[0],
  };
}

export function queryString(q: Query): string {
  return `?cenario=${encodeURIComponent(q.scenario)}&persona=${q.persona}&modo=${q.mode}#chamada`;
}

export function neighbors(data: BotData, id: string) {
  const list = tickets(data);
  const i = list.findIndex((s) => s.id === id);
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length], current: list[i] };
}

export function transcriptFor(data: BotData, q: Query, brain: string): Transcript | undefined {
  return data.transcripts.find((t) => t.scenarioId === q.scenario && t.brain === brain && t.mode === q.mode && t.persona === q.persona);
}

/** Violations summed over both patients: what the brain produced, and what reached the patient. */
export function receipt(data: BotData, brain: string) {
  const rows = data.summary.filter((r) => r.brain === brain);
  const sum = (mode: Mode, key: 'violationsGenerated' | 'violationsSent') => {
    const out: Record<string, number> = {};
    for (const r of rows.filter((x) => x.mode === mode)) for (const [k, v] of Object.entries(r[key])) out[k] = (out[k] ?? 0) + v;
    return out;
  };
  const kinds = Object.keys(VIOLATION_LABEL);
  const bruto = sum('bruto', 'violationsSent');
  const generated = sum('guardrails', 'violationsGenerated');
  const sent = sum('guardrails', 'violationsSent');
  const lines = kinds
    .map((k) => ({ kind: k, label: VIOLATION_LABEL[k], bruto: bruto[k] ?? 0, generated: generated[k] ?? 0, sent: sent[k] ?? 0 }))
    .filter((l) => l.bruto + l.generated + l.sent > 0);
  const runs = (mode: Mode) => rows.filter((r) => r.mode === mode).reduce((n, r) => n + r.runs, 0);
  return {
    lines,
    unconfirmed: rows.filter((r) => r.mode === 'bruto').reduce((n, r) => n + r.unconfirmedActions, 0),
    runsBruto: runs('bruto'),
    runsGuardrails: runs('guardrails'),
    totalBruto: lines.reduce((n, l) => n + l.bruto, 0),
    totalSent: lines.reduce((n, l) => n + l.sent, 0),
    totalGenerated: lines.reduce((n, l) => n + l.generated, 0),
  };
}

/** Waiting-room figures for one brain and mode, over both patients. */
export function wait(data: BotData, brain: string, mode: Mode) {
  const rows = data.summary.filter((r) => r.brain === brain && r.mode === mode);
  if (!rows.length) return null;
  const weight = (f: (r: SummaryRow) => number, by: (r: SummaryRow) => number) => {
    const total = rows.reduce((n, r) => n + by(r), 0);
    return total ? rows.reduce((n, r) => n + f(r) * by(r), 0) / total : 0;
  };
  return {
    messages: weight((r) => r.botMessagesPerConversation, (r) => r.conversation.runs),
    tools: weight((r) => r.toolCallsPerRun, (r) => r.runs),
    p50: Math.max(...rows.map((r) => r.latencyP50Ms)),
    p95: Math.max(...rows.map((r) => r.latencyP95Ms)),
    cost: weight((r) => r.costPerConversationUSD, (r) => r.conversation.runs),
    errors: rows.reduce((n, r) => n + r.errors, 0),
  };
}

export function seconds(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
}

export function usd(v: number): string {
  if (v === 0) return 'US$ 0';
  return `US$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}
