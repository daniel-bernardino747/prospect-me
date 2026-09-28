# Product: /techifide

Scope: this artifact only. Labs-wide truth (banner, `noindex`, expiry, no invented claims) lives in `labs/PRODUCT.md` and holds here; this file narrows it for one reader.

## Platform

web, phone-first (390 × 844 is the reference viewport).

## Users

**First reader:** Techifide's CEO, who places Brazilian engineers with AEC software companies from the UK. They open the link from a LinkedIn message, on a phone, and decide in about a minute whether a reply is worth it. Techifide says it builds each client's Role Fit Profile with the client before recruiting; the page assumes that happens on an intake call and treats the call as the point, not something to replace.

**Imagined user:** the same person, or a Techifide recruiter, the day before an intake call with a hiring manager.

## Product Purpose

Take Techifide's three live job ads and return, for each, the vacancy brief on Techifide's own template (`Techi-job-offer.docx`) and the questions the intake call still has to answer, organised by the eleven Role Fit dimensions Techifide publishes. Then let the recruiter run that call on the page: record a level and a note per dimension, fill the template's empty fields, and leave with the filled Techi-job-offer and the Role Fit Profile as .docx, PDF or text. It prepares and records the call; it never replaces it.

## Positioning

The missing step between the "Submit Vacancy" page, which promises an "advanced matching algorithm" in front of a seven-field contact form, and the call where the Role Fit Profile is really built. Made from Techifide's own published thinking and its own ads, before any conversation.

## Capabilities and Constraints

- Three ads, captured once (2026-09-28), precomputed; the page works unchanged after they close. No runtime model call, no paste mode: a visitor costs nothing.
- Screening demo: one CV per ad, **synthetic** — written for the demo, about no real person, labelled as such in its first line and on the page. Read against the ad's must-haves the way the ad was read (evidence only where a line of the CV says it, checked word for word by code), with behavioural interview questions for the dimensions the call left open. Precomputed; no CV upload, no runtime model.
- The screening video (`media/`, rendered once with HyperFrames from `.hyperframes/techifide-cv-screen/`, gitignored) is served by `/<slug>/media/<file>`, which applies the same 404-after-expiry rule as the page; nothing goes in `public/`.
- The call sheet lives in the visitor's browser (`localStorage`, per ad) and is never sent anywhere: no submit to Techifide, no account, no server write. Exports are built in the browser.
- Every claim quotes its ad line verbatim, checked by code; a field with no quote is shown empty, never guessed.
- The headline counts questions ("N questions your intake call still has to answer"), never coverage ("X of 11").
- Contradictions are "worth confirming", never errors. Nothing judges the ad.
- Manatal's `validThrough` rolls forward on every request; it is never shown as a deadline.

## Brand Commitments

- Labs banner in English: independent prototype by Daniel Bernardino, built from public data, not affiliated with or produced by Techifide.
- No Techifide logo, no magenta/purple, no clone of techifide.com. Its own identity: a working tool.
- British English, direct, no hype.

## Product Principles

1. Show it working before explaining it: right under the role, on every screen, the screening video plays on its own (Daniel's call, 2026-09-28, over the earlier rule that the first phone screen hold the call's three questions). The call's questions follow.
2. The quote is the proof: every claim ties to a numbered line of the ad, one tap away.
3. Prepares and records, never replaces: no copy suggests swapping the call for a form or a score; the call's answers are the recruiter's, and they say where each level came from (the ad's line or the call).
4. Honest method: one line at the foot says extraction by an LLM, quotes checked literally by code, questions reviewed by a human.

## Accessibility & Inclusion

Readable in daylight on a phone; no state carried by colour or hover alone; tap targets at least 44px; `prefers-reduced-motion` honoured.
