# Pix na minha cidade — brief

Showcase (ADR-0002) em `/demo/pix-na-minha-cidade`. Demo conceitual de Daniel Bernardino: sem empresa, sem cliente, indexada e sem data de fim. Pesquisa feita em 2026-09-25; toda requisição citada abaixo foi executada nesse dia.

Recomendação: **construir**. Os dados existem por município, respondem sem autenticação, têm licença aberta (ODbL + IBGE com citação) e contam uma história que ninguém espera: a intensidade de uso do Pix cresce de Sul para Norte, e as capitais mais ricas estão no fim da fila. O fallback `de-onde-vem-o-watt` não é necessário (ver Referências).

---

## Pergunta e resposta da primeira tela

**Pergunta:** quanto a minha cidade usa o Pix, comparada ao resto do Brasil?

**Métrica principal: Pix por usuário no mês.** São os Pix enviados por pessoa física residente no município divididos pelo número de pessoas físicas que enviaram pelo menos um Pix naquele mês (`QT_PagadorPF / QT_PES_PagadorPF`). É a mesma métrica "Transações por Usuário" do estudo Geografia do Pix 2 (FGV EAESP, jun/2025). Vale por três motivos:
- não depende de estimativa de população, que distorce municípios pequenos e de fronteira;
- ignora pagadores pessoa jurídica, que se acumulam onde a empresa tem sede (ver Riscos);
- fica comparável entre uma capital e uma cidade de 1.300 habitantes.

**Caso padrão: São Paulo (SP), agosto de 2026**, o último mês fechado.

> **Quem usa Pix em São Paulo fez 38 Pix em agosto. A média do Brasil é 43.**
> São Paulo está no meio da fila, em 2.805º entre 5.571 municípios, e é a 25ª entre as 27 capitais. Em Manaus foram 71.

Os números abaixo foram calculados hoje com a API do BCB (ver Achados A6–A9):
- São Paulo: 373.200.700 Pix de pessoa física; 9.788.772 pagadores; 38,1 por pagador; valor médio de R$ 243.
- Brasil: 43,2 Pix por pagador em 2026-08.
- Capitais: Manaus 70,9 · Macapá 63,2 · Belém 61,9 … Belo Horizonte 38,7 · São Paulo 38,1 · Curitiba 34,4 · Florianópolis 32,5.
- Estados: Amazonas 64,9; Rio Grande do Sul 36,0.

A cidade padrão é São Paulo porque é a mais buscada e porque a resposta contraria a intuição: a maior cidade do país está na mediana. A página abre já com o card preenchido e a busca logo acima dele. Não há tela vazia.

**Contexto sob o card, em uma linha, sempre com fonte:** "Em 4 de setembro de 2026 o Pix bateu recorde: 318.073.816 transações em um dia (Banco Central, via imprensa)." O MED 2.0 entra só como nota de rodapé nacional, porque não existe dado de fraude por município (A11).

---

## Usuário e momento

**Usuário principal:** um brasileiro curioso, de 20 a 45 anos, que vê no feed (X, Instagram, WhatsApp) o card de outra pessoa ("Belém faz 62 Pix por mês, e a sua cidade?") ou uma notícia sobre o recorde de 318 milhões. Abre pelo celular, em um momento de distração: fila, ônibus, intervalo.

**O que ele faz com a página:** busca a própria cidade (ou a cidade onde nasceu), compara com o Brasil e **decide se compartilha o card**. É a única decisão que importa, e a métrica de sucesso da demo é o card ser bom o bastante para ser postado.

**Leitor secundário (não guia o design):** quem visita o portfólio no desktop e quer ver range: dados públicos, busca rápida, imagem compartilhável gerada no cliente e rigor nas fontes.

---

## Dados

### 1. BCB · Estatísticas do Pix · Transações Pix por Município — fonte principal

