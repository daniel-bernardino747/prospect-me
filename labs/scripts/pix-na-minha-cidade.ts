/**
 * Gathers the public data behind /demo/pix-na-minha-cidade once, and writes the
 * compact data.json the page reads. Run by hand, never at build:
 *
 *   node --no-warnings labs/scripts/pix-na-minha-cidade.ts
 *
 * Sources (BRIEF.md, "Dados"):
 * - BCB Estatísticas do Pix, TransacoesPixPorMunicipio (OData, no auth, ODbL):
 *   the 12 closed months ending before the current one; the running month is
 *   partial and cut (see lastClosedMonth).
 * - BCB EstatisticasFraudesPix: the latest national MED figures (no municipal cut).
 * - IBGE agregado 6579 (population estimates): names in proper spelling, UF and
 *   population, joined by IBGE code.
 *
 * The raw 32 MB answer is held in memory only; nothing raw is saved. The output
 * is a Derivative Database under the ODbL (see DATA-LICENSE beside it).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  type BcbRow,
  buildData,
  CAPITALS,
  lastClosedMonth,
  monthsEndingAt,
  splitIbgeName,
} from '../src/artifacts/pix-na-minha-cidade/data.ts';

const OUT = fileURLToPath(new URL('../src/artifacts/pix-na-minha-cidade/data.json', import.meta.url));
const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata';
const IBGE = 'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[all]';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Olinda fails often; a fetch-once script can afford to wait and retry. */
async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      if (attempt >= 4) throw new Error(`${url}: ${(e as Error).message}`);
      console.log(`retry ${attempt} ${url}: ${(e as Error).message}`);
      await sleep(5000 * attempt);
    }
  }
}

const today = new Date();
const months = monthsEndingAt(lastClosedMonth(today), 12);
console.log(`months ${months[0]}–${months[months.length - 1]}`);

const bcb = await getJson<{ value: BcbRow[] }>(
  `${OLINDA}/TransacoesPixPorMunicipio(DataBase=@DataBase)?@DataBase='${months[0]}'&$format=json` +
    `&$select=AnoMes,Municipio_Ibge,Municipio,VL_PagadorPF,QT_PagadorPF,QT_PES_PagadorPF`,
);
console.log(`BCB rows ${bcb.value.length}`);

type IbgeAnswer = { resultados: { series: { localidade: { id: string; nome: string }; serie: Record<string, string> }[] }[] }[];
const ibge = await getJson<IbgeAnswer>(IBGE);
const population = new Map<number, { name: string; uf: string; pop: number }>();
for (const s of ibge[0].resultados[0].series) {
  const value = Object.values(s.serie)[0];
  population.set(Number(s.localidade.id), { ...splitIbgeName(s.localidade.nome), pop: Number(value) || 0 });
}
console.log(`IBGE municípios ${population.size}, period ${Object.keys(ibge[0].resultados[0].series[0].serie)[0]}`);

for (const [code, name] of Object.entries(CAPITALS)) {
  const got = population.get(Number(code))?.name;
  if (got !== name) throw new Error(`capital ${code}: expected ${name}, IBGE says ${got}`);
}

type MedRow = { AnoMes: number; QtdePixcontestados: number; Qtdecontestacoesaceitas: number; PercentualdeDevolucao: number };
const medRows = await getJson<{ value: MedRow[] }>(
  `${OLINDA}/EstatisticasFraudesPix(Database=@Database)?@Database='${months[0]}'&$format=json`,
);
const latestMed = medRows.value.reduce((a, b) => (b.AnoMes > a.AnoMes ? b : a));
const med = {
  month: latestMed.AnoMes,
  contestados: latestMed.QtdePixcontestados,
  aceitas: latestMed.Qtdecontestacoesaceitas,
  devolucao: latestMed.PercentualdeDevolucao,
};
console.log(`MED latest ${med.month}`);

const { data, dropped } = buildData(bcb.value, population, months, today.toISOString().slice(0, 10), med);
for (const d of dropped) console.log(`dropped ${d}`);
const missing = [...population.keys()].filter((k) => !data.mun.some((r) => r[0] === k));
console.log(`municípios ${data.mun.length}; in IBGE but not ranked: ${missing.join(', ') || 'none'}`);

writeFileSync(OUT, JSON.stringify(data));
console.log(`wrote ${OUT}`);
