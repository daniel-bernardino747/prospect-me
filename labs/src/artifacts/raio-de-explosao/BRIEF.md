# Raio de explosão — brief

Showcase `/demo/raio-de-explosao` (ADR-0002). Demo conceitual de Daniel Bernardino: sem cliente, sem usuário inventado, dados públicos e citados. Pesquisa feita em 2026-09-25; toda chamada de API abaixo foi executada nesse dia.

---

## Pergunta e resposta da primeira tela

**Pergunta:** se o pacote X for comprometido hoje, por qual caminho ele chega na minha app?

**Caso padrão (real, não ilustrativo):** o worm ChainDrop, 4 de agosto de 2026, e o `stylelint@17.14.1`, que era a versão `latest` do stylelint naquela manhã (publicada em 2026-07-20; nenhuma versão mais nova até 2026-09-04).

**Frase da primeira tela (antes de qualquer rolagem):**

> **5 dos 444 pacotes do ChainDrop entravam por um único devDependency.**
> Em 4 de agosto de 2026, a partir das 10:13 UTC, um `npm install stylelint` sem lockfile resolvia `file-entry-cache@11.1.6` — infectado — a um salto da raiz, e atrás dele `flat-cache`, `cacheable`, `@cacheable/memory` e `@cacheable/utils`. O `keyv`, onde o ataque começou, ficou de fora: `^5.6.0` não aceita `6.0.0`.

Abaixo da frase, o grafo já colapsado: raiz → `file-entry-cache ^11.1.5` (vermelho, "aceitava 11.1.6") → `flat-cache ^6.1.23` → `cacheable ^2.5.0` → `@cacheable/memory` / `@cacheable/utils`; e as três arestas para `keyv ^5.6.0` em cinza, marcadas "barrado pela faixa". Os outros ~110 nós do grafo aparecem só como contagem ("116 pacotes no grafo; 6 no caminho").

Dois outros presets, um toque cada:
- `got@15.1.0` (latest no dia) → `cacheable-request ^13.0.18` aceitava `13.0.20` infectado. **1 salto.**
- `eslint@10.8.0` (latest no dia) → `file-entry-cache ^8.0.0` → `flat-cache ^4` → `keyv ^4.5.4`: **nenhum caminho.** O ESLint só subiu para o `file-entry-cache` 11 em 10.10.0 (2026-09-04), já com a faixa `11.1.5 || >11.1.6 <12`, que exclui explicitamente a versão infectada.

O contraste stylelint × eslint é a tese da página: mesma família de pacotes, a faixa de versão decide.

---

## Usuário e momento

**Usuário principal:** dev ou tech lead de um time pequeno de Node/front-end, sem ferramenta paga de supply chain, no dia (ou dia seguinte) em que sai a notícia de um worm no npm. Ele tem o `package.json` aberto no editor e uma pergunta: "estou no raio disso?".

**Momento:** manchete de incidente no feed, antes de rodar `npm ls` em todos os repositórios. Ou, em tempo de paz, revisando o `package.json` antes de um upgrade.

**Decisão que ele toma:** qual dependência direta é a porta de entrada, e o que fazer com ela: travar a faixa (`~`, versão exata ou `overrides`), confirmar que o lockfile está commitado e que o CI usa `npm ci`, ou rodar `--ignore-scripts` enquanto o incidente não fecha.

**Leitor secundário (portfólio):** quem avalia o Daniel. Para ele, a primeira tela tem que fazer sentido sem colar nada: o caso padrão já carregado é a demo.

---

## Dados

### 1. Lista de versões maliciosas do ChainDrop — Datadog Security Labs (IOC CSV)

