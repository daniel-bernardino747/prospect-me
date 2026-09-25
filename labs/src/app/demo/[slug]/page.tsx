import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ARTIFACTS } from '@/artifacts';
import { resolveShowcase } from '@/labs/artifact';
import { ShowcaseBanner } from '@/labs/ShowcaseBanner';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The single route every showcase is served through (ADR-0002): unknown is a 404,
 * and a showcase has no end. Unlike a prospect, it is meant to be found.
 */
export default async function ShowcasePage({ params, searchParams }: Props) {
  const showcase = resolveShowcase((await params).slug, ARTIFACTS);
  if (!showcase) notFound();

  const { default: Component } = await showcase.load();
  return (
    <>
      <ShowcaseBanner />
      <Component searchParams={await searchParams} />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const showcase = resolveShowcase((await params).slug, ARTIFACTS);
  if (!showcase) return {};
  return {
    title: `${showcase.title} · Daniel Bernardino`,
    description: showcase.summary,
    robots: { index: true, follow: true },
  };
}
