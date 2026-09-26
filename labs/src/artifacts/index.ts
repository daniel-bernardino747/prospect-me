import type { Artifact } from '@/labs/artifact';

/** Every artifact Labs serves. A route that is not listed here does not exist. */
export const ARTIFACTS: readonly Artifact[] = [
  {
    kind: 'prospect',
    slug: 'tarken-fila-da-safra',
    company: 'Tarken',
    title: 'A fila da safra',
    expiresAt: '2026-11-23T23:59:00-03:00',
    load: () => import('./tarken-fila-da-safra/FilaDaSafra'),
  },
  {
    kind: 'showcase',
    slug: 'conta-de-tokens',
    title: 'Conta de tokens',
    summary:
      'Quanto o volume de tokens do seu time custaria em cada modelo de LLM, com o cache como alavanca, ao lado dos modelos em que o mercado do OpenRouter de fato gasta seus tokens.',
    load: () => import('./conta-de-tokens/ContaDeTokens'),
  },
  {
    kind: 'showcase',
    slug: 'raio-de-explosao',
    title: 'Raio de explosão',
    summary:
      'Por qual caminho um pacote comprometido chega na sua app: o worm ChainDrop no npm, salto a salto, com a faixa de versão de cada dependência decidindo se a porta abre.',
    load: () => import('./raio-de-explosao/RaioDeExplosao'),
  },
];
