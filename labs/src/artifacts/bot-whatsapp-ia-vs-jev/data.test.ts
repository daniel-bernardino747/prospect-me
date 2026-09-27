import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  answer,
  answerText,
  type BotData,
  checkLabel,
  guiches,
  neighbors,
  parseQuery,
  pct,
  receipt,
  type SummaryRow,
  tickets,
  transcriptFor,
} from './data';

const DATA = JSON.parse(readFileSync(join(import.meta.dirname, 'data.json'), 'utf8')) as BotData;

function row(brain: string, mode: 'bruto' | 'guardrails', persona: 'padrao' | 'dificil', passed: number, runs = 20): SummaryRow {
  return {
    brain,
    mode,
    persona,
    runs,
    passed,
    singleTurn: { runs, passed },
    conversation: { runs: 0, passed: 0 },
    errors: 0,
    unconfirmedActions: 0,
    violationsGenerated: {},
    violationsSent: {},
    botMessagesPerConversation: 0,
    toolCallsPerRun: 0,
    latencyP50Ms: 0,
    latencyP95Ms: 0,
    costPerConversationUSD: 0,
  };
}

function withBrains(summary: SummaryRow[]): BotData {
  return {
    ...DATA,
    synthetic: false,
    brains: [
      { id: 'jev', label: 'Jev', model: 'jev' },
      { id: 'gpt', label: 'GPT', model: 'gpt' },
      { id: 'sonnet', label: 'Claude Sonnet 5', model: 'claude-sonnet-5' },
      { id: 'haiku', label: 'Claude Haiku 4.5', model: 'claude-haiku-4-5' },
    ],
    summary,
  };
}

describe('dados copiados do zap-bench', () => {
  it('são só da validation, e a rodada de teste vem marcada', () => {
    expect(DATA.split).toBe('validation');
    expect(DATA.synthetic).toBe(true);
    expect(DATA.transcripts.length).toBeGreaterThan(0);
  });

  it('não trazem telefone nem conta de produto', () => {
    const text = JSON.stringify(DATA);
    expect(text).not.toMatch(/55489999\d{5}/);
    expect(text).not.toMatch(/59,90|mensalidade/);
  });
});

describe('a frase da primeira tela', () => {
  it('na rodada de teste, diz que só o cérebro falso rodou', () => {
    expect(answerText(answer(DATA))).toMatch(/^Rodada de teste: só Regras \(falso, sem IA\) rodou\./);
  });

  it('LLM na frente, e a camada de segurança diminui a diferença', () => {
    const data = withBrains([
      row('sonnet', 'bruto', 'dificil', 14),
      row('haiku', 'bruto', 'dificil', 12),
      row('gpt', 'bruto', 'dificil', 13),
      row('jev', 'bruto', 'dificil', 10),
      row('sonnet', 'guardrails', 'dificil', 16),
      row('jev', 'guardrails', 'dificil', 15),
    ]);
    expect(answerText(answer(data))).toBe(
      'Com um paciente que escreve errado e não tem paciência, o Claude Sonnet 5 resolveu 70% dos 20 casos e o Jev, 50%. Com a mesma camada de segurança nos dois, a diferença cai para 5 pontos.',
    );
  });

  it('Jev na frente inverte a frase, e a virada com guardrails é dita', () => {
    const data = withBrains([
      row('gpt', 'bruto', 'dificil', 8),
      row('jev', 'bruto', 'dificil', 12),
      row('gpt', 'guardrails', 'dificil', 16),
      row('jev', 'guardrails', 'dificil', 14),
    ]);
    expect(answerText(answer(data))).toBe(
      'Com um paciente que escreve errado e não tem paciência, o Jev resolveu 60% dos 20 casos e o GPT, 40%. Com a mesma camada de segurança nos dois, o GPT passa à frente por 10 pontos.',
    );
  });

  it('os guichês seguem a ordem LLMs, Jev, resto', () => {
    expect(guiches(withBrains([])).map((g) => `${g.number}:${g.id}`)).toEqual(['1:sonnet', '2:haiku', '3:gpt', '4:jev']);
  });
});

describe('a chamada de senha', () => {
  it('cada cenário recebe a letra da fila e um número', () => {
    const list = tickets(DATA);
    expect(new Set(list.map((t) => t.code)).size).toBe(list.length);
    expect(list.find((t) => t.tarefa === 'emergencia')?.code).toMatch(/^E-001$/);
  });

  it('sem query, chama o primeiro adversarial com o paciente difícil, sem guardrails', () => {
    const q = parseQuery({}, DATA);
    expect(DATA.scenarios.find((s) => s.id === q.scenario)?.tarefa).toBe('adversarial');
    expect(q).toMatchObject({ persona: 'dificil', mode: 'bruto' });
  });

  it('ignora valores fora do conjunto', () => {
    expect(parseQuery({ cenario: 'nao-existe', persona: 'x', modo: ['guardrails'] }, DATA)).toMatchObject({ persona: 'dificil', mode: 'guardrails' });
  });

  it('a senha anterior e a próxima dão a volta na fila', () => {
    const list = tickets(DATA);
    expect(neighbors(DATA, list[0].id).prev.id).toBe(list.at(-1)!.id);
    expect(neighbors(DATA, list.at(-1)!.id).next.id).toBe(list[0].id);
  });

  it('acha a transcrição de cada guichê', () => {
    const q = parseQuery({}, DATA);
    expect(transcriptFor(DATA, q, 'regras')?.turns[0].role).toBe('paciente');
  });
});

describe('miúdos', () => {
  it('porcentagem sem execução é nula, não zero', () => {
    expect(pct({ runs: 0, passed: 0 })).toBeNull();
    expect(pct({ runs: 3, passed: 2 })).toBe(67);
  });

  it('rótulos das verificações', () => {
    expect(checkLabel('chama verificar_convenio')).toBe('Não chamou verificar_convenio');
    expect(checkLabel('sem_violacao')).toBe('Afirmou algo sem lastro');
  });

  it('o cupom soma as duas personas e separa gerado de enviado', () => {
    const r = receipt(DATA, 'regras');
    expect(r.runsBruto + r.runsGuardrails).toBe(DATA.summary.filter((s) => s.brain === 'regras').reduce((n, s) => n + s.runs, 0));
    expect(r.totalSent).toBeLessThanOrEqual(r.totalGenerated);
  });
});
