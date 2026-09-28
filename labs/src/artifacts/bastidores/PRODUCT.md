# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (INFERIDO, see BRIEF.md):** a visitor to Daniel Bernardino's portfolio who is weighing whether to hire him or work with him: a technical recruiter, a tech lead, or the CTO of a small team. They have just seen one or two of the other showcases and are thinking "nice, but an AI made it". They arrive from the portfolio link ("como estas demos foram feitas") or from a search about agent orchestration, often on a laptop during a screening, sometimes on a phone from a shared link. The recruiter reads the first viewport and leaves with one sentence; the tech lead scrolls the whole timetable and opens two or three agents to check whether the structure is real. Both are deciding the same thing: does Daniel *direct* agents (phases, parallel work, a critic that sends work back, an agent allowed to say "not viable", a human who decides at the right moments), or does he just prompt them.

**Secondary:** people who study AI-agent observability and want to see a real multi-agent session trace told for humans, not for an on-call engineer.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/bastidores` (ADR-0002), the AI-agent-observability slot of the showcase set. It replays, as a structure rather than a transcript, the orchestration that researched, designed, built and deployed the five showcases, this one included: which agents ran, in which phase, in parallel or in series, for how long, with how many tool calls and tokens processed, where they failed or refused, which commits they produced, and the checkpoints where the orchestration stopped and Daniel chose. Success for the reader: leaving able to say in one sentence how the work was directed, and having checked one or two claims by opening an agent. Success for Daniel: the page answers "the AI made it" with the direction, not with a denial.

## Positioning

Agent tracing tools (claude-replay, Arize coding-harness-tracing, Langfuse, Splunk Tokenomics) show what a machine did, span by span, for the engineer who debugs it. This page shows how the work was *directed*, for the person who decides whether to trust the director: phases as the skeleton, the human checkpoints as first-class events, refusals and send-backs kept in, and every figure extracted from the real session files. It is also the only trace on the web built from its own making, including the agent that designed it.

## Operating Context

- One Next.js 16 page in Labs at `/demo/bastidores`: "demo conceitual" banner, indexed, lifetime, no company, no `expiresAt`.
- Data is Daniel's own: Claude Code session files on his machine (workflow state, workflow journals, per-agent transcripts, the orchestrator's transcript) and the git history of this repository. No licence to ask; a privacy rule instead (below).
- `labs/scripts/bastidores.ts` runs once, on Daniel's machine, **after** the other four showcases are deployed, reading session directories from an environment variable, and writes `data.json` beside the code (target < 60 KB). The build of this page may start from a snapshot and swap the file at the end.
- The timetable ends at `asOf`. The deploy of this page itself happens after its data was frozen, and the page says so.
- Without JavaScript, the whole timetable, the first-viewport sentence and every agent's card render on the server (cards as `<details>`).

## Capabilities and Constraints

- The first-viewport sentence is generated from `data.json` (total duration, agent count, phase count, human checkpoints, the not-viable research, the send-back) and is a Vitest test.
- Extraction is a **whitelist**: only enumerated numeric, timestamp and enum fields leave the transcripts. No prompt text, response text, thinking, tool inputs (except tool name, skill name and filtered file paths), tool outputs, result prose, session or agent ids.
- File paths are kept only when they resolve under `labs/` or `docs/` of the repo or a build worktree; anything under `recon/` (third-party contacts), temp, scratchpad or outside the repo is dropped.
- A final scan of the serialized JSON fails the extraction on: the Windows username, `Users/`, `C:`, `AppData`, e-mail patterns, `sk-`, `Bearer`, UUIDs, `req_`/`msg_`/`toolu_` ids, phone-like digit runs, the word `dossier`.
- All prose on the page (event captions, the one-line account of each agent, checkpoint wording) lives in a hand-written `anotacoes.ts`, reviewed by Daniel, 160 characters max per note. Short quotes of Daniel's own question headers and chosen option labels are allowed; they are his words.
- Tokens: "tokens processados" = input + cache write + cache read, summed once per `message.id`. Output tokens are not shown (the transcripts undercount them); "caracteres escritos" is the stated proxy. No dollar cost: the session ran on a subscription and a list-price bill would be invented; the page points to `conta-de-tokens` for model prices.
- Times are shown in Brasília time (UTC−3) with the date; durations in `h min s`.
- Terminology on the page: "agente", "fase", "orquestrador", "ponto de decisão", "esperando", "devolvida", "inviável", "chamada de ferramenta", "tokens processados", "worktree", "commit".

## Brand Commitments

- The Labs "demo conceitual" banner is fixed. Page language pt-BR, direct, no hype, no adjectives about the process.
- No imitation of any product's brand, including Claude Code, Anthropic, Arize, Langfuse or the claude-replay themes. Tool names (Bash, WebFetch, Read…) appear as data.
- Daniel's name appears (it is his page). No other person is named.

## Evidence on Hand

- `BRIEF.md` in this folder: every finding marked CONFIRMADO or INFERIDO, sources and extraction rules.
- Snapshot at 2026-09-25 17:08 UTC: 20 subagents plus the orchestrator; 3 checkpoints with 8 questions; one completed workflow of 4 phases and 14 agents (25 min 46 s, 285 tool calls, 17.5 M tokens processed, 93.1% cache reads); one not-viable research (`caixa-preta`) with a safety-classifier-blocked write and a workflow-script error on the null result; a cross-review that sent all 4 designs back; 2 commits; a build workflow running 4 agents in separate git worktrees. Final numbers are generated after deploy.
- Absent, and never to be fabricated: output token counts, dollar cost, prompt or response text, the agents' reasoning, any quality claim about the results beyond the pages that exist, any client or user.

## Product Principles

1. Direction over volume: structure (phases, parallelism, send-backs, refusals, human stops) leads; token and call counts support it, never headline alone.
2. The human is an event, not a footnote: every checkpoint is on the timeline, with its wait, its question headers and what Daniel chose.
3. Failures stay in: the not-viable research, the blocked write, the script error and the send-back are shown as plainly as the successes.
4. Every figure is extracted, never typed: numbers and the sentence are generated from `data.json`; prose is annotation, reviewed and short.
5. Privacy is structural: a whitelist and a failing scan, not a careful reading.

## Accessibility & Inclusion

Phone-first at 390px and composed for 1440px (portfolio visitors land on laptops). The timetable is an SVG with a parallel semantic structure (an ordered list of runs by time, each a `<details>` card) so it reads without the drawing. Every agent run is reachable by keyboard and by tap with 44px targets; no information by colour alone (the human mark is a distinct glyph and a text label, waiting is a pattern plus a label). Reduced motion honoured. Times always carry the timezone.