| | |
|---|---|
| Endpoint | `https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/TransacoesPixPorMunicipio(DataBase=@DataBase)?@DataBase='AAAAMM'&$format=json` |
| Auth | nenhuma (HTTP 200 sem chave ou cookie) |
| Rate limit | não documentado; em 5 chamadas seguidas, nenhum 429 |
| Formato | OData v4 JSON; 1 linha por município e mês; 18 campos: `AnoMes`, `Municipio_Ibge`, `Municipio`, `Estado_Ibge`, `Estado`, `Sigla_Regiao`, `Regiao`, `VL_/QT_` Pagador/Recebedor × PF/PJ, `QT_PES_` Pagador/Recebedor × PF/PJ |
| Semântica do parâmetro | `DataBase` = "a partir de": `'202509'` devolve 13 meses (202509–202609), 72.435 linhas, 32,5 MB, em 10 s |
| Cobertura | 5.572 linhas por mês = 5.571 municípios + 1 linha `N/D / NAO INFORMADO` (3,57 M Pix PF em 2026-08, descartada) |
| Atualização | o mês corrente já aparece parcial: 2026-09 com 5,83 bi de Pix contra 7,37 bi em 2026-08 |
| Licença | **ODbL** — Open Data Commons Open Database License. CKAN `package_show?id=pix`: `license_id: "odc-odbl"`, `license_title: "Open Data Commons Open Database License (ODbL)"`, `license_url: http://www.opendefinition.org/licenses/odc-odbl` |

**O que a ODbL exige de nós:**
- A página é um *Produced Work*, então exige atribuição visível: "Fonte: Banco Central do Brasil — Estatísticas do Pix (dadosabertos.bcb.gov.br/dataset/pix), ODbL".
- O `data.json` derivado que vai para o repositório público é um *Derivative Database*. Tem de ser oferecido sob ODbL (share-alike): um comentário ou `DATA-LICENSE` na pasta do artefato e uma linha no rodapé da página.
- Nada disso impede o uso. Também não há restrição comercial.

### 2. BCB · Estatísticas de Fraude no Pix (MED) — só contexto nacional

- `EstatisticasFraudesPix(Database=@Database)`, mesma licença ODbL.
- **Não tem dimensão geográfica**: a entidade só tem `AnoMes` e 23 medidas nacionais.
- Último mês publicado: **2026-03** (a documentação diz "30 dias após o término do mês", mas a defasagem observada é de cerca de 6 meses).
- Uso: no máximo uma nota nacional. Exemplo, 2026-03: 2.925.121 Pix contestados; 308.792 contestações aceitas; 13,19% de devolução.

### 3. IBGE · Estimativas de população (agregado 6579, variável 9324) — só para a métrica secundária

- Endpoint: `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[all]`. Com curl, use `-g` por causa dos colchetes.
- Sem auth. 200 OK em 0,4 s, 689 KB.
- Período mais recente: **2026**, modificado em 28/08/2026. 5.571 municípios, total de 214.211.951 habitantes. Os códigos casam 1:1 com `Municipio_Ibge` do BCB.
- Nomes em grafia correta ("São Paulo - SP"). **Use estes nomes na UI**, não os do BCB, que vêm em caixa alta.
- **Licença:** o IBGE não publica uma licença formal da API. As páginas de termos de uso (`ibge.gov.br/acesso-informacao/.../termos-de-uso.html`) devolvem 403 para curl e WebFetch hoje, então não foi possível citar o texto na fonte. Pela busca, os termos dizem que os dados "podem ser utilizados por terceiros … sendo citado o IBGE como fonte" e que o conteúdo é de domínio público com citação obrigatória. **Tratar como reuso livre com citação obrigatória. Não está verificado no texto original** (ver A14).
- Uso: apenas "adoção", ou seja, pagadores PF ÷ população, como dado secundário. Ver o risco de Pacaraima.

### 4. Recorde diário de 318 milhões

