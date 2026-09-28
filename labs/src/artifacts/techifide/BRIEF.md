# techifide — plano de construção

Prospect em `/techifide` (ADR-0001), escolhido em 2026-09-28 a partir do dossiê `recon/dossiers/techifide.json` (gitignored, só nesta máquina): solução `sol-vacancy-brief-role-fit`, intenção `join`, **~12 h**, expira em `2026-11-27T23:59:00-03:00`.

Este arquivo é o ponto de partida de um contexto novo. Siga as tarefas **em ordem**. Cada uma termina num estado verificável; não comece a seguinte com a anterior quebrada.

## O que é, em uma frase

Uma página em inglês que pega os três anúncios de vaga que a Techifide publicou e devolve, para cada um, o **brief da vaga** no formato do modelo que a própria Techifide publica, e as **perguntas que a call de intake ainda precisa responder**, organizadas pelas 11 dimensões de Role Fit que ela mesma publicou. Cada linha cita o trecho do anúncio de onde saiu.

## O problema que ela responde (dossiê, todos CONFIRMADO)

- `pb-vacancy-form`: a página *Submit Vacancy* promete um "advanced matching algorithm", mas o formulário é o mesmo formulário genérico de contato, com 7 campos. A especificação vive num `.docx` de 2023 que o formulário não consegue receber.
- `pb-companies-cta-to-jobs`: em `/companies/`, o botão "Submit a Vacancy" abre o quadro de vagas para candidatos.
- `pb-role-fit`: o Role Fit Profile é o diferencial declarado ("we work with our clients to create an ideal Role Fit Profile"). Nenhum cliente vê como ele é.
- Anúncios: `dr-role-fullstack`, `dr-role-ml` e `dr-role-qa` (Manatal, `techifide.careers-page.com`).

## A crítica que o design tem que absorver

O decisor (CEO) monta o Role Fit Profile **numa call, de propósito**, e diz que ainda lê todo CV pessoalmente. Um score do tipo "3 de 11 dimensões evidenciadas" nos anúncios dele vai ser lido como falha da ferramenta, ou como um estranho dizendo que os anúncios são ruins. Por isso:

- A manchete é **"N questions your intake call still has to answer"**, nunca uma cobertura "X de 11".
- A ferramenta **prepara a call dele**, não a substitui. Nenhum texto sugere trocar a call por um formulário.
- O tom é neutro. As contradições aparecem como "worth confirming", nunca como erro.

## Primeiro critério de pronto (vale mais que todos os outros)

> O CEO, **num celular**, abrindo o link de uma **mensagem no LinkedIn**: no anúncio *Senior / Staff Fullstack Software Engineer*, a primeira tela mostra, **sem rolar**, a vaga em uma linha, os must-haves e "N questions your intake call still has to answer" com as três primeiras perguntas.

Os demais critérios estão em `brief.doneCriteria` no dossiê.

---

## Tarefas

### 0. Ler antes de tocar em código (~20 min)

- `docs/adr/0001-an-approach-leads-with-something-built-for-them.md` (seção *Labs*) e `labs/PRODUCT.md`.
- `recon/dossiers/techifide.json`: `brief`, a solução `sol-vacancy-brief-role-fit` com a `critique` dela, e os achados citados acima.
- `labs/src/artifacts/tarken-fila-da-safra/` é o único prospect já feito: use-o como referência de `load.ts`, `data.ts`, `data.test.ts` e `DESIGN.md`.
- `labs/AGENTS.md`: esta versão do Next.js tem breaking changes. Leia o guia relevante em `node_modules/next/dist/docs/` antes de escrever código.

### 1. Locale dos prospects: o chrome do Labs em inglês (~1 h)

Hoje o banner, a página "encerrado", o `<title>` e o `<html lang>` são fixos em pt-BR. O leitor aqui é um CEO no Reino Unido.

