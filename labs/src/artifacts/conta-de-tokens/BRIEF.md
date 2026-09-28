# conta-de-tokens — brief

Showcase em `/demo/conta-de-tokens` (ADR-0002). Demo conceitual de Daniel Bernardino; sem cliente, sem empresa. Pesquisa feita em 2026-09-25; toda afirmação marcada **CONFIRMADO** (URL, observado hoje) ou **INFERIDO**.

## Pergunta e resposta da primeira tela

**Pergunta:** "Quanto o volume de tokens do meu time custaria em cada modelo — e os modelos baratos são os que o mercado está usando?"

**Caso padrão (ilustrativo, rotulado na página):** 1 bilhão de tokens por mês, 80% entrada / 20% saída, 50% da entrada servida do cache. Preços do catálogo do OpenRouter em 2026-09-25; participação do top 50 do OpenRouter na semana de 2026-09-18 a 2026-09-24.

**Frase da primeira tela (antes de qualquer rolagem):**

> Com 50% de cache, 1 bilhão de tokens por mês custa **US$ 2.880 no Claude Sonnet 5** e **US$ 91 no DeepSeek V4.1 Flash** — e a DeepSeek ficou com **24,6%** dos tokens do OpenRouter na última semana; a Anthropic, com 2,8%.

Números calculados hoje a partir dos dados reais (ver Achados 8–10). Abaixo da frase: o slider de cache (0–95%) e a área de participação por fornecedor; mexer no slider reordena a lista de faturas ao vivo. A frase é gerada dos dados no build, não escrita à mão — quando os dados forem rebuscados, ela muda sozinha.

Por que esse recorte: o contraste de 30x entre um modelo de fronteira e o modelo que lidera o volume é a notícia; o slider mostra que o cache mexe muito na fatura dos caros (Sonnet 5: US$ 3.600 → 2.304 de 0% a 90%) e pouco na dos baratos (DeepSeek V4.1 Flash: US$ 120 → 67), porque neles a saída domina.

## Usuário e momento

**Usuário primário:** o tech lead / head de engenharia de um time brasileiro de 5–30 devs que já paga uma ou duas APIs de LLM (agente de código, feature com LLM no produto) e recebeu a fatura do mês mais alta do que o orçado. **INFERIDO.**

**Momento:** a fatura chegou, ou o financeiro perguntou "por que isso subiu?". Ele tem um número de tokens/mês (do painel do provedor) e quer saber, em 2 minutos, se trocar de modelo ou investir em cache resolve — antes de abrir um projeto de migração. **INFERIDO.**

**Decisão que toma:** (a) vale a pena priorizar prompt caching (quanto a fatura cai por ponto de cache)? (b) vale testar um modelo mais barato que o mercado já adotou em volume, ou continuar no atual? A página não decide por ele; mostra a ordem de grandeza. **INFERIDO.**

Leitor secundário: o visitante do portfólio de Daniel (quer ver um dashboard denso bem feito). A página serve os dois se a primeira tela responder sem jargão.

## Dados

### 1. Catálogo de modelos e preços — `GET https://openrouter.ai/api/v1/models`

- **Responde hoje:** HTTP 200, sem autenticação, JSON, ~752 KB, **458 modelos**, `Cache-Control: public, max-age=120`. **CONFIRMADO** (curl em 2026-09-25 16:38 UTC).
- **Formato:** `data[]` com `id`, `canonical_slug`, `name`, `created`, `context_length`, `pricing` (strings em US$ por token: `prompt`, `completion`, `input_cache_read`, `input_cache_write`, `input_cache_write_1h`, às vezes `overrides[]` com `min_prompt_tokens` para contexto longo), `hugging_face_id`, etc. **CONFIRMADO.**
- **Cache:** 293 de 458 modelos têm `input_cache_read`; 91 têm `input_cache_write`. **CONFIRMADO.**
- **Variantes:** 72 ids terminam em `:batch` e 18 em `:free`; `:batch` compartilha o `canonical_slug` do modelo base. **CONFIRMADO.** No join, pegar o id sem sufixo.
- **Licença:** a página da API não declara licença para o catálogo de preços. **CONFIRMADO (silêncio).** Uso aqui: fatos de preço (números públicos de tabela), citados com fonte e data; sem copiar descrições. Risco baixo, mas é silêncio, não permissão — dizer na página "Preços: catálogo público do OpenRouter, 2026-09-25". **INFERIDO** que isso basta.
- **Buscar uma vez:** um `fetch` no script de build, guardar só os ~60 modelos que aparecem no ranking + ~10 de referência (Sonnet 5, Opus 5.5, GPT-6 Sol/Luna, Gemini 3.x) com `id, name, canonical_slug, prompt, completion, input_cache_read, input_cache_write`. Tamanho final estimado: ~10 KB. **INFERIDO.**

