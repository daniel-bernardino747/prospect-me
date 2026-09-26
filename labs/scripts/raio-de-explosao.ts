/**
 * Gathers the public data behind /demo/raio-de-explosao once, and writes the
 * `data.json` the page reads. Run by hand, never on a schedule: the page makes
 * no request when it opens (ADR-0002, "fetched once").
 *
 *   node --no-warnings labs/scripts/raio-de-explosao.ts
 *
 * Sources:
 * - Datadog Security Labs IOC list for ChainDrop (Apache-2.0): every package
 *   and version the worm published.
 * - deps.dev API v3 (Google, CC BY 4.0): each preset's resolved dependency
 *   graph, with the range on every edge, and the root's publication time.
 * - npm registry: the minute each malicious version was published. Only those
 *   timestamps are kept, never the documents.
 * - OSV API: the MAL-… record id of each malicious version (ossf/malicious-packages, Apache-2.0).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Edge, MaliciousVersion, Preset, RaioData } from '../src/artifacts/raio-de-explosao/data.ts';
import {
  acceptedVersions,
  parseIocCsv,
  type Published,
  resolveAt,
  shadowingVersion,
} from '../src/artifacts/raio-de-explosao/rules.ts';

const OUT = fileURLToPath(new URL('../src/artifacts/raio-de-explosao/data.json', import.meta.url));
const IOC_CSV =
  'https://raw.githubusercontent.com/DataDog/indicators-of-compromise/keyv-campaign/keyv-campaign/malicious-packages.csv';
const DEPS_DEV = 'https://api.deps.dev/v3/systems/npm/packages';
/** The instant the presets are resolved at: just after the stylelint door opened. */
const REPLAY = '2026-08-04T10:15:00Z';

/** The three cases, each the version `npm install <name>` gave on the morning of 4 August. */
const PRESETS: { id: string; name: string; version: string; kind: Preset['kind'] }[] = [
  { id: 'stylelint', name: 'stylelint', version: '17.14.1', kind: 'devDependency' },
  { id: 'got', name: 'got', version: '15.1.0', kind: 'dependency' },
  { id: 'eslint', name: 'eslint', version: '10.8.0', kind: 'devDependency' },
];

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

const enc = (name: string) => encodeURIComponent(name);

interface DepsDevPackage {
  versions: { versionKey: { version: string }; publishedAt?: string }[];
}
interface DepsDevGraph {
  nodes: { versionKey: { name: string; version: string }; relation: string }[];
  edges: { fromNode: number; toNode: number; requirement: string }[];
}

async function graphOf(p: (typeof PRESETS)[number]) {
  const pkg = await json<DepsDevPackage>(`${DEPS_DEV}/${enc(p.name)}`);
  const versions: Published[] = pkg.versions
    .filter((v) => v.publishedAt)
    .map((v) => ({ version: v.versionKey.version, publishedAt: v.publishedAt! }));
  const resolved = resolveAt(versions, REPLAY);
  if (resolved !== p.version) throw new Error(`${p.name}: resolves to ${resolved} at ${REPLAY}, not ${p.version}`);
  const publishedAt = versions.find((v) => v.version === p.version)!.publishedAt;

  const g = await json<DepsDevGraph>(`${DEPS_DEV}/${enc(p.name)}/versions/${enc(p.version)}:dependencies`);
  const self = g.nodes.findIndex((n) => n.relation === 'SELF');
  // Root first, so node 0 is always the preset.
  const order = [self, ...g.nodes.map((_, i) => i).filter((i) => i !== self)];
  const index = new Map(order.map((old, i) => [old, i]));
  const nodes = order.map((i) => `${g.nodes[i].versionKey.name}@${g.nodes[i].versionKey.version}`);
  const edges = g.edges.map((e) => [index.get(e.fromNode)!, index.get(e.toNode)!, e.requirement] as const);
  return { root: { name: p.name, version: p.version, publishedAt }, nodes, edges };
}

const nameOf = (node: string) => node.slice(0, node.lastIndexOf('@'));

async function main() {
  console.log('IOC list');
  const csv = await (await fetch(IOC_CSV)).text();
  const ioc = parseIocCsv(csv);
  const iocVersions = [...ioc.values()].reduce((n, v) => n + v.length, 0);

  console.log('deps.dev graphs');
  const graphs = await Promise.all(PRESETS.map(graphOf));

  const inGraphs = [...new Set(graphs.flatMap((g) => g.nodes.map(nameOf)))].filter((n) => ioc.has(n)).sort();
  console.log(`packages in the graphs with ChainDrop versions: ${inGraphs.join(', ')}`);

  console.log('npm registry publish times and OSV ids');
  const registry = new Map<string, Published[]>();
  const malicious: Record<string, MaliciousVersion[]> = {};
  for (const name of inGraphs) {
    const doc = await json<{ time: Record<string, string> }>(`https://registry.npmjs.org/${name.replace('/', '%2F')}`);
    const all = Object.entries(doc.time)
      .filter(([v]) => v !== 'created' && v !== 'modified')
      .map(([version, publishedAt]) => ({ version, publishedAt }));
    registry.set(name, all);
    malicious[name] = ioc.get(name)!.map((version) => {
      const publishedAt = doc.time[version];
      if (!publishedAt) throw new Error(`${name}@${version}: no publish time in the registry`);
      return { version, publishedAt, osv: null };
    });
  }

  const queries = inGraphs.flatMap((name) =>
    malicious[name].map((m) => ({ package: { ecosystem: 'npm', name }, version: m.version })),
  );
  const osv = await json<{ results: { vulns?: { id: string }[] }[] }>('https://api.osv.dev/v1/querybatch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ queries }),
  });
  queries.forEach((q, i) => {
    const id = osv.results[i].vulns?.map((v) => v.id).find((v) => v.startsWith('MAL-')) ?? null;
    malicious[q.package.name].find((m) => m.version === q.version)!.osv = id;
  });

  const presets: Preset[] = PRESETS.map((p, i) => {
    const g = graphs[i];
    const edges: Edge[] = g.edges.map(([from, to, requirement]) => {
      const target = nameOf(g.nodes[to]);
      const bad = malicious[target] ?? [];
      const accepts = acceptedVersions(
        requirement,
        bad.map((m) => m.version),
      );
      for (const v of accepts) {
        const shadow = shadowingVersion(requirement, bad.find((m) => m.version === v)!, registry.get(target)!);
        if (shadow) throw new Error(`${target} ${requirement}: ${shadow} would have been picked over ${v}`);
      }
      return accepts.length > 0 ? [from, to, requirement, accepts] : [from, to, requirement];
    });
    return { id: p.id, kind: p.kind, root: g.root, nodes: g.nodes, edges };
  });

  const data: RaioData = {
    fetchedAt: new Date().toISOString(),
    replayAt: REPLAY,
    ioc: { url: IOC_CSV, packages: ioc.size, versions: iocVersions },
    malicious,
    presets,
  };
  writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  for (const p of presets) console.log(`${p.id}: ${p.nodes.length} nodes, ${p.edges.length} edges`);
  console.log(`${ioc.size} packages, ${iocVersions} versions in the IOC list → ${OUT}`);
}

await main();
