import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  apportion,
  buildGraph,
  chainDropTargets,
  collapse,
  defaultEntry,
  edgeState,
  type Entry,
  exposureAt,
  headline,
  layout,
  morning,
  pathsTo,
  type Preset,
  qualifier,
  type RaioData,
  whatIfHeadline,
} from './data';

const data = JSON.parse(readFileSync(fileURLToPath(new URL('./data.json', import.meta.url)), 'utf8')) as RaioData;
const preset = (id: string) => data.presets.find((p) => p.id === id)!;
const text = (pieces: { v: string }[]) => pieces.map((p) => p.v).join('');
const row = (entries: Entry[], pkg: string) => entries.find((e) => e.kind === 'publish' && e.pkg === pkg)!;

describe('data.json', () => {
  it('carries the IOC file as counted and the three presets', () => {
    expect(data.ioc).toMatchObject({ packages: 444, versions: 2236 });
    expect(data.presets.map((p) => `${p.root.name}@${p.root.version}`)).toEqual([
      'stylelint@17.14.1',
      'got@15.1.0',
      'eslint@10.8.0',
    ]);
    for (const p of data.presets) expect(p.nodes[0]).toBe(`${p.root.name}@${p.root.version}`);
  });

  it('stays small', () => {
    expect(JSON.stringify(data).length).toBeLessThan(500_000);
  });
});

