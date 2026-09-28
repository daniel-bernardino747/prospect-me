---
name: Bastidores
description: How five showcases were made by agents, read as a shop-floor levelling board (heijunka) — one row per line of work, one pigeonhole per five minutes, a printed cardstock card for every agent run, and a yellow-and-black stop band across the whole board wherever the line waited for Daniel to decide.
colors:
  parede: "#BEBCB4"
  parede-raised: "#CBC9C2"
  parede-sunk: "#B1AFA7"
  quadro: "#F2F2EE"
  quadro-lip: "#E4E1D6"
  divisoria: "#1A1A1A"
  pitch-tick: "#9C9A93"
  ink: "#141414"
  ink-2: "#2E2D2A"
  muted: "#3F3E3A"
  parada: "#F4C300"
  parada-stripe: "#141414"
  card-orquestrador: "#D6D5CF"
  card-nichos: "#E4E1D6"
  card-pesquisa: "#D9BC8C"
  card-design: "#EBA3B5"
  card-critica: "#F2F2EE"
  card-build: "#8DB6DE"
  card-polimento: "#A7D3B0"
  card-deploy: "#EE9A5A"
  card-parou: "#141414"
  on-card-parou: "#F2F2EE"
typography:
  answer:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 0.95rem + 1.9vw, 2.75rem)"
    fontWeight: 700
    lineHeight: "1.22 → 1.08"
    letterSpacing: "-0.018em"
  title-plate:
    fontFamily: "Overpass, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 5vw, 5.5rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Overpass, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  row-label:
    fontFamily: "Overpass, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  note:
    fontFamily: "Overpass, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  card-code:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "0.6875rem (390) → 0.75rem (1024+)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  figure:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.35
  clock:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  none: "0"
  card: "3px"
  tag: "2px"
spacing:
  unit: "4px"
  scale: "4, 8, 12, 16, 24, 32, 48, 64, 96"
  gutter-mobile: "16px"
  margin-wide: "64px"
  column-gap: "24px"
  sheet-max: "1360px"
  measure: "40rem"
  pitch-min-wide: "20px"
  pitch-min-mobile: "22px"
  row-height-wide: "44px"
  lane-width-mobile: "min(44px, (100% - 56px) / lanes)"
components:
  board:
    backgroundColor: "{colors.quadro}"
    border: "3px solid {colors.divisoria}"
    rounded: "{rounded.none}"
  pigeonhole-divider:
    stroke: "1.5px {colors.divisoria} (rows) / 1px {colors.pitch-tick} (pitches)"
  card:
    rounded: "{rounded.card}"
    textColor: "{colors.ink}"
    shadow: "0 1px 1.5px rgb(20 20 20 / 0.28)"
  card-parou:
    backgroundColor: "{colors.card-parou}"
    textColor: "{colors.on-card-parou}"
  stop-band:
    background: "repeating-linear-gradient(-45deg, {colors.parada} 0 7px, {colors.parada-stripe} 7px 14px)"
  decision-card:
    backgroundColor: "{colors.parada}"
    textColor: "{colors.ink}"
    border: "1.5px solid {colors.ink}"
    rounded: "{rounded.card}"
  andon-strip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.quadro}"
    height: "28px"
  ficha:
    backgroundColor: "{colors.quadro}"
    border: "1.5px solid {colors.divisoria}"
    rounded: "{rounded.none}"
  commit-tag:
    backgroundColor: "{colors.quadro-lip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
---

# Design System: Bastidores

Scope: this showcase only (`/demo/bastidores`). Nothing here binds Labs or the other showcases. Product truth lives in `PRODUCT.md`; data, extraction and privacy rules in `BRIEF.md`. Tokens live as custom properties on the artifact root class (`.chao` in `bastidores.module.css`), not on `:root`, because the Labs `globals.css` owns `:root` and `body`.

This file was written **before** the build, as the build's spec (the workflow asked for it up front, as it did for the other four). After the build, re-record it from what shipped and list deviations under "Desvios na implementação"; ground truth wins over intention.

## Direction contract

Ship this as an HTML comment, first child of the artifact's root element (rendered with `dangerouslySetInnerHTML` on a `<div hidden>`, as the siblings do), and grep the production build for `ec0a855b`.