- Em `src/labs/artifact.ts`, adicione `locale: 'pt-BR' | 'en'` ao `Prospect`, com a Tarken como `'pt-BR'`, e valide em `registryProblems`.
- `Banner` e `Ended` recebem o locale. O texto em inglês diz o mesmo: *independent prototype by Daniel Bernardino, built from public data, not affiliated with or produced by Techifide*.
- Em `src/app/[slug]/page.tsx`, `generateMetadata` usa "independent prototype" quando o locale é `en`.
- Para `lang`: o root layout fixa `pt-BR`. Veja na documentação do Next desta versão como sobrescrever por rota. Se não houver jeito limpo, use um `lang="en"` no contêiner do artefato.
- Teste em `artifact.test.ts`. A Tarken não pode mudar.

### 2. Capturar os dados públicos, uma vez (~1,5 h)

Crie `labs/scripts/techifide.ts` no mesmo padrão dos outros scripts. Antes de buscar qualquer coisa, confira `robots.txt` de `techifide.com` e de `techifide.careers-page.com`.

Capture, com `capturedAt`:

| Fonte | O que guardar |
|---|---|
| 3 páginas de vaga (`7ea41dbd…`, `7b85ad5a…`, `45222237…`) | título, texto integral do corpo, `datePosted` e `validThrough` do JSON-LD, URL |
| `techifide.com/techifide-role-fit-assessment/` | as 11 dimensões, com nome e descrição exatos |
| `techifide.com/screening-and-evaluation/` | o parágrafo do Role Fit Profile/Score, para citar |
| `wp-content/uploads/2023/07/Techi-job-offer.docx` | a lista de campos do modelo (descompacte e leia `word/document.xml`) |
| `techifide.com/submit-vacancy/` | a frase do "advanced matching algorithm", para citar |

Guarde o bruto em `labs/src/artifacts/techifide/sources/` (JSON, não HTML). Nenhum dado pessoal: os anúncios não citam pessoas; se citarem, remova.

⚠ O anúncio fullstack expira em **2026-10-28**. Esta tarefa vem antes de qualquer outra coisa depois da 1.

### 3. Pipeline de extração, offline (~3 h)

No mesmo script, depois da captura, gere `data.json` a partir de `sources/`:

1. **Brief**: para cada campo do `.docx`, o valor e a **citação literal** do anúncio. Sem citação, o campo fica vazio, nunca adivinhado.
2. **Role Fit**: para cada uma das 11 dimensões, ou `{ score: 1–5, quote }` ou `{ question }`, uma pergunta de intake redigida para o hiring manager.
3. **Contradições**: pares de citações em tensão, como WebAssembly exigido e CAD/geometria só como nice-to-have, ou "Staff" ao lado de "own features end-to-end".

Os três itens foram extraídos uma vez pelo Claude numa sessão do Claude Code (sem API key, sem custo por visita) e estão em `extraction/<ad>.json`, no formato `Extraction` de `review.ts`; `scripts/techifide.ts build` gera o `data.json`. A **revisão é código, não LLM**: normalize espaços e aspas e descarte qualquer `quote` que não esteja literalmente no texto capturado. Um score descartado vira pergunta.

`data.ts` define os tipos e `load.ts` lê uma vez (lembre: depois de regerar, reinicie o `labs dev`). Em `data.test.ts`, cubra no mínimo:

- toda `quote` está literalmente na fonte;
- há exatamente 11 dimensões por anúncio, cada uma com score+quote ou com question, nunca os dois;
- nenhum número aparece sem fonte;
- `capturedAt` está presente.

### 4. Portão: Daniel revisa o `data.json` (~30 min)

Leia as perguntas dos três anúncios como o CEO leria. Reescreva à mão as que soarem acusatórias ou genéricas; guarde as sobrescritas num arquivo separado (`overrides.ts`) para sobreviverem a uma regeração. Confirme que a contagem N da manchete do fullstack faz sentido. **Não siga sem isso.**

