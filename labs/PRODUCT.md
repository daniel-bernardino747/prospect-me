# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Each artifact has one first reader: the person at the target company who can decide, reached by a direct e-mail from Daniel Bernardino. They open the link on a phone, between other things, and decide within a minute whether it is worth a reply. The artifact also imagines the person inside that company (or its customer) who would use the thing day to day; that user shapes the task, the first reader decides whether it lands.

## Product Purpose

Labs serves prototypes Daniel builds for one company before approaching it (ADR-0001 in the repo root: an approach leads with something built for them). Each artifact proves, on the company's own subject and public data, that Daniel understood their problem and can ship. Success is a reply from the decider.

## Positioning

Built for one company, from its own published thinking and public data, before any conversation. Not a pitch deck, not a template, not a clone of the company's product.

## Operating Context

- One Next.js app at `labs.teamdbsolutions.com/<slug>`; every request goes through `src/app/[slug]/page.tsx`: 404 outside the registry, "encerrado" after `expiresAt`, and a banner stating the artifact is an independent prototype.
- Private links, `noindex`. Read on a phone from an e-mail or a forwarded WhatsApp message.
- Data is public and gathered once by hand (no recurring crawler); the page never downloads or shows personal data (no CPF/CNPJ).

## Capabilities and Constraints

- Every number shown is computed from a cited public source; small samples are suppressed, never shown as zero.
- Nothing inferred about the company is stated as fact on the page.
- An artifact may echo the target company's tone and colors when that helps the decider picture it as theirs, but never uses its logo, product names as its own, or claims affiliation. The banner stays.

## Brand Commitments

- The Labs banner and the "protótipo independente" framing are fixed.
- Portuguese (pt-BR), direct, no hype.

## Evidence on Hand

- Per artifact: the brief in `recon/dossiers/<slug>.md` (gitignored), the public data under `src/artifacts/<slug>/`.
- No testimonials, clients, or results of Daniel's may be invented on any artifact.

## Product Principles

1. The answer before the explanation: the first viewport says what the data shows for the reader's case.
2. Their thinking, made usable: the company's own published claims become something its customer can act on.
3. Every number traceable: source and date one tap away, never in the way.
4. Honest limits shown, not hidden: what the public data cannot say is stated plainly.

## Accessibility & Inclusion

Phone-first; readable in daylight; no information carried by hover or color alone.