### 2. Tokens diários do top 50 — `GET https://openrouter.ai/api/v1/datasets/rankings-daily`

- **Auth:** exige chave OpenRouter (`Authorization: Bearer`), qualquer chave válida. Sem chave respondeu hoje `401 {"error":{"message":"No cookie auth credentials found","code":401}}` — o endpoint existe e está vivo. **CONFIRMADO.** Não havia chave neste ambiente; o corpo foi verificado pelo espelho abaixo.
- **Parâmetros:** `start_date`, `end_date` (padrão: último dia UTC completo), `period=day|week|month`, `modality`, `context_bucket`, `category` (ex. `programming`), `language_type`. Histórico a partir de 2025-01-01. **CONFIRMADO** (doc).
- **Rate limit:** 30 req/min por chave, 500 req/dia por conta. **CONFIRMADO** (doc).
- **Formato:** `{ data: [{ date, model_permaslug, total_tokens (string decimal) }], meta: { as_of, version: "v1", start_date, end_date } }`; top 50 por dia + uma linha `other`. `total_tokens` = prompt + completion. **CONFIRMADO** (doc + amostra real).
- **Amostra real:** o repositório público IAPS-AI/OpenRouter-OS-Rankings guarda as respostas cruas da API (`data/rankings-2026.json`, 1,37 MB, 13.617 linhas, 2026-01-01 a 2026-09-24, `as_of` 2026-09-25T12:06:35Z). **CONFIRMADO.** Amostra de 5 linhas salva só no scratchpad.
- **Licença (texto literal da doc):** "Licensed under CC BY 4.0: reuse and republish with attribution to OpenRouter." e "When republishing or quoting this dataset, OpenRouter must be cited as: "Source: OpenRouter (openrouter.ai/rankings), as of {as_of}."" — https://openrouter.ai/docs/api/api-reference/datasets/daily-token-totals-for-top-50-models. **CONFIRMADO.** Reuso liberado; a linha de citação vai literal no rodapé do gráfico com o `as_of` do fetch.
- **Aviso da própria fonte (vai para a página):** "Token counts come from each upstream provider's own tokenizer … so a token in one row is not directly comparable to a token in another row from a different provider." **CONFIRMADO.**
- **Buscar uma vez:** 1 requisição `period=week&start_date=2026-03-30&end_date=2026-09-24` (≈26 semanas × 51 linhas ≈ 1.300 linhas, ~80 KB cru). O script agrega por fornecedor (prefixo antes de `/`) e por modelo (top 12 + "outros") e grava `data.json`. Não usar o espelho IAPS no build (o repo não tem licença própria); usar a API oficial com a chave de Daniel em `.env`, fora do git. **INFERIDO** (dimensionamento).
- **Join ranking → preço:** `model_permaslug` (ex. `deepseek/deepseek-v4.1-flash-20260910`) casa com `canonical_slug` do catálogo, tirando `:free`. Na semana 09-18..09-24 o join cobre **91,7%** dos tokens; o resto é `other` (6,6%) e modelos já fora do catálogo (ex. `typesafe/jev-1.13-20260917`, 1,3%). **CONFIRMADO** (calculado hoje).

### O que os dados não dão (e a página diz)

- Não há divisão entrada/saída nem taxa de cache por modelo no ranking — o 80/20 e o slider são **hipóteses do usuário**, rotuladas como ilustrativas. **CONFIRMADO** (schema só tem `total_tokens`).
- É a visão do OpenRouter, não do mercado: quem chama Anthropic/OpenAI direto não aparece. Modelos `:free` e "stealth" inflam fornecedores baratos (8,0% dos tokens da semana foram de variantes `:free`). **CONFIRMADO** (número) / **INFERIDO** (viés).

## Referências

