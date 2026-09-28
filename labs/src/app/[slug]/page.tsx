import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { ARTIFACTS } from '@/artifacts';
import { prospectTitle, resolveProspect } from '@/labs/artifact';
import { Banner } from '@/labs/Banner';
import { Ended } from '@/labs/Ended';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The single route every prospect is served through, so the Labs rules hold for
 * all of them: unknown is a 404, expired has ended, live carries the banner.
 * Showcases are served at `/demo/<slug>` instead (ADR-0002).
 */
export default async function ArtifactPage({ params, searchParams }: Props) {
  // Expiry is decided per request, never frozen into a build.
  await connection();
  const resolution = resolveProspect((await params).slug, new Date(), ARTIFACTS);
  if (resolution.kind === 'unknown') notFound();
  const { artifact } = resolution;
  if (resolution.kind === 'ended') return <Ended company={artifact.company} locale={artifact.locale} />;

  const { default: Component } = await artifact.load();
  const page = (
    <>
      <Banner company={artifact.company} locale={artifact.locale} />
      <Component searchParams={await searchParams} />
    </>
  );
  // The root layout fixes `<html lang="pt-BR">`; per-route `lang` in this Next
  // needs one root layout per locale, so another locale is set on the page.
  return artifact.locale === 'pt-BR' ? page : <div lang={artifact.locale}>{page}</div>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artifact = ARTIFACTS.find((a) => a.kind === 'prospect' && a.slug === slug);
  return artifact?.kind === 'prospect' ? { title: prospectTitle(artifact) } : {};
}
