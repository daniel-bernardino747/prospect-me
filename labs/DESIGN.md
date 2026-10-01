---
name: Labs
description: The departure hall that lists Daniel Bernardino's public demos on a split-flap board.
colors:
  housing: "#0e100f"
  board: "#151816"
  flap-face: "#2b302c"
  flap-lower: "#232724"
  flap-blank: "#1d201e"
  hinge: "#080908"
  glyph: "#efeadb"
  label: "#a9ada2"
  rule: "#2b302c"
  signal: "#f2c230"
  signal-ink: "#15140f"
  chrome-paper: "#fbfaf6"
  chrome-ink: "#1b1d1a"
  chrome-muted: "#5d625a"
  chrome-rule: "#dcd9cf"
  banner-ink: "#f3f1ea"
typography:
  display:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 11vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 6vw, 3.5rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.6vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.12em"
  flap-lg:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1
  flap-md:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
  field:
    fontFamily: "Overpass Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontFeature: "tnum"
rounded:
  flap: "0.09em"
  sign: "3px"
  focus: "4px"
  board: "6px"
spacing:
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  board-inset: "clamp(0.75rem, 2.5vw, 1.75rem)"
  row-y: "1.25rem"
  row-gap: "0.625rem"
  column-gap: "1.5rem"
  container: "76rem"
components:
  board:
    backgroundColor: "{colors.board}"
    rounded: "{rounded.board}"
    padding: "0.5rem clamp(0.75rem, 2.5vw, 1.75rem) 0.75rem"
  flap-cell:
    backgroundColor: "{colors.flap-face}"
    textColor: "{colors.glyph}"
    rounded: "{rounded.flap}"
    width: "0.74em"
    height: "1.18em"
  boarding-sign:
    textColor: "{colors.signal}"
    typography: "{typography.label}"
    rounded: "{rounded.sign}"
    padding: "0.4rem 0.625rem"
  boarding-sign-active:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
  exit-band:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.headline}"
    padding: "clamp(1.75rem, 5vh, 3rem) clamp(1rem, 4vw, 2.5rem)"
  labs-banner:
    backgroundColor: "{colors.chrome-ink}"
    textColor: "{colors.banner-ink}"
    padding: "0.5rem 1rem"
---

# Design System: Labs

> **Scope.** This file covers the Labs home page, "the departure hall" (`src/app/page.tsx`, `src/labs/home/`), and the Labs chrome that wraps every artifact page. It does **not** cover the showcases or prospects: each of those carries its own `DESIGN.md` in `src/artifacts/<slug>/`, and nothing here binds them. An artifact may borrow nothing from the hall, and the hall takes nothing from any artifact.
>
> The hall is the current system. The artifact chrome (the paper/ink tokens, the Labs banner and the "encerrado" page in `src/app/globals.css`) is a separate, older, deliberately minimal layer, recorded at the end of Colors and in Components.

## Overview

**Creative North Star: "The Departure Hall"**

Labs is a station concourse at night. Each demo is a departure on a split-flap board: its title on flaps, its data source, the period its data covers, one line on what it answers, and a boarding sign. The board sits in a dark housing; the only color in the hall is the signal yellow of its signage, which names the place ("Labs"), heads the board's columns, marks each boarding sign, and finally fills the whole width as the exit to the portfolio. The world refuses the grid of project cards: departures are rows on one board, separated by rules, never tiles.

The flap is the signature. Every flap is a real cell (a two-tone face split by a hinge line), and the board behaves like one: the clock flips its digits at each minute in Brasília time, and once per session the board "refreshes", each letter and digit running through a few glyphs of its own kind before settling on the text the server already rendered. The text is never hidden by the motion; reduced motion removes it entirely.

Density is a board's density: generous rows, monospaced flaps, a short humanist lede and summaries in Overpass, all on near-black with warm off-white glyphs.

**Key Characteristics:**
- One dark housing, one board, one signal color.
- Titles, periods and the clock as split-flap cells; prose in Overpass.
- Yellow is signage only: the name, column heads, boarding signs, the exit.
- Mechanical motion (a leaf falling around a hinge), once per session, skippable by preference.
- The page ends in a full-bleed yellow exit band, not a footer.

## Colors

A near-black, faintly green housing with warm off-white glyphs and a single sodium-yellow signal.