1. **OpenRouter Rankings** — https://openrouter.ai/rankings (200 hoje). Área empilhada de tokens por modelo, semanal. Faz bem: é a fonte, atualiza diário, filtro por categoria. Não faz: não liga volume a preço, não diz quanto custaria para *você*. Aqui: a mesma área vira pano de fundo da fatura.
2. **Splunk Tokenomics (Cisco, anunciado em 2026-09-15)** — https://www.splunk.com/en_us/products/tokenomics.html · https://siliconangle.com/2026/09/15/splunk-rebuilds-its-platform-around-agents/. Mede uso e custo de tokens por time/usuário/agente, mede efetividade do prompt caching, prevê a fatura antes do fechamento. Faz bem: atribuição e previsão sobre dados *reais* do cliente. Não faz: é enterprise, exige instrumentação, não compara com o que o mercado usa. Aqui: nenhum dado do usuário sai do navegador, zero instalação, 2 minutos — um "e se" antes de comprar observabilidade. **CONFIRMADO** (páginas acessadas hoje).
3. **LLM Prices (Simon Willison)** — https://www.llm-prices.com/ (200). Calculadora com entrada, entrada em cache e saída; tabela ordenável; avisa que tokenizadores diferem. Faz bem: honestidade e simplicidade. Não faz: sem mercado, sem slider que mostre a sensibilidade ao cache. Aqui: pegar o aviso de tokenizador e a clareza da tabela.
4. **OpenRouter Open vs. Closed (IAPS-AI)** — https://github.com/IAPS-AI/OpenRouter-OS-Rankings (dashboard em openrouter-share.theo-bearman.com). Mesma fonte, dados embutidos no HTML no build, classifica aberto/fechado e EUA/China. Faz bem: prova que "buscar e embutir" funciona e é barato (2 req/dia). Não faz: preço. Aqui: participação + custo na mesma tela.
5. **Helicone LLM cost / Artificial Analysis** — https://www.helicone.ai/llm-cost, https://artificialanalysis.ai/models (200). Tabelas de preço e qualidade. Não faz: cenário do time nem cache como variável principal. **INFERIDO** (não inspecionados a fundo).

Diferença desta demo em uma linha: é a única que põe **a fatura de um cenário** e **a adoção real** no mesmo eixo, com o cache como alavanca direta.

## Escopo de 16h

### Tela única, três blocos (phone-first; no desktop, 2 colunas)

1. **Cabeçalho-resposta** (primeira tela): a frase acima, gerada dos dados; dois números grandes (modelo de referência vs. líder de volume) e o slider de cache logo abaixo com o valor atual em %.
2. **Painel denso:** área empilhada de participação por fornecedor (26 semanas, top 8 + outros) com as faturas por modelo sobrepostas como lista/barras à direita (desktop) ou abaixo (celular). O slider recalcula as barras ao vivo; modelos sem `input_cache_read` ficam visualmente "travados" (a barra não se move) — isso é informação.
3. **Entradas do cenário** (recolhidas por padrão): tokens/mês (presets 100M · 1B · 10B), % de saída (20% padrão), modelo de referência (Sonnet 5 padrão). Rodapé: método, avisos, citação literal do OpenRouter com `as_of`, data dos preços.

### Estados

- Padrão (dados do build). Cache 0% e 95% (limites). Modelo sem preço de cache. Modelo gratuito (`:free` mostrado como "US$ 0 — gratuito no OpenRouter, com limites", sem entrar no ranking de "mais barato"). Hover/toque em uma semana da área mostra os números daquela semana. Sem JS: a frase e a tabela do caso padrão renderizam no servidor.

### Implementação

- `scripts/fetch.ts` (roda uma vez com `OPENROUTER_API_KEY`) → `data.json` (~15–20 KB: fornecedores × semanas, top modelos, preços, `as_of`). `load.ts` como o da Tarken. `data.ts` com o cálculo puro da fatura + testes Vitest (a frase da primeira tela é teste).
- Gráfico em SVG próprio (área empilhada é simples); nenhuma lib obrigatória. Se precisar, `d3-shape` (~10 KB) só para a curva.
- Estimativa: dados + testes 4h · cálculo e frase 2h · layout e gráfico 6h · estados/responsivo/acessibilidade (slider com teclado, `aria-valuetext`) 3h · textos e revisão 1h.

### Cortado

- Escrita de cache (`input_cache_write`, prêmio de 1h), overrides de contexto longo, preços `:batch` — só uma nota no método ("o cálculo considera leitura do cache; a escrita encarece um pouco nos modelos que cobram por ela").
- Filtro por categoria (`programming`) — tentador, mas dobra os dados; fica para v2.
- Qualidade/benchmarks, latência, previsão de fatura, login, dados do usuário, comparar com preço direto do fornecedor.
- Classificação aberto/fechado ou país.

## Riscos

