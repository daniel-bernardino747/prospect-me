/**
 * Turning what Techifide publishes into the plain text the page quotes. Pure,
 * so `scripts/techifide.ts` does the fetching and these do the reading.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  raquo: '»',
  laquo: '«',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

/**
 * An ad's HTML as the lines a reader sees: one per paragraph, heading or list
 * item, inline markup dropped, whitespace collapsed. Quotes are checked against
 * these lines, so a quote never spans two of them.
 */
export function htmlToLines(html: string): string[] {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|div|h[1-6]|li|ul|ol|tr|section|article|blockquote)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** The paragraphs of a `word/document.xml`, as the text of their runs. */
export function docxParagraphs(xml: string): string[] {
  return xml
    .split(/<\/w:p>/)
    .map((p) => decodeEntities([...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')))
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** The JSON-LD `JobPosting` in a careers page, if it has one. */
export function jobPosting(html: string): Record<string, unknown> | undefined {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const json = JSON.parse(m[1]) as Record<string, unknown>;
    if (json['@type'] === 'JobPosting') return json;
  }
  return undefined;
}

/**
 * The lines of a WordPress page's main text, from its first line matching
 * `from` up to (not including) the first matching `to`.
 */
export function pageLines(html: string, from: RegExp, to: RegExp): string[] {
  const body = html.replace(/<(nav|header|footer|form)\b[\s\S]*?<\/\1>/gi, '');
  const lines = htmlToLines(body);
  const start = lines.findIndex((l) => from.test(l));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && to.test(l));
  return lines.slice(start, end < 0 ? undefined : end);
}

/**
 * "Structure – How much clarity…" → name and description, as the Role Fit
 * Assessment page lists its eleven dimensions.
 */
export function dimensionLine(line: string): { name: string; description: string } | undefined {
  const m = /^(.+?) [–—-] (How|Whether) (.+)$/.exec(line);
  return m ? { name: m[1].trim(), description: `${m[2]} ${m[3]}`.trim() } : undefined;
}
