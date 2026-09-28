/**
 * Gathers the public data behind /demo/curtailment-br once, and writes the
 * aggregate the page reads. Run by hand, never on a schedule (ADR-0002: public
 * data gathered once; the page freezes this snapshot and says so).
 *
 *   node --no-warnings labs/scripts/curtailment-br.ts
 *
 * Sources (see BRIEF.md):
 * - ONS Dados Abertos (CC-BY): restricao_coff_eolica_usi and
 *   restricao_coff_fotovoltaica, Aug and Sep 2026, for the cut (GNRa), the
 *   reason and the restriction text; the *_detail datasets only to learn which
 *   plants (by CEG) form each plant group.
 * - ANEEL SIGA (ODbL): plant coordinates, joined on the 6-digit CEG core.
 * - Natural Earth admin-1, 10m (public domain): state outlines, turned into
 *   0.25° tiles here so the browser ships no projection code.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DuckDBInstance } from '@duckdb/node-api';
import { geoContains, geoMercator } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

import { buildDays, Catalog, type CurtailmentData, type OnsRow, dataProblems, type Point, type Reason } from '../src/artifacts/curtailment-br/data.ts';
import { type Grid, tilePaths } from '../src/artifacts/curtailment-br/geometry.ts';

const CACHE = fileURLToPath(new URL('../.cache/curtailment-br/', import.meta.url));
const OUT = fileURLToPath(new URL('../src/artifacts/curtailment-br/data.json', import.meta.url));
const S3 = 'https://ons-aws-prod-opendata.s3.amazonaws.com/dataset';
const MONTHS = ['2026_08', '2026_09'];
const ONS_DATASETS = [
  'restricao_coff_eolica_usi',
  'restricao_coff_fotovoltaica',
  'restricao_coff_eolica_detail',
  'restricao_coff_fotovoltaica_detail',
];
const SIGA_PACKAGE = 'https://dadosabertos.aneel.gov.br/api/3/action/package_show?id=siga-sistema-de-informacoes-de-geracao-da-aneel';
const NATURAL_EARTH =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

/** The board: Northeast + northern MG, with a 2° band of Atlantic on top for the plate rail. */
const FRAME = { west: -48.75, east: -34.5, north: 1.25, south: -18.75, railSouth: -0.75, cell: 0.25 };
const WIDTH = 560;

const posix = (p: string) => p.replaceAll('\\', '/');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url: string, tries = 5): Promise<Response> {
  for (let k = 1; ; k++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'prospect-me labs (one-off fetch)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (k >= tries) throw new Error(`${url}: ${(e as Error).message} ${(e as { cause?: { code?: string } }).cause?.code ?? ''}`);
      console.log(`retry ${k} ${url}`);
      await sleep(3000 * k);
    }
  }
}

async function download(url: string, name = url.split('/').pop()!): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (!existsSync(path)) {
    console.log(`downloading ${url}`);
    writeFileSync(path, new Uint8Array(await (await fetchRetry(url)).arrayBuffer()));
  }
  return posix(path);
}

/** CKAN metadata, cached so a re-run reports the snapshot it used. */
async function ckan(url: string, name: string): Promise<{ metadata_modified: string; license_id: string; resources: { url: string; name: string }[] }> {
  const path = join(CACHE, `${name}.json`);
  if (!existsSync(path)) writeFileSync(path, await (await fetchRetry(url)).text());
  return JSON.parse(readFileSync(path, 'utf8')).result;
}

// ---------------------------------------------------------------------------

const ons = await Promise.all(
  ONS_DATASETS.map((id) => ckan(`https://dados.ons.org.br/api/3/action/package_show?id=${id}`, id)),
);
for (const p of ons) if (p.license_id !== 'cc-by') throw new Error(`ONS licence changed: ${p.license_id}`);

const files = {
  eol: await Promise.all(MONTHS.map((m) => download(`${S3}/restricao_coff_eolica_tm/RESTRICAO_COFF_EOLICA_${m}.parquet`))),
  fv: await Promise.all(MONTHS.map((m) => download(`${S3}/restricao_coff_fotovoltaica_tm/RESTRICAO_COFF_FOTOVOLTAICA_${m}.parquet`))),
  eolDetail: await Promise.all(MONTHS.map((m) => download(`${S3}/restricao_coff_eolica_detail_tm/RESTRICAO_COFF_EOLICA_DETAIL_${m}.parquet`))),
  fvDetail: await Promise.all(MONTHS.map((m) => download(`${S3}/restricao_coff_fotovoltaica_detail_tm/RESTRICAO_COFF_FOTOVOLTAICA_DETAIL_${m}.parquet`))),
};

