---
name: Curtailment BR
description: One day of wind and solar cuts read as a grid operator's mosaic mimic board: a tiled Northeast on instrument-green enamel, a lamp per plant that lights with its cut, and an annunciator that names the restriction behind it.
colors:
  console: "#A9C3B5"
  console-deep: "#93B1A2"
  enamel: "#DDE6DF"
  enamel-raised: "#EAF0EB"
  joint-land: "#C6D3CA"
  joint-sea: "#9CB7A9"
  border-uf: "#4B5B53"
  ink: "#16201B"
  ink-2: "#3E4D46"
  muted: "#55655D"
  plate: "#161B19"
  plate-ink: "#F1F4EF"
  bezel: "#1E2723"
  socket: "#2E3A34"
  glass-off: "#6F8078"
  sobra: "#F4B02A"
  sobra-deep: "#7D5200"
  rede: "#D63A22"
  rede-deep: "#9E2412"
  window-off: "#E4EAE5"
  window-off-ink: "#5E6E66"
  heat-0: "#DDE6DF"
  heat-1: "#F2D892"
  heat-2: "#F4B02A"
  heat-3: "#C97A12"
  heat-4: "#6E3808"
typography:
  answer:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "clamp(1.3125rem, 0.95rem + 1.5vw, 2.125rem)"
    fontWeight: 650
    lineHeight: "1.24 → 1.14"
    letterSpacing: "-0.01em"
  deck:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1rem → 1.1875rem"
    fontWeight: 400
    lineHeight: 1.45
  headline:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 1vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.15
  engraving:
    fontFamily: "B612, sans-serif"
    fontSize: "0.6875rem → 0.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.08em"
    textTransform: uppercase
  figure:
    fontFamily: "B612 Mono, ui-monospace, monospace"
    fontWeight: 700
    fontFeature: "tnum"
  data:
    fontFamily: "B612 Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.35
  clock:
    fontFamily: "B612 Mono, ui-monospace, monospace"
    fontSize: "1.25rem (390px) → 1.625rem (1024px+)"
    fontWeight: 700
    fontFeature: "tnum"
    letterSpacing: "0.02em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  none: "0"
  plate: "2px"
  clock: "2px"
  window: "3px"
  button: "4px"
spacing:
  unit: "4px"
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s6: "24px"
  s8: "32px"
  s12: "48px"
  s16: "64px"
  gutter-mobile: "16px"
  gutter-wide: "24px"
  console-max: "1360px"
  measure: "36rem"
  tile: "10 viewBox units (0.25 degree)"
components:
  engraved-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.engraving}"
    rounded: "{rounded.plate}"
    padding: "4px 8px 3px"
  pushbutton:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    rounded: "{rounded.button}"
    size: "48px"
  annunciator-window-off:
    backgroundColor: "{colors.window-off}"
    textColor: "{colors.window-off-ink}"
    typography: "{typography.engraving}"
    rounded: "{rounded.window}"
  annunciator-window-sobra:
    backgroundColor: "{colors.sobra}"
    textColor: "{colors.ink}"
  annunciator-window-rede:
    backgroundColor: "{colors.rede}"
    textColor: "{colors.plate-ink}"
  mimic-panel:
    backgroundColor: "{colors.console-deep}"
    rounded: "{rounded.none}"
  clock-window:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.clock}"
    rounded: "{rounded.clock}"
    padding: "4px 8px"
  dock-collapsed:
    backgroundColor: "{colors.enamel-raised}"
    textColor: "{colors.ink}"
    height: "64px (16px recorder strip + 48px control row)"
  dock-expanded:
    backgroundColor: "{colors.enamel-raised}"
    textColor: "{colors.ink}"
    height: "112px (56px recorder + 8px gap + 48px control row)"
---

# Design System: Curtailment BR

Scope: this showcase only (`/demo/curtailment-br`). Nothing here binds Labs or the other showcases. Tokens live as custom properties on the artifact's root class (`.board` in `curtailment.module.css`); light only (see Colors, "No dark theme").

## Direction contract

Paste as the hidden `DIRECTION` comment at the top of the artifact component (as `tarken-fila-da-safra` does), and keep it true.

- **THESIS:** the day the ONS cut 400 GWh, shown on the operator's own instrument, a mosaic mimic board, where each plant is a lamp that lights with its cut and an annunciator names the reason. Refuses the dark-glow energy dashboard and the cream scrollytelling essay.
- **OWN-WORLD:** instrument-green console enamel, a Northeast built from 0.25° square tiles with stepped coasts, black-bezelled lamps in two warm glasses (amber "sobrou energia", red with a breaker bar "a rede não aguentou"), black laminate plates with white engraved caps, a strip-chart recorder under a square pushbutton.
- **STORY:** the reader gets the sentence, sees the board already lit at 10h30, presses play to watch the cut rise with the sun, reads which annunciator windows are lit, and leaves with surplus vs. named line.
- **FIRST VIEWPORT:** the h1 alone on top, then the lit board as the largest thing on screen (≥300px of it at 390×664), a 64px collapsed dock under the thumb (pushbutton, clock window, MW readout, 16px recorder strip); the deck sentence waits below the map as the first line of POR QUÊ. The play pushbutton is the primary action.
- **FORM:** grounded direction 3 of 7 (control-room mosaic mimic board); seed key `47e938dc`.

## Overview

**Creative North Star: "O painel sinóptico"**

