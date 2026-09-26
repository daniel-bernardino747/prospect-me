import { Fragment_Mono, Sofia_Sans, Sofia_Sans_Condensed, Sofia_Sans_Extra_Condensed } from 'next/font/google';

import type { ArtifactProps } from '@/labs/artifact';

import { Carta } from './Carta';
import { CopyButton } from './CopyButton';
import { dateBr } from './data';
import { loadRaio } from './load';
import s from './raio.module.css';

const display = Sofia_Sans_Extra_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['800'], variable: '--font-display' });
const label = Sofia_Sans_Condensed({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-label' });
const body = Sofia_Sans({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-body' });
const code = Fragment_Mono({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--font-code' });

/** Survives the build, so the render can be audited against what was decided (seed 79ac1c79). */
const DIRECTION = `<!--
THESIS: A dependency path is a distance, not a list. The page is a planning-zone chart: your root at the centre, one ring per hop, one sector per direct dependency, and each edge's version range drawn as a barrier arm that is open or shut. It refuses the dark security dashboard with a force-directed node cloud, the blue blueprint, and the scrubbed timeline.
OWN-WORLD: pale chart paper (#EDEFEA), graphite ink, hairline rings with degree ticks, one hazard magenta (#A8105F) used only for exposure, laid as a hatched wedge. Barred edges are dashed graphite that ends in a shut bar. Sofia Sans in three widths as map lettering, Fragment Mono for package names, ranges, ids and commands. Square corners, no shadows, no cards.
STORY: The visitor sees how many hops away ChainDrop landed from a real stylelint install, sees which range let it in and which range barred keyv, then steps through the morning of 4 August one publish event at a time, a ruled log under the chart, watching gates swing and the zone close ring by ring on the root.
FIRST VIEWPORT: headline sentence at display size, its condition on the next line, three preset tabs, a square chart that fills the width. Desktop: sentence, log and path ledger on the left 5 columns, sticky chart with its stepper on the right 7.
FORM: emergency-planning-zone chart with a discrete event log. Position 7 on the grounded list; seed key 79ac1c79.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const STEPS: { text: React.ReactNode; command: string }[] = [
  {
    text: (
      <>
        Veja o seu caminho no repositório. Compare as versões que aparecem com a lista em Fontes e método.
      </>
    ),
    command: 'npm ls keyv flat-cache file-entry-cache cacheable cacheable-request --all',
  },
  {
    text: (
      <>
        Commite o lockfile e instale com <code>npm ci</code> no CI: ele instala o que está no lockfile e não resolve
        faixas de novo.
      </>
    ),
    command: 'npm ci',
  },
  {
    text: (
      <>
        Trave a porta de entrada com <code>overrides</code> no <code>package.json</code> até o incidente fechar.
      </>
    ),
    command: '"overrides": { "file-entry-cache": "11.1.5" }',
  },
  {
    text: (
      <>
        Durante a janela de um incidente, instale sem scripts: o ChainDrop entrava pelo <code>preinstall</code>.
      </>
    ),
    command: 'npm install --ignore-scripts',
  },
];

export default function RaioDeExplosao({ searchParams }: ArtifactProps) {
  const data = loadRaio();
  const fetched = dateBr(data.fetchedAt);
  const initial = { caso: one(searchParams.caso) ?? 'stylelint', t: one(searchParams.t), alvo: one(searchParams.alvo) };

  return (
    <main className={`${s.carta} ${display.variable} ${label.variable} ${body.variable} ${code.variable}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION }} />
      <Carta data={data} initial={initial} />

      <div className={s.sheet}>
        <section className={s.todo} aria-labelledby="fazer">
          <h2 id="fazer" className={s.label}>
            O que fazer
          </h2>
          <ol className={s.todoList}>
            {STEPS.map((step, i) => (
              <li key={i} className={s.todoItem}>
                <span className={s.hop} aria-hidden="true">
                  {i + 1}
                </span>
                <div className={s.todoBody}>
                  <p>{step.text}</p>
                  <div className={s.command}>
                    <pre>
                      <code>{step.command}</code>
                    </pre>
                    <CopyButton text={step.command} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={s.sources} id="metodo" aria-labelledby="fontes">
          <h2 id="fontes" className={s.label}>
            Fontes e método
          </h2>
          <div className={s.sourcesGrid}>
            <dl className={s.sourceList}>
              <dt>
                <a href={data.ioc.url}>Lista de IOCs do ChainDrop</a>, Datadog Security Labs
              </dt>
              <dd>
                Apache-2.0. {data.ioc.packages} pacotes, {data.ioc.versions.toLocaleString('pt-BR')} versões no arquivo
                usado; a{' '}
                <a href="https://www.stepsecurity.io/blog/chaindrop-npm-worm">StepSecurity</a> conta 2.212. Artigo:{' '}
                <a href="https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/">
                  &ldquo;ChainDrop&rdquo; worm compromises hundreds of popular npm packages
                </a>{' '}
                (4 ago 2026).
              </dd>
              <dt>
                <a href="https://deps.dev">Dados de dependências: deps.dev (Google), CC BY 4.0</a>
              </dt>
              <dd>
                O grafo resolvido de cada caso, com a faixa de cada aresta (API v3,{' '}
                <code>GetDependencies</code>), e a data de publicação da raiz.
              </dd>
              <dt>
                <a href="https://osv.dev">OSV</a> e{' '}
                <a href="https://github.com/ossf/malicious-packages">ossf/malicious-packages</a>
              </dt>
              <dd>Apache-2.0. O registro MAL-… de cada versão maliciosa, com o mecanismo e os créditos.</dd>
              <dt>
                <a href="https://registry.npmjs.org/file-entry-cache">Registro do npm</a>
              </dt>
              <dd>
                O segundo em que cada versão maliciosa foi publicada (campo <code>time</code>). Só esses horários
                foram guardados.
              </dd>
              <dt>
                <a href="https://www.stepsecurity.io/blog/chaindrop-npm-worm">StepSecurity, &ldquo;ChainDrop npm Worm&rdquo;</a>
              </dt>
              <dd>
                A remoção: o npm começou a despublicar por volta de 10:39 UTC, e os 11 portadores principais foram revertidos
                até 18:10 UTC. É a afirmação deles; a hora de saída de cada versão não é pública.
              </dd>
            </dl>
            <div className={s.method}>
              <p>
                Dados coletados uma vez em {fetched}; a página não consulta nada ao abrir.
              </p>
              <p>
                <strong>A regra.</strong> Uma aresta está aberta quando uma versão maliciosa do pacote de destino já
                estava publicada naquele instante e a faixa da aresta a aceita (semver do npm). Está barrada quando há
                versão maliciosa publicada e a faixa não aceita nenhuma.
              </p>
              <ul className={s.limits}>
                <li>
                  A raiz é a versão que <code>npm install</code> dava na manhã de 4 de agosto; o resto é o grafo como o
                  deps.dev o coletou, não o de 4 de agosto. A regra usa a faixa de cada aresta, não a versão
                  resolvida.
                </li>
                <li>
                  As dependências da versão maliciosa não são conhecidas (foi despublicada); supõe-se que tinha as
                  mesmas faixas da versão limpa anterior.
                </li>
                <li>
                  Com lockfile commitado e <code>npm ci</code>, nada disso é resolvido de novo. A página não afirma que
                  alguém foi infectado.
                </li>
                <li>A hora em que cada versão saiu do registro não é conhecida; o gráfico não encolhe a zona depois de 10:39.</li>
              </ul>
              <p className={s.byline}>
                Demo conceitual de Daniel Bernardino. Fala de pacotes, não de quem os mantém.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