```
THESIS: An orchestration of agents is a production line, and directing it is levelling the work and stopping the line when a human must decide. The page is a heijunka board: one row per line of work, one pigeonhole per five minutes, one printed card per agent run, and a yellow-black stop band across the whole board wherever the line waited for Daniel. It refuses the dark trace viewer (terminal replay, tokyo-night spans) and the pastel SaaS Gantt.
OWN-WORLD: Concrete-grey shop wall (#BEBCB4); a white enamel board (#F2F2EE) ruled in black; flat cardstock cards in eight phase stocks with Overpass Mono codes; andon yellow (#F4C300) only for the human; black cards for lines that stopped. Overpass for words, Overpass Mono for codes and figures. Square board, 3px card corners.
STORY: The visitor reads how long, how many agents and how often Daniel decided; watches the cards slot in pitch by pitch and the line halt at each stop band; opens a card to check one agent; leaves through a row's end to the showcase it produced.
FIRST VIEWPORT: title plate and answer sentence on the wall; the andon strip and the board's first pitches beneath, with the first stop band visible.
FORM: heijunka levelling board with andon stops, candidate 6 of 7; seed ec0a855b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

### How the direction was chosen (unattended run)

No question tool reached Daniel from inside this workflow agent, so the impeccable interview and the decision page did not run. PRODUCT.md is written from the brief with inferred facts labelled, the assigned direction ships, and the alternates below are recorded for him to overrule.

**Mechanism in one sentence:** agents do the work in phases, in parallel, and the orchestration stops for a human at the points that matter.
**Audience scene:** a recruiter or tech lead at a laptop during a screening, having just seen another showcase and thinking "an AI made this".
**The rut (kept off the list):** the dark trace viewer (a terminal-style replay, tokyo-night or dracula spans, collapsible tool blocks) and its predictable opposite, a pastel Gantt dashboard of rounded bars and KPI tiles.
**Literal readings (one slot each at most):** "bastidores" read as theatre backstage; "orquestração" read as an orchestral score.

**Grounded list, ordered by resonance before the roll:**
1. Conductor's full score: one staff per agent, rehearsal letters for phases, a fermata for each human stop, *D.S.* for the send-back, *tacet* for the research that stopped. (Music notation; the literal "orquestração".)
2. Railway graphic timetable (Marey / *horário gráfico*): phases as stations, each showcase a train path, dwell and return visible as geometry. (Transport notation.)
3. Air-traffic flight progress strips in a strip bay: one strip per agent, racked by sector, annotated by the controller's pen. (Operations, physical.)
4. Theatre stage manager's prompt book: cue calls, *standby / go*, the director's pencil. (Literal "bastidores".)
5. Film production call sheet and continuity report: departments, call times, wrap. (Production paperwork.)
6. **Heijunka levelling board with andon: rows of pigeonholes by time pitch, printed cards per job, a stop band when the line calls for a human (jidoka).** (Lean manufacturing, physical board and its printed notation.)
7. `git log --graph` rendered large: branches, merges, worktrees. (Terminal; adjacent to the rut.)

Families: notation (1, 2), operations and shop floor (3, 6), production paperwork (4, 5), terminal (7).

**The roll** (`concept-seed.mjs --scope direction --mode experience`, key `ec0a855b`) assigned **6**.

**Why 6 carries the product's truth (not rescued, it fits):** Toyota's *jidoka*, "automation with a human touch", is exactly the story the data tells: machines that stop themselves on an abnormality and call a person. The research agent that returned `viable: false` and asked for a human decision is jidoka; the classifier that stopped a file write is jidoka; each `AskUserQuestion` is the andon cord pulled. Heijunka (levelling work across time pitches, one row per product) makes parallelism and phase readable at a glance, and software people already know the vocabulary (kanban, andon, "stop the line"). A time-pitched grid is also honest to the data: runs of 1 to 11 minutes land in 5-minute pitches, and the card carries the exact minutes inside it.

**Challengers dealt and weighed (fused with the product, on audience identification and product clarity):**
- *Film cutting-bench select rail* (orange on black, frames on a perforated rail, trims on pins): the "hung on a pin" state is a lovely home for the not-viable research, but orange-on-black is the neon-dark lane the brief forbids and a single rail loses the parallel rows. Loses on clarity.
- *Pocket airline timetable on a lit goldenrod slide rack* (one type size, raked slides): close kin to candidate 2 and strong on timetable literacy, but the rake and one-size rule fight a dense 9-row grid at 390px, and a lit bed with tinted glass slides reads as a physical instrument again, the exact template the cross-review broke up. Loses on clarity.
- *Metro typographic tiles* (flat tiles, giant cropped lowercase on black): the only non-physical world in the hand and a real contrast with the set, but tiles make agents into equal squares and drop time, which is the product. Loses on both.
- Waiting in the re-roll pool: the WebGL shader portal and the rain-night cityscape (both decorative over this data), the cloud quarry (surreal, no reading of time).

**Honest risk:** the set's cross-review found the first four converging on "a physical instrument on a pale ground with one reserved accent and tracked caps". A board is a physical object. This page answers by (a) a **mid-tone concrete wall**, not a pale sheet, (b) a **full, coded palette** of eight card stocks rather than one reserved accent, (c) **no tracked uppercase micro-labels** (row labels and plates are sentence case in Overpass 700–900; codes are mono, not caps signage), (d) no lamps, no LEDs, no split-flaps, no dials, no seven-segment digits, no mounted-plastic highlight: the board is flat printed enamel and cardstock, and its motion is cards sliding into slots.

### Distinct within the showcase set

| | conta-de-tokens | raio-de-explosao | curtailment-br | pix-na-minha-cidade | **bastidores** |
|---|---|---|---|---|---|
| World | exchange split-flap board | emergency-zone polar chart | control-room mimic board | thermal queue ticket | **shop-floor heijunka board** |
| Faces | Chivo + Chivo Mono | Sofia Sans (3 widths) + Fragment Mono | Atkinson Hyperlegible Next + B612 (+ Mono) | Archivo (wdth) + Martian Mono | **Overpass + Overpass Mono** |
| Ground | blue-steel `#C7CFD8` + black band | pale chart paper `#EDEFEA` | instrument-green enamel | warm gelo wall + ochre barra | **mid concrete `#BEBCB4` + white enamel board** |
| Colour logic | one chartreuse highlighter | one magenta for exposure | amber + red lamps | tomato dispenser + red LED | **eight flat card stocks by phase + andon yellow for the human** |
| Time grammar | none (a fader) | discrete event log with stepper | continuous play-the-day dock | none | **a pitched grid, read by scrolling; one "encaixe" replay of cards sliding into slots** |
| Composition | light/dark/light horizontal board | sentence left, chart right | map dominant, bottom dock | ticket from dispenser | **wall plate on top, a full-bleed board that is the page** |

