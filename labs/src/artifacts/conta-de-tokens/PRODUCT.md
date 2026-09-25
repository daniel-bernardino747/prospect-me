# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (INFERIDO, see BRIEF.md):** the tech lead or head of engineering of a Brazilian team of 5 to 30 developers that already pays one or two LLM APIs (a coding agent, an LLM feature inside the product). The month's bill came in above budget, or finance asked "por que isso subiu?". They have one number in hand, tokens per month from the provider's dashboard, and want to know in about two minutes whether switching model or investing in prompt caching changes the order of magnitude, before opening a migration project. They read it on a phone first (a link in Slack or WhatsApp), then again at a desk with the dashboard open beside it.

**Secondary:** a visitor to Daniel Bernardino's portfolio, arriving from the portfolio or from search, who wants to see a dense, honest data interface done well. The page serves both only if the first viewport answers the primary question without jargon.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/conta-de-tokens` (ADR-0002): a concept demo that puts two things on the same axis for the first time, **what a team's token volume would cost on each model** and **which models the market is actually spending its tokens on**, with prompt caching as the one lever the reader moves. It does not decide for the reader; it shows the order of magnitude. Success for the primary user: leaving with "cache is worth X for us" or "a model the market already uses at volume would cost Y" in under two minutes. Success for Daniel: a portfolio piece that shows he can turn two public datasets into a decision tool, carefully.

## Positioning

The only page that sets the bill of a stated scenario against real adoption (OpenRouter's weekly token share) and makes cache the direct control. Price tables (LLM Prices, Helicone) have no market; the OpenRouter rankings have no price; enterprise cost tools (Splunk Tokenomics) need instrumentation and the customer's own data. This one needs nothing installed and nothing leaves the browser.

## Operating Context

- One Next.js 16 page in Labs, `/demo/<slug>`: "demo conceitual" banner, indexed, lifetime, no company, no `expiresAt`.
- Data fetched once by `scripts/fetch.ts` (OpenRouter models catalog, no auth; OpenRouter `rankings-daily`, key in `.env`, never in the client or the repo) and stored as `data.json` beside the code. No recurring crawler. Refetching is manual; the page shows the data date prominently.
- The first-viewport sentence is generated from the data at build time and is a Vitest test; it changes by itself when the data is refetched.
- Without JavaScript, the sentence and the default-case table render on the server.

## Capabilities and Constraints

- Inputs: cache share 0 to 95% (slider, default 50%), tokens per month (presets 100M, 1B, 10B; default 1B), output share (default 20%), reference model (default Claude Sonnet 5).
- Bill per model = input tokens × (1 − cache) × input price + input tokens × cache × cache-read price + output tokens × output price. Cache writes, long-context overrides and `:batch` prices are out of scope and said so in the method note.
- Models with no `input_cache_read` price do not move with the slider; that stillness is information and must read as such, not as a bug.
- `:free` variants show "US$ 0, gratuito no OpenRouter, com limites" and never rank as "cheapest". `stealth/*` shows as "modelo não identificado".
- Market share is 26 weeks, top 8 providers + "outros", from OpenRouter's top 50 per day. It is the OpenRouter view only: direct API traffic to Anthropic, OpenAI and others is invisible. This is said in the first viewport, not only in the footer.
- Terminology on the page: "tokens", "entrada", "saída", "cache", "fatura", "fornecedor", "modelo", "participação". Provider and model names appear as data, never with logos or brand colors.

## Brand Commitments

- The Labs "demo conceitual" banner is fixed. Page language pt-BR, direct, no hype.
- No imitation of any real company's brand, including OpenRouter's and every model provider's.
- Attribution, verbatim, under the market chart: "Source: OpenRouter (openrouter.ai/rankings), as of {as_of}." (CC BY 4.0). Prices cited as "Preços: catálogo público do OpenRouter, {data}".

## Evidence on Hand

- `BRIEF.md` in this folder: every finding marked CONFIRMADO or INFERIDO, with URLs.
- Data to be generated into `data.json` by the fetch script: model prices (~70 models), weekly token totals by provider and top models, `as_of`.
- The default scenario (1B tokens, 80/20, 50% cache) is illustrative and is labelled so on the page.
- Absent, and never to be fabricated: users, customers, testimonials, savings achieved by anyone, per-model input/output split, per-model cache rates, quality or latency comparisons.

## Product Principles

1. The answer before the controls: the first viewport states the bill on two models and the market share, in one sentence, for the default case.
2. One lever, visibly: the cache slider is the interaction; everything that moves, moves because of it, and what does not move says why. The lever sits where it is read (under the two quotes, and again in the header of the bill table), never pinned to the screen edge.
3. Every figure has its source and date one tap away, and the illustrative scenario is never mistaken for someone's real bill.
4. Limits stated where they bite: OpenRouter-only view, incomparable tokenizers across providers, free and stealth models inflating share.

## Accessibility & Inclusion

Phone-first at 390px, and composed for desktop at 1440px, not merely stretched: portfolio visitors land there, so the answer and the two quotes read as one horizontal board across the full width. No fixed or docked UI on any width. The slider exists twice (under the quotes, and in the bill table's header) bound to one state; both are operable by keyboard with `aria-valuetext` in pt-BR ("50 por cento da entrada vinda do cache"). No information by color or hover alone: every chart value reachable by tap and by keyboard, and the frozen (no-cache-price) state is carried by text and a glyph, not only by tone. Reduced motion honored.