const siga = await ckan(SIGA_PACKAGE, 'siga');
if (siga.license_id !== 'odc-odbl') throw new Error(`SIGA licence changed: ${siga.license_id}`);
const sigaResource = siga.resources.find((r) => /siga-empreendimentos-geracao\.csv$/i.test(r.url));
if (!sigaResource) throw new Error('SIGA: no siga-empreendimentos-geracao.csv resource');
const sigaCsv = await download(sigaResource.url, 'siga-empreendimentos-geracao.csv');

const list = (xs: string[]) => `[${xs.map((x) => `'${x}'`).join(', ')}]`;
const db = await DuckDBInstance.create(':memory:');
const con = await db.connect();
const all = async <T>(sql: string) => (await con.runAndReadAll(sql)).getRowObjectsJS() as T[];

await con.run(`CREATE TABLE agg AS
  SELECT 'eol' AS fonte, * FROM read_parquet(${list(files.eol)}, union_by_name=true)
  UNION ALL BY NAME
  SELECT 'fv' AS fonte, * FROM read_parquet(${list(files.fv)}, union_by_name=true)`);
await con.run(`CREATE TABLE members AS
  SELECT DISTINCT id_ons_conjuntousina AS grp, ceg FROM read_parquet(${list([...files.eolDetail, ...files.fvDetail])}, union_by_name=true)
  WHERE id_ons_conjuntousina IS NOT NULL AND ceg IS NOT NULL`);
await con.run(`CREATE TABLE siga AS
  SELECT IdeNucleoCEG AS core,
    avg(TRY_CAST(replace(NumCoordNEmpreendimento, ',', '.') AS DOUBLE)) AS lat,
    avg(TRY_CAST(replace(NumCoordEEmpreendimento, ',', '.') AS DOUBLE)) AS lon
  FROM read_csv('${sigaCsv}', delim=';', header=true, all_varchar=true)
  WHERE TRY_CAST(replace(NumCoordNEmpreendimento, ',', '.') AS DOUBLE) <> 0
    AND TRY_CAST(replace(NumCoordEEmpreendimento, ',', '.') AS DOUBLE) <> 0
  GROUP BY 1`); // SIGA writes an unknown position as 0,0: that is not a place

const [dups] = await all<{ n: number }>(`SELECT count(*)::INT AS n FROM (SELECT id_ons, din_instante FROM agg GROUP BY ALL HAVING count(*) > 1)`);
if (dups.n) throw new Error(`${dups.n} duplicated (id_ons, din_instante) rows`);

// Points: one per id_ons, placed at the centroid of its member plants.
interface PointRow { id: string; name: string; source: 'eol' | 'fv'; uf: string; sub: string | null; lat: number | null; lon: number | null; plants: number; located: number }
const pointRows = await all<PointRow>(`
  WITH ids AS (
    SELECT id_ons AS id, any_value(fonte) AS source, arg_max(nom_usina, din_instante) AS name,
      arg_max(id_estado, din_instante) AS uf, mode(nom_pontoconexao) AS sub, arg_max(ceg, din_instante) AS ceg
    FROM agg GROUP BY id_ons
  ), plants AS (
    SELECT ids.id, coalesce(m.ceg, ids.ceg) AS ceg
    FROM ids LEFT JOIN members m ON ids.ceg = '-' AND m.grp = ids.id
  ), located AS (
    SELECT p.id, s.lat, s.lon FROM plants p
    LEFT JOIN siga s ON s.core = split_part(split_part(p.ceg, '.', 4), '-', 1)
  )
  SELECT ids.id, ids.name, ids.source, ids.uf, ids.sub,
    avg(l.lat)::DOUBLE AS lat, avg(l.lon)::DOUBLE AS lon,
    count(*)::INT AS plants, count(l.lat)::INT AS located
  FROM ids JOIN located l USING (id) GROUP BY ALL ORDER BY ids.id`);
const unlocated = pointRows.filter((p) => p.lat === null);
if (unlocated.length) throw new Error(`no coordinates for ${unlocated.map((p) => p.id).join(', ')}`);
const partial = pointRows.filter((p) => p.located < p.plants);
console.log(`${pointRows.length} points; ${partial.length} placed without some member plant (no SIGA position): ${partial.map((p) => `${p.id} ${p.located}/${p.plants}`).join(', ')}`);

// Projection and tiles.
const projection = geoMercator().fitWidth(WIDTH, {
  type: 'MultiPoint',
  coordinates: [[FRAME.west, FRAME.north], [FRAME.east, FRAME.south]],
});
const px = (lon: number, lat: number) => projection([lon, lat])!;
const cols = Math.round((FRAME.east - FRAME.west) / FRAME.cell);
const rows = Math.round((FRAME.north - FRAME.south) / FRAME.cell);
const xs = Array.from({ length: cols + 1 }, (_, c) => px(FRAME.west + c * FRAME.cell, 0)[0]);
const ys = Array.from({ length: rows + 1 }, (_, r) => px(FRAME.west, FRAME.north - r * FRAME.cell)[1]);
const height = Math.round(ys[rows] * 10) / 10;
const rail = Math.round(px(FRAME.west, FRAME.railSouth)[1] * 10) / 10;