Brazilian grid operation has been run, for decades, from rooms whose front wall is a mosaic mimic board: small square enamel tiles with the network painted across them, and indicator lamps set into the tiles. The ONS gives the order to cut; this page puts the order back on the instrument that would show it. The map is not a slippy web map and not a black canvas with glowing dots. It is a daylight-grey-green panel, tiled, where 236 lamps sit at their true positions and light up by how much they were cut, and where an **annunciator** (the grid of backlit alarm windows above every control desk) lights the named restriction that caused it.

Why this is only justifiable here: the unit (a lamp per plant group), the colour code (lamp glass), the naming (an annunciator window per restriction, which is literally what `dsc_restricao` is), the time control (a chart recorder of the national curve) and the alarm motion (flash then steady on activation, the ISA-18.1 annunciator sequence) all come from the grid operator's own room.

**Key characteristics**
- Instrument green (`console`), not grey aluminium, not black, not cream.
- Square tiles, stepped coastline and stepped state borders; lamps at true lat/lon on top of that grid.
- Two lamp glasses, never a gradient: amber (sobra, ENE) and red (rede, CNF/REL), always with a glyph and a word.
- Black laminate engraved plates for every label that names a thing (day, UF, restriction, section).
- Faces engineered for reading under pressure: B612 (designed for Airbus cockpit displays) for engraving and figures, the clock included; Atkinson Hyperlegible Next for sentences. Three faces, no display face, no seven-segment anything (that is `pix-na-minha-cidade`'s LED panel, not this room's).
- No glow, no blur, no glass, no gradients except the chart recorder's area fills.

## Colors

Strategy: **Committed.** `console` green owns the page ground (roughly 40–60% of every viewport) and `enamel` owns the map land and the dock; the two lamp glasses are the only saturated colours on the page.

