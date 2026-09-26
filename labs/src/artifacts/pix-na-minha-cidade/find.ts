/**
 * The município search, shared by the client combobox and the no-JS `?q=`
 * form the server resolves. No node imports: it ships to the browser.
 */

/** [ibge, name, uf], most payers first, so a common prefix finds the big city first. */
export type Entry = [ibge: number, name: string, uf: string];

export const MAX_OPTIONS = 7;

/** "São Paulo", "sao paulo" and "SÃO  PAULO" are the same search. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}

const UFS = new Set([
  'ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe',
  'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to',
]);

/**
 * "bom jesus pi", "Bom Jesus - PI" and "bom jesus/pi" narrow to that UF; a
 * query that is only a UF ("SP") lists that state.
 */
function parse(query: string): { name: string; uf?: string } {
  const q = fold(query);
  if (UFS.has(q)) return { name: '', uf: q };
  const words = q.split(' ');
  const last = words[words.length - 1];
  if (words.length > 1 && UFS.has(last)) return { name: words.slice(0, -1).join(' '), uf: last };
  return { name: q };
}

/**
 * Up to `limit` options: names starting with the query, then names with a word
 * starting with it, then names containing it; each tier keeps the index order
 * (most payers first). A bare UF lists the state, capital first.
 */
export function search(
  index: readonly Entry[],
  query: string,
  capitals: ReadonlySet<number> = new Set(),
  limit = MAX_OPTIONS,
): Entry[] {
  const { name, uf } = parse(query);
  if (!name && !uf) return [];
  const pool = uf ? index.filter((e) => e[2].toLowerCase() === uf) : index;
  if (!name) {
    const capital = pool.filter((e) => capitals.has(e[0]));
    return [...capital, ...pool.filter((e) => !capitals.has(e[0]))].slice(0, limit);
  }
  const tiers: Entry[][] = [[], [], []];
  for (const e of pool) {
    const n = fold(e[1]);
    if (n.startsWith(name)) tiers[0].push(e);
    else if (n.includes(` ${name}`)) tiers[1].push(e);
    else if (n.includes(name)) tiers[2].push(e);
    if (tiers[0].length >= limit) break;
  }
  return tiers.flat().slice(0, limit);
}

/** When nothing matches: the names sharing the longest prefix with the query. */
export function suggestions(index: readonly Entry[], query: string, count = 3): Entry[] {
  let name = parse(query).name;
  while (name.length > 1) {
    name = name.slice(0, -1);
    const found = index.filter((e) => fold(e[1]).startsWith(name)).slice(0, count);
    if (found.length) return found;
  }
  return index.slice(0, count);
}

export type Resolution =
  | { kind: 'one'; entry: Entry }
  | { kind: 'many'; entries: Entry[] }
  | { kind: 'none'; suggestions: Entry[] };

/**
 * What a submitted `?q=` means: one município (show its ticket), several
 * (homonyms or a partial name: list them, never auto-pick), or none.
 */
export function resolveQuery(index: readonly Entry[], query: string, capitals?: ReadonlySet<number>): Resolution {
  const { name, uf } = parse(query);
  if (name) {
    const exact = index.filter((e) => fold(e[1]) === name && (!uf || e[2].toLowerCase() === uf));
    if (exact.length === 1) return { kind: 'one', entry: exact[0] };
    if (exact.length > 1) return { kind: 'many', entries: exact };
  }
  const found = search(index, query, capitals);
  if (found.length === 1) return { kind: 'one', entry: found[0] };
  if (found.length > 1) return { kind: 'many', entries: found };
  return { kind: 'none', suggestions: suggestions(index, query) };
}