- Não está nos dados abertos: a API só tem séries mensais.
- Fonte disponível: imprensa citando o BC/SPI, entre outros Metrópoles, "R$ 186,89 bilhões: Pix bate recorde diário…": 318.073.816 transações em 4/9/2026 (sexta-feira), R$ 186,89 bi. O recorde anterior foi 313.339.828 em 5/12/2025.
- Não achei nota primária no bcb.gov.br (INFERIDO: é possível que tenha saído só por rede social ou nota à imprensa). Na página, citar "Banco Central, via Metrópoles" com o link.

### Como buscar uma vez

Script `scripts/fetch-pix.ts` (ou `.mjs`), rodado à mão e nunca no build:
1. `GET TransacoesPixPorMunicipio` com `DataBase='202509'`: 32 MB em memória, nada salvo cru.
2. Manter só `AnoMes ≤ 202608`, que são 12 meses fechados. Descartar a linha `N/D` e o mês parcial.
3. `GET` da população do IBGE. Join por código.
4. Gravar `data.json` compacto: `{ fetchedAt, months[12], brasil: { perPayer[12], adoption }, mun: [[ibge, nome, uf, pop, [[qtPF, pagadoresPF, vlPF] × 12]]] }`.
5. Pré-computar no script os rankings de 2026-08 (Brasil, UF, capitais), para a página não ordenar 5.571 linhas por requisição.

**Tamanho medido:**
- `data.json` com 12 meses: cerca de 1,76 MB (835 KB gzip). Só no servidor, lido uma vez por `load.ts`, como no `tarken-fila-da-safra` (725 KB). Se quiser menos, dá para guardar a série só em Pix por pagador (1 número por mês).
- Índice de busca enviado ao cliente (`[ibge, nome, uf]`): 154 KB, **58 KB gzip**.

---

## Referências

1. **Dados do Pix** — https://www.dadospix.com.br/ (painel independente de Sulivan Rocha sobre a mesma API).
   - Faz bem: cobre todos os recursos (DICT, chaves, municípios, volume mensal) e documenta a fonte em schema.org.
   - É um painel para quem já quer explorar dados. **A diferença aqui:** uma pergunta, uma resposta, um card. Nada de abas ou filtros.
2. **FGV EAESP · Geografia do Pix 2** (jun/2025) — https://portal.fgv.br/sites/default/files/uploads/fgv-eaesp-estudo-geografia-do-pix-2.pdf e a notícia https://portal.fgv.br/en/noticias/use-pix-greater-municipalities-younger-population-points-out-study-fgvcemif
   - Faz bem: métricas limpas, só PF, adoção e transações por usuário. Também achou o Norte em primeiro e Pacaraima (RR) como caso anômalo.
   - É um PDF estático com dados de 2024. **A diferença:** a mesma métrica com dados até ago/2026, para qualquer um dos 5.571 municípios, em 2 segundos. Citar o estudo na página como origem da métrica.
3. **IBGE Cidades** — https://cidades.ibge.gov.br (panorama e ranking "posição da sua cidade").
   - Faz bem: o padrão "busque sua cidade → posição no Brasil / no estado".
   - É denso e tem cara de sistema. **A diferença:** um número grande e uma frase, pensados para ler em 3 segundos no celular.
4. **Nexo · mapa interativo do PIB dos municípios** — https://www.nexojornal.com.br/grafico/2025/12/19/pib-municipios-brasileiros-ranking-ibge
   - Faz bem: ranking municipal com contexto editorial.
   - **A diferença:** sem mapa coroplético, que é caro no celular e ilegível para 5.571 polígonos pequenos. No lugar, uma faixa de distribuição (strip plot) com a cidade marcada.
5. **Padrão "Wrapped"** (Spotify Wrapped, sem imitar a marca).
   - Faz bem: um card vertical 9:16 que é da pessoa e que ela quer postar.
   - **A diferença:** o card traz a fonte impressa, porque é dado público e não dado pessoal.

