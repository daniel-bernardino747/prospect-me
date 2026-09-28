/**
 * The words a shared state carries: the page title, the link preview's
 * description and the short text of the share links. Generated from the data;
 * the only prose is from `anotacoes.ts`.
 */

import { resultNote } from './anotacoes';
import {
  answerSentence,
  type Bastidores,
  type Checkpoint,
  clock,
  type Commit,
  day,
  duration,
  int,
  LANES,
  plain,
  processed,
  type Run,
  runActiveMs,
  shippedLines,
  STATIONS,
  tokensShort,
  toolCalls,
  totals,
  waitMs,
} from './data';

export type Selected =
  | { kind: 'run'; id: string; run: Run }
  | { kind: 'stop'; id: string; cp: Checkpoint; index: number }
  | { kind: 'commit'; id: string; commit: Commit };

export const commitId = (c: Commit) => `c-${c.hash}`;

export function selectionIds(d: Bastidores): string[] {
  return [...d.runs.map((r) => r.id), ...d.checkpoints.map((c) => c.id), ...d.commits.map(commitId)];
}

export function findSelected(d: Bastidores, id: string | null | undefined): Selected | null {
  if (!id) return null;
  const run = d.runs.find((r) => r.id === id);
  if (run) return { kind: 'run', id, run };
  const index = d.checkpoints.findIndex((c) => c.id === id);
  if (index >= 0) return { kind: 'stop', id, cp: d.checkpoints[index], index };
  const commit = d.commits.find((c) => commitId(c) === id);
  if (commit) return { kind: 'commit', id, commit };
  return null;
}

export const laneLabel = (r: Run) => LANES.find((l) => l.id === r.lane)!.label;
export const stopLabel = (cp: Checkpoint) => cp.id.toUpperCase();

/** "Pesquisa · Pix na cidade". */
export function runTitle(r: Run): string {
  if (r.code === 'OR') return `Orquestrador, ${day(r.spans[0][0])} ${clock(r.spans[0][0])}`;
  if (r.code === 'NI' || r.code === 'EX') return STATIONS[r.code].label;
  if (r.lane === 'arte') return `Crítica cruzada · Direção de arte`;
  const lane = r.label.includes('caixa-preta') ? 'Caixa-preta' : laneLabel(r);
  return `${STATIONS[r.code].label}${r.attempt > 1 ? ` (tentativa ${r.attempt})` : ''} · ${lane}`;
}

export function stopChoices(cp: Checkpoint): string {
  if (cp.status !== 'respondida') return cp.questions.map((q) => q.header).join(', ');
  return cp.questions
    .map((q) => `${q.header}: ${q.chosen.length ? q.chosen.join(', ') : q.own ? 'resposta própria' : 'sem resposta'}`)
    .join('; ');
}

export interface ShareWords {
  title: string;
  description: string;
  /** The text that goes before the link in WhatsApp and X. */
  short: string;
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

export function shareWords(d: Bastidores, sel: Selected | null): ShareWords {
  const t = totals(d);
  const demos = shippedLines(d).length;
  if (!sel) {
    return {
      title: 'Bastidores',
      description: clip(plain(answerSentence(d)), 300),
      short: `Como ${demos} demos foram feitas por ${t.agents} agentes de IA, e onde a linha parou para Daniel decidir:`,
    };
  }
  if (sel.kind === 'run') {
    const r = sel.run;
    const facts = `${duration(runActiveMs(r))} trabalhando, ${int(toolCalls(r))} chamadas de ferramenta, ${tokensShort(processed(r))} de tokens processados`;
    return {
      title: `Bastidores: ${runTitle(r)}`,
      description: clip(`${r.label}: ${facts}. ${resultNote(r)}`, 300),
      short: `Um cartão do quadro de como ${demos} demos foram feitas por agentes: ${r.label}, ${facts}.`,
    };
  }
  if (sel.kind === 'stop') {
    const w = duration(waitMs(sel.cp, d.asOf));
    const head =
      sel.cp.status === 'respondida'
        ? `A linha parou ${w} esperando Daniel decidir`
        : sel.cp.status === 'interrompida'
          ? `A linha parou ${w}: a sessão terminou antes da resposta`
          : `A linha está parada esperando Daniel`;
    return {
      title: `Bastidores: a parada ${stopLabel(sel.cp)}`,
      description: clip(`${head}. ${stopChoices(sel.cp)}.`, 300),
      short: `${head} (${stopLabel(sel.cp)}), no quadro de como ${demos} demos foram feitas por agentes:`,
    };
  }
  const c = sel.commit;
  return {
    title: `Bastidores: commit ${c.hash}`,
    description: clip(`${c.subject}. ${c.filesChanged} arquivos, +${int(c.insertions)} −${int(c.deletions)}, em ${c.branch}.`, 300),
    short: `O commit ${c.hash} no quadro de como ${demos} demos foram feitas por agentes:`,
  };
}