- **URL:** https://raw.githubusercontent.com/DataDog/indicators-of-compromise/keyv-campaign/keyv-campaign/malicious-packages.csv (link citado no artigo da Datadog; está no branch `keyv-campaign`, não no `main`).
- **Licença:** Apache-2.0 (repositório `DataDog/indicators-of-compromise`, campo `license` da API do GitHub: `Apache-2.0`). Reuso permitido com atribuição e cópia do aviso de licença/NOTICE.
- **Formato:** CSV, colunas `ecosystem,package,versions`; versões múltiplas separadas por ` | `.
- **Tamanho:** 31.288 bytes, 444 linhas de pacote, 2.236 versões (contagem minha). StepSecurity fala em 2.212 versões; a página cita a fonte e mostra a contagem do arquivo usado.
- **Como buscar uma vez:** `curl` do raw acima → `scripts/raio-de-explosao.ts` converte para `data.json` (`{ [pacote]: string[] }`), commitado ao lado do código. Cabe inteiro no bundle do cliente (~30 KB, menos em JSON enxuto).
- Amostra salva em scratchpad (`chaindrop-malicious-packages.csv`), não no repo.

### 2. Horário de publicação de cada versão — registro do npm

- **URL:** `https://registry.npmjs.org/<pacote>` (campo `time`). Sem auth.
- **O que dá:** o minuto em que cada versão maliciosa entrou (ex.: `keyv@6.0.0` 09:35:00Z, `flat-cache@6.1.24` 10:10:55Z, `cacheable-request@13.0.20` 10:11:24Z, `file-entry-cache@11.1.6` 10:13:02Z). Versões despublicadas continuam no `time`, mas saem de `versions` e `dist-tags`.
- **Licença:** metadados do registro sob os termos de uso do npm (https://docs.npmjs.com/policies/open-source-terms). Não há licença de dados explícita: usar só os timestamps das ~11 versões mostradas, citando o registro como fonte, e não redistribuir o documento inteiro. **Se isso for um problema, dá para cortar:** os horários também estão no artigo da Datadog e no OSV (`published`).
- **Como buscar uma vez:** no mesmo script, só para os pacotes que aparecem nos presets (≈10 requisições). Guardar só `{pacote, versão, publicadoEm}`.

### 3. Grafo de dependências resolvido — deps.dev API v3

- **Endpoints usados:** `GET /v3/systems/npm/packages/{nome}` (versões + `publishedAt` + `isDefault`) e `GET /v3/systems/npm/packages/{nome}/versions/{versão}:dependencies` (nós com `relation` SELF/DIRECT/INDIRECT, arestas com `requirement`, a faixa semver original).
- **Licença:** "CC-BY 4.0", uso sujeito aos Google APIs Terms of Service; a doc diz que clientes podem fazer cache (https://docs.deps.dev/api/v3/). Atribuição obrigatória na página: "Dados de dependências: deps.dev (Google), CC BY 4.0".
- **Auth / limites:** sem auth. A doc não publica limite. 30 requisições paralelas hoje: 30 × HTTP 200, sem header de rate limit.
- **Tamanho/latência:** `stylelint@17.14.1` → 116 nós/133 arestas, 22 KB, ~0,4 s; `got@15.1.0` → 25 nós; `@backstage/cli@0.33.0` → 1.893 nós/3.871 arestas, 468 KB, ~0,3 s.
- **Não existe endpoint de dependentes reversos** (confirmado na doc). Não precisamos dele: a página parte do `package.json` do usuário e anda para frente.
- **Versões maliciosas não existem no deps.dev:** `file-entry-cache/versions/11.1.6` → 404; `keyv` lista até `6.0.0-rc.1`. Por isso o grafo vem limpo e a exposição é calculada por cima dele (ver algoritmo abaixo).

### 4. Confirmação por versão — OSV API (ossf/malicious-packages)

- **Endpoints:** `POST https://api.osv.dev/v1/query` e `/v1/querybatch`. Sem auth; a FAQ do OSV diz "Currently there is not a limit on the API".
- **Registros:** `MAL-2026-11524` (keyv 6.0.0), `MAL-2026-11971` (flat-cache 6.1.24), `MAL-2026-11970` (file-entry-cache 11.1.6), `MAL-2026-11964` (cacheable-request 13.0.20). Cada um traz o mecanismo (hook `preinstall: node setup.mjs`, Bun, `Math_Symbol.js`) e créditos de quem achou.
- **Licença:** os registros MAL vêm do repositório `ossf/malicious-packages`, Apache-2.0 (API do GitHub). O OSV não publica licença própria na FAQ/doc da API; tratamos cada registro pela licença da fonte.
- **Uso:** só para linkar cada nó vermelho ao seu `MAL-…` (ids guardados no `data.json`); nada de chamada em runtime.

### Algoritmo (o que a página calcula)

1. Resolver cada dependência direta do `package.json` colado: `GetPackage` → `semver.maxSatisfying` sobre as versões com `publishedAt ≤ instante escolhido` (no replay, 2026-08-04T10:15Z).
2. `GetDependencies` de cada raiz; unir os grafos.
3. Uma aresta está **exposta** quando alguma versão maliciosa do pacote-alvo satisfaz o `requirement` da aresta (`semver.satisfies`) e já tinha sido publicada no instante escolhido. Está **barrada** quando o alvo tem versão maliciosa mas a faixa não a aceita.
4. Colapsar: mostrar só os caminhos raiz → aresta exposta (BFS pelo menor caminho, depois todos os caminhos até N=5 por alvo), mais as arestas barradas como contraste.
5. Modo "e se": o usuário toca em qualquer pacote do grafo e vê todos os caminhos até ele (sem precisar de lista de maliciosos). É a pergunta genérica do título.

`semver` (npm, ~20 KB, ISC) é a única biblioteca nova, justificada: comparar faixas npm à mão é onde bugs escondem.

### Decisão: precomputado + consulta ao vivo com cache

- **Presets (stylelint, got, eslint) precomputados** em `data.json` com o grafo do deps.dev já recortado aos caminhos: a primeira tela não depende de rede.
- **`package.json` colado → server route** (`/demo/raio-de-explosao/api`), no Next: no máximo 40 dependências diretas, concorrência 6, cache em memória por `nome@versão` (grafo de uma versão publicada é imutável na prática) e `fetch` com `revalidate` longo. Falha do deps.dev → mensagem clara e os presets continuam funcionando.
- Não é um crawler recorrente: só roda quando alguém cola algo. Se isso ferir a regra "buscar uma vez" do Labs, o corte é o modo ao vivo; a página ainda se sustenta com os presets e o modo "e se" sobre eles.

---

## Referências

1. **`npm explain` / `npm why`** (https://docs.npmjs.com/cli/commands/npm-explain) — imprime a cadeia que trouxe um pacote. Faz bem: exato, a partir do `node_modules` real. Diferente aqui: não precisa de checkout nem instalação, e responde para uma versão que **já foi despublicada** (o `npm explain` não acha o que não está instalado).
2. **deps.dev, aba Dependents/Dependencies** (https://deps.dev/npm/file-entry-cache) — grafo resolvido, licenças, advisories. Faz bem: dados completos e rápidos. Diferente: mostra o grafo inteiro de um pacote; não parte do *seu* `package.json`, não colapsa até um alvo e não distingue "faixa aceitava a versão infectada" de "estava no grafo".
3. **npmgraph** (https://npmgraph.js.org, MIT, github.com/npmgraph/npmgraph) — cola nomes/`package.json` e desenha o grafo todo. Faz bem: entrada sem fricção. Diferente: grafo completo vira novelo em celular; aqui o grafo colapsa para 3–8 nós. (Site respondeu 429 hoje; descrição de memória → INFERIDO.)
4. **Datadog Security Labs, "'ChainDrop' worm compromises hundreds of popular npm packages"** (https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/, 2026-08-04) — linha do tempo ao segundo e CSV de IOCs. Faz bem: rigor e dados abertos. Diferente: diz *o que* foi infectado; a página diz *por onde chegaria em você*.
5. **StepSecurity, "ChainDrop npm Worm"** (https://www.stepsecurity.io/blog/chaindrop-npm-worm) — janela de remoção e impacto em CI. Útil para a janela; mas afirma exposição do ESLint que os dados do deps.dev não mostram para `eslint@10.8.0` (ver Achados). A página mostra o dado, não a manchete.

Nenhuma marca é imitada: sem roxo Datadog, sem vermelho npm, sem logos.

---

## Escopo de 16h

### Telas / estados (uma página)

1. **Primeira tela (padrão):** frase + grafo colapsado do stylelint + linha do tempo mínima de 4/ago (09:35 keyv → 10:10–10:13 flat-cache/cacheable-request/file-entry-cache → ~10:39 começa a remoção). Chips: `stylelint` · `got` · `eslint`.
2. **Caminho:** lista vertical de nós (celular) / grafo horizontal da esquerda para a direita (desktop). Cada aresta mostra a faixa (`^11.1.5`) e o veredito: *aceitava 11.1.6* (vermelho) ou *barrado* (cinza). Cada nó vermelho linka o `MAL-…` no osv.dev.
3. **Colar `package.json`:** textarea; valida JSON; lê `dependencies` + `devDependencies`.
4. **Resultado ao vivo:** mesmo componente de caminho; contagem "N portas de entrada, M pacotes infectados alcançáveis"; ou "nenhum caminho" com as arestas barradas.
5. **Modo "e se":** tocar num nó qualquer (ou buscar nome) → todos os caminhos até ele. Sem lista de maliciosos, é a pergunta do título para o próximo incidente.
6. **O que fazer:** três linhas: lockfile commitado + `npm ci`; `overrides` para travar; `--ignore-scripts` na janela de incidente (o ChainDrop entrava por `preinstall`).
7. **Rodapé de fontes e método:** Datadog (Apache-2.0), deps.dev (CC BY 4.0), OSV/ossf (Apache-2.0), registro npm; limitações em uma frase cada.

**Estados:** carregando (skeleton do caminho, não spinner), JSON inválido, >40 deps (corta e avisa), pacote privado/inexistente no deps.dev (listado como "não resolvido", não some), deps.dev fora do ar, zero caminhos (é uma resposta, não um erro).

### Orçamento

| Bloco | h |
|---|---|
| Script único de dados (CSV + npm time + presets do deps.dev + ids OSV) e testes | 3 |
| Núcleo: resolver raízes, unir grafo, classificar arestas, colapsar caminhos (Vitest) | 4 |
| Server route com cache e limites | 2 |
| UI do caminho (celular + desktop), primeira tela, presets | 4 |
| Colar/e-se/estados/rodapé, DESIGN.md/PRODUCT.md, registro | 3 |

### Cortes

- Sem lockfile (`package-lock.json`/`pnpm-lock`) na entrada: só `package.json`. (Lockfile seria a resposta exata; fica para depois.)
- Sem outros incidentes além do ChainDrop (Shai-Hulud etc. ficam fora).
- Sem outros ecossistemas (só npm).
- Sem reconstruir o grafo "como era em 4/ago" nos níveis transitivos: a raiz é resolvida na data, o resto é o grafo de hoje do deps.dev (ver Riscos).
- Sem grafo force-directed / biblioteca de grafos: caminhos são listas, desenhados com CSS/SVG simples.

---

## Riscos

- **Grafo transitivo é o de hoje, não o de 4/ago.** deps.dev resolve cada versão no momento do crawl. Para os presets isso foi verificado (flat-cache, file-entry-cache, cacheable não publicaram nada depois de 2026-06-27; o default ainda é 6.1.23/11.1.5/2.5.0), mas para um `package.json` qualquer pode divergir. Mitigação: a regra de exposição usa a **faixa** de cada aresta, não a versão resolvida; a página diz isso numa frase.
- **As dependências da própria versão maliciosa são desconhecidas** (despublicadas; deps.dev dá 404). Assume-se que `file-entry-cache@11.1.6` tinha as mesmas faixas de 11.1.5.
- **Lockfile muda tudo:** quem tinha lockfile e usou `npm ci` não resolveu nada novo. A frase da primeira tela diz "sem lockfile"; o texto não afirma que alguém foi infectado.
- **deps.dev sem limite publicado e sob os Google API ToS:** consulta ao vivo pode ser estrangulada. Mitigação: cache, concorrência baixa, presets offline.
- **Contagens divergentes entre fontes** (2.236 no CSV × 2.212 StepSecurity × "hundreds" na Datadog). Mostrar a do arquivo usado, com link.
- **Janela de exposição por pacote é INFERIDA** do campo `modified` do registro (ex.: `file-entry-cache` modificado às 11:52:08Z). Na página, usar só o que a StepSecurity afirma ("remoção a partir de ~10:39 UTC; carriers primários revertidos até 18:10 UTC") e não inventar a hora de saída de cada versão.
- **Registro npm sem licença de dados explícita** → usar o mínimo (timestamps de ~11 versões) com citação; cortável.
- **Tema sensível:** mencionar o mantenedor por nome não acrescenta nada; a página fala de pacotes, não de pessoas.

---

## Achados

Todos observados em 2026-09-25.

| # | Achado | Status | Fonte |
|---|---|---|---|
| 1 | O artigo da Datadog existe, é de 2026-08-04, título "'ChainDrop' worm compromises hundreds of popular npm packages"; o nome ChainDrop foi dado pela comunidade | CONFIRMADO | https://securitylabs.datadoghq.com/articles/npm-worm-compromises-popular-npm-packages/ |
| 2 | Início: commit malicioso no repo do keyv às 09:02:37 UTC; `keyv@6.0.0` publicado 09:29–09:35; pacotes cacheable ~10:06–10:07; `ecto@5.0.1` ~10:25 | CONFIRMADO | artigo Datadog |
| 3 | Mecanismo: hook `preinstall` → `setup.mjs` baixa Bun e roda segundo estágio ofuscado (~728 KB) que coleta credenciais e se republica com tokens roubados | CONFIRMADO | OSV `MAL-2026-11524`, `MAL-2026-11970` via `api.osv.dev/v1/query` |
| 4 | CSV de IOCs: 444 pacotes, 2.236 versões, 31 KB, Apache-2.0 | CONFIRMADO | raw.githubusercontent.com/DataDog/indicators-of-compromise/keyv-campaign/keyv-campaign/malicious-packages.csv; api.github.com/repos/DataDog/indicators-of-compromise |
| 5 | Versões no CSV: keyv 6.0.0, flat-cache 6.1.24, file-entry-cache 11.1.6, cacheable 2.5.1, @cacheable/utils 2.5.1, @cacheable/memory 2.2.1, cacheable-request 13.0.20, cache-manager 7.2.10, ecto 5.0.1 | CONFIRMADO | CSV acima |
| 6 | Publicação no registro: keyv 6.0.0 09:35:00Z; flat-cache 6.1.24 10:10:55Z; cacheable-request 13.0.20 10:11:24Z; file-entry-cache 11.1.6 10:13:02Z; `latest` hoje é 5.6.0 / 6.1.23 / 13.0.19 / 11.1.5 | CONFIRMADO | registry.npmjs.org/{keyv,flat-cache,cacheable-request,file-entry-cache} |
| 7 | Janela: npm começou a despublicar ~10:39 UTC; 11 carriers primários revertidos até 18:10 UTC; StepSecurity conta 444 pacotes / 2.212 versões | CONFIRMADO (como afirmação da StepSecurity) | https://www.stepsecurity.io/blog/chaindrop-npm-worm |
| 8 | Downloads na semana anterior (27/jul–2/ago): keyv 153,7 M; flat-cache 149,8 M; file-entry-cache 147,4 M; got 39,2 M; cacheable-request 34,1 M; stylelint 10,6 M | CONFIRMADO | api.npmjs.org/downloads/point/2026-07-27:2026-08-02/{pacote} |
| 9 | `stylelint@17.14.1` era a versão mais nova publicada antes de 10:13Z de 4/ago (publicada 2026-07-20) | CONFIRMADO | api.deps.dev/v3/systems/npm/packages/stylelint |
| 10 | Grafo de `stylelint@17.14.1`: 116 nós; arestas `file-entry-cache ^11.1.5`, `flat-cache ^6.1.23`, `cacheable ^2.5.0`, `@cacheable/memory ^2.2.0`, `@cacheable/utils ^2.5.0` aceitam as versões maliciosas; 3 arestas `keyv ^5.6.0` não aceitam 6.0.0 | CONFIRMADO (dados deps.dev + `semver.satisfies`, script rodado hoje) | api.deps.dev/v3/systems/npm/packages/stylelint/versions/17.14.1:dependencies |
| 11 | `got@15.1.0` (latest em 4/ago) exige `cacheable-request ^13.0.18`, que aceita 13.0.20 | CONFIRMADO | deps.dev `got/versions/15.1.0:requirements` e `:dependencies` |
| 12 | `eslint@10.8.0` (latest em 4/ago, publicado 2026-07-24) exige `file-entry-cache ^8.0.0` → `flat-cache ^4` → `keyv ^4.5.4`: nenhuma faixa aceita as versões do ChainDrop | CONFIRMADO | deps.dev `eslint/versions/10.8.0:dependencies` |
| 13 | `eslint@10.10.0` (2026-09-04) passou a exigir `file-entry-cache "11.1.5 \|\| >11.1.6 <12"`, pulando a versão maliciosa | CONFIRMADO | deps.dev `eslint/versions/10.10.0:requirements` |
| 14 | A exposição do ESLint citada pela StepSecurity não se sustenta para `eslint@10.8.0` isolado; pode ter vindo por plugins ou outras dependências dos projetos citados | INFERIDO | cruzamento de 7 e 12 |
| 15 | deps.dev: CC-BY 4.0 + Google API ToS; cache permitido; sem auth; sem limite documentado; sem endpoint de dependentes reversos | CONFIRMADO | https://docs.deps.dev/api/v3/ |
| 16 | deps.dev aguentou 30 requisições paralelas (30 × 200); `:dependencies` de 22 KB a 468 KB, 0,2–0,5 s | CONFIRMADO | curl hoje |
| 17 | deps.dev não tem as versões maliciosas (404 em `file-entry-cache/versions/11.1.6`; keyv só até 6.0.0-rc.1) | CONFIRMADO | api.deps.dev |
| 18 | OSV API sem auth e "Currently there is not a limit on the API"; `querybatch` funciona (MAL-2026-11964 para cacheable-request 13.0.20) | CONFIRMADO | https://google.github.io/osv.dev/faq/; POST api.osv.dev/v1/querybatch |
| 19 | `ossf/malicious-packages` é Apache-2.0 | CONFIRMADO | api.github.com/repos/ossf/malicious-packages |
| 20 | O OSV não publica licença própria de dados na FAQ/doc da API | CONFIRMADO (ausência observada) | https://google.github.io/osv.dev/faq/ |
| 21 | Registro npm não tem licença de dados explícita para o JSON de metadados | INFERIDO | termos do npm não lidos na íntegra hoje |
| 22 | Quem instalou com lockfile + `npm ci` não resolveu as versões novas; `--ignore-scripts` impediria o estágio 1 | INFERIDO | semântica de lockfile do npm + mecanismo em 3 |
| 23 | Hora de remoção por versão ≈ campo `modified` do registro (ex.: file-entry-cache 11:52:08Z, cacheable-request 10:39:44Z) | INFERIDO | registry.npmjs.org `time.modified` |
| 24 | `npm explain` imprime a cadeia que instalou um pacote, a partir do que está instalado | CONFIRMADO | github.com/npm/cli docs/lib/content/commands/npm-explain.md |
| 25 | npmgraph é MIT, ativo (push 2026-09-24); o site respondeu 429 hoje; sua capacidade de colar `package.json` é de memória | CONFIRMADO (repo) / INFERIDO (funcionalidade) | api.github.com/repos/npmgraph/npmgraph |
