---
name: Conta de tokens
description: Token prices read as an exchange quote board — a blue-steel sheet crossed by one near-black board band where two white split-flap quotes sit side by side, one highlighter mark for the reader's own model, and a cache fader that reprices every row.
colors:
  ground: "#C7CFD8"
  ground-raised: "#D6DDE4"
  ground-sunk: "#B6C0CB"
  rule: "#A9B4C0"
  rule-strong: "#6C7888"
  ink: "#0D1826"
  ink-2: "#2E3A48"
  muted: "#3D4959"
  housing: "#15171A"
  housing-raised: "#1D2024"
  housing-rule: "#2C3036"
  housing-label: "#9AA3AE"
  housing-label-strong: "#D6DDE4"
  flap-face: "#F2F1EC"
  flap-lower: "#E6E5DF"
  flap-hinge: "rgb(0 0 0 / 0.22)"
  flap-blank: "#CFCEC8"
  flap-glyph: "#0D1826"
  marca: "#D4F23A"
  marca-deep: "#3F5200"
  band-1: "#A3AEBA"
  band-2: "#7E8A98"
  band-3: "#BAC3CD"
  band-4: "#677384"
  band-5: "#AEB8C3"
  band-6: "#7F8B99"
  band-outros: "#9AA3AE"
  frozen: "#5B6776"
typography:
  answer:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 0.9rem + 1.95vw, 2.5rem)"
    fontWeight: 500
    lineHeight: "1.28 → 1.14"
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Chivo, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.012em"
  signage:
    fontFamily: "Chivo, sans-serif"
    fontSize: "0.6875rem (0.75rem at 64rem+)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
    textTransform: uppercase
  body:
    fontFamily: "Chivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  flap-lg:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "2.5rem (390px) → 4.5rem (1440px)"
    fontWeight: 600
    lineHeight: 1
  flap-sm:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "1rem (1.1875rem at 64rem+)"
    fontWeight: 500
    lineHeight: 1
  data:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0"
  flap: "2px"
spacing:
  unit: "4px"
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "72px"
  gutter-mobile: "16px"
  margin-wide: "64px"
  column-gap: "24px"
  sheet-max: "1360px"
  measure: "40rem"
  answer-measure: "60ch"
components:
  headrail:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground-raised}"
    height: "40px (48px at 64rem+)"
  board-band:
    backgroundColor: "{colors.housing}"
    width: "full bleed"
  quote-plate:
    backgroundColor: "{colors.housing-raised}"
    textColor: "{colors.housing-label-strong}"
    rounded: "{rounded.none}"
  quote-plate-reference:
    borderLeft: "6px solid {colors.marca}"
  flap-cell:
    backgroundColor: "{colors.flap-face}"
    textColor: "{colors.flap-glyph}"
    rounded: "{rounded.flap}"
  fader-cap:
    backgroundColor: "{colors.ink}"
    width: "28px"
    height: "44px"
  fader-compact:
    height: "44px"
  board-row-reference:
    backgroundColor: "{colors.marca}"
    textColor: "{colors.ink}"
  stamp-ilustrativo:
    borderColor: "{colors.ink}"
    textColor: "{colors.ink}"
---

# Design System: Conta de tokens

Scope: this showcase only (`/demo/conta-de-tokens`). Nothing here binds other artifacts. Tokens live as custom properties on the artifact root class (`.sheet` in `conta.module.css`), not on `:root`, because the Labs `globals.css` owns `:root` and `body`.

## Direction contract

Ship this as the first child of the artifact's root element (an HTML comment rendered with `dangerouslySetInnerHTML` on a hidden `<div hidden>`), and grep the production build for `dee86e75`:

```
THESIS: Tokens are a commodity with a price per million; the page is the exchange quote board that reprices them for your volume. It refuses the SaaS cost dashboard (dark cards, KPI tiles, donut) and the broadsheet price table.
OWN-WORLD: Blue-steel sheet (#C7CFD8, ink #0D1826) crossed by one full-bleed near-black board band (#15171A) where white split-flap quotes hang side by side on a black hinge; Chivo in sentences and tracked caps signage, Chivo Mono for every figure; one chartreuse highlighter (#D4F23A) that only ever means "your reference model", never as text on black.
STORY: The reader sees their bill on a frontier model beside the bill on the model the market uses most, learns the view is OpenRouter's, moves the cache fader, and watches which cells flip and which rows stay frozen.
FIRST VIEWPORT: headrail; kicker; answer sentence full width; the black board band with the two quotes; the cache fader directly under the band.
FORM: exchange quote board, horizontal, candidate 3 of 7; seed dee86e75.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

## Overview

**Creative North Star: "O painel de cotações"**

LLM tokens are quoted per million like a commodity, and the market's weekly volume is public. So the page is that market's quote board: a physical, mechanical board where every figure is a white split-flap cell. The board itself is a full-bleed near-black band across a light blue-steel sheet, the way an exchange board hangs across a hall wall. The reader's scenario is the one line an analyst would highlight with a marker. Moving the cache fader reprices the board: only the cells whose glyph changes flip, rows re-sort, and the models with no cache price do not flip at all.

Why this world and not the others in the set:
- **raio-de-explosao** is a pale grey-green paper inspector (`#EDEFEA`, ink `#16181A`, one magenta, Sofia Sans Extra Condensed caps, sentence column left with sticky instrument right). This page leaves that whole family: blue-steel ground, navy ink `#0D1826`, no condensed face, and a horizontal composition with no sentence-left/instrument-right split in the first viewport.
- **pix-na-minha-cidade** is a consumer app on a pale green wall (`#DDE3D8`) set in Archivo; this page uses neither the colour family nor the faces.
- **curtailment-br** is a map console with a sticky bottom play/scrubber dock and mounted-plastic plates with a white inset highlight. This page has no sticky range bar anywhere and no laminate highlight: depth lives only in the flap cells.
- **caixa-preta** is a replay timeline.

