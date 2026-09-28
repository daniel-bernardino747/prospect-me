import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ARTIFACTS } from '@/artifacts';
import { resolveShowcase } from '@/labs/artifact';
import { OG_SIZE, shareQuery, shareUrl } from '@/labs/share';
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const showcase = resolveShowcase((await params).slug, ARTIFACTS);
  if (!showcase) return {};

  // A shared link keeps its state: the Pix city, the npm case. The OG image and
  // the title follow it, and every other query key is dropped.
  const search = await searchParams;
  const share = showcase.share ? await showcase.share() : undefined;
  const query = shareQuery(share?.keys ?? [], search);
  const text = share?.describe?.(search) ?? { title: showcase.title, description: showcase.summary };
  const title = `${text.title} · Daniel Bernardino`;
  const url = shareUrl(showcase.slug, query);
  const image = { url: `/demo/${showcase.slug}/og${query ? `?${query}` : ''}`, ...OG_SIZE, alt: text.title };

  return {
    title,
    description: text.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/demo/${showcase.slug}` },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Labs · Daniel Bernardino',
      title,
      description: text.description,
      url,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description: text.description, images: [image] },
  };
}