describe('the morning of 4 August, stylelint', () => {
  const g = buildGraph(preset('stylelint'));
  const entries = morning(data, g);

  it('bars keyv 6.0.0 at ^5.6.0 and opens flat-cache at 2 hops, file-entry-cache at 1', () => {
    expect(row(entries, 'keyv')).toMatchObject({ version: '6.0.0', verdict: { kind: 'barred', range: '^5.6.0' } });
    expect(row(entries, 'flat-cache')).toMatchObject({ version: '6.1.24', verdict: { kind: 'open', hops: 2 } });
    expect(row(entries, 'file-entry-cache')).toMatchObject({
      version: '11.1.6',
      verdict: { kind: 'open', hops: 1, range: '^11.1.5' },
    });
  });

  it('runs from 09:30 to the removal statement, in order', () => {
    expect(entries[0].kind).toBe('start');
    expect(entries.at(-1)!.kind).toBe('removal');
    const times = entries.map((e) => Date.parse(e.at));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it('opens on the door event, file-entry-cache at 10:13:02', () => {
    const i = defaultEntry(entries);
    expect(entries[i]).toMatchObject({ pkg: 'file-entry-cache', id: '101302' });
    expect(qualifier(entries, i)).toBe('npm install sem lockfile, 4 ago 2026, a partir de 10:13 UTC');
  });

  it('counts what an install reached at that instant, never ahead of the registry', () => {
    const i = defaultEntry(entries);
    const ex = exposureAt(data, g, entries[i].at);
    // @cacheable/utils 2.5.1 was published at 10:14:21, after the door opened.
    expect(ex.reached.map((n) => g.names[n])).toEqual(['file-entry-cache', 'flat-cache', 'cacheable', '@cacheable/memory']);
    expect(text(headline(data, g, entries, i, ex))).toBe(
      '4 dos 444 pacotes do ChainDrop entravam por um único devDependency.',
    );
    const last = exposureAt(data, g, entries.at(-1)!.at);
    expect(last.reached).toHaveLength(5);
    expect(last.reached.map((n) => g.names[n])).not.toContain('keyv');
  });

  it('keeps every gate shut before the first publish', () => {
    const ex = exposureAt(data, g, entries[0].at);
    expect(ex.edges.every((s) => s === 'none' || s === 'not-yet')).toBe(true);
    expect(text(headline(data, g, entries, 0, ex))).toBe('Às 09:30 UTC, nenhuma versão do ChainDrop estava publicada.');
  });

  it('moves the front inward as nearer rings open', () => {
    const at = (pkg: string) => exposureAt(data, g, row(entries, pkg).at).nearest;
    expect(at('keyv')).toBeNull();
    expect(at('cacheable')).toBe(3);
    expect(at('flat-cache')).toBe(2);
    expect(at('file-entry-cache')).toBe(1);
  });

  it('leaves the chart as it was on the removal row', () => {
    const removal = entries.at(-1)!;
    const before = entries.at(-2)!;
    expect(exposureAt(data, g, removal.at).edges).toEqual(exposureAt(data, g, before.at).edges);
  });
});

describe('got and eslint', () => {
  it('got pulls cacheable-request 13.0.20 at one hop', () => {
    const g = buildGraph(preset('got'));
    const entries = morning(data, g);
    const i = defaultEntry(entries);
    expect(entries[i]).toMatchObject({ pkg: 'cacheable-request', version: '13.0.20' });
    expect(text(headline(data, g, entries, i, exposureAt(data, g, entries[i].at)))).toBe(
      'got 15.1.0 puxava um pacote infectado a 1 salto.',
    );
  });

  it('eslint 10.8.0 has no path: a zero is an answer', () => {
    const g = buildGraph(preset('eslint'));
    const entries = morning(data, g);
    const i = defaultEntry(entries);
    expect(entries[i].kind).toBe('publish');
    expect(entries.every((e) => e.kind !== 'publish' || e.verdict.kind === 'barred')).toBe(true);
    const ex = exposureAt(data, g, entries[i].at);
    expect(ex.reached).toEqual([]);
    const pieces = headline(data, g, entries, i, ex);
    expect(text(pieces)).toMatch(/^Nenhum caminho\. As faixas do eslint 10\.8\.0/);
    // Magenta is exposure only: a zero is said in words, in ink.
    expect(pieces.some((p) => p.t === 'fig')).toBe(false);
    expect(qualifier(entries, i)).toBe('npm install sem lockfile, 4 ago 2026, 09:30–10:39 UTC');
  });
});

describe('edgeState on a hand-made graph', () => {
  const p: Preset = {
    id: 't',
    kind: 'dependency',
    root: { name: 'app', version: '1.0.0', publishedAt: '' },
    nodes: ['app@1.0.0', 'a@1.0.0', 'b@1.0.0', 'c@1.0.0'],
    edges: [
      [0, 1, '^1.0.0', ['1.0.1']],
      [1, 2, '^1.0.0'],
      [0, 3, '^1.0.0'],
    ],
  };
  const d: RaioData = {
    fetchedAt: '',
    replayAt: '',
    ioc: { url: '', packages: 2, versions: 2 },
    malicious: {
      a: [{ version: '1.0.1', publishedAt: '2026-08-04T10:00:00Z', osv: null }],
      b: [{ version: '2.0.0', publishedAt: '2026-08-04T09:50:00Z', osv: null }],
    },
    presets: [p],
  };
  const g = buildGraph(p);

  it('is not-yet before, open after the accepted version is out', () => {
    expect(edgeState(d, g, 0, '2026-08-04T09:59:59Z')).toBe('not-yet');
    expect(edgeState(d, g, 0, '2026-08-04T10:00:00Z')).toBe('open');
  });

  it('is barred once a refused version is out, and none for a clean package', () => {
    expect(edgeState(d, g, 1, '2026-08-04T09:49:00Z')).toBe('not-yet');
    expect(edgeState(d, g, 1, '2026-08-04T09:50:00Z')).toBe('barred');
    expect(edgeState(d, g, 2, '2026-08-04T12:00:00Z')).toBe('none');
  });
});

describe('collapse and layout', () => {
  const g = buildGraph(preset('stylelint'));
  const c = collapse(g, chainDropTargets(data, g));
  const L = layout(g, c);

  it('keeps the six packages on the paths, of 116 in the graph', () => {
    expect(g.preset.nodes).toHaveLength(116);
    expect(c.nodes.filter((n) => n !== 0).map((n) => g.names[n]).sort()).toEqual(
      ['@cacheable/memory', '@cacheable/utils', 'cacheable', 'file-entry-cache', 'flat-cache', 'keyv'].sort(),
    );
  });

  it('finds every path to keyv, shortest first', () => {
    const keyv = g.names.indexOf('keyv');
    const paths = pathsTo(g, keyv);
    expect(paths[0]).toHaveLength(4);
    expect(paths.map((p) => p.length)).toEqual([...paths.map((p) => p.length)].sort((a, b) => a - b));
    expect(paths.length).toBe(4);
  });

  it('puts each node on the ring of its hop count, and the field on theirs', () => {
    for (const n of c.nodes) expect(L.place.get(n)!.ring).toBe(g.depth[n]);
    for (const f of L.field) expect(f.ring).toBe(Math.min(g.depth[f.node], L.rings));
    expect(L.field).toHaveLength(116 - c.nodes.length);
  });

  it('gives the door and "outras" sectors the whole dial, clockwise from 12', () => {
    expect(L.sectors[0].start).toBe(0);
    expect(L.sectors.at(-1)!).toMatchObject({ door: -1, end: 360 });
    expect(L.sectors.at(-1)!.end - L.sectors.at(-1)!.start).toBeGreaterThanOrEqual(60);
    for (let i = 1; i < L.sectors.length; i++) expect(L.sectors[i].start).toBeCloseTo(L.sectors[i - 1].end);
  });

  it('keeps three rings for a small graph', () => {
    const tiny = buildGraph({ ...preset('got'), edges: preset('got').edges.filter(([from]) => from === 0) });
    expect(layout(tiny, collapse(tiny, [1])).rings).toBe(3);
  });

  it('answers "e se" for any package, with no malicious list', () => {
    const target = g.names.indexOf('flat-cache');
    const cw = collapse(g, [target]);
    expect(text(whatIfHeadline(g, target, cw))).toBe('Se flat-cache for comprometido: 1 caminho, o mais curto a 2 saltos.');
  });
});

describe('apportion', () => {
  it('splits by weight and lifts small shares to the minimum', () => {
    expect(apportion([1, 1], 180, 40)).toEqual([90, 90]);
    const out = apportion([10, 1], 180, 40);
    expect(out[1]).toBe(40);
    expect(out[0]).toBeCloseTo(140);
  });
});
