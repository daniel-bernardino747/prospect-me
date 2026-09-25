---
name: A fila da safra
description: A praça's rural credit read as a pocket timetable on a lit goldenrod bed.
colors:
  bed: "#f2a516"
  bed-hover: "#ffbd3a"
  carbon: "#12161b"
  slate: "#26323c"
  slate-rule: "#3b4955"
  ivory: "#f4ecd6"
  ivory-dim: "#cfc6ae"
  ink: "#15181b"
  ink-soft: "#3b3524"
  placeholder: "#6d6553"
  stop: "#b8321c"
  go: "#1d6a3d"
  hold: "#26323c"
typography:
  display:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "clamp(3.75rem, 17vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "clamp(2.25rem, 9vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 0.95
  figure:
    fontFamily: "League Gothic, sans-serif"
    fontSize: "clamp(3.25rem, 15vw, 4.75rem)"
    lineHeight: 0.95
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "0.8125rem to 1.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.04em to 0.1em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0"
spacing:
  gutter-mobile: "1rem"
  gutter-wide: "1.5rem"
  section: "3.5rem"
  measure: "38rem"
  sheet: "60rem"
components:
  finder-toggle:
    backgroundColor: "{colors.bed}"
    textColor: "{colors.carbon}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.1rem"
    height: "44px"
  finder-toggle-hover:
    backgroundColor: "{colors.bed-hover}"
  verdict-line:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.ivory}"
    padding: "0.85rem 1rem 1rem"
  status-stop:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.ivory}"
  status-go:
    backgroundColor: "{colors.go}"
    textColor: "{colors.ivory}"
  status-hold:
    backgroundColor: "{colors.hold}"
    textColor: "{colors.ivory}"
  pane:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.ink}"
    padding: "1rem"
---

# Design System: A fila da safra

Scope: this artifact only (`/tarken-fila-da-safra`). Labs hosts one world per company; nothing here binds other artifacts. The direction contract is the `DIRECTION` comment in `FilaDaSafra.tsx`, shipped hidden in the HTML. Tokens are custom properties on `.bed` in `fila.module.css`.

## Overview

**Creative North Star: "The Pocket Timetable"**

A praça read as a timetable: the harvest's creditors depart month by month, and 30/04 (the revenda's prazo-safra) is the gate. The page is a lit goldenrod bed, echoing Tarken's amber, with carbon and slate slabs that carry data, ivory panes that carry prose, and raked plates for codes and statuses. It rejects the data-journalism scroll and the KPI-card dashboard. Reading order: the praça name, the three verdict lines, the departures board, the detail behind each line, then the method.

**Key Characteristics:**
- Goldenrod bed with a soft radial highlight (`radial-gradient(120% 60% at 20% 0%, rgb(255 214 120 / 0.55), transparent 60%)`).
- Condensed gothic caps for anything read at a glance; plain Barlow for sentences.
- Raked plates (`--rake: -9deg`, `skewX`) with counter-skewed text inside.
- Square corners everywhere; no radius.
- Status is always a written word on a colored plate.

## Colors

A single warm field (goldenrod) with two dark slabs, one light pane, and exactly two signal colors.

### Primary
- **Lit Goldenrod** (`bed`): the page ground; also the ink of highlights on dark slabs: site mark, verdict figures, board header, method summary, the selected praça in the R$/ha scale, the before-cutoff bars, the UF plate text, code plates, the finder toggle. Hover on the toggle lifts to `bed-hover`.

### Secondary
- **Carbon** (`carbon`): the data slab: top strip, verdict lines, departures board, R$/ha scale, method; also the h1/h2 ink on the bed.
- **Slate** (`slate`) with **Slate Rule** (`slate-rule`): the finder panel, scale tracks, the "hold" plate; the rule color divides board rows and finder options.

### Tertiary (status)
- **Vermilion** (`stop`): "na frente". Used for the bank's debt that falls due before 30/04, "Banco na frente", and yields below 60 sacks.
- **Bottle Green** (`go`): "depois" / above breakeven: "Banco depois", "Depois" flags, yields at or above 60 sacks.
- **Hold** (`hold` = slate, plus `inset 0 0 0 1px slate-rule`): neutral verdicts, "Divide a janela" and the bank-share line.

