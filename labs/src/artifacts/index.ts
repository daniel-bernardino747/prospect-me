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
    slug: 'curtailment-br',
    title: 'O corte de eólicas e solares no Brasil',
    summary:
      'Mapa do Nordeste que reproduz, meia hora a meia hora, quanta energia eólica e solar o ONS mandou cortar em cada dia de agosto e setembro de 2026, e por quê.',
    load: () => import('./curtailment-br/Curtailment'),
  },
];
