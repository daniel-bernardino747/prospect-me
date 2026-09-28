/**
 * Every sentence of prose the board shows about a card or an event, written by
 * hand and reviewed by Daniel (BRIEF: nothing is copied from a transcript).
 * At most 160 characters each; `anotacoes.test.ts` holds them to it.
 */

import type { Code, EventKind, Run } from './data';

/** What an agent at each station was asked to do. */
export const STATION_NOTES: Record<Code, string> = {
  OR: 'A sessão principal: planejou, fez as perguntas a Daniel, lançou os workflows e juntou os resultados.',
  EX: 'Uma consulta rápida que o orquestrador mandou fazer antes de seguir.',
  NI: 'Levantou nichos em alta e propôs candidatos a demo, com fontes.',
  PE: 'Verificou dados, licenças e o usuário da demo e escreveu o BRIEF.md.',
  DE: 'Desenhou a direção visual com o impeccable e escreveu PRODUCT.md e DESIGN.md.',
  CR: 'Leu o trabalho dos outros com olhos frescos e apontou o que precisava mudar.',
  DE2: 'Refez a direção que a crítica cruzada devolveu.',
  BU: 'Implementou a demo na sua própria worktree git, com capturas de tela e autocrítica.',
  PO: 'Aplicou a crítica, desenhou a imagem de compartilhamento e os links de compartilhar.',
  DP: 'Publicou a demo.',
};

/** The one-line caption of each kind of event. */
export const EVENT_NOTES: Record<EventKind, string> = {
  bloqueio: 'Um classificador de segurança parou a escrita de um arquivo; o agente não tentou de novo.',
  inviavel: 'A pesquisa concluiu que a demo não era viável: os dados não tinham licença para reprodução.',
  'erro-script': 'O script do workflow não tratou o resultado vazio e registrou um erro; as outras linhas seguiram.',
  devolvida: 'A crítica cruzada devolveu esta direção: as quatro convergiam num mesmo molde.',
  reinicio: 'O workflow viu o agente parado, sem progresso, e o reiniciou numa nova tentativa.',
  deploy: 'A página foi publicada.',
};

/** The line the ficha prints under "Resultado". */
export function resultNote(r: Run): string {
  if (r.flags.incomplete) return 'O transcrito deste agente não existe mais: dados incompletos, nada estimado.';
  if (r.result.viable === false) return 'Concluiu que a demo não era viável: sem licença para os dados.';
  if (r.result.revise) return 'Entregou a direção; a crítica cruzada a devolveu para revisão.';
  if (r.flags.stalledAfterS !== undefined) return 'Parou de progredir; o workflow o reiniciou numa nova tentativa.';
  if (r.flags.open) return 'Em andamento quando os dados foram extraídos.';
  if (r.result.findings) {
    const f = r.result.findings;
    return `Apontou ${f.P0 + f.P1 + f.P2 + f.P3} problemas: ${f.P0} graves, ${f.P1} importantes, ${f.P2 + f.P3} de acabamento.`;
  }
  if (r.result.done === true) return 'Concluiu e commitou na sua branch.';
  if (r.result.done === false) return 'Terminou sem concluir.';
  if (r.result.viable === true) return 'Concluiu que a demo era viável.';
  return 'Concluiu.';
}

/** What the end of each row says, if the line did not ship a page. */
export const LANE_OUTCOME: Partial<Record<string, string>> = {
  daniel: 'decidiu',
  orquestrador: 'dirigiu',
  nichos: 'propôs',
  arte: 'devolveu',
};
