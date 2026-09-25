/**
 * Gathers the public data behind /tarken-fila-da-safra once, and writes the
 * aggregate the page reads. Run by hand, never on a schedule (ADR-0001: public
 * data gathered once, no recurring crawler).
 *
 *   node --no-warnings labs/scripts/tarken-fila-da-safra.ts
 *
 * Sources, each used where it is complete (see data.ts):
 * - BCB SICOR bulk files: soy custeio maturities per UF (bcb.gov.br robots.txt
 *   allows /htms/). Only the operations files are read; the files carrying
 *   producers' CPF/CNPJ are never downloaded.
 * - BCB MDCR (olinda OData): soy custeio value and area per município. The
 *   service fails often, so every município's answer is cached and a re-run
 *   resumes; a município it never answers is reported, not guessed.
 * - IBGE SIDRA PAM table 5457 and the IBGE localidades API.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DuckDBInstance } from '@duckdb/node-api';

import {
  buildPracas,
  buildUfs,
  type FilaDaSafra,
  type MonthRow,
  safraHarvestedIn,
  safraOf,
} from '../src/artifacts/tarken-fila-da-safra/data.ts';

const CACHE = fileURLToPath(new URL('../.cache/', import.meta.url));
const OUT = fileURLToPath(new URL('../src/artifacts/tarken-fila-da-safra/data.json', import.meta.url));
const SICOR = 'https://www.bcb.gov.br/htms/sicor';
const MDCR = 'https://olinda.bcb.gov.br/olinda/servico/SICOR/versao/v2/odata/CusteioMunicipioProduto';
/** MDCR's product code for soy (nomeProduto "SOJA"). */
const MDCR_SOY = '6720';
/** The first safra the page needs: the one the latest PAM harvest measures. */
const FIRST_EMISSION = '2024-07-01';

const OPERACOES = [2024, 2025, 2026].map((y) => `${SICOR}/DadosBrutos/SICOR_OPERACAO_BASICA_ESTADO_${y}.gz`);
const EMPREENDIMENTO = `${SICOR}/Empreendimento.csv`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string): Promise<{ path: string; lastModified: string }> {
  const dir = join(CACHE, 'sicor');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, url.split('/').pop()!);
  const head = await fetch(url, { method: 'HEAD' });
  const lastModified = head.headers.get('last-modified') ?? '';
  if (!existsSync(path)) {
    console.log(`downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // Empreendimento.csv is Latin-1; DuckDB reads UTF-8.
    await writeFile(path, url.endsWith('.csv') ? new TextDecoder('latin1').decode(bytes) : bytes);
  }
  return { path: path.replaceAll('\\', '/'), lastModified };
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Soy custeio maturities per UF and month, from every operation since
 * FIRST_EMISSION: that reaches back past the pre-custeio of the harvest before
 * the latest, so the complete harvest's queue holds all it owes.
 */
async function sicorMonths() {
  const files = await Promise.all([...OPERACOES, EMPREENDIMENTO].map(download));
  const empreendimento = files.pop()!;
  const db = await DuckDBInstance.create(':memory:');
  const con = await db.connect();

  // Empreendimento.csv quotes every field but leaves inner quotes unescaped
  // ("bovinos "free stall""); every line still splits into 15 fields on ';'.
  await con.run(`CREATE TABLE soja AS
    SELECT trim("#CODIGO", '"') AS codigo
    FROM read_csv('${empreendimento.path}', delim=';', header=true, all_varchar=true, quote='', escape='')
    WHERE trim(FINALIDADE, '"') = 'Custeio' AND trim(PRODUTO, '"') = 'SOJA'`);
  await con.run(`CREATE TABLE ops AS
    SELECT CD_ESTADO AS uf,
      strptime(DT_EMISSAO, '%d/%m/%Y')::DATE AS emissao,
      strptime(DT_VENCIMENTO, '%d/%m/%Y')::DATE AS vencimento,
      TRY_CAST(VL_PARC_CREDITO AS DOUBLE) AS valor
    FROM read_csv([${files.map((f) => `'${f.path}'`).join(', ')}], delim=';', header=true, all_varchar=true)
    WHERE CD_EMPREENDIMENTO IN (SELECT codigo FROM soja)
      AND strptime(DT_EMISSAO, '%d/%m/%Y') >= DATE '${FIRST_EMISSION}'`);

  const months = (
    await con.runAndReadAll(`
      SELECT uf, strftime(vencimento, '%Y-%m') AS month, sum(valor)::DOUBLE AS amount, count(*)::INTEGER AS operations
      FROM ops WHERE valor > 0 AND uf IS NOT NULL GROUP BY ALL`)
  ).getRowObjectsJS() as MonthRow[];
  const [{ latest }] = (
    await con.runAndReadAll(`SELECT strftime(max(emissao), '%Y-%m-%d') AS latest FROM ops`)
  ).getRowObjectsJS() as { latest: string }[];
  con.closeSync();

  return {
    lastModified: files.at(-1)!.lastModified,
    latest,
    months,
  };
}

interface MdcrRow {
  cdProduto: string;
  AnoEmissao: string;
  MesEmissao: string;
  VlCusteio: number;
  AreaCusteio: number;
}

/** One município's custeio rows from the MDCR, cached; null if the service never answered. */
async function mdcrMunicipio(ibge: number): Promise<MdcrRow[] | null> {
  const dir = join(CACHE, 'mdcr');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${ibge}.json`);
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8')) as MdcrRow[];

  const url =
    `${MDCR}?$filter=${encodeURIComponent(`codIbge eq '${ibge}'`)}&$format=json&$top=100000` +
    '&$select=cdProduto,AnoEmissao,MesEmissao,VlCusteio,AreaCusteio';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const rows = ((await res.json()) as { value: MdcrRow[] }).value.filter(
          (r) => r.cdProduto === MDCR_SOY && `${r.AnoEmissao}-${r.MesEmissao.padStart(2, '0')}-01` >= FIRST_EMISSION,
        );
        writeFileSync(path, JSON.stringify(rows));
        return rows;
      }
    } catch {
      // network error: retry like a 5xx
    }
    await sleep(1000 * 2 ** attempt);
  }
  return null;
}

