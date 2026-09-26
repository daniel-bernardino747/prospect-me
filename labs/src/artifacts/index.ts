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
    slug: 'pix-na-minha-cidade',
    title: 'Pix na minha cidade',
    summary:
      'Quantos Pix por usuário a sua cidade fez em agosto de 2026, a posição dela entre os 5.571 municípios do Brasil e um cartão para compartilhar, com dados abertos do Banco Central.',
    load: () => import('./pix-na-minha-cidade/PixNaMinhaCidade'),
  },
];
