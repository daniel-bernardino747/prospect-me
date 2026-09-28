# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (from BRIEF.md, not interviewed):** a curious Brazilian, 20 to 45, who sees someone else's card in the feed (X, Instagram stories, a WhatsApp group: "Belém faz 62 Pix por mês, e a sua cidade?") or a headline about the 318-million-Pix day. They open it on a phone, in a moment of distraction (a queue, the bus, a break), look up their own city or the one they were born in, compare it with Brazil, and **decide whether to post the card**. That decision is the only one that matters; the card being good enough to post is the success metric.

**Secondary (does not steer the design):** a visitor to Daniel Bernardino's portfolio on a desktop, looking for range: public data turned into a consumer object, fast search over 5,571 municipalities, a shareable image generated in the browser, and rigor about sources.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/pix-na-minha-cidade` (ADR-0002): one question, "quanto a minha cidade usa o Pix, comparada ao resto do Brasil?", answered with one number (Pix enviados por usuário pessoa física no mês, agosto de 2026), one sentence against the national figure (43), the city's place in line (of 5,571, in its state, among the 27 capitals), a 12-month line against Brazil, and a card to share. Success for the reader: finding their city in seconds and wanting to post the result. Success for Daniel: a portfolio piece that shows a public dataset turned into something people pass around, without losing the source on the way.

## Positioning

Dados do Pix (dadospix.com.br) is a panel for people who already want to explore; FGV's Geografia do Pix 2 is a static PDF with 2024 data; IBGE Cidades is dense and system-like. This is the same FGV metric ("Transações por Usuário") with data through August 2026, for any of the 5,571 municipalities, as one answer and one postable card that carries its own source printed on it.

## Operating Context

- One Next.js 16 page in Labs at `/demo/<slug>`, under the fixed "Demo conceitual" banner; indexed, lifetime, no company, no `expiresAt`.
- State lives in the URL: `?c=<código IBGE>` is the shareable link; `?q=` resolves a no-JS search on the server. Default (no `?c`) is São Paulo.
- Data fetched once by hand (`scripts/fetch-pix`), never at build: BCB `TransacoesPixPorMunicipio` (12 closed months, 2025-09 to 2026-08, PF only) joined to IBGE population estimates 2026. Stored as `data.json` beside the code, read once by `load.ts`; rankings precomputed by the script. A ~58 KB gzip search index (`[ibge, nome, uf]`) goes to the client.
- The card is rendered to a 1080×1350 PNG in the browser (canvas) and handed to `navigator.share({ files })`; download and copy-link where share is unsupported.
- The link preview (OG) is generic: the route cannot pass `searchParams` to metadata. The per-city card travels as the PNG.

## Capabilities and Constraints

- Metric: `QT_PagadorPF / QT_PES_PagadorPF` for the municipality, 2026-08. Brazil = sum of PF Pix / sum of PF payers (43,2). Pessoa jurídica is excluded everywhere (company headquarters distort municipal rankings).
- The number is an average and is always worded as one. Ticket and PNG sentence: `Quem usa Pix em {cidade} fez, em média, {n} Pix em agosto. A média do Brasil é 43.` Share text: `{cidade}: {n} Pix por usuário em agosto. E a sua cidade?`. This supersedes the brief's draft sentence ("Quem usa Pix em São Paulo fez 38 Pix em agosto"), which read an average as if every user had done it (ADR-0002: no overstated results).
- Default case, confirmed today: São Paulo 38 Pix por usuário em agosto; 2.805º de 5.571; 331º de 645 em SP; 25ª de 27 capitais; valor médio R$ 243. Manaus 71, Florianópolis 32,5 (last capital).
- Small municipalities (under ~2,000 payers): show the metric plainly but replace the exact rank with a decile phrase ("entre os 10% que mais usam").
- Outliers (payers above the estimated population, e.g. Pacaraima-RR, a border town): note on the card, metric untouched.
- Invalid `?c`: show the default with a discreet "não achamos esse município"; never a 404. Search with no match: "Nenhum município com esse nome" plus 3 prefix suggestions. Homonyms (Bom Jesus) listed with UF.
- Cut, and never faked: choropleth map, receiver/PJ side, daily series, fraud (MED) by municipality (the data does not exist), geolocation, automatic refresh, per-city OG image.
- UI names come from IBGE ("São Paulo - SP"), not the BCB's upper-case names.

## Brand Commitments

- The Labs "Demo conceitual" banner is fixed. pt-BR, direct, no hype.
- No imitation of any real brand: not the Pix logo or its teal, not the Banco Central identity, not any bank's app, not Spotify Wrapped (the vertical-card pattern is borrowed, never its look).
- Tone between cities is neutral: "usa mais" / "usa menos", never "atrasada", "campeã", or a judgment of the South or the North.
- Attribution required by the ODbL, visible on the page **and printed on the card**: "Fonte: Banco Central do Brasil — Estatísticas do Pix (dadosabertos.bcb.gov.br/dataset/pix), ODbL". The derived `data.json` is offered under ODbL (a `DATA-LICENSE` file in the folder and one footer line). IBGE cited as source of names and population. FGV EAESP cited as the origin of the metric.

## Evidence on Hand

- `BRIEF.md` in this folder: findings A1–A21, each CONFIRMADO or INFERIDO, with URLs and the São Paulo / capitals / states figures.
- Data to be generated into `data.json`: 5,571 municipalities × 12 months (PF Pix, PF payers, PF value), population, precomputed rankings, `fetchedAt`.
- The 318,073,816-transaction day (4/9/2026) is cited "Banco Central, via Metrópoles" with the link; no primary BCB note was found.
- Absent, and never to be fabricated: users of this page, share counts, testimonials, any person's own Pix data, fraud per city, reasons why a city uses more or less (the FGV income association may be cited as the FGV's, never stated as fact about a city).

## Product Principles

1. The card is the answer: the first viewport is already a filled card (São Paulo), and every other element serves finding a different city or trusting this one.
2. Postable means sourced: the source and month travel printed on the image, not only on the page.
3. An average is said as an average: "em média" in every sentence that states the number, "por usuário" in every label; never "você fez" or "cada pessoa fez".
4. The place in line, not a verdict: rank and comparison are stated neutrally; distance from the national figure is shown, never judged.
5. Honest limits in the sentence that needs them: border towns, tiny samples, and residence-vs-where-paid are said on the card or right beside it.

## Accessibility & Inclusion

Phone-first at 390px, one-handed; touch targets at least 48px; readable in daylight on a bus. Fully usable at 1440px. Search works without JavaScript (`<form method="get">`) and with a keyboard (combobox with `aria-activedescendant`, pt-BR announcements). The distribution strip and sparkline carry their meaning in text too ("São Paulo: 38; Brasil: 43"); nothing by color or hover alone. Reduced motion honored.
