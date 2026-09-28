# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (INFERIDO, from BRIEF.md "Usuário e momento"; not interviewed):** an economy or energy reporter or editor, on a Monday morning after a weekend of cuts. Someone in a sector group wrote "o ONS cortou de novo"; they have until mid-morning to pick the story. They open the link on a phone, on the way to the newsroom or already in the pauta meeting, often in daylight. The decision they make: is this a story about **surplus energy in the country** (reason ENE, "Controle de frequência do SIN": low demand, storage, expansion without consumption) or about **a transmission line that could not carry it** (reasons CNF/REL, with the line named in `dsc_restricao`: a place, a name)? They leave with a correct sentence for the lede, a number attributable to the ONS, and a place to cite (RN, Conj. Caju, SE Açu III).

**Secondary:** a visitor to Daniel Bernardino's portfolio, arriving from the portfolio or from search, who should understand in five seconds that real public data, a map and time are working together. Not modelled beyond that; the page serves them only by serving the primary reader well.

## Product Purpose

A showcase at `labs.teamdbsolutions.com/demo/curtailment-br` (ADR-0002): a concept demo that answers one question, **where, how much and why wind and solar energy was cut in Brazil on one day**, as a map of the Northeast where every plant or plant group lights up with its cut, replayed half hour by half hour, and colored by reason. Default day: Sunday 16/08/2026, the worst day between 01/08 and 24/09/2026. Success for the reporter: the lede sentence and the angle (surplus vs. named line) in under two minutes. Success for Daniel: a portfolio piece that shows he can join three public datasets (ONS, ANEEL, Natural Earth) into one legible spatial-temporal story.

## Positioning

One day, in space and in time, for someone outside the sector. The Curtômetro (BrazilGrid) is a deep work tool for sector agents: accumulated counter, R$ by PLD, D-1 preview, bottleneck ranking, reimbursement reports, and its map lives in another product. The Volt Robotics tracker is paid and analytical. CAISO's daily reports have the day as unit but no space and no interaction. This demo has no R$, no counter, no forecast, no ranking, no claim: it shows the cut rising with the sun and spreading across the Northeast, and names the restriction behind each lit point.

## Operating Context

- One Next.js 16 page in Labs at `/demo/curtailment-br`: "demo conceitual" banner (fixed by Labs), indexed, lifetime, no company, no `expiresAt`.
- Data fetched once by a one-off script (ONS Parquet for 2026-08 and 2026-09, ANEEL SIGA CSV, Natural Earth admin-1), aggregated into `data.json` beside the code; `load.ts` reads it once on the server. No recurring crawler. The page states "dados baixados em 2026-09-25" and freezes that snapshot.
- The chosen day arrives by `?dia=AAAA-MM-DD`; the server embeds only that day (about 11 KB gzip) plus the 55-day totals strip. Invalid or absent `?dia` falls back to 2026-08-16.
- Without JavaScript the sentence, the map frozen at 10h30, the reason split and the method render on the server. That server frame is also the first paint with JavaScript: the board is lit at the peak before any script runs.

## Capabilities and Constraints

