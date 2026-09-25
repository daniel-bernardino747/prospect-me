# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (INFERIDO from BRIEF.md; not confirmed in an interview):** a developer or tech lead on a small Node / front-end team with no paid supply-chain tool. It is the day, or the day after, a worm hits npm. The headline is in their feed, `package.json` is open in the editor, and they have not run `npm ls` across every repository yet. Their question: "estou no raio disso?". The decision they leave with: which direct dependency is the door, and what to do about it (pin the range with `~`, an exact version or `overrides`; check that the lockfile is committed and CI runs `npm ci`; run with `--ignore-scripts` until the incident closes). In v1 they read the answer off three worked cases and then run the page's `npm ls` line in their own repository; the page does not take their manifest (see "Deferred to v2").

**Secondary:** someone evaluating Daniel Bernardino, arriving from his portfolio or from search. They will not type anything. The preloaded default case (ChainDrop × `stylelint@17.14.1`) is the demo for them, and the first viewport has to make sense, and be true, without any input.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/raio-de-explosao` (ADR-0002): a concept demo that answers "if package X is compromised today, by which path does it reach my app?" It shows the path hop by hop and makes one thing visible that no neighbouring tool shows: **the version range on each edge is the gate**. The same family of packages reaches `stylelint@17.14.1` and not `eslint@10.8.0` only because of the ranges they declare. The morning of 4 August 2026 is told as a log of discrete publish events: each one either opens a gate or is barred by it.

Success for the primary user: naming the door dependency and the one range to change, in about a minute. Success for Daniel: a portfolio piece that turns three public datasets (Datadog IOCs, deps.dev, OSV) plus the npm registry's publish times into a precise, honest instrument.

## Positioning

`npm explain` needs the package installed and cannot see an unpublished version. deps.dev shows a package's whole graph, not *your* path to a target, and does not separate "the range accepted the infected version" from "it was in the graph". npmgraph draws the whole graph, which becomes a tangle on a phone. This page collapses a real graph to the 3–8 nodes that matter and gives each edge a verdict, *aceitava* or *barrado*, with the publication second of the version that made it so.

## Operating Context

- One Next.js 16 page in Labs at `/demo/<slug>`: "demo conceitual" banner (fixed, rendered by the route), indexed, lifetime, no company, no `expiresAt`.
- **Fetched once, cached as JSON.** Everything the page shows is in `data.json`, written once by `scripts/raio-de-explosao.ts` and committed beside the code: the Datadog CSV (counts and the malicious version list for the packages in the three graphs), the npm registry `time` of the ~11 versions involved, the three deps.dev graphs cut down to their paths plus the field of off-path packages, and the OSV `MAL-…` ids. The page makes **no network request at runtime**, has no API route and no crawler. `data.json` carries its own `fetchedAt`, shown in "Fontes e método".
- Three presets: `stylelint@17.14.1` (default), `got@15.1.0`, `eslint@10.8.0`.
- The morning is a finite, ordered list of instants, not a continuous clock: "09:30:00 antes do primeiro evento", then one entry per publish event of a package in the current preset's graph, then the 10:39 removal statement. The default instant for each preset is its **door event** (the publish that opens the shallowest path: `file-entry-cache@11.1.6` at 10:13:02 UTC for stylelint), or, where nothing opens, its last publish event.

## Capabilities and Constraints

- Exposure rule: an edge is **exposed** when some malicious version of its target satisfies the edge's `requirement` and was already published at the chosen instant; **barred** when the target has a malicious version but the range does not accept it.
- Direct dependencies resolve at the chosen instant (`maxSatisfying` over versions with `publishedAt ≤ instant`); the transitive graph is deps.dev's graph as fetched. The page says so in one sentence, near the chart.
- Assumes the malicious version had the same ranges as the clean one before it (its own metadata is unpublished; deps.dev 404s). Said in the method note.
- The 10:39 row is a statement from StepSecurity, not a state change: per-version removal times are not public, so stepping onto it leaves the chart as it was and says so.
- "E se" mode: any package in the current preset's graph can become the target, with no malicious list needed. It uses the same precomputed graph.
- Terminology on the page: "caminho", "salto(s)", "faixa", "aceitava", "barrado", "abre", "porta de entrada", "dependência direta", "lockfile", "raiz". Package names always in monospace, never translated.
- Only npm, only the ChainDrop incident, only the three precomputed graphs. No input of the reader's own manifest in v1.

### Deferred to v2 (not built now)

A paste form for the reader's `package.json`. If it returns, it stays inside the fetch-once rule: it traces only direct dependencies whose graphs are already precomputed in `data.json`, lists the others as "fora da lista pré-calculada", and says so above the field. The sample button is labelled "exemplo montado (stylelint + got)" so it is never read as a real project's manifest. No runtime call to deps.dev.

## Brand Commitments

- The Labs "demo conceitual" banner stays. Page language pt-BR, direct, no hype: no "ataque devastador" or siren words, no countdowns.
- No imitation of any real brand: no Datadog purple, no npm red, no Defesa Civil identity, no logos.
- Attribution on the page, verbatim: "Dados de dependências: deps.dev (Google), CC BY 4.0". Datadog IOC list and `ossf/malicious-packages` credited as Apache-2.0; npm registry cited as the source of publication times; StepSecurity cited for the 10:39 removal statement.
- The page talks about packages, never about maintainers by name.

## Evidence on Hand

- `BRIEF.md` in this folder: 25 findings marked CONFIRMADO or INFERIDO, with URLs, observed 2026-09-25.
- Confirmed publish times (registry `time`): `keyv@6.0.0` 09:35:00Z, `flat-cache@6.1.24` 10:10:55Z, `cacheable-request@13.0.20` 10:11:24Z, `file-entry-cache@11.1.6` 10:13:02Z. The `cacheable` family times (~10:06–10:07 per Datadog) are read from the registry by the script, not typed by hand.
- `data.json` (to be generated): malicious versions per package (444 packages, 2,236 versions in the file used), publication times, the three preset graphs, `MAL-…` ids.
- Counts disagree across sources (2,236 in the CSV × 2,212 at StepSecurity × "hundreds" at Datadog). The page shows the count of the file used, with a link.
- Absent, never to be fabricated: anyone who was infected, any team that used the page, per-version removal times (only StepSecurity's statement: removal from ~10:39 UTC, primary carriers reverted by 18:10 UTC), claims that a given project was compromised.

## Product Principles

1. The path before the explanation: the first viewport shows the default case already traced, with its hop count, before a word of method.
2. The range is the verdict: every edge carries its range and a written verdict; color only repeats what the words say.
3. Nothing inferred reads as fact: the headline's condition ("npm install sem lockfile, 4 ago 2026, a partir de 10:13 UTC") sits on the line directly under it, inside the first viewport; the "grafo como coletado" limit sits by the chart; INFERIDO findings never appear as statements.
4. A zero is an answer: "nenhum caminho" is presented as a result, with the ranges that barred it, never as an empty or error state.
5. Every number one tap from its source: CSV, registry, deps.dev, OSV, StepSecurity.
6. Discrete, not scrubbed: the morning advances one event at a time, each event a row the reader can name.

## Accessibility & Inclusion

Phone-first at 390px, and a full composition at 1440px for portfolio visitors. The path ledger is the accessible equivalent of the chart: every node and edge in the drawing is also a row of text. Exposed vs. barred is carried by words and by glyph (open arm vs. shut bar), never by color alone. The morning is an ordered list of buttons (one per event) plus "◂ anterior" / "Próximo evento ▸"; the current row carries `aria-current="step"` and each step announces itself in one `aria-live="polite"` line. Reduced motion honored: state changes become instant, the stepping is the same for everyone.
