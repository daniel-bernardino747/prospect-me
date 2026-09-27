# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (INFERIDO, see BRIEF.md):** someone about to build or hire a WhatsApp attendance bot for a small Brazilian business (clinic, practice, salon): a developer, a SaaS founder or an automation agency. They are choosing between "an LLM with tools" and something deterministic, and have heard of bots that invent a price or get talked into things. They open the link on a phone from a WhatsApp group or LinkedIn, then again at a desk to read the conversations.

**Secondary:** a visitor to Daniel Bernardino's portfolio who wants to see an honest, reproducible evaluation.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/bot-whatsapp-ia-vs-jev` (ADR-0002). It is the public face of the [zap-bench](https://github.com/daniel-bernardino747/zap-bench) repository: the same WhatsApp attendance bot for a fictional dental clinic, built four times (Claude Sonnet 5, Claude Haiku 4.5, GPT, and Jev with templates) and measured by code on the same cases. The page shows:

- how much each one solves with a patient who writes badly and has no patience;
- where each one fails;
- what reached the patient;
- what guardrails change;
- what a conversation costs.

Success for the primary user: leaving in two minutes with "the LLM wins or loses by X, and the safety layer in code is or isn't what closes the gap". Success for Daniel: a portfolio piece that shows a fair, auditable comparison, not an opinion.

## Positioning

Vendor pages sell one side; public LLM leaderboards measure general tasks in English. This page measures one concrete job (a Brazilian clinic's WhatsApp desk), in Portuguese, with a hostile-but-realistic patient, and lets the reader open every conversation behind every number.

## Operating Context

- One Next.js 16 page in Labs, `/demo/<slug>`: the "demo conceitual" banner, indexed, with no company and no `expiresAt`.
- Data comes only from zap-bench's `export` of a `validation` round, copied by `scripts/bot-whatsapp-ia-vs-jev.ts` into `data.json`. The page never calls an API.
- Everything renders on the server. Which ticket (case) is being read lives in the query string (`?cenario=&persona=&modo=`).
- `data.synthetic` is true when the round used zap-bench's fake brain or rule patient. The page then shows hazard tape saying so, and in production it answers 404.

## Capabilities and Constraints

- The first-viewport sentence is generated from the data (best LLM against Jev, difficult patient, before and after guardrails) and is a Vitest test. It inverts when Jev leads.
- Every figure carries its n. There are no decimals, and no overall score: metrics sit side by side (zap-bench ADR-0006).
- A brain that did not run shows "não rodou", never zero.
- Not shown: product pricing, the clinic's subscription or WhatsApp costs per clinic (internal, zap-bench ADR-0005); naturalness until the judge exists.
- Model and vendor names appear as data. No logos, no brand colors.

## Brand Commitments

- The Labs showcase banner stays.
- Portuguese (pt-BR), direct, no hype. The clinic is fictional and the page says so.

## Product Principles

1. The answer before the explanation.
2. Every number opens into the conversations behind it.
3. Honest limits are shown on the page, not hidden in the repository.
4. Fair to both sides: the same functions, the same cases, the same checks.

## Accessibility & Inclusion

Phone-first. LED figures are real text, never images. Pass/fail is never carried by color alone, since each status is also written out. Reduced motion stops the ticket animation.
