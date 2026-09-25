import type { ComponentType } from 'react';

/** What an artifact's component receives: the query string, for its own state. */
export interface ArtifactProps {
  searchParams: Record<string, string | string[] | undefined>;
}

/**
 * One prototype built for one company (ADR-0001, Labs). The slug is the brief's
 * `labsSlug` in the dossier; `expiresAt` is the brief's, about sixty days out.
 */
export interface Artifact {
  slug: string;
  company: string;
  title: string;
  expiresAt: string;
  load: () => Promise<{ default: ComponentType<ArtifactProps> }>;
}

export type Resolution =
  | { kind: 'unknown' }
  | { kind: 'ended'; artifact: Artifact }
  | { kind: 'live'; artifact: Artifact };

/** The only way a request reaches an artifact: unknown is a 404, expired has ended. */
export function resolveArtifact(slug: string, now: Date, registry: readonly Artifact[]): Resolution {
  const artifact = registry.find((a) => a.slug === slug);
  if (!artifact) return { kind: 'unknown' };
  return now.getTime() >= Date.parse(artifact.expiresAt) ? { kind: 'ended', artifact } : { kind: 'live', artifact };
}

/** Registry mistakes that would otherwise surface only in production. */
export function registryProblems(registry: readonly Artifact[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const a of registry) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(a.slug)) problems.push(`"${a.slug}": slugs are lowercase kebab-case`);
    if (seen.has(a.slug)) problems.push(`"${a.slug}": duplicate slug`);
    seen.add(a.slug);
    if (!/[+-]\d\d:\d\d$|Z$/.test(a.expiresAt) || Number.isNaN(Date.parse(a.expiresAt))) {
      problems.push(`"${a.slug}": expiresAt must be an ISO timestamp with an offset`);
    }
  }
  return problems;
}