- **Visão só do OpenRouter** — tem que estar na primeira tela como subtítulo, não só no rodapé ("participação entre os tokens que passam pelo OpenRouter").
- **Dados congelados no build** — o mercado muda por semana (novo líder a cada poucas semanas: na semana de 08-21 era `stealth` com 23,8%). A página mostra "dados de 2026-09-24" em destaque; rebuscar é manual. Uma demo "lifetime" vai envelhecer: aceitar e datar, ou rebuscar a cada visita de Daniel ao projeto.
- **Chave necessária** — só no build; nunca no cliente nem no repo.
- **Tokens não comparáveis entre fornecedores** — aviso literal da fonte na página.
- **Modelos gratuitos e stealth** distorcem a participação; tratar `:free` junto do fornecedor mas sinalizar, e `stealth/*` como "modelo não identificado".
- **Preços do catálogo não licenciados explicitamente** — citar fonte e data; não reproduzir descrições.
- **Nomes de marca** (Anthropic, DeepSeek…) aparecem como dado, sem logos nem cores de marca.

## Achados

1. `GET https://openrouter.ai/api/v1/models` responde 200 sem auth, ~752 KB, 458 modelos, cache público de 120 s. **CONFIRMADO** (curl, 2026-09-25 16:38 UTC).
2. 293 modelos têm `input_cache_read`; 91 têm `input_cache_write`; 72 variantes `:batch`, 18 `:free`. **CONFIRMADO** (mesma resposta).
3. `GET https://openrouter.ai/api/v1/datasets/rankings-daily` responde 401 sem chave ("No cookie auth credentials found"). **CONFIRMADO** (curl, 16:39 UTC).
4. Schema, parâmetros, histórico desde 2025-01-01, limites 30/min e 500/dia, e licença CC BY 4.0 com citação obrigatória. **CONFIRMADO** — https://openrouter.ai/docs/api/api-reference/datasets/daily-token-totals-for-top-50-models (texto da licença extraído do HTML hoje).
5. A página https://openrouter.ai/data não traz texto de licença; a licença está na doc do endpoint. **CONFIRMADO.**
6. O catálogo `/api/v1/models` não declara licença. **CONFIRMADO (silêncio).**
7. Respostas cruas do `rankings-daily` espelhadas em https://github.com/IAPS-AI/OpenRouter-OS-Rankings (`data/rankings-2026.json`, `as_of` 2026-09-25T12:06:35Z, 267 dias); repo sem licença própria. **CONFIRMADO** (GitHub API).
8. Semana 2026-09-18..24, participação por fornecedor no top 50: deepseek 24,6% · z-ai 17,5% · tencent 11,6% · openai 10,4% · other 6,6% · xiaomi 5,3% · google 4,3% · nvidia 4,1% · anthropic 2,8% · stealth 2,1%. Quatro semanas antes (08-21..27): stealth 23,8% · deepseek 18,8% · xiaomi 10,0% · openai 7,9%. **CONFIRMADO** (calculado sobre os dados do item 7).
9. Em 2026-09-24: 21,9 trilhões de tokens no top 50 + other; líder diário `deepseek/deepseek-v4.1-flash-20260910` (12,6%). **CONFIRMADO** (idem).
10. Preços por milhão (entrada / cache leitura / saída): Claude Sonnet 5 US$ 2 / 0,20 / 10 · Claude Opus 5.5 US$ 4 / 0,20 / 20 · GPT-6 Sol US$ 2 / 0,20 / 10 · GPT-6 Luna US$ 0,10 / 0,01 / 0,50 · DeepSeek V4.1 Flash US$ 0,075 / 0,0015 / 0,30 · GLM-5.3 Flash US$ 0,045 / 0,01 / 0,14. Fatura do caso padrão (1B, 80/20) a 0% / 50% / 90% de cache: Sonnet 5 US$ 3.600 / 2.880 / 2.304 · Opus 5.5 7.200 / 5.680 / 4.464 · DeepSeek V4.1 Flash 120 / 91 / 67 · GLM-5.3 Flash 64 / 50 / 39. **CONFIRMADO** (preços) / cálculo reproduzível.
11. Join `model_permaslug` → `canonical_slug` cobre 91,7% dos tokens da semana; 8,0% dos tokens vieram de variantes `:free`. **CONFIRMADO** (calculado).
12. Splunk Tokenomics anunciado em 2026-09-15 no Splunk Agent Observability: atribuição de gasto por time/usuário, efetividade de cache, previsão com o Cisco Deep Time Series Model. **CONFIRMADO** — https://siliconangle.com/2026/09/15/splunk-rebuilds-its-platform-around-agents/, https://www.splunk.com/en_us/products/tokenomics.html.
13. Âncora pública para quem quiser sair do ilustrativo: a Anthropic informa custo médio de ~US$ 13 por dev por dia ativo no Claude Code (US$ 150–250/mês). **CONFIRMADO** — https://docs.anthropic.com/en/docs/claude-code/costs. Não usado como padrão porque converter em tokens exige hipótese de mix; pode virar preset "time de 10 devs". **INFERIDO.**
14. Usuário, momento e decisão. **INFERIDO.**