**Fallback `de-onde-vem-o-watt`:** não recomendado agora. A API do Ember respondeu **403** sem chave (`api.ember-energy.org/v1/electricity-generation/yearly?...`), então exige cadastro e API key. Além disso, scrollytelling editorial custa mais horas de narrativa do que um card. O Pix por município tem dados mais densos, mais atuais e um gancho de compartilhamento que o Watt não tem.

---

## Escopo de 16h

### Telas e estados (uma página, `?c=<código IBGE>`)

1. **Card da cidade**, primeira dobra no celular:
   - nome e UF;
   - número grande (Pix por usuário em ago/2026);
   - frase comparando com o Brasil, do tipo "abaixo/acima da média do Brasil (43)";
   - posição no Brasil (x de 5.571), no estado (x de N) e, se for capital, entre as capitais;
   - sparkline de 12 meses, cidade contra Brasil;
   - valor médio por Pix.
   - Padrão: São Paulo.
2. **Busca**: campo com typeahead no cliente sobre o índice de 58 KB. Normaliza acentos e aceita "sao paulo", "SP" e homônimos com UF ("Bom Jesus - PI/RS/SC…").
   - **Sem JS**, é um `<form method="get">` com `?q=`, que o servidor resolve.
   - `?c=` é a URL compartilhável.
3. **Faixa de distribuição**: 5.571 pontos (ou um histograma de 40 bins) com a cidade, o Brasil e as capitais marcados. É SVG estático gerado no servidor.
4. **Botão "Compartilhar card"**: gera um PNG 1080×1350 no cliente (canvas) e chama `navigator.share({ files })`. Sem suporte, faz download. O link `?c=` é sempre copiável.
5. **Rodapé de fonte e método**:
   - métrica, mês, fontes BCB (ODbL), IBGE e FGV (origem da métrica);
   - linha do recorde de 318 M;
   - nota nacional do MED 2.0 (fev/2026) com o último número publicado (mar/2026);
   - "dados de <fetchedAt>".

### Estados

- **Padrão** (sem `?c`): São Paulo.
- **`?c` inválido ou inexistente**: mostra o padrão e um aviso discreto, "não achamos esse município". Nunca 404, que é reservado para o slug.
- **Busca sem resultado**: "Nenhum município com esse nome" e 3 sugestões por prefixo.
- **Homônimos**: lista com UF.
- **Outliers** (adoção > 100% da população estimada, como Pacaraima-RR com 174.555 pagadores para 24.132 habitantes): nota no card, "números afetados por pessoas que não moram no município (ex.: fronteira)". Métrica principal intacta.
- **Municípios muito pequenos** (mínimo de 387 pagadores): mostrar sem ressalva. A métrica por pagador é estável, mas a posição exata no ranking é ruidosa; mostrar "entre os 10% que mais usam" em vez da posição exata abaixo de ~2.000 pagadores.
- **Share não suportado**: download do PNG e cópia do link.

### Cortado

- **Mapa coroplético** (GeoJSON de 5.571 polígonos: peso e tempo demais).
- **Lado recebedor e PJ.** PJ é enganoso por município: fica onde está a sede.
- **Série diária e o próprio recorde como gráfico**, porque não há dado diário aberto.
- **MED por município** (o dado não existe).
- **Chaves Pix e DICT.**
- **Atualização automática.** O dado fica congelado com `fetchedAt` visível; refetch manual.
- **OG image por cidade.** A rota `/demo/[slug]` gera `metadata` sem `searchParams`, então o preview do link mostra só o card genérico. O card por cidade circula como PNG. Se valer a pena depois, o `Showcase` ganha um `metadata?(searchParams)` opcional, mas isso muda `src/labs` e não o artefato.
- **Geolocalização** ("detectar minha cidade"): pede permissão e erra em cidades vizinhas.

### Orçamento aproximado