### Ground
- **Console** (`console` #A9C3B5): page ground, sea tiles on the map. Physical scene: a reporter in a lit meeting room or on a bus at 8 a.m., phone in hand, daylight on the screen. That forces a light, matte surface; the green keeps it from reading as a blank white document and from matching any other showcase.
- **Console Deep** (`console-deep` #93B1A2): the mimic panel frame (a 6px band around the map at ≥40rem, 0 at mobile), the dock's top rule, section dividers.
- **Enamel** (`enamel` #DDE6DF): land tiles; background of the "Ponto" tag and method section body. **Enamel Raised** (`enamel-raised` #EAF0EB): the dock, the recorder paper, the day-selector sheet.
- **Joints:** `joint-land` #C6D3CA (1px tile seams on land, drawn at 0.6 viewBox units), `joint-sea` #9CB7A9 (same on sea). **UF borders:** `border-uf` #4B5B53, 1.2 viewBox units, along tile edges only.

### Ink
- **Ink** (`ink` #16201B): text everywhere on console and enamel. Contrast on console 9.3:1, on enamel 13.9:1.
- **Ink 2** (`ink-2` #3E4D46): secondary text (deck sentence second clause, captions). 6.4:1 on console.
- **Muted** (`muted` #55655D): tertiary on enamel only (axis labels, method footnotes). 5.1:1 on enamel. Never on console.

### Instrument parts
- **Plate** (`plate` #161B19) + **Plate Ink** (`plate-ink` #F1F4EF): engraved labels, pushbuttons, the "fora do mapa" plate, the "Ponto" tag header.
- **Bezel** (`bezel` #1E2723): the ring of every lamp. **Socket** (`socket` #2E3A34): the empty hole when the point could produce nothing in that half hour. **Glass off** (`glass-off` #6F8078): the unlit part of a lamp, i.e. what it could produce and was not cut.

### Signal (the only two)
- **Sobra** (`sobra` #F4B02A, amber): lit glass for reason ENE, "sobrou energia". Text in this role on light grounds uses `sobra-deep` #7D5200 (6.2:1 on enamel).
- **Rede** (`rede` #D63A22, red): lit glass for CNF and REL, "a rede não aguentou". Always carries the **breaker bar** glyph (see Components). Text in this role uses `rede-deep` #9E2412 (6.9:1 on enamel).
- Sobra and rede differ in lightness (L≈78 vs L≈52), so they separate in greyscale and for deuteranopes; the glyph separates them regardless.

### Heat (day selector only)
Five stops from `heat-0` (no cut, same as enamel) through `heat-1` #F2D892, `heat-2` #F4B02A, `heat-3` #C97A12 to `heat-4` #6E3808 (national MW cut per half hour, 0 → day-range maximum ≈ 41 GW, thresholds at 0, 5, 15, 25, 35 GW). It is the sobra amber stretched into a ramp: loss has one warm family on this page.

**The Two Glasses Rule.** Amber and red appear only as lamp glass, annunciator windows, the recorder's cut areas, the reason bar and the heat ramp. Never on buttons, links, focus or decoration.

**No dark theme.** The scene is daylight and the metaphor is a lit panel in a lit room; a dark variant would turn into the neon dashboard this refuses. Set `color-scheme: light` on the root.

## Typography

Loaded with `next/font` in the artifact, exposed as CSS variables on `.board`:

- **Atkinson Hyperlegible Next** (`next/font/google`, export `Atkinson_Hyperlegible_Next`, variable weight 200–800, subsets `latin`, `latin-ext`; `display: swap`) → `--font-text`. If the installed Next font manifest lacks the export, self-host the OFL woff2 from the Braille Institute release via `next/font/local` with the same variable name.
- **B612** (`next/font/google`, `B612`, weights 400 and 700) → `--font-engrave`.
- **B612 Mono** (`next/font/google`, `B612_Mono`, weights 400 and 700) → `--font-figure`.

No self-hosted fonts. The clock is B612 Mono 700 (`--font-figure`) set in its own window (see Clock and readout).

**Character:** cockpit labelling and low-vision legibility, not editorial serif and not terminal mono. Sentences are warm and open; everything engraved is tight, tracked caps.

### Hierarchy
- **Answer** (h1, Atkinson 650, `clamp(1.3125rem, 0.95rem + 1.5vw, 2.125rem)`, line-height 1.24 at 390px, 1.14 at ≥64rem, -0.01em, `text-wrap: balance`, max 22em). Inline **figures** inside it (`400 GWh`, `401 GWh`) are B612 Mono 700 at 0.94em with `tabular-nums`, and carry a 0.18em underbar: sobra amber under the cut figure, `ink-2` under the generated one (`text-decoration: underline; text-decoration-thickness: 0.18em; text-underline-offset: 0.12em`).
- **Deck** (p, Atkinson 400, 1rem at 390px, 1.1875rem at ≥64rem, 1.45, `ink-2`, max `measure`). Figures inline as above, `87%` underlined sobra, `82%` underlined sobra.
- **Headline** (h2, Atkinson 700, `clamp(1.375rem, 1.1rem + 1vw, 1.75rem)`, 1.15), always preceded by its engraved plate kicker.
- **Engraving** (B612 700, uppercase, 0.08em tracking; 0.6875rem at 390px, 0.75rem at ≥64rem, 1.15): plates, annunciator windows, legend terms, UF codes, dock labels.
- **Figure** (B612 Mono 700, tabular): readouts in the dock (1.125rem), window values (0.8125rem), UF plate values (0.6875rem).
- **Data** (B612 Mono 400, 0.8125rem, 1.35): axis ticks, heatmap row labels, method numbers.
- **Clock** (B612 Mono 700, tabular, 0.02em tracking; 1.25rem at 390px, 1.625rem at ≥64rem): `10:30`, `plate-ink` inside a `plate` window. Nothing stacked behind it: no ghost digits, no segment emulation.
- **Body** (Atkinson 400, 1rem/1.55, max `measure` 36rem): method and captions.

**Tabular Figures Rule.** Every number that changes with the scrubber or is compared uses `font-variant-numeric: tabular-nums` so nothing jitters during replay. pt-BR formatting everywhere: `40.740 MW`, `399,9 GWh`, `87%`, `10h30` in prose, `10:30` only on the clock.

## Layout

Mobile-first. One breakpoint for rearrangement at `min-width: 64rem` (1024px) and one for air at `min-width: 40rem` (640px). Base unit 4px; spacing scale 4, 8, 12, 16, 24, 32, 48, 64. Gutter 16px, 24px at ≥40rem. Max console width 1360px, centred. Section rhythm: 64px above an h2 block, 24px below its plate+headline. Touch targets ≥44px.

### The map (mimic panel)
- Generated entirely by the fetch script: `d3-geo` `geoMercator().fitWidth(560, frame)` where `frame` is the bbox lon −48.75…−34.5, lat +1.25…−18.75 (Northeast + northern MG, plus a 2° band of Atlantic north of the coast). SVG `viewBox="0 0 560 H"`, H ≈ 786, written exactly by the script.
- **Plate rail:** that northern sea band (lat +1.25…−0.75, the top ≈ 55px at 390 wide) holds no land and no lamps. The mobile overlays (legend and fora-do-mapa plates) sit there, like the rail of engraved plates along the top of a real mimic board, so no label ever covers a lamp. The script asserts that no point and no land cell falls inside it (if a coastal cell of AP/PA intrudes at the west edge, it is clipped from the frame; those UFs have no wind or solar points in the dataset's top ranks and fall under "fora do mapa" anyway).
- **Tiles:** a 0.25° lattice. For each cell, the script tests the cell centre against Natural Earth admin-1 (BR states) and assigns a UF or sea. Output: one `<path>` per UF made of the union of its cells (stepped outline), plus a single `<path>` for UF borders built from cell edges whose neighbours differ in UF (land/sea edges are the coast and are drawn in `border-uf` too). Tile seams are an SVG `<pattern>` (10×10 units, 0.6-unit lines) filled over land in `joint-land` and over sea in `joint-sea`. Commit these paths into `data.json` (or `map.json`) so the client ships no projection code.
- **Lamps:** at true projected lat/lon, drawn over the tiles, never snapped (clusters on the RN coast overlap; that density is real). Draw order: larger bezels first, so small lamps stay on top.
- Map container: `aspect-ratio: 560 / H`. At 390px it is full-bleed (≈390 × 547). At ≥40rem it sits inside the mimic frame with 6px `console-deep` band.

### First viewport at 390 × 664 (Safari with toolbars; the case that matters)
Top to bottom, y values from the top of the viewport. The rule behind it: in the first image the instrument is the thesis, so the board gets the room and prose gets one sentence.
1. **Labs banner** 0–56 (fixed by Labs, two lines at this width).
2. **Day plate row** 64–92: left, engraved plate `DOM · 16/08/2026` (28px tall); right, text link `Trocar dia ↓` in Atkinson 600 0.875rem, ink, underlined, jumps to the day selector. 16px gutters.
3. **Answer h1** 104–≈264 (≈6 lines × 26px). Content: "Domingo, 16 de agosto de 2026: eólicas e solares deixaram de gerar **400 GWh** por ordem do ONS, quase o mesmo tanto que geraram (**401 GWh**)." Nothing else sits between the h1 and the map: the deck sentence moved to POR QUÊ.
4. **Map** full-bleed from 276 (12px after the h1) to ≈823. Visible above the collapsed dock: 276 → 600 = **324px**, covering lat +1.25 to ≈ −10.5: the plate rail, then the lit CE and RN coasts (their lamps between y≈330 and ≈460), PI, PB, PE and the northern Bahia interior. Overlaid in the plate rail, 8px inset: row 1 the **legend strip** (28px), row 2 the **fora-do-mapa plate** (24px, horizontally scrollable in place, never wrapping). Both sit on sea tiles: the first image has no lamp under a label, and the out-of-frame total is visible from the first paint.
5. **Dock, collapsed**, `position: sticky; bottom: 0`, 64px + `env(safe-area-inset-bottom)`, `enamel-raised`, 1px `console-deep` top rule. Row A (16px, full width minus gutters): the **recorder strip**. Row B (48px): pushbutton ▶ (48×48) at left 16; clock window at left 72 (≈76 × 36, centred on the row); readout right-aligned to 16, B612 Mono 700 1rem `40.740 MW` over engraving `87% DO POSSÍVEL`.

At 390 × 844 (no toolbars) the same stack shows ≈500px of map, the whole Northeast down to northern MG.

The first image is therefore: one sentence, then a board already lit amber across the RN/CE coast and the Bahia interior filling half the screen, the out-of-frame total in its rail, and the play button under the thumb.

### First viewport at 1440 × 900
A 12-column console grid, max 1360px, 24px gutters, 24px column gap, starting 24px below the banner (banner one line ≈ 36px).
- **Columns 1–4 (≈430px), the reading column**, top 60px: day plate row (plate + `Trocar dia ↓`), then h1 at 2.125rem/1.14 (≈7 lines, ≈270px), 32px, then the **POR QUÊ block** in the same order as on mobile: kicker plate `POR QUÊ`, the deck sentence as its first line (Deck style, ≈5 lines, ≈140px), 16px, the reason bar (≈48px with labels), 16px, the **annunciator** (2 columns × 3 windows, each 203 × 72px, 8px gaps; ≈232px). The block ends near y ≈ 900; the last window row may sit just under the fold at 1440 × 900, which is acceptable because the board, not the annunciator, is the first image.
- **Columns 5–12 (≈906px), the mimic panel**, top 60px, height to 876: framed in `console-deep` 6px. Inside, the map at height 640 (≈456px wide; its top ≈37px is the plate rail, left empty at desktop) aligned left with 24px inner padding; the remaining ≈400px to its right is the **panel margin column**: legend (lamp anatomy, 4 rows, see Legend), the fora-do-mapa plate stacked vertically, and at ≥1280px the UF readout list (`RN 126,9` … in B612 Mono, updating with the scrubber). Under map and margin, inside the frame, the **dock** (not sticky at desktop, always expanded, no strip): pushbutton, clock window, readout and the recorder spanning the panel width (≈858 × 72px).
- UF plates (engraved, `RN`, `CE`, `PI`, `BA`, `MA`, `PB`, `PE`, `MG`…) sit at each UF's tile-centroid on the map at ≥64rem, showing code only below 1280px and `code value-GWh-of-the-day` at ≥1280px.

## Elevation & Depth

Flat, mounted, physical. No blur, no glass, no glow.
- Plates and pushbuttons: `box-shadow: 0 1px 0 rgb(255 255 255 / 0.35) inset, 0 1px 1px rgb(0 0 0 / 0.35)` (a laminate edge, not a floating card).
- Mimic frame: `box-shadow: inset 0 0 0 1px rgb(22 32 27 / 0.18)`.
- Dock (mobile): `box-shadow: 0 -6px 12px -8px rgb(22 32 27 / 0.35)`.
- Clock window (recessed into the panel, the opposite of a plate): `box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.6), 0 1px 0 rgb(255 255 255 / 0.35)`.
- Lamps: depth comes from the bezel ring only. Lit glass has a single specular fleck: a white circle at 25% opacity, radius 0.28 × lit radius, offset (−0.3r, −0.3r), drawn only when lit radius ≥ 4 units.

## Shapes

Rectangles with small radii (plates and clock window 2px, annunciator windows 3px, pushbuttons 4px), circles for lamps, squares for tiles. No pills, no rounded cards, no bento. There are no diagonals: the mimic board is orthogonal and state borders are stepped.

## Components

### Lamp (map point)
Per point `p` per patamar `t`, with `k = 13 / sqrt(maxRefMW over all points in the day)` in viewBox units:
- **Bezel:** circle, `r_b = max(2.5, k·sqrt(max_t ref(p,t)))`, fill `socket`, stroke `bezel` 1.5 units. Fixed for the whole day (the socket's size is the point's capacity that day).
- **Glass (could produce):** circle, `r_g = k·sqrt(ref(p,t))`, fill `glass-off`.
- **Lit (was cut):** circle, `r_c = k·sqrt(cut(p,t))`, fill `sobra` if reason ENE, `rede` if CNF/REL.
- **Breaker bar** (rede only, when `r_c ≥ 3`): horizontal line through the centre, length `1.4·r_c`, stroke `plate` 1.2 units, `stroke-linecap: butt`. It reads as an open breaker blade across the glass.
- Areas are all on the same MW scale, so "lit share of the glass" is the share cut.
- **States:** *no reference* (solar at night): socket only, visibly hollow, `aria` "não podia gerar neste horário". *No cut*: glass-off only. *Selected* (tapped/focused): 2-unit `ink` ring at `r_b + 2.5`, drawn above everything, and the Ponto tag opens. *Highlighted by a restriction*: affected lamps full, all others at `opacity: 0.22`. *Dimmed by nothing*: default.
- Hit area: each lamp is a `<g role="button" tabindex="-1">`; a transparent circle of radius `max(r_b, 22px in screen space)` sits underneath for touch. Keyboard access to lamps goes through the "Pontos" list (see Ponto tag), not 236 tab stops; the map itself has one tab stop that opens a listbox of the day's top 20 points by cut.

### Legend
Mobile: one strip in the map's plate rail, row 1 (amber lamp "sobrou energia · ENE", red lamp with bar "a rede não aguentou · CNF/REL"). Desktop margin column adds lamp anatomy with one drawn example lamp and three labelled leaders: `TAMANHO: QUANTO PODIA GERAR NO DIA`, `VIDRO CINZA: PODIA GERAR AGORA`, `ACESO: FOI CORTADO AGORA`, and a hollow socket `VAZIO: NÃO PODIA GERAR (NOITE)`.

### Fora-do-mapa plate
Engraved plate, always present. Header `FORA DO MAPA`, then one row per UF outside the frame with a tiny lamp (sobra or rede by that UF's dominant reason in the current patamar) and value: `RS 23,7 · SP 5,8 · GO 2,7 · SC 0,7 GWh no dia`. Mobile: one line in the map's plate rail (row 2, under the legend), horizontally scrollable in place if needed, never wrapping and never under the dock. Desktop: stacked rows in the margin column. Values are day totals; the lamp reflects the current patamar.

### Pushbutton (play/pause)
48 × 48px, `plate` body, `plate-ink` glyph (▶ triangle 16px, ❚❚ 14px, drawn as SVG), radius 4px, laminate shadow. Pressed (`:active` and while playing): `transform: translateY(1px)`, inner shadow `inset 0 2px 0 rgb(0 0 0 / 0.5)`, and a 6px square **status lamp** at the button's top-right corner lit `sobra` while playing. `aria-pressed` reflects playing. Label: "Reproduzir o dia" / "Pausar". Space and K toggle when focus is in the dock.

### Recorder (scrubber)
The national curve on chart paper, and the range input on top of it. On mobile it has two sizes; on desktop it is always full.

**Mobile, collapsed (on load): the recorder strip.** 16px tall, the top row of the dock. It shows only the cut: the stacked step-area fills (`sobra`, `rede` on top) scaled to the day's max cut, on `enamel-raised`, and the pen (2px `ink` line, no triangle). No possible line, no hour rules, no ticks. It is a `<button aria-expanded="false" aria-controls="recorder">` labelled "Abrir o registrador do dia"; its hit area extends 28px upward (transparent `::before`) over the map's bottom edge, for 44px total. Touching the strip (pointerdown) or pressing play **expands** the dock; so does Tab reaching it and pressing Enter/Space. The strip is not a scrubber: the first touch opens, it does not seek. Once expanded, the dock stays expanded for the visit (the reader asked for the instrument; taking it back would be a trick).

**Expansion:** dock 64 → 112px, growing upward over the map: the strip becomes the 56px recorder and an 8px gap opens above the control row. 200ms `cubic-bezier(0.16, 1, 0.3, 1)` on the recorder row's height only; the control row does not move under the thumb. Instant under reduced motion. Focus goes to the range input when opened by touch or keyboard, stays on the pushbutton when opened by play.

**Full recorder (expanded on mobile; always on desktop):**
- Paper: `enamel-raised`, vertical hour rules every 3h at `joint-land`, midnight/noon rules at `console-deep`; hour ticks `00 03 06 09 12 15 18 21` in Data style below (desktop) or none (mobile, where only `00h` and `23h30` appear at the ends).
- Curve: 48 samples. **Possible** as a 1.5px `ink-2` step line (half-hour steps, not smoothed; the data is half-hourly). **Cut** as stacked step-area fills from the baseline: `sobra` for ENE, `rede` for CNF+REL on top. The area under the possible line not cut is left as paper.
- Playhead: a 2px `ink` vertical line spanning the paper with a 7px downward pen triangle at the top; the current half-hour column behind it gets a `rgb(22 32 27 / 0.06)` band.
- Input: native `<input type="range" min=0 max=47 step=1>` stretched over the paper with a transparent track and a 44 × 56 invisible thumb (the pen is the visible thumb). Arrows ±1 patamar, PageUp/PageDown ±6 (3h), Home 00h00, End 23h30. `aria-label="Horário do dia"`, `aria-valuetext` e.g. "10h30, 40.740 megawatts cortados, 87 por cento do possível".
- Default value: the day's peak patamar (index 21, 10h30, on 16/08), never 0.

### Clock and readout
Clock: `HH:MM` in B612 Mono 700 inside a small engraved **window**: `plate` #161B19 ground, `plate-ink` #F1F4EF figures, 2px radius, padding 4px 8px, recessed shadow (see Elevation), `min-width: 5ch` plus padding so its width never changes. No ghost digits, no horizontal split line (that would read as the split-flap board of `conta-de-tokens`), no colour change while playing. It is the engraved-plate material set into the panel instead of onto it. Readout: MW cut (B612 Mono 700) over `CORTADOS · NN% DO POSSÍVEL` (engraving). When the patamar has zero possible (never on the SIN, but guard): `SEM GERAÇÃO POSSÍVEL`.

### Annunciator (the reason panel; signature)
A grid of backlit windows, one per named restriction of the day, ordered by day GWh descending; show the top 6 (5 plus "Outras restrições (N)" aggregated when there are more).
- Window: 72px tall (64px at 390px), `rounded.window`, 1px `plate` border, inner 2px `plate` bevel line (`box-shadow: inset 0 0 0 2px rgb(22 27 25 / 0.9)` removed when lit). Text: restriction name in engraving caps, max 3 lines, e.g. `CONTROLE DE FREQUÊNCIA DO SIN`, `LT 500 kV AÇU III / JAGUARUANA II` (keep `kV` in its correct case), then day total in figure 0.8125rem: `330,0 GWh NO DIA`. Right-top: a reason tag `ENE` / `CNF` / `REL` in engraving 0.625rem.
- **Off** (restriction not active in this patamar): `window-off` ground, `window-off-ink` text.
- **Lit sobra**: `sobra` ground, `ink` text. **Lit rede**: `rede` ground, `plate-ink` text, and the breaker bar glyph (12 × 2px) before the reason tag.
- A 3px bar along the window's bottom edge shows that restriction's MW in the current patamar relative to its own day max (ink at 40% on lit, `window-off-ink` at 40% off).
- **Activation sequence** (the ISA-18.1 flash): when a window goes off → lit between patamares while playing or scrubbing, it flashes: lit 0–160ms, off 160–320ms, lit 320–480ms, off 480–640ms, then steady lit. Implemented as a CSS animation `annunciate` 640ms `steps(1, end)` restarted by toggling a `data-flash` key. Lit → off is instant.
- **Tap/Enter** on a window: toggles highlight of its affected points on the map (others dim to 0.22), sets `aria-pressed`, shows a plate above the map `DESTACANDO: <nome> · N pontos · limpar`. On mobile, scrolls the map's top to 72px below the viewport top (`scrollIntoView({block:'start'})` with `scroll-margin-top: 72px`; `behavior: 'smooth'` unless reduced motion).
- Placement: inside the **POR QUÊ block**. Desktop: first viewport, reading column. Mobile: the first section below the map. Order on both: kicker plate `POR QUÊ`; the **deck sentence** as its first line (Deck style, max `measure`: "Às 10h30, **87%** do que podiam produzir estava cortado. E **82%** do corte do dia foi por sobra de energia no sistema, não por falta de linha."); the reason bar; the annunciator. No h2 here: the deck sentence already does a heading's job.
- Above the windows on both: the **reason bar** (a busbar): one 20px-tall horizontal bar split ENE / CNF / REL by day GWh, `sobra` / `rede` / `rede` with a 2px `plate` gap between CNF and REL and the breaker bar glyph on the rede segments; labels below in figure style `ENE 330,0 · CNF 49,6 · REL 20,3 GWh`, and one sentence: "82,5% do corte veio de sobra de energia no sistema."

### Ponto tag (tapped point)
Styled as an operator's equipment tag, not a card: `enamel` body, `plate` header strip with the point name in engraving (`CONJ. CAJU`), a punched hole (10px circle in `console` at top-left of the header, 1px `bezel` ring).
- Body rows (Data style): `UF · subestação · fonte` (`RN · SE AÇU III · EÓLICA`), `Corte no dia 9,0 GWh (75% do que podia gerar)`, restriction active in the current patamar with its reason lamp, or `Sem corte neste horário`.
- Text rows only in v1: no mini recorder, no per-point curve (cut for scope; the dock's recorder already carries time, and the rows update with the patamar).
- Mobile: slides up from the dock and sits above it, max height 45vh, closable (× pushbutton 44px, Escape, tap outside on the map). Desktop: anchored in the panel margin column, replacing the UF list while open.
- No below-the-fold repeat of the tag and no 48-row table in v1 (cut for scope). The live region carries the tag's current row for screen readers.

### Day selector (heatmap)
Kicker plate `OUTROS DIAS · 01/08 A 24/09/2026`, headline "Os domingos acendem primeiro." only if the data keeps showing it (it is a data-driven heading: computed at build from whether the top-5 days contain ≥2 Sundays; otherwise "Cada linha é um dia; cada coluna, meia hora.").
- Grid: 55 rows (days, oldest at top) × 48 columns (patamares). Mobile: cells 7 × 7px, 0 gap, total 336 × 385; row label to the left in Data 0.625rem (`16/08 D`, `D` for Sunday in `sobra-deep`). Desktop: cells 12 × 9px (576 × 495), labels 0.75rem, with the day total GWh at the right of each row in Data style.
- Fill: heat ramp by national MW cut. The currently shown day: 2px `ink` outline on the row and its label set as an engraved plate. The five worst days carry a small `plate` tick at the row end.
- Each row is a link to `?dia=AAAA-MM-DD` (whole row is the target; min 44px effective height on touch through an invisible 44px hit box grouped per row on mobile, since rows are 7px: the grid is wrapped in a listbox where a tap selects the nearest row and shows a confirm plate `Ver 20/08 · 336,6 GWh →`). Keyboard: the grid is one tab stop, Up/Down moves the row, Enter navigates.
- Beneath: a line on the week 14–20/09/2026, 1.722,7 GWh (33,9%), as text, not a second chart.

### Method and sources
Kicker `MÉTODO E FONTES`. `enamel` block, body text, max `measure`. Items: what GNRa is ("corte estimado pelo ONS a partir da geração de referência, sujeito a revisão"); "dados baixados em 25/09/2026"; "não inclui geração distribuída (telhados)"; "cada conjunto está no centro das suas usinas"; "horário de Brasília" (only after verification; until then "horário do arquivo do ONS, que tratamos como de Brasília"); the 8% outside the frame; credits verbatim: "Fonte: ONS, Dados Abertos (CC-BY). Alterações: agregamos por dia e por ponto; convertemos MWmed de meia hora em MWh; posicionamos cada conjunto no centro das suas usinas." · "Contém dados do SIGA/ANEEL, sob ODbL; a tabela de coordenadas derivada está disponível sob ODbL." · "Contornos: Natural Earth (domínio público)." Links underlined, `ink`, 2px focus.

### Links, focus, hover
- Links: `ink`, underline 1px, offset 0.18em; hover thickens to 2px. No colour change.
- Focus-visible everywhere: `outline: 3px solid var(--ink); outline-offset: 2px`; on `plate` surfaces, `outline-color: var(--plate-ink)`. Lamps: the selected-ring doubles as focus ring.
- Hover (fine pointers only, `@media (hover: hover)`): lamps show a tooltip plate with name and current MW; windows lift nothing, they get a 1px `ink` outline. Nothing is hover-only: the same info is one tap away.

## States

- **Loading:** none visible. The day is server-rendered and embedded. Fonts use `swap`; the clock window reserves `min-width: 5ch`, so the B612 Mono swap does not shift the dock.
- **First paint and no JavaScript are the same frame, and it is the peak.** The server renders every lamp's `r_g`, `r_c` and reason at the peak patamar (index 21, 10h30 on 16/08), the windows lit for that patamar, the clock at `10:30`, the readout at `40.740 MW`. Nothing in markup or CSS starts a lamp unlit, at radius 0 or at `opacity: 0`; the entrance (Motion) only animates away from this state and back. Without JS the dock renders expanded (the strip could not open), with the full recorder's pen at the peak; the pushbutton and range render `disabled` with an engraving note `REPRODUÇÃO REQUER JAVASCRIPT`. Day selector rows are plain links.
- **Invalid `?dia`:** render the default day and a plate above the h1: `DIA NÃO ENCONTRADO · MOSTRANDO 16/08/2026` (dismissable, not an error page).
- **Quiet patamar** (little cut, e.g. 03h00): lamps mostly glass-off, windows mostly off, readout shows the real MW. No empty-state illustration: the dark board is the state.
- **Zero-cut point:** glass only. **No-reference point:** hollow socket. **Tiny values:** the lit disc is drawn at its true radius even when sub-pixel; the tag shows the MW, never rounds a nonzero cut to "0" (below 1 MW prints "< 1 MW").
- **Restriction without mapped points** (all affected points outside the frame): the window works, and the highlight plate reads `N pontos, todos fora do mapa (RS)` while the fora-do-mapa plate row gets the `ink` outline.
- **Data error at build** (missing or malformed `data.json`): the build fails via the loader's validation (test in Vitest); never ship a runtime error page for this showcase.
- **Small screens under 360px:** clock drops to 1.125rem, the readout drops its engraving line and keeps the MW, annunciator becomes one column.

## Motion

Motion is the replay itself; everything else is small.
- **Replay:** 48 patamares in 12s: 250ms per patamar. Driven by `requestAnimationFrame`; lamp radii (`r_g`, `r_c`) interpolate linearly between patamar values over the 250ms (set as SVG `r` attributes per frame, not CSS transitions, to keep 236 lamps in one paint). Reason colour switches at the patamar boundary, no crossfade. Play from the end restarts at 00h00. Reaching 23h30 stops, pen stays.
- **Scrubbing:** instant, no interpolation; the lamp values jump to the chosen patamar.
- **Pulse:** when a lamp's `r_c` grows by ≥25% of its bezel between patamares, a ring (stroke = its glass colour, 1.5 units) expands from `r_b` to `r_b + 6` units while opacity goes 0.6 → 0 over 600ms `cubic-bezier(0.2, 0.7, 0.3, 1)`. At most **12** simultaneous pulses (largest increases win), drawn from a pool of 12 pre-rendered `<circle>` elements that are reused, never created per frame.
- **Annunciator flash:** 640ms, `steps(1)`, as specified above.
- **Entrance: the lamp test** (once per page view). The board is at the peak from first paint, and the entrance never replaces that frame with an unlit one. It runs the operator's lamp test instead, east to west in the direction the sun crosses the board: each lit disc steps off for 120ms and back on (`steps(1)`, opacity 1 → 0 → 1 on the lit layer only; bezels and grey glass stay), staggered by longitude 0 → 360ms. Total 480ms; at any instant only a narrow meridian band is dark, so the peak reading survives it.
  - **Trigger:** an `IntersectionObserver` on the map, threshold 0.5, armed after hydration. It fires the first time half the map is visible: on desktop (map in the first viewport) as soon as the page is interactive; on mobile, where 324 of ≈547px are on screen, also at load. If the map is not in view at load (a deep link to `#metodo`, restored scroll, a short landscape window), nothing runs until the reader scrolls it in, so nobody gets an entrance that played off-screen.
  - **Skip:** if the reader has already pressed play, scrubbed, or tapped a lamp or window; if the page is hidden; under reduced motion; without JS. It never repeats on scroll back.
- **Dock expansion:** 200ms, see Recorder.
- **Ponto tag:** slides up 16px + fades in, 220ms `cubic-bezier(0.16, 1, 0.3, 1)`; out 160ms ease-in.
- **Pushbutton:** press 80ms ease-out; status lamp on/off instant.
- **Dimming on highlight:** opacity 180ms ease-out.
- **`prefers-reduced-motion: reduce`:** no lamp test, no pulse, no flash (windows switch steady), dock expands instantly, tag appears without slide, highlight dims without transition, `scrollIntoView` instant. Play still works but steps once per 500ms without interpolation (24s per day), so the change is readable as discrete frames. There is no autoplay in any mode.
- **Live region:** a visually hidden `aria-live="polite"` sentence ("10h30: 40.740 megawatts cortados, 87% do possível; 5 restrições ativas") updates on scrub and at most every 3h of patamar (every 6 steps) while playing.

## Performance

236 lamps × 3 circles in one SVG is fine at 60fps with rAF attribute updates; move to a single `<canvas>` layer for lamps only if a mid-range Android drops below 45fps during play (keep SVG tiles beneath, same projection). Map paths are precomputed; the client bundle ships no d3. Target: day payload ≤ 12 KB gzip, JS for the board ≤ 25 KB gzip.

## Do's and Don'ts

### Do
- **Do** open at the peak patamar with the board lit, in the server HTML, before any script runs.
- **Do** give the board the first viewport: on mobile nothing but the day plate and the h1 sits between the banner and the map.
- **Do** pair every amber or red with its glyph and its word.
- **Do** keep the fora-do-mapa plate visible whenever the map is.
- **Do** write numbers in pt-BR with the unit: `399,9 GWh`, `40.740 MW`.
- **Do** keep state borders and coast stepped on the tile grid; lamps stay at true positions.

### Don't
- **Don't** draw transmission lines. Name them.
- **Don't** add R$, counters, forecasts, rankings, or equivalences ("uma Itaipu").
- **Don't** use glow, blur, glass, gradients on surfaces, dark mode, or neon.
- **Don't** use the ONS, BrazilGrid, Volt or Electricity Maps visual identity, logos or palette.
- **Don't** call GNRa "desperdício medido"; it is "corte estimado pelo ONS".
- **Don't** introduce Inter, Geist, Space Grotesk, IBM Plex, DSEG or any fourth face; no seven-segment or split-flap numerals.
- **Don't** add a per-point curve, a mini recorder or a 48-row table in v1.

## Desvios na implementação

Registrados na construção (2026-09-26). Tudo o mais segue o texto acima.

- **Figuras em B612, não em B612 Mono.** A face mono dá à vírgula, ao ponto e aos dois-pontos uma célula inteira: `40. 740 MW`, `126, 9`, `10: 30` liam como dois números. As figuras (h1, relógio, readout, janelas, tabelas) usam B612 com `font-variant-numeric: tabular-nums`, então nada treme no replay. São duas faces carregadas, não três; `--font-figure` aponta para a B612.
- **Legenda do trilho sem os códigos no celular.** `SOBROU ENERGIA · ENE` e `A REDE NÃO AGUENTOU · CNF/REL` não cabiam em 358px com engraving legível; o trilho mostra só as palavras (0,625rem), e os códigos aparecem na barra de razões e em cada janela. No desktop a legenda completa fica na coluna de margem.
- **Nomes das janelas: até 4 linhas no celular** (3 no desktop). Com 3 linhas, `DESLIGAMENTO DAS LT 525 kV POVO NOVO / MARMELEIRO C2` perdia justamente a linha nomeada. O `aria-label` de cada janela traz o nome completo.
- **Seletor de dias: rótulos só nos domingos e no dia do painel; total em GWh só no dia do painel.** Linhas de 7px (celular) e 9px (desktop) não comportam um rótulo por linha, e os piores dias vizinhos (19/09 e 20/09) colidiam. Os cinco piores dias levam só a marca quadrada; o total de qualquer dia aparece na placa de confirmação e no rótulo acessível da linha. O "D" de domingo é `ink` em negrito, não `sobra-deep`: `sobra-deep` sobre `console` dá 3,5:1, pouco para 10px.
- **Lâmpadas sem `role="button"` individual.** Dentro de um `<svg role="img">` os filhos são apresentacionais; o acesso por teclado e leitor de tela é o seletor "Os 20 pontos com mais corte" (um `<select>` nativo que aparece ao receber foco), como o texto já previa. O toque escolhe a lâmpada mais próxima dentro de 22px de tela.
- **Registrador do celular fechado mostra a pena como linha vertical no patamar**, sem triângulo. Arrastar sobre o papel busca o patamar pela coluna sob o dedo; o `<input type="range">` fica por cima só para teclado e leitor de tela.
- **Dica do mouse com valor aproximado.** Os valores por ponto e por patamar vêm dos níveis de desenho (64 por ponto), então a dica diz `≈ 490 de 660 MW cortados`. A placa do ponto só mostra totais exatos do dia.
- **Fuso: conferido de forma indireta, não pelo dicionário.** O centro da geração solar possível no arquivo cai às 11h52, perto do meio-dia solar do Nordeste em UTC−3; em UTC cairia perto das 14h50. O método diz isso com essas palavras e trata o horário como de Brasília.
- **Desktop: altura do mapa `clamp(460px, 100vh − 336px, 640px)`** em vez de 640px fixos, para que a botoeira caiba na primeira tela de 1440×900; a coluna de margem rola por dentro quando a lista por estado passa da altura do mapa.
- **Conjuntos com usina sem coordenada:** quatro conjuntos (Aracati II/CE, Serra do Tigre/PB e dois de MG) têm uma usina com posição 0,0 no SIGA; ficam no centro das demais usinas. Sem isso, CE e PB apareceriam como "fora do mapa".
- **Tamanho:** `data.json` tem cerca de 1,9 MB (55 dias × 240 pontos × 48 patamares, codificados). Fica só no servidor; a página entrega um dia, e o HTML com a carga do dia fica perto de 80 KB com gzip, acima dos 12 KB que o texto estimava para "só o dia".
- **240 pontos, não 236:** setembro trouxe quatro ids a mais que o brief contou em agosto. O texto da página usa os números calculados, nunca a contagem do brief.