The one structural move none of the others make: a **light / dark / light rhythm** down the page, where the dark band is the board and carries the only split-flap figures of the first viewport.

It rejects: dark "cost observability" dashboards with neon charts; neon-on-black accents; rounded KPI cards and donuts; cream-paper broadsheet tables with italic serif display; provider logos or brand colours.

**Key characteristics**
- Cool blue-steel light sheet, never cream, never white, never grey-green.
- One full-bleed near-black board band in the first viewport; everything else sits on the light sheet.
- Every compared figure is set in Chivo Mono (flap cells or data face), including the numbers inside the answer sentence. Prose never enters a flap.
- Signage is Chivo 700 caps at normal width with 0.1em tracking. No condensed face anywhere.
- Exactly one colour: chartreuse highlighter, only for the reference model, and only on light surfaces. On the black band it appears as a 6px left edge, never as text or glyph colour.
- Square geometry; the only radius is 2px on flap cells.
- Stepped (weekly) chart lines, never smoothed curves.

**Physical scene (decides light/dark):** a tech lead at a desk in daylight with the provider's usage dashboard open in another tab, or on a phone in a meeting room after finance asked about the bill. Light is the default. A night variant exists for `prefers-color-scheme: dark` because portfolio visitors often browse in dark mode; it is the same hall with the lights dimmed, and the board band stays the darkest thing on the page.

## Colors

Strategy: **Restrained**, blue-steel and navy ink plus one accent that carries meaning, with one dark band as structure.

### Sheet (light surfaces)
- **Ground** `#C7CFD8`: the artifact's full-bleed ground (root wrapper `min-height: 100dvh` paints it; `body` stays Labs paper outside).
- **Ground raised** `#D6DDE4`: scenario drawer, chart readout, row detail, notes block, hover row.
- **Ground sunk** `#B6C0CB`: fader track, board column-header row, the "gratuitos" group.
- No texture, no noise, no gradient on the sheet. The contrast with the band is the only surface drama.

### Ink
- **Ink** `#0D1826` (11.3:1 on Ground): text, headrail, fader cap, leader band in the chart, stamp border.
- **Ink 2** `#2E3A48` (7.3:1): secondary prose.
- **Muted** `#3D4959` (5.8:1 on Ground, 5.0:1 on Ground sunk): captions, column headers, units, "sem preço de cache". Do not go lighter for text.
- **Rule** `#A9B4C0` for row dividers; **Rule strong** `#6C7888` for section rules and tick marks.

### Board band (dark surface)
- **Housing** `#15171A`: the full-bleed band behind the two quote plates. It spans the viewport edge to edge on every width; its content aligns to the sheet grid.
- **Housing raised** `#1D2024`: each quote plate's field, flat, with a 1px **Housing rule** `#2C3036` border. No shadow, no inset highlight.
- **Housing label** `#9AA3AE` (7.0:1 on Housing): plate labels, unit text, band caption. **Housing label strong** `#D6DDE4` for the model name inside the label.
- Nothing chartreuse is ever text or glyph colour on the band.

### Flaps
- **Flap face** `#F2F1EC` (upper half) and **Flap lower** `#E6E5DF` (lower half), split by a 1px **Flap hinge** seam, black at 22%, at 50% height (none on blank cells). Glyph **Flap glyph** `#0D1826` (15.9:1 on face).
- Cell depth, the only depth on the page: `box-shadow: 0 1px 0 rgb(0 0 0 / 0.55), inset 0 -1px 0 rgb(0 0 0 / 0.08)` on the band; on the light sheet (board rows) `0 1px 0 rgb(13 24 38 / 0.28), inset 0 -1px 0 rgb(0 0 0 / 0.06)`.
- **Flap blank** `#CFCEC8`: padding cells (no glyph) so figures keep a fixed width.