### 5. Design: `PRODUCT.md` e `DESIGN.md` do artefato (~1,5 h)

Use `/impeccable` (shape) com `labs/PRODUCT.md` e este arquivo como entrada. As decisões que o DESIGN.md precisa fixar:

- **Ordem da tela**: seletor dos 3 anúncios (estado na URL, `?ad=fullstack` como padrão); vaga em uma linha; must-haves; **"N questions your intake call still has to answer"** com as 3 primeiras. Isso tudo fica acima da dobra num celular de 390 × 844. Depois vêm as demais perguntas, o brief completo com citações, as 11 dimensões (as com score mostram a citação, as sem score remetem à pergunta), as contradições ("worth confirming") e as fontes com "captured on <date>".
- **A citação é o elemento visual central**: cada afirmação tem o trecho do anúncio a um toque, sem atrapalhar a leitura.
- **Nada da marca da Techifide**: sem logo, sem as cores deles, sem clone do site. Uma identidade própria e sóbria, de ferramenta de trabalho.
- **Inglês britânico**, direto, sem hype.
- Nada carregado só por cor ou hover; legível à luz do dia.
- Uma linha, ao pé, explicando o método: extração com LLM, citações checadas literalmente por código, perguntas revisadas por um humano.

### 6. Implementar a página (~3 h)

- Crie o componente principal em `labs/src/artifacts/techifide/`, com CSS module, seguindo o DESIGN.md.
- Registre em `src/artifacts/index.ts`: `kind: 'prospect'`, `slug: 'techifide'`, `company: 'Techifide'`, `locale: 'en'`, `expiresAt: '2026-11-27T23:59:00-03:00'`, título curto em inglês.
- A lógica pura (contagem de N, ordem das perguntas, o que entra acima da dobra) fica em `.ts` com teste, como o `finder.ts` da Tarken.

### 7. Modo "cole um job description": CORTADO (2026-09-28)

Daniel decidiu: a página nunca chama um LLM em runtime, nenhum visitante gera custo. O critério 6 saiu do `brief.doneCriteria` e o dossiê valida. O texto abaixo fica como registro.


O critério de pronto 6 do brief pede que um texto colado passe pelo mesmo pipeline, sem ser guardado nem logado. Isso é o **primeiro artefato do Labs a chamar um LLM em runtime**, e traz consigo:

- `ANTHROPIC_API_KEY` no serviço do Railway (`.railway/railway.ts`, depois `railway config plan` e `apply`);
- uma route handler que reusa o módulo da tarefa 3;
- limite de tamanho e de taxa (a página é pública, mesmo com `noindex`);
- nenhum log do corpo da requisição.

Decida com o Daniel. Se cortar, remova o critério 6 do `brief.doneCriteria` no dossiê e rode `npm run recon -- validate techifide`. Recomendação: entregar 1–6 e 8 primeiro, e fazer esta tarefa só se sobrar tempo dentro das 12 h. Os três anúncios pré-computados já provam a ideia.

### 8. Verificar (~1 h)

- `npm test` e `npm run typecheck -w @prospect-me/labs` passam.
- `npm run build -w @prospect-me/labs` e depois `npm run serve -w @prospect-me/labs`: `/techifide` responde 200 **com CSS e JS**, `/` e um slug desconhecido respondem 404, e o header `X-Robots-Tag: noindex` está presente.
- Abra no Chrome em 390 × 844 e tire um screenshot da primeira tela. O primeiro critério de pronto tem que valer **sem rolar**.
- Confira que o banner em inglês aparece e que não há logo nem cor da Techifide.

### 9. Commit e deploy

- Branch própria (`labs-techifide`), commit `feat(labs): techifide prospect`, PR para `master`.
- Deploy no Railway e conferência de fora em `labs.teamdbsolutions.com/techifide`.
- Depois, `/prospect-me techifide` para a fase dois: re-check dos achados e a mensagem no LinkedIn para o CEO.
