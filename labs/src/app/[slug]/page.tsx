import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { ARTIFACTS } from '@/artifacts';
import { resolveArtifact } from '@/labs/artifact';
import { Banner } from '@/labs/Banner';
import { Ended } from '@/labs/Ended';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The single route every artifact is served through, so the Labs rules hold for
 * all of them: unknown is a 404, expired has ended, live carries the banner.
 */
export default async function ArtifactPage({ params, searchParams }: Props) {
  // Expiry is decided per request, never frozen into a build.
  await connection();
  const resolution = resolveArtifact((await params).slug, new Date(), ARTIFACTS);
  if (resolution.kind === 'unknown') notFound();
  if (resolution.kind === 'ended') return <Ended company={resolution.artifact.company} />;

  const { artifact } = resolution;
  const { default: Component } = await artifact.load();
  return (
    <>
      <Banner company={artifact.company} />
      <Component searchParams={await searchParams} />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artifact = ARTIFACTS.find((a) => a.slug === slug);
  return artifact ? { title: `${artifact.title} · protótipo independente` } : {};
}
