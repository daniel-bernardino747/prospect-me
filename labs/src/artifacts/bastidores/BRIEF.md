# bastidores — brief

Showcase em `/demo/bastidores` (ADR-0002). Demo conceitual de Daniel Bernardino; sem cliente, sem empresa. É o espaço de "observabilidade de agentes de IA" do conjunto: o horário de como as outras quatro demos (e esta) foram feitas por uma orquestração de agentes, com os pontos em que Daniel decidiu. Pesquisa feita em 2026-09-25, com a orquestração ainda rodando; toda afirmação marcada **CONFIRMADO** (arquivo lido ou URL acessada hoje) ou **INFERIDO**.

Os dados são do próprio Daniel (a sessão de trabalho dele nesta máquina e o git deste repositório): não há licença a pedir. O que existe é uma regra de privacidade, mais dura que a de qualquer outra demo, porque o repositório e a página são públicos (ver Dados → Limpeza).

## Pergunta e resposta da primeira tela

**Pergunta do visitante:** "Esse cara sabe *dirigir* agentes, ou só escreve prompt?"

**Resposta, em uma frase gerada dos dados no build (nunca escrita à mão):**

> Em **{duração total}**, **{N} agentes** de IA pesquisaram, desenharam e construíram estas **5 demos** em **{F} fases**; Daniel decidiu em **{K} pontos** — os agentes pararam e esperaram por ele —, uma pesquisa concluiu que uma demo **não era viável**, e uma revisão cruzada **devolveu as 4 primeiras direções** por parecerem um mesmo molde.

Com os dados de hoje (instantâneo das 14h08 BRT, orquestração em andamento), a frase sairia: "Em **1 h 04 min**, **20 agentes** … em **5 fases** …; Daniel decidiu em **3 pontos** (8 perguntas respondidas) …". Os números finais só existem depois do deploy; o teste Vitest da frase roda contra o `data.json` final. **CONFIRMADO** (contagens de hoje, ver Achados 1–6) / **INFERIDO** (valores finais).

Por que esse recorte: o que distingue "dirigir" de "promptar" não é o volume de tokens, é a **estrutura** — fases, paralelismo, um crítico que manda de volta, um agente que diz "não dá", e um humano que escolhe nos pontos certos. A frase nomeia as três coisas que um prompt solto não produz: parada para decisão humana, recusa fundamentada, revisão que reprova.

Logo abaixo da frase, a primeira tela mostra o **topo do quadro** (ver DESIGN.md): uma fileira por linha de trabalho, um cartão por agente no intervalo de tempo em que trabalhou, e a primeira parada da linha — a faixa amarela e preta onde Daniel decidiu.

## Usuário e momento

**Usuário primário:** um visitante do portfólio de Daniel que avalia se contratá-lo ou trabalhar com ele — recrutador técnico, tech lead ou CTO de time pequeno. Chegou pelo link do portfólio ("como estas demos foram feitas") ou por busca sobre orquestração de agentes. **INFERIDO.**

**Momento:** acabou de ver uma ou duas das outras demos e pensa "bonito, mas foi a IA que fez". A página responde de frente: sim, agentes fizeram muito do trabalho, e aqui está *como* foram dirigidos — quem fez o quê, em paralelo ou em série, quanto custou em tokens e chamadas, onde falharam, e onde um humano decidiu. **INFERIDO.**

**Decisão que toma:** "Daniel sabe montar e supervisionar um fluxo de agentes com critério (fases, checagens, parada humana, higiene de dados)?" — ou seja, se vale a conversa. Tempo de leitura: 1–3 minutos; o recrutador lê a frase e a primeira tela, o tech lead rola o horário e abre dois ou três agentes. **INFERIDO.**

Leitor secundário: quem estuda observabilidade de agentes e quer ver um *trace* de verdade de uma orquestração multiagente, contado para humanos.

## Dados

### Fontes (todas locais, lidas uma vez pelo script de extração)

Diretório da sessão: `~/.claude/projects/<projeto>/<sessão>/` (o caminho real tem o nome de usuário do Windows; entra por variável de ambiente `BASTIDORES_SESSIONS`, nunca no código nem no git).