const ne = JSON.parse(readFileSync(await download(NATURAL_EARTH), 'utf8')) as FeatureCollection<Polygon | MultiPolygon>;
const states = ne.features
  .filter((f) => f.properties?.adm0_a3 === 'BRA')
  .map((f) => ({ uf: String(f.properties!.iso_3166_2).replace('BR-', ''), f: f as Feature<Polygon | MultiPolygon> }));
if (states.length !== 27) throw new Error(`Natural Earth: ${states.length} Brazilian states, expected 27`);
const grid: Grid = Array.from({ length: rows }, (_, r) =>
  Array.from({ length: cols }, (_, c) => {
    const lat = FRAME.north - (r + 0.5) * FRAME.cell;
    const lon = FRAME.west + (c + 0.5) * FRAME.cell;
    if (lat > FRAME.railSouth) return null; // the plate rail is sea, always
    return states.find((s) => geoContains(s.f, [lon, lat]))?.uf ?? null;
  }),
);
const tiles = tilePaths(grid, xs, ys);

const points: Point[] = pointRows.map((p) => {
  const [x, y] = px(p.lon!, p.lat!);
  const onMap = x >= 0 && x <= WIDTH && y >= rail && y <= height;
  if (!onMap && y < rail && x >= 0 && x <= WIDTH && p.lat! < FRAME.north) throw new Error(`${p.id} falls in the plate rail`);
  return {
    id: p.id,
    name: p.name,
    source: p.source,
    uf: p.uf,
    sub: p.sub,
    x: onMap ? Math.round(x * 10) / 10 : null,
    y: onMap ? Math.round(y * 10) / 10 : null,
  };
});
const indexOf = new Map(points.map((p, i) => [p.id, i]));

// Rows → days.
interface Raw { id: string; date: string; t: number; ref: number; cut: number; gen: number; reason: string | null; dsc: string | null }
const raw = await all<Raw>(`
  SELECT id_ons AS id, strftime(din_instante, '%Y-%m-%d') AS date,
    (hour(din_instante) * 2 + minute(din_instante) // 30)::INT AS t,
    coalesce(val_geracaoreferencia, 0)::DOUBLE AS ref,
    coalesce(val_geracaonaorealizadaapurada, 0)::DOUBLE AS cut,
    coalesce(val_geracao, 0)::DOUBLE AS gen,
    cod_razaorestricao AS reason, dsc_restricao AS dsc
  FROM agg ORDER BY date, t`);
con.closeSync();
const REASONS = new Set(['ENE', 'CNF', 'REL', 'PAR']);
const onsRows: OnsRow[] = raw.map((r) => {
  if (r.reason !== null && !REASONS.has(r.reason)) throw new Error(`unknown reason ${r.reason}`);
  return { point: indexOf.get(r.id)!, date: r.date, t: r.t, ref: r.ref, cut: r.cut, gen: r.gen, reason: r.reason as Reason | null, dsc: r.dsc };
});
const catalog = new Catalog();
const days = buildDays(onsRows, points, catalog);

const data: CurtailmentData = {
  // The day the ONS files were downloaded (the cache keeps them), not the day this ran.
  fetchedAt: statSync(files.eol.at(-1)!).mtime.toISOString().slice(0, 10),
  sources: {
    onsModified: ons.map((p) => p.metadata_modified).sort().at(-1)!.slice(0, 10),
    sigaModified: siga.metadata_modified.slice(0, 10),
    firstDay: days[0].date,
    lastDay: days.at(-1)!.date,
  },
  map: { width: WIDTH, height, rail, ...tiles },
  points,
  catalog: catalog.entries,
  days,
};
const problems = dataProblems(data);
if (problems.length) throw new Error(problems.join('\n'));

const json = JSON.stringify(data);
writeFileSync(OUT, json);
const d16 = days.find((d) => d.date === '2026-08-16');
console.log(`${days.length} days (${data.sources.firstDay} … ${data.sources.lastDay}), ${catalog.entries.length} restrictions, ${(json.length / 1024).toFixed(0)} KB`);
if (d16) console.log('16/08', { cut: d16.cutMwh, gen: d16.genMwh, ref: d16.refMwh, byReason: d16.byReason });
console.log('off the map', [...new Set(points.filter((p) => p.x === null).map((p) => p.uf))].join(' '));