### Primary
- **Signal Yellow** (`signal`): the hall's signage. The "Labs" title, the column heads, the "Brasília" clock label, each row's boarding sign outline, text selection, focus rings on the board, and the full exit band. Never used for body text or data.

### Neutral
- **Housing Black** (`housing`): the page and the `html` background; the hall sets `color-scheme: dark`.
- **Board Black** (`board`): the board's panel, one step above the housing.
- **Flap Face** (`flap-face`) / **Flap Lower** (`flap-lower`): the upper and lower halves of every flap cell, split at 50% so each cell reads as two leaves.
- **Blank Flap** (`flap-blank`): the empty cells that fill out a title field's last line.
- **Hinge** (`hinge`): the 1px line across the middle of every flap.
- **Glyph Cream** (`glyph`): flap glyphs, source field text, the default text color of the hall.
- **Concourse Gray** (`label`): the lede, row summaries, field labels on narrow screens.
- **Board Rule** (`rule`): the board's border and the rules between rows (same value as the flap face).
- **Signal Ink** (`signal-ink`): text and arrow on yellow (exit band, active boarding sign, selection).

### Artifact chrome (older layer)
The `:root` tokens in `globals.css` serve artifact pages, not the hall: **Paper** (`chrome-paper`) background, **Ink** (`chrome-ink`) text and banner background, **Muted** (`chrome-muted`) secondary text on the ended page, **Paper Rule** (`chrome-rule`), and **Banner Ink** (`banner-ink`). Light scheme, system sans. It predates the hall and stays minimal on purpose so an artifact's own world starts right under the banner.

### Named Rules
**The Signage Rule.** Yellow is the hall's signage and nothing else. If an element is not naming the place, heading a column, pointing to a boarding, or the exit, it is not yellow.

**The Scoped Hall Rule.** The hall's tokens live on the `.hall` element, not on `:root`, so they never leak into artifact pages, which run on the paper/ink chrome and their own systems.

## Typography

**Display Font:** Overpass (400/700/900, self-hosted woff, OFL) with ui-sans-serif, system-ui fallback
**Flap Font:** Overpass Mono 700 (self-hosted woff, OFL) with ui-monospace fallback

**Character:** Overpass descends from the US highway signage face, so the hall's signs read as wayfinding; its mono cut gives the flaps fixed-width cells with the same skeleton. The hall's default weight is 700; prose steps down to 400.

### Hierarchy
- **Display** (900, `clamp(3.5rem, 11vw, 6rem)`, 0.82, -0.03em): "Labs" only, in signal yellow.
- **Headline** (900, `clamp(1.75rem, 6vw, 3.5rem)`, 1, -0.02em): the exit band's host name, on yellow.
- **Body** (400, `clamp(1rem, 1.6vw, 1.125rem)`, 1.55, max 62ch): the lede under the title.
- **Body small** (400, 0.9375rem, 1.55, max 68ch): row summaries. The exit band's sub-line uses 400 at `clamp(0.9375rem, 1.8vw, 1.125rem)`.
- **Label** (700, 0.75rem, 0.12em tracking, uppercase): column heads and the clock label. Boarding signs use 0.8125rem at 0.1em; narrow-screen field labels use 400 at 0.6875rem in Concourse Gray.
- **Flap large** (Mono 700, `clamp(1.25rem, 2.4vw, 1.75rem)`; `clamp(1.0625rem, 5.4vw, 1.375rem)` under 52rem): demo titles. The clock uses `clamp(1.5rem, 4vw, 2.25rem)`.
- **Flap medium** (Mono 700, 1rem): the "Dados de" period.
- **Field** (Mono 700, 0.9375rem, 0.02em, uppercase, tabular numerals; 0.8125rem under 52rem): the source, set in mono but not on flaps.

### Named Rules
**The Flap Is Uppercase Rule.** Text on flaps is uppercased and split into one cell per glyph, grouped by word so lines wrap between words. Screen readers get the original text from a visually hidden copy; the cells are `aria-hidden`.

## Layout

A single centered column (max 76rem) with fluid gutters (`clamp(1rem, 4vw, 2.5rem)`) and vertical padding that scales with viewport height. The header is a two-column grid: title left, clock right, both bottom-aligned; the lede spans below.

The board is a four-column grid: title (fluid), source (11.5rem), period (9.5rem), status (7.5rem), 1.5rem column gap. Each row places name, source and period on the first line and the summary across the first three columns below, with the boarding sign in the status column. Rows bleed to the board's inner edges so their hover fill and focus ring span the full board width. Title fields fill their column: blank flaps pad the last line so every row's flaps end at the same edge.