| # | Arquivo | Campos usados | Estado hoje |
|---|---|---|---|
| 1 | `workflows/wf_*.json` (estado final de cada workflow) | `runId`, `workflowName`, `status`, `startTime`, `durationMs`, `totalTokens`, `totalToolCalls`, `defaultModel`, `phases[].title`, `workflowProgress[]` do tipo `workflow_agent`: `label`, `phaseTitle`, `phaseIndex`, `state`, `startedAt`, `queuedAt`, `attempt`, `durationMs`, `tokens`, `toolCalls` | existe só para workflows **concluídos** (1 hoje: `showcase-research-design`, 14 agentes, 1.546.267 ms, 285 chamadas). **CONFIRMADO** |
| 2 | `subagents/workflows/wf_*/journal.jsonl` | eventos `launched`, `started` (`agentId`, `label`, `phase`), `result` (`agentId` + objeto `result`) | **sem timestamps**; ordem apenas. Do `result` só se extraem campos enumerados: `viable` (bool), `revise` (bool por slug, na crítica), `done` (bool, no build). **CONFIRMADO** |
| 3 | `subagents/workflows/wf_*/agent-<id>.jsonl` e `agent-<id>.meta.json` | por linha `assistant`: `timestamp`, `message.id`, `message.model`, `message.usage.{input_tokens, cache_creation_input_tokens, cache_read_input_tokens}`, `message.content[].type` e, para `tool_use`, só `name` (e `input.skill` quando `name == "Skill"`); para `Write`/`Edit`, `input.file_path` passa pela regra de caminhos. Por linha `user`: `tool_result.is_error`. Do meta: `spawnedWithWorktree`, `workflowPhase` | existe e cresce enquanto o agente roda. **CONFIRMADO** |
| 4 | `subagents/agent-a<nome>-*.jsonl` (teammates fora de workflow, ex. a pesquisa de nichos) | os mesmos campos de 3; `meta.json`: `name`, `description` | 1 hoje (`nichos`). **CONFIRMADO** |
| 5 | `<sessão>.jsonl` (o orquestrador, sessão principal) | `timestamp`; `assistant` → contagem de `tool_use.name`, `usage`; `AskUserQuestion`: `input.questions[].header` e `.question` e `options[].label`; o `tool_result` correspondente: **só qual opção foi escolhida** (casada por rótulo) e o timestamp da resposta; `Workflow`: o `meta` do script (`name`, `phases[]`) | a partir do `/clear` de 16:02:04 UTC. **CONFIRMADO** |
| 6 | `git log` das branches `labs-showcase` e `worktree-wf_*` (e depois `master`) | `%h`, `%aI`, `%s`, `--shortstat` (arquivos, inserções, remoções), `--name-only` filtrado pela regra de caminhos | 2 commits hoje (13:37 e 14:07 BRT) + 4 worktrees de build no mesmo HEAD. **CONFIRMADO** |
| 7 | Deploy no Railway (fase futura) | horário do deploy e status, anotados à mão pelo orquestrador em `anotacoes.ts` ou lidos de `railway` CLI se disponível | ainda não existe. **INFERIDO** |

### Modelo de dados do `data.json` (alvo: < 60 KB)

```ts
type Bastidores = {
  asOf: string;                 // ISO UTC do fim da extração
  tz: 'America/Sao_Paulo';
  totals: { durationMs; agents; phases; checkpoints; questions; toolCalls; tokensProcessed; tokensCacheRead; commits; filesTouched };
  stations: { id; label }[];    // Nicho, Pesquisa, Design, Crítica, Revisão, Build, Polimento, Deploy, No ar
  lines: { slug; label; outcome: 'no-ar' | 'inviavel' | 'substituida' | 'em-andamento' }[];
  runs: {                       // um por agente (e um para o orquestrador)
    id: string;                 // curto e sequencial: "a01"…; nunca o agentId real
    line: string | null;        // slug da demo, ou null (orquestrador, crítico, nichos)
    station: string; phase: string; workflow: string | null;
    start: string; end: string; // ISO UTC
    turns: number; toolCalls: Record<ToolName, number>; toolErrors: number;
    tokens: { input; cacheWrite; cacheRead };   // processados, somados por message.id único
    contextFinal: number | null;                // o "tokens" do estado do workflow
    charsWritten: number;       // caracteres de texto + entradas de ferramenta (proxy de saída; ver Achado 9)
    files: string[];            // relativos ao repo, só labs/** e docs/**
    worktree: boolean;
    result: { viable?: boolean; revise?: boolean; done?: boolean };
  }[];
  checkpoints: { at: string; answeredAt: string; waitMs: number;
    questions: { header: string; options: string[]; chosen: string[] }[] }[];
  commits: { hash; at; subject; files; insertions; deletions; branch }[];
  events: { at; kind: 'bloqueio' | 'inviavel' | 'devolvida' | 'erro-script' | 'limpeza' | 'deploy'; runId?; noteId }[];
};
```