### The one accent
- **Marca** `#D4F23A` (chartreuse highlighter): the reference model only. On light surfaces it is a highlighter under ink text (answer sentence figure, board reference row, the reference band in the chart and its legend line). On the black band it is only the 6px left edge of Plate A. It is never a text colour, never a hover state, never a glow.
- **Marca deep** `#3F5200` (5.5:1 on Ground): the only way the accent appears as a line on the sheet (reference band outline in the chart, the reference row's left edge in night).
- The fader cap's 2px centre line is Marca on the Ink cap: a line on a control, not text.

### Chart bands (no brand colours)
Top 8 providers + outros, stacked bottom-up by last-week share. The leader gets **Ink**. The reference model's provider gets **Marca** with a 1px Marca-deep outline (if the reference provider is also the leader, it gets Marca and the next one gets Ink). The rest take `band-1…band-6` in stacking order, alternating light/dark so neighbours differ by ≥ 1.5:1; bands 5 and 6 add a 45° hairline hatch (1px ink at 14% opacity every 5px) so no two adjacent bands depend on tone alone. **Outros** is `band-outros` with a −45° hatch (1px ink at 25% every 5px, against the direction of bands 5 and 6), and the plot draws a 1px Rule-strong edge at 100%. Every band is labelled in text, so colour is never the only carrier.

### Frozen
- **Frozen** `#5B6776` (3.7:1 on Ground, a non-text graphic): the lock glyph on rows that do not respond to the fader. The accompanying text uses Muted.

### Night variant (`@media (prefers-color-scheme: dark)` on `.sheet`)
| token | night |
|---|---|
| ground / raised / sunk | `#161E2A` / `#1C2633` / `#111823` |
| rule / rule-strong | `#2E3A48` / `#56637A` |
| ink (text) | `#E9EDF1` |
| ink-2 | `#BAC3CD` |
| muted | `#97A3B1` |
| housing / housing-raised / housing-rule | `#0A0B0D` / `#121417` / `#23272D` |
| flap face / lower / hinge / glyph | unchanged `#F2F1EC` / `#E6E5DF` / `#000` / `#0D1826` (the board is lit) |
| flap-blank | `#BDBCB6` |
| headrail bg / text | `#0A1019` / `#E9EDF1` |
| leader band | `#E9EDF1` |
| bands 1–6 | `#3A4757 #5A687A #2F3B4A #6E7C8F #46546A #56647A` |
| band-outros | `#4B586A` |
| marca / marca-deep | `#D4F23A` unchanged (text on it stays `#0D1826`) / `#B6D12A` for outlines |

The rhythm holds in night: the band (`#0A0B0D`) is still the darkest surface, and its flaps are still the brightest. The fader cap becomes `#E9EDF1` with the chartreuse centre line.

## Typography

Load with `next/font/google` in the artifact component file (not the root layout):

```ts
import { Chivo, Chivo_Mono } from 'next/font/google';
const chivo = Chivo({ subsets: ['latin'], variable: '--font-sign', display: 'swap' });
const chivoMono = Chivo_Mono({ subsets: ['latin'], variable: '--font-flap', display: 'swap' });
```

Both are variable on weight only (100–900). There is no width axis and none is simulated (`font-stretch` is never set). Chivo Mono is monospaced, so flap cells and data columns align without `tnum`.

**Character:** Chivo is a grotesque with some weight and bluntness; in sentences it reads plain and sturdy, and at 700 in tracked caps it becomes the board's column signage without narrowing. Chivo Mono is the quote-board glyph: open, squarish figures that hold up at 72px on a flap and at 13px in a price column.

### Hierarchy
- **Answer** (h1): Chivo 500, `clamp(1.375rem, 0.9rem + 1.95vw, 2.5rem)`, leading 1.28 at 390px → 1.14 at 1440px, tracking -0.015em, `text-wrap: balance`, `max-width: 60ch`. At 1440 it runs across all 12 columns in three lines (two when the names are short). **Figures inside it are Chivo Mono 600 at 0.92em** (a `<span class="fig">`) so the tabular rule holds even in prose. The reference model's bill gets the highlighter: `background: linear-gradient(transparent 10%, var(--marca) 10% 90%, transparent 90%); padding: 0 0.14em; box-decoration-break: clone`. The leader's bill gets a 3px ink underline at `text-underline-offset: 0.16em`. Shares are Chivo Mono 600 without decoration.
- **Headline** (h2): Chivo 700, sentence case, `clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem)`, leading 1.08, tracking -0.012em. Sentence case keeps headings out of the signage register.
- **Signage**: Chivo 700 caps, 0.6875rem (0.75rem ≥ 64rem), tracking 0.1em, leading 1.2. Column headers, plate labels, kicker, headrail, button text, stamp, chart direct labels.
- **Body**: Chivo 400, 1rem/1.55, max `40rem`. Notes 0.9375rem/1.55 in Ink 2.
- **Flap large**: Chivo Mono 600, `clamp(2.5rem, 1.8rem + 2.9vw, 4.5rem)`. Cell: width `0.82em`, height `round(up, 1.32em, 4px)`, gap `0.08em`, glyph centred.
- **Flap small**: Chivo Mono 500, 1rem (1.1875rem ≥ 64rem). Same cell proportions.
- **Data**: Chivo Mono 400, 0.8125rem/1.4: prices per million, shares, axis labels, readouts, sources.

**Tabular rule.** Every compared figure is set in Chivo Mono: in a flap cell, in data face, or as a `.fig` span inside the answer sentence. Chivo carries numbers only in non-compared prose (dates in notes, "95% é o teto").

**Number format.** pt-BR everywhere: `US$ 2.880`, `US$ 0,075`, `24,6%`, `1 bi`, `100 mi`, `10 bi`. Bills rounded to whole dollars; below US$ 10 one decimal (`US$ 6,7`); `:free` shows `0`. Dates as `24 set 2026`.

## Layout

Mobile-first. One breakpoint that matters, `min-width: 64rem` (1024px), plus a width cap.

- **< 64rem:** single column, 16px side gutters, sections separated by 48px, h2 48px above and 16px below.
- **≥ 64rem:** 12-column grid inside `max-width: 1360px`, 64px outer margin (32px between 64rem and 80rem), 24px column gap. Sections separated by 72px.
- The board band breaks out of the grid to full bleed (`margin-inline: calc(50% - 50vw)` on a wrapper, `overflow-x: clip` on the root to avoid scrollbar-width scroll) and re-applies the grid inside.
- 4px baseline unit; flap cell heights round up to 4px multiples (52px at 390, 96px at 1440 for large cells).
- No horizontal page scroll at 320px. Board rows at 320px drop the price trio to a third line.
- Touch targets ≥ 44px: fader caps (both), presets, stepper, rows, chart scrub area, "Ver todos", plates.
- **No fixed element and no sticky control anywhere.** The headrail scrolls away; there is no fader dock. The only sticky rule is the market chart on ≥ 64rem (see below).

### First viewport at 390 × 844 (≈ 760px visible)
Top to bottom, 16px gutters:
1. **Labs banner** (global, ~56px).
2. **Headrail** (40px, full bleed, Ink): "CONTA DE TOKENS" signage in Ground raised left; "dados 24 set 2026" in data face right.
3. 20px. **Kicker** (signage, Muted): "Cenário ilustrativo · preços e participação do OpenRouter (só o tráfego que passa por ele)". Two lines at most.
4. 8px. **Answer** (h1, 22px, ~5 lines, ~145px): "Com **50%** de cache, 1 bilhão de tokens por mês custa **US$ 2.880** no Claude Sonnet 5 e **US$ 91** no DeepSeek V4.1 Flash — e a DeepSeek ficou com **24,6%** dos tokens do OpenRouter na última semana; a Anthropic, com **2,8%**." (generated from data; figures in Chivo Mono.)
5. 20px. **Board band** (full bleed, Housing, 16px padding top and bottom): the two **quote plates** stacked 8px apart, full content width (358px), each 96px tall:
   - Plate A (reference, 6px Marca left edge): signage label in Housing label "SEU MODELO DE REFERÊNCIA · " + model name in Housing label strong "CLAUDE SONNET 5"; below, flap-large row: static "US$" in signage (Housing label) baseline-aligned to the flaps' bottom, 6 cells (`_2.880`), then "/mês" in data face Housing label.
   - Plate B (leader, 6px `#4A5058` left edge, a neutral steel, not an accent): "MAIS USADO NA SEMANA · DEEPSEEK V4.1 FLASH", flaps `____91`, and at the right a small Flap-face tag with ink signage "32× MENOS" (live ratio; below 2× one decimal: "1,4× MENOS").
   Band height ≈ 232px.
6. 16px. **Cache fader** on the light sheet (≈ 92px): signage "CACHE DE ENTRADA" left, flap-small readout `50%` right; the track below with tick labels `0 · 25 · 50 · 75 · 95`.
7. The remainder shows the scenario stamp's top edge, signalling the scroll.

The kicker already says "cenário ilustrativo" in the first viewport; the stamp repeats it just below the fold.

### First viewport at 1440 × 900 (≈ 820px visible), the horizontal board
Grid 12 cols, content width 1312px. Nothing in the first viewport is split into a text column and an instrument column.
1. **Banner** (~38px). **Headrail** 48px full bleed; middle item in data face on Ink: "Preços: catálogo OpenRouter · Participação: OpenRouter rankings" linking to `#fontes`.
2. 40px. **Kicker** (signage, Muted), cols 1–12.
3. 12px. **Answer** across cols 1–12 at 40px/1.14, `max-width: 60ch`, three lines (~140px).
4. 32px. **Board band**, full bleed, Housing, 32px padding top and bottom. Inside, on the grid: Plate A in cols 1–6, Plate B in cols 7–12 (each ~644px wide, 152px tall). Flap-large at 72px (cells ≈ 59 × 96px). Each plate: label row on top (signage), then the flap row with "US$" left and "/mês" after the cells; Plate B's "32× MENOS" tag right-aligned in its plate. A 1px Housing rule divides the two plates vertically in the 24px gutter, so the pair reads as one board with two slots. Band height ≈ 216px.
5. 24px. **Cache fader** across cols 1–12 on the sheet: label and flap-small readout in a 200px block on the left, track across the remaining ~1090px with ticks every 5% and labels at 0/25/50/75/95. Scenario stamp right-aligned on the line below the track.
6. The fold lands around the stamp at 900px tall; on taller screens the Market/Board section heads enter.

### Below the first viewport
- **< 64rem:** Scenario stamp and drawer, Board section (header row with h2 and the compact fader, column header, rows, "Ver todos"), Market section (h2, chart, legend, readout, attribution, tokenizer warning), Notes, Sources, footer.
- **≥ 64rem:** Market chart in cols 1–5 (`position: sticky; top: 24px` only within its own section, since it is taller content beside a long table; it is not a control) and Board in cols 6–12 with its header row (h2 + compact fader) spanning cols 6–12. Then Notes in cols 1–7 and Sources in cols 8–12. Footer.

The chart's `sticky` is the one sticky rule on the page: scoped to the Market/Board section, below the first viewport, holding a chart rather than a control.

## Elevation & depth

Mechanical, not glassy. No blur, no glow, no gradients other than the flap halves.
- **Only flap cells get depth** (see Flaps).
- Quote plates: flat Housing raised with a 1px Housing rule. No shadow, no inset highlight, no laminate.
- Fader cap: `0 2px 0 rgb(0 0 0 / 0.35)`; pressed `none` and `translateY(1px)`.
- The board band has no shadow onto the sheet; the edge is a hard cut.

## Components

### Headrail
Full-bleed Ink strip. Left: artifact name in signage. Right: data date. Middle (≥ 64rem): sources shortcut. Not sticky.

### Flap cell (`<FlapFigure value="2.880" width={6} size="lg|sm" surface="band|sheet" />`)
- One cell per character, left-padded with blank cells to `width`. Characters: digits, `.`, `,`, `%`, `—`, blank. Separators `.`/`,` get a narrow cell (0.42em).
- Each cell: two stacked halves (Flap face over Flap lower) with the black hinge line; the glyph is drawn once in a centred span and clipped per half (`clip-path: inset(0 0 50% 0)` / `inset(50% 0 0 0)`) so halves animate independently.
- `surface` only switches the cell shadow (band vs sheet).
- Accessibility: cells are `aria-hidden="true"`; a visually hidden span carries the formatted value ("US$ 2.880 por mês"). No live region per figure.

### Quote plate
Housing raised field, 1px Housing rule, square, on the board band. Left edge 6px: Marca (reference) or `#4A5058` (leader). Label in signage (Housing label + Housing label strong for the model name), figure in flap-large, unit in data face. The whole plate is a button: it scrolls to that model's board row and gives the row a 600ms 2px ink outline pulse (none under reduced motion). Hover (pointer): the border goes to `#4A5058`. Focus-visible on the band: `outline: 2px solid #F2F1EC; outline-offset: 2px` (never chartreuse on black).

### Cache fader (`<Fader variant="full|compact">`)
Native `<input type="range" min=0 max=95 step=1>` restyled. Two instances share one state.
- **Full** (under the band): track 8px tall, Ground sunk, 1px Rule-strong inset border, filled part Ink. Ticks under the track as SVG: 1px × 6px Rule-strong every 5%, 1px × 10px Ink at 0/25/50/75/95 with data-face labels. Cap 28 × 44px Ink, 2px radius, 2px × 20px Marca centre line. Readout flap-small `50%` (3 cells). `aria-label="Parte da entrada servida do cache"`.
- **Compact** (in the Board section header row): same input and cap, no tick labels (ticks at 25% steps only), track width fills the header row's free space (min 160px), readout in data face `50%` in a fixed 4ch box. On < 64rem the header row is two lines: h2 "Sua fatura em cada modelo" on the first, "CACHE" signage + compact track + readout on the second, 44px tall. On ≥ 64rem it is one line: h2 left, compact fader right in cols 9–12. `aria-label="Cache de entrada, na tabela"`. It is not sticky.
- Both: keyboard arrows ±1, PageUp/PageDown ±10, Home 0, End 95; `aria-valuetext="50 por cento da entrada vinda do cache"`. Focus-visible on the cap: `outline: 2px solid var(--marca); box-shadow: 0 0 0 4px var(--ink)` (Marca here sits on the light sheet, framed by ink).
- **Detents:** no snapping; at 0/25/50/75/95 the matching tick turns Ink 3px wide for 240ms. None under reduced motion.
- **At 95%:** a Muted note under the full fader: "95% é o teto: mesmo com cache, parte da entrada é sempre nova." (160ms opacity).

### Scenario stamp and drawer
- Stamp: 1.5px dashed Ink border, signage: "CENÁRIO ILUSTRATIVO · 1 BI TOKENS/MÊS · 20% SAÍDA · REF. CLAUDE SONNET 5", right-aligned text button "Alterar" (signage, underline). It is a `<details>`'s `<summary>`, closed by default.
- Drawer (Ground raised, 16px padding):
  - **Tokens por mês:** three flap-small keys `100 mi` `1 bi` `10 bi` (radio group; selected = Ink face with Ground raised glyph; others Flap face). 44px tall.
  - **Saída:** stepper `−` `20%` `+`, 5% steps, 5–60%. Buttons 44 × 44px, square, 1px Ink border.
  - **Modelo de referência:** native `<select>` styled flat (1px Ink border, 44px), options grouped by provider. Changing it regenerates the sentence, Plate A, the highlighted row and chart band.
  - Muted line: "Nada do que você escolhe aqui sai do navegador."
- Scenario in the URL (`?t=1b&s=20&ref=anthropic/claude-sonnet-5&c=50`) via `history.replaceState`; the server renders from these params when present.

### Board (`<Board>`) — "Sua fatura em cada modelo"
A real `<table>` with a visually hidden caption "Fatura mensal estimada por modelo para o cenário escolhido", on the light sheet.
- **Section header row:** h2 + compact fader (see Fader).
- **Column header row:** Ground sunk, signage Muted: `MODELO` · `PART. SEMANA` · `US$/MILHÃO ENTRADA · CACHE · SAÍDA` · `FATURA/MÊS`.
- **Rows (≥ 64rem):** 56px, 1px Rule divider. Model name Chivo 600 0.9375rem with provider in data face Muted below; share: 64px Ground sunk track with Ink fill plus value in data face (`12,6%`; `<0,1%`; `—` when not ranked); prices in data face `0,075 · 0,0015 · 0,30`; bill in flap-small cells (sheet surface), right-aligned, width fixed to the widest bill in the scenario (max 7 cells).
- **Rows (< 64rem):** two lines, 64px min. Line 1: name left, bill flaps right. Line 2 data face Muted: provider · share. Line 3: the three prices, each with its label (`ENT 0,075  CACHE 0,0015  SAÍDA 0,3`), rounded to two significant digits; a pair never breaks, the line wraps between pairs.
- **Order:** ascending by bill, re-sorted live. Paid models only; `:free` in a separate group.
- **Default rows:** top 12 by weekly volume plus the brief's reference models and the chosen reference, deduplicated (~16). Full-width button "Ver todos os N modelos" (signage, 48px, 1px Ink border) reveals all (~60) with a 240ms clip-path from top.
- **Reference row:** Marca background across the row, ink text (light surface, so the highlighter is legal here, and in night too since the row text stays `#0D1826`). Never pinned; it keeps its sort position.
- **Leader row:** 4px Ink left edge.
- **Frozen row** (no `input_cache_read`): 12 × 14px lock glyph (1.5px strokes) in Frozen before the bill; cache slot shows `—`; < 64rem line 2 ends with "sem preço de cache" in Muted. Its bill flaps never flip when the fader moves (they do change with tokens/mês or saída).
- **Row tap / Enter:** inline detail (Ground raised, data face): "Entrada sem cache: US$ X · Entrada do cache: US$ Y · Saída: US$ Z" and "Preço: catálogo OpenRouter, 25 set 2026". One open at a time; `aria-expanded` on the name `<button>`.

### Market chart (`<MarketChart>`) — "Onde o mercado gasta"
Hand-written SVG, no chart library, on the light sheet.
- **Form:** 100% stacked stepped area, 26 weekly columns (2026-03-30 … 2026-09-24), flat steps, 1px Ground gap between bands.
- **Size:** < 64rem full width × 260px + 24px x-axis. ≥ 64rem cols 1–5 (~530px) × 420px, 120px reserved right for direct labels.
- **Axes:** month labels in data face Muted (`abr mai jun jul ago set`); y at 0/50/100% as 1px Rule gridlines.
- **Labels:** ≥ 64rem direct labels at the right edge (signage name + data-face share, `DEEPSEEK 24,6%`), 14px minimum spacing with 1px leaders. < 64rem legend list under the chart in stack order: 12 × 12 swatch (with hatch), signage name, data-face share; the reference provider's line has a Marca background.
- **Scrub:** pointer/touch places a 1px Ink rule on the nearest week; readout (Ground raised, 1px Rule) shows "Semana de 18 a 24 set" and each provider's share. < 64rem the legend becomes the readout in place; ≥ 64rem it floats beside the rule, flipping side past the midpoint. Default = last week. Keyboard: plot `tabindex="0"`, `role="group"` with `aria-label`; arrows move week by week and update a polite live region.
- **Attribution (verbatim, data face Muted):** `Source: OpenRouter (openrouter.ai/rankings), as of {as_of}.` Then the tokenizer warning in body 0.875rem Ink 2: "Tokens de fornecedores diferentes não são diretamente comparáveis: cada um conta com seu próprio tokenizador (aviso da própria fonte)." Then "Só aparece o tráfego que passa pelo OpenRouter; quem chama a Anthropic ou a OpenAI direto não entra." Then the `:free` line (8,0% da semana veio de variantes gratuitas).

### Notes — "Como a conta é feita"
`<details open>` ≥ 64rem, closed < 64rem. Chivo 0.9375rem: the formula as a sentence, then as a Chivo Mono line `fatura = entrada × (1 − cache) × preço_entrada + entrada × cache × preço_cache + saída × preço_saída`; what is out (cache write, long-context overrides, `:batch`); where each number comes from, with dates; that the sentence is generated from the data at build; and "os números do cenário são ilustrativos" (third "cenário ilustrativo" mention). Summary in signage with trailing ` +` / ` −`.

### Sources (`#fontes`) and footer
Plain list in data face: catalog URL + fetch date, rankings endpoint + `as_of` + CC BY 4.0. Footer: "Demo conceitual de Daniel Bernardino." with a link to the portfolio.

### Footnote markers
Each first-viewport figure carries a superscript data-face marker (`¹` prices, `²` share) linking to `#fontes`, 24 × 24px hit area. On the band, markers are Housing label.

## States

- **Default (SSR):** scenario from URL or default (1 bi, 20% saída, 50% cache, ref. Sonnet 5). Sentence, plates, board and chart all SSR; flaps render as final static glyphs. `<noscript>` under the full fader in Muted: "Sem JavaScript, a página mostra o caso padrão."
- **Loading:** no runtime fetch. Font swap only; flaps live in fixed-size cells with `ui-monospace` fallback, so nothing shifts. No skeletons, no spinners.
- **First-visit settle:** once per session (sessionStorage in try/catch), the two plates' flaps settle from blank to value. Board rows do not.
- **Cache 0%:** readout `0%`; the sentence reads "Sem cache, …"; filled track empty.
- **Cache 95%:** note under the full fader (see Fader).
- **Reference model frozen:** Plate A shows the lock glyph (Housing label strong) and the line "Este modelo não tem preço de cache no catálogo: o cache não muda esta fatura." replaces its unit line; the sentence says "Sem preço de cache no catálogo, …".
- **Free models:** group under signage subhead "GRATUITOS NO OPENROUTER, COM LIMITES" on Ground sunk; bills `0` and "gratuito, com limites" in Muted. Never sorted, never "mais barato", never Plate B (if a `:free` variant leads, Plate B shows the paid model with the largest share).
- **Stealth:** "Modelo não identificado", provider "stealth", prices and bill `—`; excluded from Plate B.
- **Ranked but missing from catalog:** `—` in prices and bill, "fora do catálogo de preços", sorted to the end.
- **Tiny shares:** providers below top 8 fold into outros; model shares < 0,1% show `<0,1%`; absent weeks are 0 height (no interpolation) and the readout shows `—`.
- **Empty chart data** (< 2 weeks): Ground raised plate with signage "SÉRIE INDISPONÍVEL" and one body line; the board still works.
- **Error:** data problems fail the build (fetch script validates schema; < 80% join coverage refuses to write). At runtime an error boundary falls back to the SSR table and sentence with a Muted line "A parte interativa falhou; os números acima são do caso padrão."
- **Hover (pointer only):** board rows get Ground raised (reference stays Marca); plates get the `#4A5058` border. Nothing is revealed only on hover.
- **Focus-visible:** on the sheet `outline: 2px solid var(--ink); outline-offset: 2px`; on the band and the headrail `outline-color: #F2F1EC`; fader caps as in Fader.
- **Pressed:** keys and buttons translate 1px down and lose their shadow.

## Motion

The board's native motion is the flap. It is for figures only, as information (this number changed), never decoration.

- **Flip (value change), the signature:** only cells whose glyph changes flip; unchanged cells in the same figure stay still, and frozen rows never flip on a cache change. For a changing cell: the old glyph's upper half rotates `rotateX(0 → -90deg)` around its bottom edge (`transform-origin: 50% 100%`) in 70ms `cubic-bezier(0.55, 0, 1, 0.45)`; then the new glyph's lower half rotates `rotateX(90deg → 0)` around its top edge in 90ms `cubic-bezier(0.2, 0.9, 0.3, 1.2)` (the slap). New upper and old lower halves are static underneath. 160ms per cell, `perspective: 300px`, changed cells staggered 22ms left to right.
- **Interruptibility:** a new value while flipping `finish()`es in-flight animations and starts from the end state (no queue). During a drag, figures update at most once per frame; on consecutive-frame changes the flip shortens to 40ms + 50ms. Web Animations API (`element.animate`), no library.
- **Settle (first visit, plates only):** each cell passes through 3 random digits then the final glyph, 160ms per step, cells staggered 40ms. ≤ 900ms. Once per session.
- **Row reorder:** FLIP. While either fader is moving, reorder waits for 140ms without input, then rows translate to their new positions in 320ms `cubic-bezier(0.2, 0.8, 0.2, 1)`. Rows moving up render above rows moving down. Heights never animate.
- **Detent tick:** 240ms (linear).
- **Chart scrub:** no tweening; weekly data is discrete.
- **Expand (row detail, "Ver todos", notes, drawer):** `clip-path: inset(0 0 100% 0) → inset(0)` 240ms `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Nothing animates on scroll. Nothing enters or leaves the viewport on its own (there is no dock).

**Reduced motion:** flips, settle, reorder translation, detent tick and expand clip are removed; values and order change instantly. A changed flap figure gets a 1px underline for 600ms (Ink on the sheet, Flap face on the band). The chart is unaffected.

## Content and voice

pt-BR, direct, no hype, no exclamation marks. Headings say what the section shows ("Sua fatura em cada modelo", "Onde o mercado gasta", "Como a conta é feita"). "Cenário ilustrativo" appears at least three times (kicker, stamp, notes). Provider and model names are data, in the same type as everything else, never with logos or brand colours.

## Do's and Don'ts

### Do
- Keep every compared figure in Chivo Mono (flaps, data face, or `.fig` in the sentence) at a fixed width for the current scenario.
- Keep the board band full bleed and dark in both themes; keep everything else on the light sheet.
- Use Marca only for the reference model and the fader cap's centre line; on the band only as Plate A's 6px edge.
- Flip only the cells that change.
- Label every chart band in text; keep bands stepped.
- Put the OpenRouter-only caveat in the first viewport (kicker) and again under the chart; keep the attribution verbatim with `as_of`.

### Don't
- No chartreuse text or glyphs on the black band; no neon on dark anywhere.
- No sticky or fixed range bar, no dock, no fixed bottom UI.
- No condensed or width-axis type; no Archivo, Martian Mono or Sofia Sans.
- No inset-white laminate highlight on plates; depth only in flap cells.
- No sentence-left / sticky-instrument-right first viewport.
- No rounded cards, donuts, KPI tiles, gradients on data, glow or glass.
- No provider logos or brand colours, no OpenRouter styling.
- No cream/paper ground, no grey-green ground, no italic serif display.
- No smooth curves or interpolation on weekly data; nothing animates on scroll.
- Never state any saving, user or result as achieved by anyone; the scenario is always illustrative.

## Desvios na implementação

Registrados na construção (2026-09-26); o resto segue o documento acima.

- **Participação lida do espelho público, não da API oficial.** Não havia `OPENROUTER_API_KEY` no ambiente nem no `.env` do checkout principal. O `data.json` foi gerado das respostas cruas do `rankings-daily` guardadas em IAPS-AI/OpenRouter-OS-Rankings (mesmo `as_of` da fonte, 2026-09-25T12:06:35Z). A citação do OpenRouter continua literal, e a seção Fontes diz que os bytes vieram do espelho (`sources.rankings.via = "mirror"`). Com a chave presente, `node --no-warnings labs/scripts/conta-de-tokens.ts` busca direto no endpoint oficial e a nota do espelho some sozinha.
- **Script em `labs/scripts/conta-de-tokens.ts`**, não em `scripts/fetch.ts`, seguindo o padrão do Labs (`labs/scripts/<slug>.ts`). A transformação pura fica em `build.ts`, com testes.
- **Semanas de sete dias terminando no último dia completo** (a primeira é 27 mar a 2 abr 2026), não semanas de calendário a partir de 30 mar. O script pede `period=day` e soma, para que a última semana seja sempre completa e termine na data do dado.
- **"Como a conta é feita" fica aberto em todas as larguras.** O servidor não sabe a largura da tela, e abrir no cliente faria o texto pular; aberto também mantém a terceira menção a "cenário ilustrativo" à vista.
- **Flaps pequenos (tabela e leitura do fader):** a dobradiça fica em preto a 30% e some nas células em branco; as células em branco sobre a folha ganham só um contorno de 1px. Em 16–19px, a dobradiça preta cheia parecia um tachado, e numa célula em branco parecia um "—", o mesmo glifo de "sem fatura". Os flaps grandes da faixa ficam como especificados.
- **Os marcadores ¹ nas placas não são links.** A placa inteira é um botão, e um link dentro de um botão é HTML inválido. O marcador fica visível (Housing label) e o link para `#fontes` está nos mesmos números da frase logo acima.
- **Etiqueta "N× MENOS" no celular:** abaixo de 64rem ela quebra para uma linha própria, alinhada à direita, e a placa B fica com uns 140px em vez de 96. Com seis células de 40px, "US$", "/mês" e a etiqueta não cabem em 358px.
- **Cabeçalho da tabela no celular:** abaixo de 64rem a coluna "Modelo" traz uma segunda linha em data face, "fornecedor · part. semana · preços em US$/milhão" (cada preço traz o próprio rótulo na linha). Sem ela, os números da segunda linha de cada modelo ficariam sem rótulo, porque as colunas de participação e preços são ocultadas.
- **Legenda do gráfico no celular:** usa colunas de no mínimo 150px (duas em 390px, uma em 320px), em vez de duas fixas. Em 320px os nomes dos fornecedores eram cortados.
- **Frozen no modo noturno:** `#8D99A8`. O `#5B6776` do modo claro some sobre o fundo `#161E2A`. O documento não definia esse valor para a noite.

Registrados no polimento (2026-09-28), depois da crítica independente:

- **Dobradiça dos flaps grandes também desbotada.** A linha preta cheia a 50% cortava cada algarismo das placas e se alinhava de célula a célula: `US$ 2.880` parecia um preço riscado, cancelado. Agora a dobradiça é uma costura de 1px em preto a 22%, em todos os tamanhos, e some nas células em branco. A diferença de tom entre as metades (Flap face / Flap lower) continua carregando a leitura de "flap".
- **"Outros" deixou de ser quase o fundo.** O `#DCE2E8` pontilhado se confundia com a folha, e a pilha parecia parar em 70–80%. Agora é `#9AA3AE` (noite `#4B586A`) com hachura a −45°, e o gráfico desenha a borda de 100%.
- **Linha de preços no celular.** A linha única "fornecedor · part. · entrada · cache · saída" quebrava no meio da lista e deixava números sem rótulo. Virou duas linhas: fornecedor e participação; depois os três preços rotulados e arredondados a dois algarismos significativos. O valor exato fica no detalhe da linha e na coluna do desktop.
- **Kicker reescrito** para enquadrar o cenário e a fonte antes da frase, sem limite de 44ch (duas linhas em 390px). A linha opcional sob o h1 ("Mova o cache…") não entrou: empurraria o fader para fora da primeira dobra em 390 × 844.
- **Marcador ¹ nas placas** agora fica dentro de "/mês", sobrescrito, na mesma cor.
- **O carimbo de data da atribuição continua literal** (`as of 2026-09-25T12:06:35.101Z`): a linha é citada ao pé da letra (Brand Commitments), então não foi aparada. O parágrafo do método passou a dizer que a participação foi lida da cópia pública (IAPS-AI).
- **Compartilhar esta conta.** Abaixo do carimbo do cenário, uma fileira de teclas no estilo das teclas do painel (Flap face, sombra de célula): "Compartilhar…" (só onde o navegador oferece `navigator.share`), "Copiar link" (confirma "LINK COPIADO" numa região `aria-live`), WhatsApp, LinkedIn e X. Todas são links simples sem JavaScript. O link leva só o que difere do caso padrão (`t`, `s`, `ref`, `c`); o caso padrão é a URL limpa.
- **Imagem de compartilhamento (`share.tsx`)** é a primeira dobra acesa em 1200 × 630: headrail, kicker do cenário, a pergunta, a faixa preta com as duas placas de flaps (Chivo Mono 600, dobradiça desbotada, borda chartreuse só na placa de referência) e a linha de fontes com a atribuição literal. Tudo sai do `data.json` e do cenário do link. Satori não lê a fonte variável do `next/font`, então `fonts/` guarda Chivo 500/700 e Chivo Mono 400/600 estáticas (OFL). As metades do flap são dois retângulos sob um glifo só, sem recorte nem filtro de sombra: assim cada imagem sai em ~0,4 s.
