import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { ARTIFACTS } from '@/artifacts';
import { resolveShowcase } from '@/labs/artifact';
import { OG_SIZE } from '@/labs/share';

/**
 * The OG image of a showcase, for the state its link carries (`?c=` on the Pix
 * showcase, say). Only the keys the showcase declares reach its image.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const showcase = resolveShowcase((await params).slug, ARTIFACTS);
  if (!showcase) notFound();

  const search: Record<string, string> = {};
  const share = showcase.share ? await showcase.share() : undefined;
  const url = new URL(request.url);
  for (const key of share?.keys ?? []) {
    const value = url.searchParams.get(key);
    if (value) search[key] = value;
  }

  const image = share ? await share.image(search) : fallback(showcase.title, showcase.summary);
  image.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return image;
}

/** A plain Labs card, for a showcase that has not drawn its own. */
function fallback(title: string, summary: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#fbfaf6',
          color: '#1b1d1a',
        }}
      >
        <div style={{ fontSize: 28 }}>Demo conceitual · Daniel Bernardino</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: '#5d625a' }}>{summary}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