Under 52rem the column heads disappear and each departure stacks: title, then source and period side by side with their own small labels, then the summary, then the boarding sign left-aligned. It stays a list of rows on one board, separated by rules.

The exit band follows the main column, full-bleed, with its content aligned to the same 76rem column.

## Elevation & Depth

Mostly flat, with depth only where the physical board would have it. The board panel carries a faint top highlight and a soft drop (`inset 0 1px 0 rgb(255 255 255 / 0.04), 0 24px 48px -24px rgb(0 0 0 / 0.7)`), so it sits proud of the housing. Each flap cell has a tight shadow (`0 0.06em 0.12em rgb(0 0 0 / 0.55)`) and the hinge line to read as a physical leaf. Nothing else casts a shadow; the exit band is a flat field of yellow.

### Named Rules
**The Physical Depth Rule.** Shadows exist only on objects the hall would really have: the board and its flaps. Interface elements (signs, labels, the exit) stay flat.

## Shapes

Near-square. Flaps have small radii proportional to their size (0.09em), boarding signs 3px, the row focus ring 4px, the board 6px. Lines are 1px rules in Board Rule; boarding signs use a 1.5px yellow outline. Arrows are drawn as open strokes (a shaft and a chevron), never filled icons.

## Components

### Flap Cell (signature)
A fixed cell (0.74em by 1.18em) with a two-tone face split at 50% and a 1px hinge across the middle. An upper leaf, invisible at rest, carries the old glyph and falls around the hinge (`perspective(240px) rotateX(0 to -90deg)`, ease `cubic-bezier(0.55, 0, 1, 0.45)`, 70 to 90ms) when the glyph changes. Used for titles (large), periods (medium) and the clock.

### Departure Board
The board panel holds column heads ("Demo", "Fonte", "Dados de") in yellow labels over a list of departure rows. Each row is one link to the demo. Hover fills the row with `rgb(255 255 255 / 0.025)`; keyboard focus draws a 2px yellow ring inset by 2px. Once per session (sessionStorage `labs:board-settled`) rows refresh one after another (110ms between rows, 14ms between cells), each cell flipping through three random glyphs of its kind before landing on its own.

### Boarding Sign
"Embarque" plus a stroked arrow, outlined in 1.5px yellow, 3px radius. On row hover or focus it fills yellow with Signal Ink text and the arrow nudges 3px right (180 to 220ms, `cubic-bezier(0.16, 1, 0.3, 1)`). Decorative to assistive tech; the row link carries the meaning.

### Clock
Five flap cells (HH:MM) labeled "Brasília" in yellow below. The server renders blank flaps; the client fills them in America/Sao_Paulo time and flips only the digits that change, once a minute. Its accessible text is "HH:MM, horário de Brasília".

### Exit Band
A full-bleed signal-yellow band after the board: a large stroked arrow, the host name in Headline type, a one-line description below. Hover moves the arrow 8px right and underlines the host; focus draws a 3px Signal Ink outline inset 6px.

### Labs Banner (artifact chrome, older layer)
A centered strip at the top of every artifact page, Ink background with Banner Ink text at 0.8125rem, stating the artifact is an independent prototype. In print it becomes an outlined box. The "encerrado" page is a plain 36rem column with muted text on paper. Neither uses the hall's tokens or fonts.

## Do's and Don'ts

### Do:
- **Do** keep the hall to one housing, one board, one signal yellow (`#f2c230`), with Signal Ink on any yellow fill.
- **Do** put each new demo on the board as a row (title on large flaps, source in mono, period on flaps, summary, boarding sign), never as a separate card.
- **Do** keep every flap's text available to screen readers as plain text and mark the cells `aria-hidden`.
- **Do** honor `prefers-reduced-motion`: no session refresh, instant clock flips, no hover transitions.
- **Do** let the flap motion settle on the server-rendered text, so the page is correct before and without JavaScript.

### Don't:
- **Don't** use yellow for prose, data values or decoration; it is signage only.
- **Don't** add shadows to signs, labels or the exit band; depth belongs to the board and its flaps.
- **Don't** list prospects on the board; the hall shows only showcases.
- **Don't** carry the hall's tokens or fonts into artifact pages, or the artifact chrome's paper/ink into the hall.