### Neutral
- **Ivory** (`ivory`): prose panes (quote column, ruler, split remainder, finder input) and text on dark slabs.
- **Ivory Dim** (`ivory-dim`): secondary text on dark slabs (scope, column headers, hints, method body), after-cutoff bars, R$/ha fills.
- **Ink** (`ink`) / **Ink Soft** (`ink-soft`): body text on the bed and panes; stamps, asides, captions.

**The Two Signals Rule.** Vermilion and bottle green are the only status colors, and neither ever appears without its word ("Na frente", "Depois", "sc abaixo", "sc acima", "Banco na frente").

## Typography

**Display Font:** League Gothic (`--font-display`), via `next/font/google`
**Label Font:** Barlow Condensed 500/600/700 (`--font-label`)
**Body Font:** Barlow 400/500/600 (`--font-prose`, fallback `system-ui, sans-serif`)

**Character:** Departure-board caps for places, figures and headings; condensed labels for codes and tables; a quiet grotesque for sentences.

### Hierarchy
- **Display** (400, `clamp(3.75rem, 17vw, 6rem)`, 0.88, -0.005em, uppercase, balanced): the praça name.
- **Figure** (`clamp(3.25rem, 15vw, 4.75rem)`, 3.5rem at 48rem+, 0.95, tabular): verdict figures, goldenrod.
- **Headline** (400, `clamp(2.25rem, 9vw, 3.25rem)`, 0.95, uppercase, balanced): section h2.
- **Mark** (League Gothic 1.625rem, 0.02em, uppercase): site name in the strip.
- **Label** (Barlow Condensed, uppercase, tracked 0.04 to 0.1em): code plate 700/0.875rem/0.1em; status 700/0.9375rem/0.06em; stamp 600/0.9375rem/0.06em; scope 600/0.8125rem/0.08em; board header 700/1.0625rem/0.08em; board cells 600/1.125rem tabular; column headers 600/0.8125rem/0.1em; finder input 600/1.25rem; method summary 700/1.125rem/0.08em.
- **Body** (Barlow 400, 1.0625rem/1.5): leads and verdict "what" text (1.35 leading), capped at `measure` (38rem). Asides 0.9375rem; quote 500/1.1875rem/1.4.

**The Tabular Figures Rule.** Every number that is compared (figures, board, ruler, scale) uses `font-variant-numeric: tabular-nums`.

## Layout

Mobile-first, single column. `.sheet` is centered at max 60rem with a 1rem gutter (1.5rem at 48rem+). Prose never exceeds 38rem. Sections are separated by 3.5rem and carry `scroll-margin-top: 5rem` to clear the sticky strip. One breakpoint, `min-width: 48rem`: the strip mark goes inline and reveals its subtitle; the praça block gets more air (3rem top); verdict lines reflow from a stacked grid (code + status / figure / what) to one row (`6.5rem 11rem 1fr auto`); ruler rows move the value to a 13rem right column. Touch targets are at least 44px (toggle, finder options, method summary).

## Elevation & Depth

Flat surfaces with soft, negative-spread drop shadows that make slabs sit on the bed like cut card; no glow, no blur layers.
- Strip: `0 6px 18px -8px rgb(0 0 0 / 0.5)`. Finder panel: `0 18px 30px -12px rgb(0 0 0 / 0.55)`.
- Verdict line: `0 10px 22px -14px rgb(0 0 0 / 0.7)`. Board: `0 16px 30px -18px rgb(0 0 0 / 0.75)`. Quote column: `0 8px 18px -14px rgb(0 0 0 / 0.6)`.

## Shapes

Square corners throughout (inputs set `border-radius: 0` explicitly). The only non-rectangular form is the rake: plates skewed `-9deg` (finder toggle, UF plate, code plate, status plate), text counter-skewed back to upright. Hazard stripe (`135deg`, 14px goldenrod/carbon, 6px tall) caps the gate row; a lighter `135deg` hatch marks the "pacote completo" fill.

## Components

