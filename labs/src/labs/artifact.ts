import type { ComponentType } from 'react';

/** What an artifact's component receives: the query string, for its own state. */
export interface ArtifactProps {
  searchParams: Record<string, string | string[] | undefined>;
}

interface Base {
  slug: string;
  title: string;
  load: () => Promise<{ default: ComponentType<ArtifactProps> }>;
}

/**
 * One prototype built for one company (ADR-0001, Labs), served at `/<slug>`. The
 * slug is the brief's `labsSlug` in the dossier; `expiresAt` is the brief's,
 * about sixty days out.
 */
export interface Prospect extends Base {
  kind: 'prospect';
  company: string;
  expiresAt: string;
}

/**
 * A portfolio demo built for no company (ADR-0002), served at `/demo/<slug>`:
 * indexed, linked from the portfolio, with no end. `summary` is its search
 * description.
 */
export interface Showcase extends Base {
  kind: 'showcase';
  summary: string;
}

export type Artifact = Prospect | Showcase;

export type Resolution =
  | { kind: 'unknown' }
  | { kind: 'ended'; artifact: Prospect }
  | { kind: 'live'; artifact: Prospect };

/** The only way a request reaches a prospect: unknown is a 404, expired has ended. */
export function resolveProspect(slug: string, now: Date, registry: readonly Artifact[]): Resolution {
  const artifact = registry.find((a): a is Prospect => a.kind === 'prospect' && a.slug === slug);
  if (!artifact) return { kind: 'unknown' };
  return now.getTime() >= Date.parse(artifact.expiresAt) ? { kind: 'ended', artifact } : { kind: 'live', artifact };
}

/** The only way a request reaches a showcase. A prospect is never one, since `/demo/` is indexed. */
export function resolveShowcase(slug: string, registry: readonly Artifact[]): Showcase | undefined {
  return registry.find((a): a is Showcase => a.kind === 'showcase' && a.slug === slug);
}

/** Registry mistakes that would otherwise surface only in production. */
export function registryProblems(registry: readonly Artifact[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const a of registry) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(a.slug)) problems.push(`"${a.slug}": slugs are lowercase kebab-case`);
    if (seen.has(a.slug)) problems.push(`"${a.slug}": duplicate slug`);
    seen.add(a.slug);
    if (a.kind === 'prospect' && (!/[+-]\d\d:\d\d$|Z$/.test(a.expiresAt) || Number.isNaN(Date.parse(a.expiresAt)))) {
      problems.push(`"${a.slug}": expiresAt must be an ISO timestamp with an offset`);
    }
    if (a.kind === 'showcase' && !a.summary.trim()) problems.push(`"${a.slug}": a showcase needs a summary`);
  }
  return problems;
}