As **anotações em prosa** (legendas dos eventos, a frase de cada agente, o texto do ponto de decisão) **não vêm dos transcritos**: ficam em `anotacoes.ts`, escritas e revisadas por Daniel, cada uma com no máximo 160 caracteres, referenciadas por `noteId`. O script nunca copia texto livre do transcrito para o `data.json`.

### Extração (`labs/scripts/bastidores.ts`, roda uma vez, na máquina de Daniel)

1. Lê `BASTIDORES_SESSIONS` (lista de diretórios de sessão) e `BASTIDORES_FROM` (ISO; hoje `2026-09-25T16:02:04Z`, o `/clear` que abriu este trabalho).
2. Para cada `agent-*.jsonl`: agrupa linhas `assistant` por `message.id` (um mesmo turno aparece em várias linhas, uma por bloco de conteúdo) e soma `input + cache_creation + cache_read` **uma vez por id**. Início = menor `timestamp`, fim = maior. **Não soma `output_tokens`** (Achado 9).
3. Fase de cada agente pelo `label` do journal (`research:` → Pesquisa, `design:` → Design, `art-director` → Crítica, `revise:` → Revisão, `build:` → Build, os rótulos futuros mapeados numa tabela no script; rótulo desconhecido **quebra o build**, não cai num "outros" silencioso).
4. Pontos de decisão: cada `AskUserQuestion` do orquestrador vira um checkpoint com `header`, rótulos das opções e as escolhidas; `waitMs = answeredAt − at`.
5. Git: `git log --format` com `--shortstat` nas branches do trabalho, desde `BASTIDORES_FROM`.
6. Grava `data.json` e roda o **teste de limpeza** antes de terminar; se falhar, apaga o arquivo e sai com erro.

### Limpeza (regras, todas testadas em `data.test.ts`)

