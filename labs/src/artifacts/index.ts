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
    slug: 'raio-de-explosao',
    title: 'Raio de explosão',
    summary:
      'Por qual caminho um pacote comprometido chega na sua app: o worm ChainDrop no npm, salto a salto, com a faixa de versão de cada dependência decidindo se a porta abre.',
    load: () => import('./raio-de-explosao/RaioDeExplosao'),
  },
];