Additionally refused here: seven-segment or LED digits (pix), lamps and annunciators (curtailment), flap cells (conta), hatch as hazard zone in magenta (raio; this page's stripes are yellow-black and mean only "waiting for a human"), a sticky bottom dock (curtailment), sentence-left / instrument-right (raio).

## Overview

**Creative North Star: "Parar a linha"**

Toyota put a cord above every station on the line. Anyone who sees something wrong pulls it; the andon board lights the station, and the line stops until a person decides. That is the idea the page is built on: the agents did most of the work, fast and in parallel, but the line stopped wherever a person had to choose, and it stopped itself when an agent could not go on.

The page is the shop floor's levelling board seen straight on. A concrete wall carries a white enamel board ruled in black into pigeonholes: one **row** per line of work (Daniel, the orchestrator, the niche research, the five showcases, the art director), one **column** per five-minute pitch of wall-clock time (Brasília time). Every agent run is a **card** printed on the cardstock of its phase and slotted into the pigeonholes it occupied. Across the full height of the board, wherever the orchestration waited for Daniel, runs a **stop band** in yellow and black, and pinned in Daniel's row on that band is his **decision card**: the question headers, and what he chose. A line that stopped for good ends in a **black card**. Each row ends at the board's right edge in an **expedição** cap that links to the showcase that line shipped.

The board is read by looking and by scrolling, not by pressing play. Once, the first time it scrolls into view, the cards slide into their slots in time order and the line visibly halts at each stop band before going on (the *encaixe*); after that the board simply is.

**Key characteristics**
- A mid-tone concrete wall, never pale, never cream, never dark. The white board is the brightest thing on the page and the only light surface of any size.
- Colour is coded, flat and printed: eight card stocks, one per phase, each also carrying its two-letter code, so colour is never the only carrier.
- Andon yellow means exactly one thing: a human decided here (the decision cards, the stop bands, and the legend chip). Nowhere else.
- Black means the line stopped: the not-viable card, a blocked write, a script error.
- Overpass carries every word; Overpass Mono carries every code, figure, clock time and path. No tracked uppercase signage.
- Square board, 1.5px black row dividers, 1px grey pitch ticks; the only radius is 3px on cards and 2px on tags.
- Depth only on cards (they are objects in slots); the board and the wall are flat paint.

**Physical scene (decides light):** a recruiter or tech lead at a laptop in office daylight during a screening, or on a phone from a link in a chat. A painted board under shop lights; the page is light. There is **no dark variant**: under `prefers-color-scheme: dark` the page stays as specified with `color-scheme: light` on `.chao`, because cardstock inverted onto a dark wall turns into glowing chips on black, the neon lane this page refuses (same decision as curtailment-br, for its own reason).

## Colors

Strategy: **Full palette**, coded. Neutrals for wall and board, eight flat card stocks that name phases, andon yellow for the human, black for stops. No gradients except the stop band's stripes; no tints of the accent anywhere.

### Wall and board
- **Parede** `#BEBCB4`: the artifact's full-bleed ground (root `min-height: 100dvh`). A warm-neutral concrete grey, mid-tone: ink on it 9.7:1.
- **Parede raised** `#CBC9C2`: method block, checkpoint list rows on hover, the "Rever o encaixe" button face.
- **Parede sunk** `#B1AFA7`: the board's shadow gap (a 6px band under the board frame, flat), table header rows in the livro de bordo.
- **Quadro** `#F2F2EE`: the board face and the ficha. 16.4:1 with ink. Not cream: it is a cool enamel white, and it is always seen against the grey wall, never as the page ground.
- **Quadro lip** `#E4E1D6`: the pigeonhole lip (a 3px strip at the top of each row where cards would sit behind the rail), commit tags, the nichos card stock.
- **Divisória** `#1A1A1A`: the board's 3px outer frame and the 1.5px row dividers.
- **Pitch tick** `#9C9A93` (2.5:1 on the board, non-text): 1px pitch dividers; every sixth (half hour) 1px Divisória; every twelfth (the hour) 1.5px Divisória.

### Ink
- **Ink** `#141414`: all text on wall, board and cards. ≥ 8.2:1 on every card stock.
- **Ink 2** `#2E2D2A` (7.2:1 on wall): secondary prose on the wall.
- **Muted** `#3F3E3A` (5.6:1 on wall, 4.8:1 on the orange stock): captions, units, clock labels. Never lighter.

### Card stocks (one per phase; code in brackets is printed on every card)
| phase | token | hex | code | ink contrast |
|---|---|---|---|---|
| Orquestrador (the main session's working spans) | card-orquestrador | `#D6D5CF` | `OR` | 12.5:1 |
| Pesquisa de nichos | card-nichos | `#E4E1D6` | `NI` | 14.1:1 |
| Pesquisa | card-pesquisa | `#D9BC8C` (kraft) | `PE` | 10.1:1 |
| Design (first pass and revision) | card-design | `#EBA3B5` (rosa) | `DE` / `DE2` | 9.2:1 |
| Crítica cruzada | card-critica | `#F2F2EE` with a 4px ink top band | `CR` | 16.4:1 |
| Build | card-build | `#8DB6DE` | `BU` | 8.7:1 |
| Polimento | card-polimento | `#A7D3B0` | `PO` | 11.0:1 |
| Deploy | card-deploy | `#EE9A5A` | `DP` | 8.3:1 |

The revision card (`DE2`) uses the design stock with a printed 1px ink diagonal from top-left to bottom-right: the second card for the same slot. Stocks were chosen so neighbours in time (PE→DE, DE→CR, BU→PO→DP) differ in hue family and by ≥ 1.1 in lightness; codes carry identity in every case. Future phase names map in `data.ts`; an unknown phase fails the extraction (BRIEF), so the palette never meets an unmapped card.

### The human
- **Parada** `#F4C300` (andon yellow): decision cards (fill), stop bands (stripes with **Parada stripe** `#141414`, 7px each at −45°), the "Daniel" row label's 8px square key, and the legend chip. Ink on it 11.1:1. Never text colour, never hover, never focus.

### Stops
- **Parou** `#141414` card with **on-parou** `#F2F2EE` text (16.4:1) and a 6px punched corner (top-right `clip-path` notch): the not-viable research's end card, a card whose run had a blocked write (a small black corner flag on the normal stock instead, see Components), the workflow-script error (a black commit-tag-sized slip in the orchestrator row).

## Typography

Load in the artifact component file with `next/font/google` (check the Next 16 font docs in `node_modules/next/dist/docs/` before writing):

```ts
import { Overpass, Overpass_Mono } from 'next/font/google';
const overpass = Overpass({ subsets: ['latin'], variable: '--font-sheet', display: 'swap' });
const overpassMono = Overpass_Mono({ subsets: ['latin'], variable: '--font-code', display: 'swap' });
```

Both are variable on weight. Overpass descends from Highway Gothic, the lettering of road and industrial signage; at 900 it has the blunt, stencil-ready weight of a painted plate on a factory wall, and at 400 it reads plainly in long notes. Overpass Mono is the printer on the cards: codes, minutes, token counts, paths, commit hashes. Using a mono here is data and measurement, not a "technical" costume: every mono string is a code, a figure or a path. **Verify at build:** Overpass's tabular figures (`font-variant-numeric: tabular-nums`) in the livro de bordo; if absent, those columns move to Overpass Mono (record under Desvios).

### Hierarchy
- **Title plate** (the page name, painted on the wall): Overpass 900, `clamp(2.75rem, 1.6rem + 5vw, 5.5rem)`, leading 0.9, tracking −0.03em, sentence case "Bastidores". Beneath it on one line, Overpass 400 1rem Ink 2: "Como estas cinco demos foram feitas por agentes de IA, e onde a linha parou para Daniel decidir." This is a subtitle sentence, not an eyebrow; there is **no kicker** above anything.
- **Answer** (h1): Overpass 700, `clamp(1.375rem, 0.95rem + 1.9vw, 2.75rem)`, leading 1.22 at 390 → 1.08 at 1440, tracking −0.018em, `text-wrap: balance`, `max-width: 34ch` at 1440 (three to four lines), full width at 390. Figures inside it are `.fig` spans in Overpass Mono 600 at 0.9em. The count of human decisions gets a Parada underline: `text-decoration: underline 0.14em var(--parada); text-underline-offset: 0.12em; text-decoration-skip-ink: none` (the only place yellow touches text, as a mark under ink, never as ink). "não era viável" gets a 0.14em ink underline. "devolveu" is plain.
- **Headline** (h2): Overpass 800, `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)`, leading 1.05, sentence case.
- **Row label**: Overpass 700 0.9375rem; the line's slug beneath in card-code mono Muted.
- **Body**: Overpass 400 1.0625rem/1.55, max 40rem. **Note**: 0.9375rem/1.45.
- **Card code**: Overpass Mono 700, 0.6875rem (0.75rem ≥ 64rem), tracking 0.02em. Two or three characters: `PE`, `DE2`, `BU`.
- **Figure**: Overpass Mono 500 0.875rem (ficha, livro de bordo, andon counts).
- **Clock**: Overpass Mono 400 0.75rem Muted (pitch axis labels `13:05`, `13:30`, `14h`).

**Number and time format:** pt-BR. `1 h 04 min`, `25 min 46 s`, `22 min 19 s`; tokens `17,5 mi` in prose and `17.511.386` in the ficha; percentages `93,1%`. Clock times are Brasília time and every axis and ficha states it once ("horário de Brasília"). Dates `25 set 2026`.

## Layout

Mobile-first. One breakpoint that changes the board's orientation, `min-width: 64rem`; a width cap at 1360px.

- **< 64rem:** single column, 16px gutters. The board is **transposed**: time runs **down** the page (one pigeonhole row per pitch, min 22px tall), the lines run **across** as lanes (min(44px, available ÷ lanes) wide), with lane headers in a header row at the top of the board.
- **≥ 64rem:** 12 columns inside 1360px, 64px outer margin (32px between 64rem and 80rem), 24px gaps. The board runs **across**: one row per line (44px tall), one column per pitch (min 20px), a 176px row-label column on the left and a 132px expedição column on the right.
- The board breaks out of the text grid to the full sheet width at ≥ 64rem (it keeps the 64px margins; it is not full-bleed). If pitches × 20px exceed the available width, the pitch area scrolls horizontally **inside the board** (`overflow-x: auto`, `scroll-snap-type: x proximity` on half-hour ticks) with the label column `position: sticky; left: 0` and the expedição column sticky right. The page itself never scrolls horizontally.
- **Idle compression:** a run of ≥ 4 consecutive pitches with no agent active and no question pending collapses into one 12px "intervalo" pigeonhole with a 45° double-slash break mark and a Muted mono label ("+1 h 20 min") on the axis. Pitches during a human wait never collapse: waiting is the story.
- 4px baseline; section rhythm 64px (< 64rem) / 96px (≥ 64rem); h2 48px above, 16px below.
- Touch targets ≥ 44px: every card's hit area is its whole pigeonhole span × row height (min 44px on the long axis; short runs extend their hit area symmetrically into empty neighbour pitches, never over another card), decision cards, stop bands, expedição caps, "Rever o encaixe", checkpoint rows.
- No fixed element anywhere. One sticky rule, scoped: the transposed board's lane-header row on < 64rem sticks to the top of the board section while the board scrolls (it is a column key, not a control), and the label/expedição columns stick inside the board's own horizontal scroller on ≥ 64rem.

### First viewport at 390 × 844 (≈ 760px visible)
1. **Labs banner** (global, ~56px).
2. 24px. **Title plate** "Bastidores" (44px, ~40px tall) and its subtitle sentence (2 lines, ~48px).
3. 20px. **Answer** (h1, 22px, 6–7 lines, ~190px): generated sentence (BRIEF).
4. 16px. **Legend** (one line, wraps to two, ~44px): three keys set inline in Note type, each with its drawn swatch: a 14 × 10px card in kraft with `PE` → "agente trabalhando"; a 14 × 10px stripe swatch → "a linha parou: Daniel decidiu"; a 14 × 10px black card → "a linha parou sozinha".
5. 16px. **Board top**: the board frame's top edge, the **lane-header row** (9 lanes × ~38px: 8px Parada square over "Da", then `OR`, `NI`, `co`, `ra`, `cu`, `px`, `cp→ba`, `AD`, each a mono two-letter key; a full key sits under the board, and each header has `aria-label` with the full name), the **andon strip** turned to a 28px left column (see Components), and the first pitches: 13:00 (the request), 13:05 (checkpoint 1's thin stop band and the first decision card in Daniel's lane), 13:10 (the nichos card)… The first stop band must be visible above the fold: the layout above is budgeted for it (board starts at ≈ 470px; three 22px pitches reach 13:10).

### First viewport at 1440 × 900 (≈ 820px visible)
1. **Banner** (~38px). 40px.
2. **Wall block**, grid: title plate in cols 1–5 (88px, one line) with its subtitle beneath; the **answer** in cols 6–12 at 44px/1.08, three lines, `max-width: 34ch`. Under the answer, the legend on one line. Block height ≈ 230px.
3. 32px. **Board**, cols 1–12: frame, the **andon strip** across the top (28px), the **clock axis** (20px), then nine rows × 44px = 396px, then the **commit rail** (28px). Board height ≈ 480px: the entire board fits the first viewport at 1440 × 900 when the pitch count fits the width (≤ 57 pitches at 20px in 1144px); otherwise its left portion shows with the scroller's edge fade (a 24px `mask-image` fade on the right, not a shadow).
4. The fold lands on the board's bottom rail and the key line under it.

### Below the board
- **Key** (a one-line list of the eight stocks with codes and names, then the lane names in full), then **"Rever o encaixe"** (text button).
- **Ficha** (the selected card's detail): ≥ 64rem, a full-width panel directly under the board key, cols 1–12, split in three: identity (cols 1–4), numbers (cols 5–8), files and result (cols 9–12). < 64rem, inserted inline in the board right below the tapped pitch row, spanning all lanes.
- **"Onde a linha parou"** (h2): the checkpoints, cols 1–8 at ≥ 64rem, with the tally of waits in cols 9–12.
- **"Livro de bordo"** (h2): tool calls by tool; tokens processed by phase with the cache share; agent-time vs. wall-clock (parallelism). Cols 1–12 in three blocks of 4 at ≥ 64rem, stacked below.
- **"Como foi medido"** (h2): method and privacy rules in plain language, cols 1–7; sources and `asOf` in cols 9–12.
- Footer: "Demo conceitual de Daniel Bernardino." with the portfolio link.

## Elevation & depth

Printed and painted, not glassy.
- **Cards** are the only objects with depth: `box-shadow: 0 1px 1.5px rgb(20 20 20 / 0.28)`; the selected card lifts to `0 3px 6px rgb(20 20 20 / 0.30)` and `translateY(-2px)` (desktop) / `translateX(2px)` (transposed).
- The **board** is flat enamel with a 3px black frame; under it a flat 6px Parede-sunk band (the board's standoff from the wall), no blur.
- **Stop bands** sit *on* the board face, under the cards (z-order: board < stop band < cards < decision cards).
- No glow, no blur, no gradient except the stop stripes and the scroller's edge mask.

## Components

### Title plate
Overpass 900 "Bastidores" painted on the wall (no box), with its subtitle sentence. Not a link, not sticky.

### Answer sentence (h1)
Generated from `data.json` by `answerSentence(data)` in `data.ts` (a Vitest test pins today's snapshot and the final data). Figures in `.fig`. It names: total duration, agent count, phases, the count of human decisions (Parada underline), the not-viable research, the send-back. When the final data has no send-back or no refusal (it has both today), the clause drops; the test covers each variant.

### Legend
Three inline keys with drawn swatches (SVG, not glyphs): card, stop stripe, black card. It is part of the first viewport, not a tooltip.

### Board (`<Quadro orientation="across|down">`)
One SVG per orientation, server-rendered, `role="img"` with an `aria-label` summarising it; the accessible structure is the **run list** (below) rendered in the DOM beside it. The client layer only handles selection, the encaixe and the scroller.
- **Frame:** 3px Divisória, square.
- **Rows (lanes):** in this order: **Daniel**, **Orquestrador**, **Nichos**, **conta-de-tokens**, **raio-de-explosao**, **curtailment-br**, **pix-na-minha-cidade**, **caixa-preta → bastidores**, **Direção de arte**. Row label (≥ 64rem): Row-label type + slug mono Muted; Daniel's label carries the 8px Parada square; the caixa-preta row's label is "caixa-preta" struck through with a 1.5px ink line, then "bastidores" beneath it after the pitch where checkpoint 3 gave it the slot (see States).
- **Pitch columns:** 5 minutes, labelled on the clock axis every 30 minutes (`13:30`) and on the hour (`14h`, Overpass Mono 700). The first label reads `13:00 · horário de Brasília`.
- **Pigeonhole lip:** a 3px Quadro-lip strip along the top of each row (≥ 64rem) or the left of each lane (< 64rem): the rail the cards tuck behind.
- **Cards** (`<Cartao run>`): a rectangle on the phase stock spanning the pitches the run overlapped, inset 3px from the row dividers, 3px radius, card shadow. Inside, at the leading edge, the code in card-code type. Along the card's bottom edge (≥ 64rem) or right edge (< 64rem), a 2px ink **time punch**: a line whose start and length are the run's exact minutes within the card's pitches (so a 1-minute run in a 5-minute pigeonhole shows a 1/5 punch). When a card spans ≥ 3 pitches at ≥ 64rem, the label slug follows the code in Muted mono (`PE · pesquisa`). A **T-shoulder** (the head of a T-card: 2px wider than the stem at the top 6px) is drawn only when the card is ≥ 28px on its short axis.
- **Parallel runs in one lane and pitch** (rare: a revision starting in the pitch its design ended): cards overlap like stacked T-cards, the later one offset 4px down/right, both codes visible.
- **Run marks** (small printed glyphs, authored SVG in 1.5px ink strokes, 10 × 10px, in the card's trailing corner):
  - **Devolvida** (the four first design cards): a return hook arrow. The mark's `<title>` and the ficha say "devolvida pela crítica cruzada".
  - **Bloqueio** (a run where a tool call was stopped by a classifier): a solid black triangular corner flag (top-right, 8px), plus the ficha line.
  - **Erro de ferramenta** (any `is_error` result): a count in mono after the code, `PE ·2✕` drawn as a 1.5px cross glyph, not a Unicode ✕.
  - **Worktree** (build runs): a tiny branch fork glyph.
- **Stop card** (Parou): black stock with on-parou code `PE ■ inviável` and the punched corner, placed right after the caixa-preta research card; the row is empty until the bastidores cards begin.
- **Selection:** tap/click/Enter selects a card: it lifts (see Depth), gets a 2px ink outline at 2px offset, and the ficha fills. `aria-pressed` on the card's button in the run list; the SVG card mirrors the state.

### Stop band (`<Parada checkpoint>`)
A band across **all rows** of the board, from the moment the question was asked to the moment Daniel answered, on the stop stripes. Minimum drawn width 6px (the 28-second stop still shows); the pigeonhole scale is not distorted to make it wider, and its decision card is what the eye finds. At the band's top (≥ 64rem) or left (< 64rem), in the Daniel row, pins the **decision card**.

### Decision card (`<Decisao>`)
Parada stock, 1.5px ink border, 3px radius, card shadow; fixed size 132 × 40px (≥ 64rem) / lane-width × 44px (< 64rem, shows only `D1`/`D2`/`D3` + the wait). Content ≥ 64rem: `D2 · 22 min 19 s` in figure type, and one line in Note type: the first question's header ("Os 5"). When it overlaps other cards it sits above them. Selecting it fills the ficha with: time asked and answered, wait, and for each question its header, its options (mono, Muted) and the chosen one(s) set in Ink 700 with a Parada underline. Question wording and options are Daniel's own interface text (short, reviewed), shown as data.

### Andon strip
A 28px Ink strip across the top of the board (≥ 64rem) or down its left (< 64rem, 28px wide), aligned to the pitches. Each pitch cell shows, in figure type on-parou colour, the **number of agents working** in that pitch (`0` shown as a Muted-on-ink dot). Pitches under a stop band show the stripes in the strip instead of a number, and at the band's first pitch the word "parada" (Overpass 700 0.6875rem) when the band is ≥ 2 pitches wide. It is the board's summary line: parallelism at a glance, stops at a glance.

### Commit rail
A 28px Quadro-lip rail under the last row (≥ 64rem) or right of the last lane (< 64rem). Each commit is a **tag** (Quadro-lip, 2px radius, 1px ink border, hung by a 1px ink string from the rail): short hash in mono at its pitch. Selecting it fills the ficha: hash, time, subject, files changed, insertions/deletions, branch. The workflow-script error is a **black slip** in this rail (black tag, on-parou text `erro no script`) at its time.

### Expedição caps
At each row's end (≥ 64rem, the sticky right column; < 64rem, a final pigeonhole row beneath the lanes): the line's outcome in Note type with a drawn outbound arrow: "no ar → /demo/conta-de-tokens" (a real link), "parou na pesquisa" for caixa-preta (no link), "você está aqui" for bastidores, and nothing for Daniel, Orquestrador, Nichos, Direção de arte (their cap reads the row's total active time in mono Muted).

### Run list (the accessible board)
An `<ol>` of every run in time order, visually hidden on ≥ 64rem only when JavaScript is running (it is the no-JS board), visible under a `<details>` "Ver como lista" on every width. Each item is a `<button aria-pressed>` naming the lane, phase, start–end and duration; it drives the same selection. Keyboard on the SVG: the board wrapper is one tab stop (`role="group"`, `aria-label`), arrows move between cards (←/→ in time within a lane, ↑/↓ across lanes at the nearest time), Enter selects, Escape clears; a polite live region announces the focused card ("pesquisa, pix-na-minha-cidade, 13:38 a 13:46, 7 min 43 s").

### Ficha (`<Ficha>`)
Quadro panel with a 1.5px Divisória border, square, 24px padding (16 on phone). Header row: the card's stock as a 24 × 16px swatch with its code, the lane name (Overpass 800 1.25rem), the phase and the times (`13:38:29 – 13:46:12 · 7 min 43 s`). Then three groups:
- **Números:** tokens processados (with "dos quais 93,1% leitura de cache" beneath), turnos, caracteres escritos, erros. Right-aligned figures.
- **Ferramentas:** one line per tool in descending order: tool name in mono, then a tally drawn as 1.5px ink strokes in groups of five (four uprights and a diagonal, the shop-floor tally), then the number. Above 30 the tally stops and a 6px-tall ink bar scaled to the page's largest count takes its place, number after it. (The tally is the board's own notation for small counts; the bar keeps large counts legible.)
- **Resultado e arquivos:** the enumerated result as a sentence from `anotacoes.ts` ("Concluiu que a demo não era viável: sem licença para os dados.") and the files touched as a mono list of repo-relative paths (`labs/src/artifacts/pix-na-minha-cidade/DESIGN.md`), max 8 with "+ N" beyond.
Closing: an × button (authored SVG, 44px) and Escape. Empty state (nothing selected): "Toque num cartão para ver o que aquele agente fez." in Note type Muted, and the ficha shows the orchestration totals instead.

### Checkpoint list ("Onde a linha parou")
An ordered list, one row per checkpoint: `D1` in a Parada swatch, the wait in figure type, then each question as "**Onde**: Labs + ADR-0002" (header in Overpass 700, chosen option in Ink with the Parada underline, the unchosen options in Muted mono after "entre"). Right column: "A linha esperou **{soma}** no total; a maior parada foi de **22 min 19 s**." and "Em {k} de {n} perguntas Daniel escolheu a opção recomendada pelo orquestrador." (computed; a fact about the data, not a judgement).

### Livro de bordo
Three printed blocks on the wall, each a real `<table>` with a caption:
- **Chamadas de ferramenta:** tool, count, share; the tally/bar rule of the ficha, at page scale.
- **Tokens processados por fase:** phase (with swatch), total, a horizontal 12px bar in the phase stock whose cache-read part is overprinted with 1px ink hatch at 45° (4px pitch) and labelled in text ("leitura de cache 93%"). No stacked-colour-only encoding.
- **Tempo:** wall-clock duration vs. summed agent-time, and the ratio as "em média, {x} agentes trabalhando ao mesmo tempo quando a linha andava". Plus the longest run and the longest wait.
Notes under the tables: no output tokens (why), no dollar cost (why, with a link to `/demo/conta-de-tokens`).

### Como foi medido
Body prose in Overpass: where the data came from (the session files and git; named generically, never paths), the whitelist rule, what is never read, the final scan, that prose on the page is written by hand and reviewed, `asOf` and "o horário para aqui; o deploy desta página veio depois". Sources as a plain list.

### Buttons and links
- **Rever o encaixe:** Parede-raised face, 1.5px ink border, square, 44px, Overpass 700 0.9375rem, a drawn replay glyph. Hover: face Quadro. Pressed: translateY(1px). Hidden under reduced motion.
- **Links:** ink, 1px underline at 0.14em offset, 2px on hover. External and expedição links end in the drawn outbound arrow.
- **Focus-visible (everything):** `outline: 2px solid var(--ink); outline-offset: 2px`; on black stop cards `outline-color: var(--quadro)`. Never yellow.

## States

- **Default (SSR):** whole board, sentence, legend, run list, checkpoints, livro, method. Ficha shows totals. No layout shift when JS hydrates.
- **Before the encaixe / no JS / reduced motion:** the board is fully populated, static.
- **Encaixe running:** cards appear in time order; interaction is live throughout (a tap selects and finishes the sequence instantly).
- **Card selected / decision selected / commit selected:** as specified.
- **Wait in progress at `asOf`:** impossible in the final data; if a snapshot build has a pending question, its band ends at `asOf` with an open right edge (a zigzag cut) and the card says "sem resposta até {asOf}".
- **Run in progress at `asOf`** (snapshot builds): card ends at `asOf` with the same zigzag cut and "em andamento" in its ficha. The final build has none; a test asserts that.
- **Idle compression:** break pigeonhole (Layout).
- **Line replaced:** the caixa-preta lane's label flips to bastidores at checkpoint 3's pitch: in the SVG, a vertical 1.5px ink rule in that lane at the pitch with the new label "bastidores" in row-label type after it (≥ 64rem, inside the lane, left-aligned after the rule); < 64rem, a full-lane-width row label "→ bastidores" at that pitch.
- **Data missing for a run** (transcript compacted or deleted): the card is drawn with a dashed 1px ink outline and no fill, code plus "dados incompletos" in its ficha; never estimated.
- **Very long board** (> 120 pitches after compression): pitch min drops to 16px (≥ 64rem) and the clock labels thin to hourly.
- **Error:** extraction failures stop the build (BRIEF). At runtime, an error boundary falls back to the SSR board and run list with a Muted line "A parte interativa falhou; o quadro acima continua completo."
- **Hover (pointer only):** a card lifts 1px; a stop band's stripes darken 8%; lanes do not highlight. Nothing is revealed only on hover.

## Motion

The board's native motion is a card sliding into a slot. It happens once, as information about order, and never as decoration.

- **Encaixe (the signature):** when the board first enters the viewport (IntersectionObserver at 35% visible, once per session via `sessionStorage` in try/catch), all cards start hidden and are placed in start-time order. Each card slides in from 10px **behind the lip** (≥ 64rem: from `translateY(-10px)` clipped by its pigeonhole; < 64rem: from `translateX(-10px)`) with `clip-path: inset(0 0 100% 0) → inset(0)` over 180ms `cubic-bezier(0.16, 1, 0.3, 1)`; cards whose starts share a pitch go together, staggered 30ms by lane. Pitches advance every 45ms; the andon strip's count for each pitch updates as the cursor passes it. At a **stop**: the band wipes across all rows (`clip-path` from its leading edge) in 220ms, the decision card drops in 200ms later, and the sequence **holds for 500ms** before continuing: the line visibly waits. The whole sequence is capped at 3.2s (pitch interval shortens to fit); holds keep their 500ms.
- **Rever o encaixe:** replays the same sequence from an empty board.
- **Selection:** lift 140ms `cubic-bezier(0.2, 0.8, 0.2, 1)`; the ficha's contents cross-fade 120ms; on < 64rem the inline ficha opens with `clip-path: inset(0 0 100% 0) → inset(0)` 220ms.
- **Scroller snap** on half-hour ticks is the browser's.
- Nothing else moves. No scroll-linked animation, no parallax, no looping.

**Reduced motion:** no encaixe (the board is simply there), no lift translation (selection is the outline and the ficha), no clip-path reveals; the "Rever o encaixe" button is not rendered.

## Content and voice

pt-BR, direct, no hype, no adjectives about the process ("impressionante", "poderoso", "autônomo" are banned words on this page). Headings say what the section shows: "O quadro", "Onde a linha parou", "Livro de bordo", "Como foi medido". The page never says an agent "thought" or "decided"; agents "pesquisaram", "escreveram", "concluíram", "pararam". Only Daniel "decidiu". Lean vocabulary is used where it helps and explained once in the method ("parar a linha" is glossed in one sentence: "na produção enxuta, qualquer pessoa pode parar a linha quando algo precisa de decisão; aqui, as paradas são as perguntas que o orquestrador fez a Daniel"). "Demo conceitual" framing comes from the Labs banner; the page adds that the data is real and Daniel's own.

## Do's and Don'ts

### Do
- Keep the wall mid-tone concrete and the board the only large light surface.
- Keep andon yellow for the human only; black for stops only.
- Print the code on every card; label every stock in the key; never rely on colour alone.
- Draw every glyph (return hook, flags, tally, arrows, fork) as authored SVG in 1.5px ink strokes.
- Show exact minutes inside the pitched card (the time punch).
- Keep stop bands full-height across every row, including the ones only 28 seconds wide.
- Generate every figure and the answer sentence from `data.json`; write every sentence of prose by hand in `anotacoes.ts`.
- End every showcase row in a real link to what it shipped.

### Don't
- No dark theme, no neon, no terminal-replay look, no tokyo-night/dracula spans, no collapsible transcript blocks, no play/pause, no speed control, no scrubber.
- No lamps, LEDs, seven-segment digits, split-flaps, dials, or mounted-plastic highlights.
- No uppercase tracked micro-labels, no kicker or eyebrow, no section numbers.
- No Chivo, Sofia Sans, Fragment Mono, Atkinson Hyperlegible, B612, Archivo, Martian Mono, Inter or Geist.
- No pale grey-green, blue-steel, cream or warm gelo ground.
- No rounded KPI tiles, no big-number hero, no donut, no bento, no gradients on data, no glass.
- No coloured `border-left` on anything; the ficha, list rows and notes carry no accent edge.
- No dollar figures, no output-token figures, no transcript text, no absolute paths, no ids.
- Never state a quality result for the showcases beyond linking to them.