async function mdcr(ids: number[]) {
  const custeio: { municipio: number; safra: string; value: number; area: number }[] = [];
  const missing: number[] = [];
  const queue = [...ids];
  let done = 0;
  // A few at a time: this is a public service already failing under load.
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        const rows = await mdcrMunicipio(id);
        if (rows === null) missing.push(id);
        for (const r of rows ?? []) {
          const safra = safraOf(new Date(Date.UTC(Number(r.AnoEmissao), Number(r.MesEmissao) - 1, 1)));
          custeio.push({ municipio: id, safra, value: r.VlCusteio, area: r.AreaCusteio });
        }
        if (++done % 100 === 0) console.log(`  mdcr ${done}/${ids.length}`);
      }
    }),
  );
  return { custeio, missing };
}

async function main() {
  console.log('SICOR maturities per UF');
  const sicor = await sicorMonths();
  const partial = safraOf(new Date(`${sicor.latest}T00:00:00Z`));
  const complete = safraOf(new Date(Date.UTC(Number(partial.slice(0, 4)) - 1, 6, 1)));

  console.log('IBGE PAM and names');
  const sidra = await json<{ V: string; D1C: string; D2C: string; D3C: string }[]>(
    'https://apisidra.ibge.gov.br/values/t/5457/n6/all/v/8331,112/p/2024,2025/c782/40124/f/c',
  );
  const pam = sidra
    .slice(1)
    .filter((r) => /^\d+$/.test(r.V))
    .map((r) => ({
      municipio: Number(r.D1C),
      year: r.D3C,
      ...(r.D2C === '8331' ? { plantedHa: Number(r.V) } : { kgHa: Number(r.V) }),
    }));
  const pamYear = [...new Set(pam.filter((r) => r.plantedHa !== undefined).map((r) => r.year))].sort().at(-1)!;
  const measured = safraHarvestedIn(pamYear);

  interface Municipio {
    id: number;
    nome: string;
    microrregiao?: { mesorregiao: { UF: { sigla: string } } } | null;
    'regiao-imediata'?: { 'regiao-intermediaria': { UF: { sigla: string } } } | null;
  }
  const municipios = await json<Municipio[]>('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  const names = new Map(
    municipios.map((m) => [
      m.id,
      {
        name: m.nome,
        uf: m.microrregiao?.mesorregiao.UF.sigla ?? m['regiao-imediata']?.['regiao-intermediaria'].UF.sigla ?? '',
      },
    ]),
  );

  const soyIds = [...new Set(pam.map((r) => r.municipio))].sort((a, b) => a - b);
  console.log(`MDCR soy custeio for ${soyIds.length} municípios with soy`);
  const { custeio, missing } = await mdcr(soyIds);
  if (missing.length > 0) {
    console.error(`MDCR never answered for ${missing.length} municípios; re-run to resume. Not writing.`);
    process.exitCode = 1;
    return;
  }

  const safras = { complete, partial, measured, pamYear };
  const data: FilaDaSafra = {
    generatedAt: new Date().toISOString(),
    sources: { sicorLastModified: sicor.lastModified, latestEmission: sicor.latest, mdcrFetchedAt: new Date().toISOString() },
    safras,
    ufs: buildUfs(sicor.months, safras),
    pracas: buildPracas({ custeio, pam, names }),
  };
  writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  console.log(`${Object.keys(data.pracas).length} praças, ${Object.keys(data.ufs).length} UFs → ${OUT}`);
}

await main();