| Tarefa | Horas |
|---|---|
| Script de fetch + join + testes do join/outliers | 3h |
| `load.ts`, `data.ts`, rankings | 2h |
| Card + busca + estados | 4h |
| Faixa de distribuição + sparkline (SVG à mão) | 2h |
| PNG do card + share | 3h |
| Rodapé, fonte, `DESIGN.md`/`PRODUCT.md`, registro no `index.ts` | 2h |

---

## Riscos

- **PJ distorce o ranking por município.** Com PF+PJ, Cuité-PB aparece com 2.257 Pix por habitante, Santo Antônio de Lisboa-PI com 1.978, e Barueri e Mogi Guaçu no topo, provavelmente por sede de empresas de pagamento. **Mitigação:** usar só PF (decisão tomada acima).
- **O município é o de cadastro do usuário, não onde o Pix acontece.** A FGV define adoção por "pessoas … com residência em determinada área geográfica". Pacaraima-RR tem 7,2 pagadores PF por habitante (fronteira com a Venezuela). **Mitigação:** métrica por pagador e nota em outliers.
- **Mês corrente parcial na API.** 2026-09 já aparece com cerca de 80% do volume. Se entrar por engano, a cidade "cai" no último mês. **Mitigação:** o script corta tudo acima do último mês fechado, e um teste garante isso.
- **Revisões retroativas.** Não verificado se o BCB revisa meses passados. Irrelevante para um snapshot congelado, mas `fetchedAt` fica na página.
- **Média Brasil = soma de Pix PF / soma de pagadores PF.** Supõe que cada pagador é contado em um só município (INFERIDO). Se alguém for contado em dois, a média nacional sai levemente baixa. Documentar no método.
- **Licença IBGE** não verificada no texto original (403). Baixo risco: a prática pública é citar e usar. **Mitigação:** a métrica principal não depende do IBGE. Se for preciso, dá para cortar o IBGE inteiro e usar os nomes do BCB com title-case.
- **ODbL share-alike** sobre o `data.json` no repositório público: exige declarar a licença na pasta. É esquecível, então colocar no checklist.
- **Recorde de 318 M sem fonte primária no bcb.gov.br.** Citar como "via imprensa" ou cortar a linha.
- **Olinda instável:** a API do BCB costuma ter instabilidade e timeouts. Como é fetch único, só afeta quem regenera os dados.
- **Tom:** comparar cidades pode soar como "sua cidade é atrasada". O Sul usa menos Pix por pessoa, provavelmente porque tem mais alternativas (a FGV associa renda alta a menor intensidade). A copy deve ser neutra ("usa mais" ou "usa menos"), sem juízo.

---

## Achados

