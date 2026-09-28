/**
 * Media an artifact ships beside its data (a hero video, its poster), served
 * through `/<slug>/media/<file>` so the Labs rules hold for it too: nothing in
 * `public/`, where it would outlive the artifact's expiry (ADR-0001).
 */

export const MEDIA_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
};

/** A plain file name with a known type, or undefined: no paths, no dot-segments. */
export function mediaType(file: string): string | undefined {
  const m = /^[a-z0-9][a-z0-9-]*\.([a-z0-9]+)$/.exec(file);
  return m ? MEDIA_TYPES[m[1]] : undefined;
}

export type ByteRange = { start: number; end: number } | 'unsatisfiable';

/**
 * A single `bytes=` range against a file of `size` bytes, or undefined when the
 * header is absent or not one we serve partially (multi-range, other units): the
 * whole file then goes out with 200. Safari needs this to play an MP4 at all.
 */
export function parseRange(header: string | null, size: number): ByteRange | undefined {
  if (!header) return undefined;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return undefined;
  let start: number;
  let end: number;
  if (m[1] === '') {
    // "bytes=-500": the last 500 bytes.
    const suffix = Number(m[2]);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}