- **Lista branca, não lista negra:** só entram os campos da tabela acima. `cwd`, `sessionId`, `uuid`, `requestId`, `agentId`, `promptId`, `signature`, `thinking`, `message.content[].text`, `tool_use.input` (exceto `name`, `skill` e `file_path` filtrado), `tool_result.content`, `resultPreview`, `promptPreview`, `lastToolSummary`, `logs`, `script` — **nada disso é lido para o arquivo final**.
- **Caminhos:** `file_path` é normalizado (`\` → `/`), cortado até a raiz do repo ou da worktree (`.claude/worktrees/<wf>/`) e só é mantido se começar com `labs/` ou `docs/`. Tudo em `recon/` (dossiês com contatos de terceiros), fora do repo, em temp/scratchpad, ou com `..` é descartado.
- **Varredura final no JSON serializado** (falha o build se casar): nome de usuário do Windows e `Users/`, `C:`, `AppData`, `@` seguido de domínio (e-mails), `sk-`/`sk-or-`/`Bearer`, padrão de UUID, `req_`/`msg_`/`toolu_`, `+55` e sequências de 10+ dígitos, a palavra `dossier`.
- **Rótulos de agentes:** mantidos (`research:pix-na-minha-cidade`), pois são slugs públicos das demos. `caixa-preta` aparece como a linha que parou na Pesquisa.
- **Nome de Daniel:** aparece (é a página dele). Nenhum outro nome de pessoa.
- **Git:** hashes curtos e assuntos de commit (já públicos no repo); nomes de arquivos filtrados pela mesma regra de caminhos; e-mail do autor nunca.

### O que os dados não dão (e a página diz)

- Os tokens de **saída** não são confiáveis nos transcritos (Achado 9): a página mostra "tokens processados (entrada + cache)" e, como proxy de produção, "caracteres escritos".
- Não há **custo em dólar**: a sessão roda num plano de assinatura; converter tokens em US$ a preço de tabela seria uma fatura inventada. A página diz isso e aponta para `conta-de-tokens` para quem quer o preço por modelo.
- O **pensamento** dos agentes vem cifrado nos transcritos (`thinking` vazio + `signature`); não há o que mostrar, e não se mostraria.
- A **própria página** não entra no próprio dado depois do último `data.json`: o horário termina em `asOf`, dito na página ("o horário para em …; o deploy desta página veio depois").

## Referências

1. **InfoQ, "Session Traces and Cost Controls Help Diagnose AI Agent Failures"**, 2026-09-11 (Mark Silvester, sobre texto de Sabith K Soopy/StackGen no blog da CNCF) — https://www.infoq.com/news/2026/09/observability-ai-agents/. Session traces com chamadas aninhadas, ferramentas e delegação a subagentes com latência e tokens; limites de iteração por ferramenta; "Traces are for debugging, metrics are for alerting"; logs com credenciais redigidas. **CONFIRMADO** (acessado hoje). Aqui: a página é um *session trace* contado para quem não debuga — e leva a regra de redigir credenciais ao extremo (lista branca).
2. **es617/claude-replay** — https://github.com/es617/claude-replay (MIT; demo em https://es617.dev/claude-replay/). Converte transcritos do Claude Code (e Cursor, Codex, Gemini CLI…) em HTML de replay: play/pause, 0,5x–5x, blocos de pensamento e ferramenta recolhíveis, barra de progresso, marcadores de capítulo (`--mark "N:Label"`), redação de segredos por padrão ("best-effort safety net"), temas tokyo-night/monokai/dracula. **CONFIRMADO** (README lido hoje). Faz bem: fidelidade ao transcrito, uma sessão por vez. Não faz: orquestração multiagente como estrutura (fases, paralelismo, decisões humanas); e mostra o texto cru — a redação por padrão é justamente o que esta página não pode arriscar. Aqui: capítulos viram fases; o texto cru vira contagem.
3. **Arize coding-harness-tracing** — https://arize.com/blog/open-source-coding-agent-tracing/ (maio de 2026), https://github.com/Arize-ai/coding-harness-tracing. Instrumenta Claude Code, Codex, Cursor, Copilot e Gemini CLI por hooks, manda spans OpenInference ao Arize AX ou Phoenix: leituras e edições de arquivo, comandos, chamadas de ferramenta, MCP, erros, tentativas, latência, tokens, custo estimado. **CONFIRMADO** (página acessada hoje; licença não informada na página). Faz bem: telemetria completa e painéis ao longo do tempo. Não faz: narrativa para quem não é engenheiro de plataforma; exige instrumentar antes. Aqui: os mesmos sinais, reconstruídos depois, a partir de arquivos que já existem.
4. **Splunk Tokenomics** (Cisco, anunciado em 2026-09-15 no Splunk Agent Observability) — https://www.splunk.com/en_us/products/tokenomics.html. "Track token usage and cost by request, model, agent, and workflow"; orçamento por workflow e alerta "when one runs hot". **CONFIRMADO** (página acessada hoje; data do anúncio confirmada no BRIEF de `conta-de-tokens`, Achado 12). Aqui: tokens por agente e por fase, sem transformar em fatura.
5. **Quadro de nivelamento (heijunka) e andon, do Sistema Toyota de Produção** — o trabalho distribuído em intervalos fixos de tempo, uma fileira por produto; e o *jidoka*, a máquina que para sozinha diante de uma anomalia e chama uma pessoa (o cordão andon). Referência de forma e de ideia, não de dado. **INFERIDO** (escolha de design, ver DESIGN.md).

Diferença desta demo em uma linha: os traces de agentes mostram **o que a máquina fez**; esta mostra **como o trabalho foi dirigido** — as demos como linhas de produção, os agentes como cartões no quadro, e as paradas da linha onde um humano decidiu.

## Escopo de 16h

### Uma página, quatro blocos (phone-first; no desktop, a folha inteira)

1. **Primeira tela:** título, a frase-resposta gerada, a legenda de três sinais (cartão = agente trabalhando; faixa amarela e preta = a linha parou e Daniel decidiu; cartão preto = a linha parou sozinha) e o topo do quadro.
2. **O quadro** (o corpo da página; a forma final é o quadro de nivelamento do DESIGN.md): uma fileira por linha de trabalho (Daniel, orquestrador, nichos, as cinco demos, a direção de arte), uma coluna por cinco minutos; tempo na horizontal no desktop e descendo na rolagem no celular. Cada trecho é tocável: abre a ficha do agente (duração, tokens processados, chamadas por ferramenta, erros, arquivos tocados, resultado enumerado). Na margem direita (desktop) ou intercaladas (celular), as observações: eventos anotados e commits.
3. **Livro de bordo** (totais): chamadas por ferramenta, tokens processados por fase com a parte de cache, tempo de agente vs. tempo de relógio (paralelismo), e a lista dos pontos de decisão com as perguntas e as escolhas.
4. **Como foi medido:** as fontes, as regras de limpeza em linguagem simples, o que não aparece e por quê, `asOf`.

### Estados

Padrão (SSR, todo o horário renderizado no servidor). Trecho aberto (ficha). Agente com erro de ferramenta. Agente inviável (linha termina em batente). Linha devolvida (sobe de volta a Design). Espera humana (faixa tracejada atravessando todas as colunas). Quebra de eixo para intervalos longos sem atividade (> 20 min sem nenhum agente e sem espera humana pendente). Sem JS: tudo legível, fichas como `<details>`.

### Implementação e tempo

- `scripts/bastidores.ts` (extração + limpeza, 3h) → `data.json`; `data.ts` com as funções puras (fases, intervalos de 5 min, somas, paralelismo, frase) + testes Vitest, incluindo a varredura de privacidade (3h).
- Horário gráfico em SVG próprio, gerado no servidor, com uma camada fina de cliente para as fichas e o relógio de leitura (5h). Livro de bordo e método (2h). Responsivo, teclado, redução de movimento (2h). Anotações e revisão de texto com Daniel (1h).
- A extração roda **depois do deploy das outras 4**: é o último passo da orquestração; o build de `bastidores` pode começar antes com um `data.json` do instantâneo de hoje e trocar o arquivo no fim.

### Cortado

- Replay com play/velocidade (é o que o claude-replay faz, e o `curtailment-br` já tem o "play do dia" no conjunto).
- Texto de prompts e respostas, pensamento, diffs de arquivos.
- Custo em US$; comparação com outros fluxos; dados de outras sessões de Daniel.
- Grafo de dependências entre agentes além do que as fileiras e fases mostram.

## Riscos

- **Vazamento de privacidade** — o maior. Mitigação: lista branca de campos, regra de caminhos, varredura final que quebra a extração, anotações em prosa escritas à mão, e revisão de Daniel do `data.json` antes do commit (o orquestrador já fez uma varredura assim antes do commit 3d082fb, Achado 7).
- **Dataset ainda crescendo** — a página é desenhada para o formato, não para os números de hoje; tudo que é número é gerado. Rótulo de agente desconhecido quebra a extração em vez de sumir.
- **Tokens mal lidos** — somar por linha em vez de por `message.id` multiplica a entrada; somar `output_tokens` subconta a saída. Ambos testados.
- **"Foi a IA que fez" lido como fraqueza** — a página não esconde; mostra a direção. A frase põe o humano e o crítico no centro.
- **Autopromoção vazia** — nada de adjetivo sobre o processo; só estrutura e números. Nenhum "resultado" alegado além das páginas que existem.
- **Sessões futuras** — se o deploy acontecer em outra sessão, a extração aceita vários diretórios; se algum transcrito for compactado ou apagado antes, o trecho sai com "dados incompletos", nunca estimado.
- **Autorreferência** — o agente que desenhou esta página aparece nela (`design:bastidores`). É honesto e divertido; dito numa observação.

## Achados

1. A sessão do orquestrador começou num `/clear` às 16:02:04 UTC (13:02 BRT); o pedido de Daniel ("fazer uns 5 demos de nichos diferentes… Recomendo fazer um plano de orquestramento e subagentes") chegou às 16:04:46 UTC. **CONFIRMADO** (`<sessão>.jsonl`).
2. Três pontos de decisão até agora, 8 perguntas: 16:05:45 → 16:07:49 UTC (onde vivem as demos: "Labs + ADR-0002"; execução: "Workflow com checkpoints"; nichos: IA/agentes, dev tools e "deixe a pesquisa decidir"); 16:14:50 → 16:37:09 (os 5: "A proposta como está"; commit da fase 0: "Sim") — espera de 22 min 19 s; 17:05:12 → 17:05:40 (vaga da caixa-preta: "Replay desta orquestração"; as 4 direções: "Aprovadas"; chave OpenRouter: "Sim"). Em todos, Daniel escolheu a opção recomendada ou a completou. **CONFIRMADO** (`AskUserQuestion` e seus `tool_result`).
3. Pesquisa de nichos (teammate `nichos`): 16:08:06 → 16:15:15 UTC, 17 buscas + 13 páginas lidas + 1 consulta pelo skill `last30days`; entregou 10 candidatos e 5 recomendados. **CONFIRMADO** (transcrito e mensagem de retorno).
4. Workflow `showcase-research-design`: 16:38:26 → 17:04:13 UTC (25 min 46 s), 4 fases (Pesquisa, Design, Crítica cruzada, Revisão), 14 agentes, 285 chamadas de ferramenta; `totalTokens` 1.470.631. Pesquisa 4,3–10,9 min por agente; Design 6,5–7,5; crítica 2,8; Revisão 3,6–4,9. Pesquisa → Design em *pipeline*: cada design começou assim que a sua pesquisa terminou (conta 16:42:48, raio 16:45:34, pix 16:46:14, curtailment 16:49:23). **CONFIRMADO** (`wf_c05edd78-875.json` e transcritos).
5. `caixa-preta` (réplica de atividade de agentes, dados Transluce): a pesquisa voltou `viable: false` — a página e o zip da Transluce não declaram licença ("© 2026 Transluce. All rights reserved."), os payloads só existem no urlquery.net, cujos termos proíbem reprodução sem permissão escrita; e um classificador de segurança parou a escrita do `BRIEF.md` às 16:43:13 UTC ("Not run: … stopped by a safety classifier"). O script do workflow não tratava o `null` e registrou `pipeline[0] failed: null is not an object`; as outras 4 linhas seguiram. Às 17:04:47 o orquestrador removeu a pasta vazia. **CONFIRMADO.**
6. A crítica cruzada (`art-director`, 16:56:26 → 16:59:16 UTC) devolveu **as 4** direções (`revise: true` em todas), por convergirem num mesmo molde (faces compartilhadas — Martian Mono em três —, paletas vizinhas, dock inferior fixo em duas, "frase à esquerda, instrumento fixo à direita" em duas); as 4 revisões rodaram em paralelo (16:59:17 → 17:04:11). **CONFIRMADO** (journal e `result.review`).
7. Antes do commit `3d082fb` (14:07 BRT), o orquestrador varreu os 4 diretórios por e-mails, nome de usuário e telefones (`grep` às 17:06:01 UTC). **CONFIRMADO** (transcrito). É o precedente da regra de limpeza desta página.
8. Workflow `showcase-build`, lançado às 17:07:54 UTC: 4 agentes de build, cada um em sua worktree git (`worktree-wf_4b209980-54e-2…5`, todas no HEAD `3d082fb`), com capturas de tela e autocrítica, mais este agente (`design:bastidores`). O estado do workflow só é gravado ao terminar; até lá, só journal e transcritos. **CONFIRMADO.**
9. Nos transcritos, uma mensagem aparece em várias linhas (uma por bloco) com o mesmo `message.id`; `usage.output_tokens` é um instantâneo do streaming e, sem `stop_reason`, subconta muito (ex.: `revise:curtailment-br` soma 2.090 tokens de saída tendo escrito um `DESIGN.md` de ~17 mil caracteres). A entrada (`input + cache_creation + cache_read`) é conhecida no início do turno e é confiável. **CONFIRMADO** (comparação linha a linha).
10. O `tokens` por agente no estado do workflow é ≈ o tamanho do contexto no último turno (ex.: `research:curtailment-br` 140.037 vs. 141.691 calculados), não o total processado; o total processado do workflow 1 foi **17,5 milhões** de tokens, **93,1% leitura de cache**. **CONFIRMADO** (cálculo) / semântica exata do campo **INFERIDO**.
11. Até 17:08 UTC: 20 subagentes, ~29,4 milhões de tokens processados, 443 chamadas de ferramenta (Bash 262, WebFetch 46, WebSearch 37, Read 33, Write 24, StructuredOutput 15, Skill 11 — `impeccable` em cada design e revisão). Orquestrador: 35 turnos, 3 `AskUserQuestion`, 2 `Workflow`, 1 teammate. Modelo único: `claude-opus-5-5`. **CONFIRMADO** (instantâneo; muda até o fim).
12. Os transcritos carregam o nome de usuário do Windows em `cwd`, em `file_path` e em textos de resultado (ex.: `resultPreview` com `C:/Users/…/labs/src/artifacts/…`); o `thinking` vem vazio com `signature` cifrada. **CONFIRMADO.** Daí a lista branca.
13. Referências: InfoQ 2026-09-11, claude-replay (MIT), Arize coding-harness-tracing (maio de 2026), Splunk Tokenomics. **CONFIRMADO** (acessadas hoje; URLs acima).
14. Usuário, momento e decisão. **INFERIDO.**