- Unit of the map: the 236 ids of the ONS aggregated datasets (153 wind, 83 solar), each placed at the centroid of its member plants (ANEEL SIGA coordinates, joined by the 6-digit CEG core). A plant group spread over tens of kilometres becomes one point; the method says so.
- Per point per half hour: reference generation (what it could produce), cut (GNRa, `val_geracaonaorealizadaapurada`) and reason code (ENE, CNF, REL; PAR folded into "rede" only if it appears, and said so).
- The frame is the Northeast plus northern Minas Gerais. What falls outside (RS, SP, GO, SC on 16/08) is shown on a "fora do mapa" plate so the total always matches the sentence; that plate never disappears.
- Transmission lines are **named**, never drawn: no open, verified line geometry exists today.
- Terminology on the page: "corte", "cortado", "gerado", "podia gerar" (referência), "patamar" (half hour), "sobrou energia" (ENE), "a rede não aguentou" (CNF/REL), "ponto" (usina ou conjunto), "restrição". GNRa is always "corte estimado pelo ONS", never "desperdício medido".
- Cut from v1 to fit ~16h (BRIEF.md's "ponto tocado" is reduced accordingly): the tapped point shows text rows only (name, UF, substation, source, day cut, current restriction), with no per-point curve, no mini recorder and no 48-row table. At most 12 pulse rings at once during replay.
- Out of scope: R$/PLD, live counter, forecast, D+7, series beyond Aug–Sep 2026, plant-by-plant inside a group, hydro spillage, distributed generation, other countries, English, CSV export.

## Brand Commitments

- The Labs "demo conceitual" banner is fixed. pt-BR, direct, no hype: no equivalences ("uma Itaipu", "X cidades"), no exclamation. The sentence compares the data with itself (cut vs. generated).
- No imitation of any real company's brand: not BrazilGrid/Curtômetro, not Volt Robotics, not Electricity Maps, not the ONS visual identity. The ONS is named as the source, never styled as the author.
- Required credits, on the page: "Fonte: ONS, Dados Abertos (CC-BY)" plus the changes made ("agregamos por dia e por ponto; convertemos MWmed de meia hora em MWh; posicionamos cada conjunto no centro das suas usinas"); "Contém dados do SIGA/ANEEL, sob ODbL" (the derived coordinate table is offered under ODbL with attribution); Natural Earth (public domain).

## Evidence on Hand

- `BRIEF.md` in this folder: every finding marked CONFIRMADO or INFERIDO, with URLs.
- Confirmed default-day figures (16/08/2026, all SIN): 399,9 GWh cut; 400,6 GWh generated; 817,0 GWh reference; peak 10h30 with 40.740 of 46.686 MWmed cut (87%); ENE 330,0 GWh (82,5%); CNF 49,6; REL 20,3 GWh; Nordeste 80% of the cut; top named restrictions "Controle de frequência do SIN" 330,0, "LT 500 kV Açu III / Jaguaruana II" 38,5, "Desligamento da LT 525 kV Povo Novo / Marmeleiro C2" 16,8 GWh.
- Inferred, and to be checked or stated as such: `din_instante` in Brasília time (verify before writing "às 10h30"); `hyparquet` reading these files.
- Absent, and never to be fabricated: users, readers, newsrooms that used it, testimonials, stories written from it, R$ values, forecasts, line geometry.

## Product Principles

1. The answer, then the instrument: the first viewport states the day's sentence (the h1 alone; the second sentence opens POR QUÊ below the map) and gives the rest of the screen to the board, already lit at the peak, not at midnight. At 390×664 at least 300px of the lit board shows above a collapsed 64px dock.
2. The reason is the story: every lit point says why it was cut (surplus vs. grid) by colour **and** glyph, and every named restriction can be traced to its points.
3. Time is the second axis: the day is replayed half hour by half hour; the curve of the whole country is always visible under the scrubber.
4. Estimate, snapshot, frame, said plainly: GNRa is an ONS estimate subject to revision, the data is frozen at 2026-09-25, distributed generation is not included, and what falls outside the frame is on the plate.

## Accessibility & Inclusion

Phone-first at 390px, readable in daylight; fully composed at 1440px. No information by colour alone (reason = colour + glyph + word) and nothing by hover alone (every lamp and restriction reachable by tap and keyboard). Scrubber operable by keyboard with `aria-valuetext` in pt-BR. `prefers-reduced-motion` removes pulse, flash and the lamp test, and the dock expands without animation; the replay still works by scrubbing. The collapsed recorder strip is a real button (44px hit area, `aria-expanded`) that opens the full scrubber. The map has a full-sentence text alternative that updates with the patamar (polite live region, throttled while playing).
