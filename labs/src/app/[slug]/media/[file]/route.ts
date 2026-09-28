import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ARTIFACTS } from '@/artifacts';
import { resolveProspect } from '@/labs/artifact';
import { mediaType, parseRange } from '@/labs/media';

const notFound = () => new Response('Not found', { status: 404 });

/**
 * A prospect's own media, under the same rules as its page: unknown or expired
 * is a 404, so a video never outlives the prototype it belongs to.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params;
  if (resolveProspect(slug, new Date(), ARTIFACTS).kind !== 'live') return notFound();
  const type = mediaType(file);
  if (!type) return notFound();

  let body: Buffer;
  try {
    body = await readFile(join(process.cwd(), 'src/artifacts', slug, 'media', file));
  } catch {
    return notFound();
  }

  const headers = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  };
  const range = parseRange(request.headers.get('range'), body.length);
  if (range === 'unsatisfiable') {
    return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${body.length}` } });
  }
  if (range) {
    const part = body.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(part), {
      status: 206,
      headers: {
        ...headers,
        'Content-Length': String(part.length),
        'Content-Range': `bytes ${range.start}-${range.end}/${body.length}`,
      },
    });
  }
  return new Response(new Uint8Array(body), { headers: { ...headers, 'Content-Length': String(body.length) } });
}