| # | Achado | Status | Evidência |
|---|---|---|---|
| A1 | O serviço OData `Pix_DadosAbertos` responde 200 sem auth e lista `TransacoesPixPorMunicipio`, `EstatisticasFraudesPix`, `EstatisticasTransacoesPix`, `ChavesPix`, `CnaePorteRecebedor` e `PixUsuariosCadastradosDICT` | CONFIRMADO | https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/ (25/09/2026 16:38 UTC) |
| A2 | Licença do dataset Pix: ODbL | CONFIRMADO | https://dadosabertos.bcb.gov.br/api/3/action/package_show?id=pix → `license_id: odc-odbl`; página https://dadosabertos.bcb.gov.br/dataset/pix |
| A3 | `DataBase` devolve do mês pedido até o mais recente; 13 meses = 72.435 linhas, 32,5 MB, 10 s | CONFIRMADO | chamada com `@DataBase='202509'` |
| A4 | 5.571 municípios + 1 linha "N/D NAO INFORMADO" por mês; códigos IBGE casam 1:1 com a estimativa IBGE 2026 | CONFIRMADO | join feito hoje |
| A5 | 2026-09 já está na API e está parcial (5,83 bi contra 7,37 bi em 2026-08) | CONFIRMADO (dado) / INFERIDO (que é parcial e não um mês fraco) | mesma chamada |
| A6 | Brasil, 2026-08: 43,2 Pix PF por pagador PF; adoção de 68,6% da população estimada | CONFIRMADO (cálculo sobre os dados de hoje) | BCB + IBGE 6579 |
| A7 | São Paulo, 2026-08: 373.200.700 Pix PF, 9.788.772 pagadores, 38,1 por pagador, 2.805º de 5.571, 331º de 645 no estado, ticket médio de R$ 243 | CONFIRMADO (cálculo) | idem |
| A8 | Capitais, 2026-08: Manaus 70,9 (3º do Brasil), São Paulo 25ª de 27, Florianópolis 32,5 (última) | CONFIRMADO (cálculo) | idem |
| A9 | Amazonas 64,9 contra Rio Grande do Sul 36,0 Pix por pagador em 2026-08 | CONFIRMADO (cálculo) | idem |
| A10 | Com PF+PJ, o ranking per capita é dominado por sedes de empresas (Cuité-PB 2.257/hab.) | CONFIRMADO (dado) / INFERIDO (causa) | idem |
| A11 | Estatísticas de fraude/MED não têm recorte municipal (só `AnoMes`); último mês = 2026-03 | CONFIRMADO | `$metadata` e `EstatisticasFraudesPix(Database='202501')` |
| A12 | MED 2.0 obrigatório desde 2/fev/2026, com rastreamento em até 5 níveis e autoatendimento | CONFIRMADO em imprensa e blogs; não lido em norma primária | https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/novas-regras-de-seguranca-do-pix-entram-em-vigor-veja-mudancas · https://investnews.com.br/financas/pix-med-2-0/ (resultados de busca) |
| A13 | API de população IBGE 6579 responde sem auth, período 2026 (modificado em 28/08/2026), 5.571 municípios, 689 KB | CONFIRMADO | https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos e `/periodos/-1/variaveis/9324?localidades=N6[all]` |
| A14 | Termos de uso do IBGE permitem reuso com citação da fonte | INFERIDO (página oficial devolveu 403; texto só via resultados de busca) | https://www.ibge.gov.br/acesso-informacao/acoes-e-programas/termos-de-uso.html (403 hoje) |
| A15 | Recorde: 318.073.816 Pix em 4/9/2026, R$ 186,89 bi; recorde anterior 313.339.828 em 5/12/2025 | CONFIRMADO em imprensa citando o BC; fonte primária no BCB não localizada | https://www.metropoles.com/brasil/r-18689-bilhoes-pix-bate-recorde-diario-de-operacao-diz-banco-central |
| A16 | Pacaraima-RR: 174.555 pagadores PF para 24.132 habitantes estimados | CONFIRMADO (cálculo) | BCB + IBGE |
| A17 | A FGV (Geografia do Pix 2, jun/2025) usa só PF, dados de 2024 e Censo 2022, com as métricas "Taxa de Adesão" e "Transações por Usuário" | CONFIRMADO | PDF https://portal.fgv.br/sites/default/files/uploads/fgv-eaesp-estudo-geografia-do-pix-2.pdf (texto extraído hoje) |
| A18 | dadospix.com.br é um painel independente (Sulivan Rocha) sobre a mesma API | CONFIRMADO | HTML de https://www.dadospix.com.br/ (schema.org `creator`) |
| A19 | A API do Ember exige chave (403 sem ela) | CONFIRMADO | `api.ember-energy.org/v1/electricity-generation/yearly?entity_code=BRA` |
| A20 | A rota `/demo/[slug]` não repassa `searchParams` ao `generateMetadata`, então não há OG por cidade sem mudar `src/labs` | CONFIRMADO | `labs/src/app/demo/[slug]/page.tsx` |
| A21 | Sem rate limit documentado no Olinda | INFERIDO (nenhum 429 em ~8 chamadas; nada na documentação) | https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/documentacao |