### Top strip + Finder
Sticky carbon strip (z 10): goldenrod mark left, raked "Trocar praça" toggle right (label reads "Fechar" while open, "Carregando…" while navigating). The finder panel drops full-width below the strip on slate: uppercase "Município" label, ivory search input, a listbox of up to 8 results (featured Tarken event praças when empty), each option name + bold UF, rows ruled in slate-rule. Hover and `aria-selected` invert the option to goldenrod on carbon. Keyboard: arrows, Enter, Escape. Choosing navigates to `?m=<id>`.

### Place heading
The praça name in display caps, carbon on the bed, followed by a raked carbon **UF plate** (0.38em, goldenrod text, raised 0.35em). Below it a stamp line: safra, harvest year, latest contract date.

### Verdict timetable lines
Three carbon lines, 0.5rem apart: **Fila**, **Banco**, **60 sc**. Each has a raked goldenrod code plate, a goldenrod figure, the "what" sentence with an ivory-dim uppercase scope line, and a raked status plate (`data-tone` stop/go/hold) right-aligned. Lines with data are anchors to their section and nudge `translateX(4px)` on hover; without data they render "—" and drop the status.

### Departures board
Carbon table: goldenrod header ("Partidas · UF" / total), columns Vence / Custeio / bar / Situação. Bars are goldenrod before 30/04 and ivory-dim after. Each row carries a flag, "Na frente" (stop) or "Depois" (go). Suppressed months read "sigilo", never zero. The **gate row** sits at the first after-cutoff month: goldenrod band with a hazard-stripe top, carbon caps "30/04 · prazo-safra da revenda" and the share already due.

### Bank split bar
A 3.25rem two-part bar (`role="img"` with a full-sentence label): carbon segment "Banco N%" in goldenrod (min 6.5rem), ivory remainder "Fora do banco N%" right-aligned.

### 60-sack ruler
Ivory pane; one row per year: year, a 0.9rem track (`rgb(21 24 27 / 0.08)`), a fill in go or stop, a 2px carbon tick at 60 sacks (labeled "60 sc" on the first row only), and the value with its written "N sc acima/abaixo" in the tone color.

### R$/ha scale
Carbon ordered list sorted by value: name, value, slate track with ivory-dim fill. The reader's praça is goldenrod (name, value, fill); "Pacote completo" (R$ 3.000/ha) uses the hatched fill.

### Column quote pane
Ivory figure, max 38rem, soft shadow: the quote from Luiz Tangari's column in Barlow 500, caption in condensed caps with the article title as a sentence-case link.

### Method details
Carbon `<details>`, goldenrod summary "Como foi feito" with a trailing " +" / " −" text sign; body list in ivory-dim at 0.9375rem.

### States and focus
Focus-visible on toggle, lines, summary and input: `3px solid ivory`, offset 3px. Tone mapping is fixed: stop = vermilion = "na frente" / below breakeven; go = bottle green = after the gate / above breakeven; hold = slate = shared or neutral.

### Motion
- **Flap** (entrance): `clip-path: inset(0 0 55% 0)` + `translateY(-6px)` to rest; 520ms `cubic-bezier(0.16, 1, 0.3, 1)` on verdict lines (stagger 0/70/140ms), 480ms on board rows (stagger 40ms, capped at 240ms).
- **Drop** (finder panel): clip-path reveal from the top, 220ms same curve.
- Toggle background 160ms ease-out; line hover transform 180ms.
- `prefers-reduced-motion: reduce` removes the flap, the drop and both transitions.

## Do's and Don'ts

### Do:
- **Do** counter-skew every text span inside a raked plate (`skewX(calc(var(--rake) * -1))`).
- **Do** pair every stop/go/hold color with its written word.
- **Do** keep prose at or under `measure` (38rem) and on the bed or an ivory pane.
- **Do** show missing data as "—" or "sigilo" with a sentence saying why.

### Don't:
- **Don't** skew text; only plates rake.
- **Don't** use border-left accent stripes on panes or lines (the ruler's 2px tick is a data mark, not an accent).
- **Don't** use unicode glyph icons (arrows, check marks, emoji) as indicators.
- **Don't** carry meaning by color alone, or by hover alone.
- **Don't** add radius, a third status color, or KPI cards.
