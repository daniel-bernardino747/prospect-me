---
name: Raio de explosão
description: A dependency path read as an emergency-planning-zone chart. Your root at the centre, one ring per hop, one sector per door, the version range drawn as a barrier arm on every edge, and the morning of 4 August stepped through as a ruled log of publish events.
colors:
  paper: "#EDEFEA"
  paper-raised: "#F7F8F5"
  ink: "#16181A"
  ink-2: "#4A4F4B"
  rule: "#C5CAC2"
  rule-strong: "#8C928A"
  field-dot: "#AEB4AB"
  zona: "#A8105F"
  zona-hatch: "rgb(168 16 95 / 0.42)"
  zona-wash: "rgb(168 16 95 / 0.06)"
  on-zona: "#FFFFFF"
  barred: "#6B716A"
  focus: "#16181A"
colors-dark:
  paper: "#121413"
  paper-raised: "#1B1E1C"
  ink: "#E8EBE6"
  ink-2: "#A3AAA3"
  rule: "#343935"
  rule-strong: "#5A615B"
  field-dot: "#454B46"
  zona: "#D9679C"
  zona-hatch: "rgb(217 103 156 / 0.30)"
  zona-wash: "rgb(217 103 156 / 0.05)"
  on-zona: "#121413"
  barred: "#7D847D"
  focus: "#E8EBE6"
typography:
  display:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "clamp(2.5rem, 10.5vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  hop-figure:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  label:
    fontFamily: "Sofia Sans Condensed, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "0.08em"
    textTransform: uppercase
  qualifier:
    fontFamily: "Sofia Sans Condensed, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Sofia Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  code:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.35
  clock:
    fontFamily: "Sofia Sans Condensed, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum, lnum"
rounded:
  none: "0"
  node: "50%"
spacing:
  unit: "4px"
  scale: "4, 6, 8, 12, 16, 24, 32, 48, 72"
  gutter-mobile: "16px"
  gutter-tablet: "32px"
  gutter-wide: "40px"
  measure: "38rem"
  sheet: "1360px"
components:
  preset-tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
  preset-tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  stepper-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
  log-row:
    minHeight: "44px"
    borderBottom: "1px solid {colors.rule}"
  log-row-current:
    backgroundColor: "{colors.paper-raised}"
    borderLeft: "3px solid {colors.ink}"
  ledger-row:
    minHeight: "64px"
    borderBottom: "1px solid {colors.rule}"
  command-block:
    backgroundColor: "{colors.paper-raised}"
    border: "1px solid {colors.rule}"
    rounded: "{rounded.none}"
---

# Design System: Raio de explosão

Scope: this showcase only (`/demo/raio-de-explosao`). Nothing here binds other artifacts, and nothing from `labs/PRODUCT.md` or the Tarken artifact carries over. Tokens live as custom properties on the artifact root class (`.carta`) in `raio.module.css`. This file was written **before** the build as its specification; after the build it is re-recorded from what shipped (ground truth wins over intention).

## Direction contract

Ship this verbatim as an HTML comment, first child of the artifact's root element (the showcase has no layout of its own), and grep the production build for `79ac1c79` to confirm it survived.

```
THESIS: A dependency path is a distance, not a list. The page is a planning-zone chart: your root at the centre, one ring per hop, one sector per direct dependency, and each edge's version range drawn as a barrier arm that is open or shut. It refuses the dark security dashboard with a force-directed node cloud, the blue blueprint, and the scrubbed timeline.
OWN-WORLD: pale chart paper (#EDEFEA), graphite ink, hairline rings with degree ticks, one hazard magenta (#A8105F) used only for exposure, laid as a hatched wedge. Barred edges are dashed graphite that ends in a shut bar. Sofia Sans in three widths as map lettering, Fragment Mono for package names, ranges, ids and commands. Square corners, no shadows, no cards.
STORY: The visitor sees how many hops away ChainDrop landed from a real stylelint install, sees which range let it in and which range barred keyv, then steps through the morning of 4 August one publish event at a time, a ruled log under the chart, watching gates swing and the zone close ring by ring on the root.
FIRST VIEWPORT: headline sentence at display size, its condition on the next line, three preset tabs, a square chart that fills the width. Desktop: sentence, log and path ledger on the left 5 columns, sticky chart with its stepper on the right 7.
FORM: emergency-planning-zone chart with a discrete event log. Position 7 on the grounded list; seed key 79ac1c79.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

### Why not the blueprint lane

The suggested lane (blueprint, hairlines, graph as hero) was kept for its precision and its hairlines, and dropped for its cyan-on-navy and its left-to-right tree. The brief's own measure is hops ("1 salto", "a um salto da raiz") and its title is a radius. A polar chart makes that measure the geometry: the distance from the centre *is* the hop count. The blueprint look is also what "engineering" AI pages default to.

### Grounded list, as ordered before the roll

1. P&ID piping schematic, with a range as a valve. 2. Railway interlocking mimic panel. 3. Epidemiological transmission chain (outbreak line list). 4. `npm ls` / `git log --graph` terminal tree. 5. Accident-investigation fault tree. 6. Postal routing waybill. 7. **Emergency planning zone chart** (the literal "raio" reading, allowed one slot; assigned by the roll). Three things carry over from the list: the valve (1) becomes the barrier arm, the mimic panel (2) gives the "gate opens when the event arrives" state logic, and the outbreak line list (3) becomes the event log: one ruled row per event, read in order, each with its time and its consequence.

### Distinct within the showcase set

- **Type.** Martian Mono belongs to pix (its `wdth` axis is the ESC/POS double width) and to conta. This page gives it up: one superfamily (Sofia Sans, in normal, condensed and extra-condensed widths) plus one mono (Fragment Mono). The clock is set in Sofia Sans Condensed, not in a mono, so there is no clock-in-mono echo either.
- **Time.** curtailment-br owns the continuous "play the day" recorder, because its data is a continuous half-hourly day. This page's data is nine-odd discrete publish events, so its grammar is discrete: a ruled timetable and a stepper. There is no play button, no track, no scrub, no `requestAnimationFrame` clock and no range input.
- **Palette.** Pale chart paper + graphite + magenta. The one-signal rule (magenta = exposure) is this page's; no other showcase uses magenta.

## Overview

**Creative North Star: "A carta da zona"**

The reference is the planning-zone chart printed around a hazardous site (Angra's ZPE-3/5/10 rings are the Brazilian example): concentric distance rings, lettered compass sectors, degree ticks and hatched zones, set in sober civic lettering, and next to it the incident log a duty officer keeps, one ruled line per event. The hazard here is not a place. It is a set of package versions, and the distance is counted in hops from *your* root. The chart is the hero. Everything else (sentence, log, ledger) is its legend.

**Key characteristics**

- One square polar chart, drawn in SVG from deterministic polar math. No graph library and no force layout.
- Magenta means exposure and nothing else: exposed edges, infected nodes, the hatched wedge, the "front" arc, the "abre" verdicts in the log, and the figures in the headline.
- Barred is graphite and dashed, and ends in a shut bar across the edge. It is a first-class result, not a greyed-out leftover.
- Time moves in discrete steps. Every state the chart can be in is a row in the log.
- Every visual state has a written twin in the log or the ledger.
- Square corners everywhere. The only round thing is a node.

## Colors

Strategy: **Restrained ground, committed signal.** Pale chart paper and graphite carry about 90% of the surface. Hazard magenta carries every exposure, and on the chart it owns a whole region (the hatched wedge), not scattered dots.

The scene is a developer at a desk in daylight, or on a phone in a feed, reading an incident. That scene makes the page light by default. Dark mode is the "carta noturna" for people who keep their OS dark: tokens under `@media (prefers-color-scheme: dark)` on `.carta`. The global Labs banner keeps its own dark bar in both modes.

- **Chart paper** (`paper`): the page ground. Pale grey-green, deliberately not cream.
- **Raised paper** (`paper-raised`): label backings on the chart (the halo behind a label that crosses a ring), the current log row, the ledger's selected row, command blocks.
- **Graphite** (`ink`): text, the root disc, selected tab fill, stepper borders, the current-row bar, and the barrier bar of a shut gate.
- **Graphite 2** (`ink-2`, 7.2:1 on paper): secondary text, the headline qualifier, captions, ring labels, log rows after the current one.
- **Rule** (`rule`) / **Rule strong** (`rule-strong`): ring hairlines, sector boundaries, degree ticks, row dividers. Ring 1 (the direct-dependency ring) uses `rule-strong`, and so does the dashed rule above the 10:39 removal row.
- **Field dot** (`field-dot`): the ~110 packages in the graph that are not on any path. Decorative texture that makes the count visible; never text.
- **Hazard magenta** (`zona`, 10:1 on paper): see the list above. White text on a magenta fill passes (`on-zona`).
- **Barred** (`barred`, 4.3:1 on paper, graphics only): dashed barred edges and "fora do alcance" node outlines. Barred *text* is set in `ink-2`, never in `barred`.

**Carta noturna (dark).** Hot pink on near-black is the neon threat map this page rejects, so dark `zona` is a lower-chroma `#D9679C` (5.6:1 on `#121413`, enough for the headline figures and "abre" verdicts). Its hatch drops to 0.30 alpha and the wash to 0.05, so the wedge reads as a tint on the chart, not a light source. In dark mode:
- Exposed edges are 2px (not 2.5px) `zona` strokes. Nothing glows: no halo ring around infected nodes (the r = 17 halo is light-mode only), no blur, no `drop-shadow`.
- The only solid magenta areas are the infected reachable nodes (r = 11, `zona` fill, `on-zona` label backing) and the headline figures. Everything else magenta is a line or a hatch.

**The one-signal rule.** No green for "safe" and no amber for "warning". No path is said in words ("Nenhum caminho"), not in a reassuring colour. Errors use graphite with a 3px `ink` left bar, never magenta, so magenta stays unambiguous.

## Typography

Loaded with `next/font/google` in the artifact component (as Tarken does), exposed as CSS variables on `.carta`:

```ts
import { Fragment_Mono, Sofia_Sans, Sofia_Sans_Condensed, Sofia_Sans_Extra_Condensed } from 'next/font/google';
const display = Sofia_Sans_Extra_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['800'], variable: '--font-display' });
const label   = Sofia_Sans_Condensed({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-label' });
const body    = Sofia_Sans({ subsets: ['latin', 'latin-ext'], weight: 'variable', variable: '--font-body' });
const code    = Fragment_Mono({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--font-code' });
```

**Fragment Mono ships one weight.** The art direction asked for 400/500; Next 16's `font-data.json` lists Fragment Mono with `weights: ["400"]` only (checked 2026-09-25), and `weight: '500'` would fail the build. So the code face is 400 everywhere, with `font-synthesis: none` on `.carta` so no faux bold is drawn. Where 500 was meant to rank a line (the ledger's `name@version`, the current log row's name), rank comes from size (14px vs 13px) and colour (`ink` vs `ink-2`), not weight.

- **Display** (Sofia Sans Extra Condensed 800): only the headline sentence and the hop figures. It is map lettering: tall and narrow, so a long sentence sits in three lines on a phone.
- **Qualifier** (Sofia Sans Condensed 500, 15px/1.4, `ink-2`, sentence case): the one line under the headline that states its condition. Condensed, not the normal-width body, because the line must stay on one line at 390px: at 15px the normal width needs about 410px for the stylelint string, the condensed width about 345px of the 358px available. `white-space: nowrap` from 360px up; below 360px it may wrap (the budget below absorbs 21px).
- **Label** (Sofia Sans Condensed 650, caps, tracked 0.08em): section heads ("A MANHÃ DE 4 DE AGOSTO", "CAMINHO", "E SE", "O QUE FAZER", "FONTES E MÉTODO"), ring labels, sector names on the chart's rim, tab sub-lines, stepper button text, log verdicts.
- **Body** (Sofia Sans 400, 17px/1.55, max 38rem): sentences.
- **Code** (Fragment Mono 400, 13px; 14px for ranked lines): every package name, version, range, `MAL-…` id and command. Never translated, never set in caps.
- **Clock** (Sofia Sans Condensed 600, `font-variant-numeric: tabular-nums lining-nums`): the instant in the stepper (20px, "10:13:02" plus "UTC" in `label`), in the masthead (13px, "04·08·2026 10:13:02 UTC") and the time column of the log (15px). Verify `tnum` in the built font on day one; if the feature is missing, each digit is wrapped in a fixed `0.55em` inline-block cell by the formatter, so the readout never jitters between steps.

Inside the headline, the numbers and the package name are wrapped: numbers take `color: var(--zona)`, and the package takes the code face at 0.62em on the display baseline. Example: "**5** dos **444** pacotes do ChainDrop entravam por um único devDependency."

## Layout and grid

- 4px base. Scale: 4, 6, 8, 12, 16, 24, 32, 48, 72.
- Gutters: 16px under 768px, 32px from 768px, 40px from 1200px. Sheet max width 1360px, centred.
- Desktop (≥ 1024px): 12 columns, 32px gap. The legend column spans 1–5 and the chart column spans 6–12. The chart column (chart + stepper) is `position: sticky; top: 24px` while the legend column scrolls through the log, the ledger and "e se". Below both, "O que fazer" and "Fontes e método" run full width.
- Tablet (768–1023px): single column. Chart max 560px, centred; stepper at the chart's width.
- Section rhythm: 72px above a section label, 16px below it. More space above than below.

## The chart (signature component): `ZoneChart`

SVG, `viewBox="0 0 1000 1000"`, rendered at `width: 100%; aspect-ratio: 1`. Centre (500, 500). Labels that must stay legible are **HTML overlays**, absolutely positioned in percentages of the same box, so they keep CSS pixel sizes (12px minimum) at any chart width.

`ZoneChart` is a pure function of `(preset, instant, target)`. The instant is one of the log's entries; there is no in-between state to render.

**Rings.**
- Root disc: r = 46, fill `ink`. The root name is overlaid in `code` on `paper` ("stylelint 17.14.1").
- Hop rings k = 1…R: r_k = 46 + k · (394 / R), so the outermost ring sits at 440. R = the collapsed view's max depth, with a minimum of 3 and a maximum of 6. Anything deeper collapses into ring 6, which is labelled "6+ saltos".
- Strokes: 1px `rule`; ring 1 1.25px `rule-strong`.
- Ring labels sit where each ring crosses 12 o'clock ("1 SALTO", "2", "3"…), in `label` style, `ink-2`, on a `paper` backing.
- Rim: degree ticks on r = 440: every 10° 6 units long, every 30° 12 units, `rule`. The sector-name band is 452–490.

**Sectors.** Each *door* (a direct dependency with at least one path to a target) gets a wedge. The doors that lead nowhere fold into one sector, "outras N diretas", which is always at least 60° and always last clockwise. Door widths are proportional to the leaf count of the door's collapsed subtree, each at least 40°. They start at −90° (12 o'clock) and run clockwise. Sector boundaries are radial hairlines, `rule`, `stroke-dasharray: 1 5`. Door names are on the rim as `<textPath>` along r = 470, `label` style (on phones, only doors wider than 50°; the rest show on tap).

**Nodes.**
- Children split the parent's angle in proportion to their leaf counts. A node sits at its mid-angle on the ring of its shortest depth.
- A node with several parents is drawn once. Its extra edges are **chords** along the ring (arcs), not new copies.
- On-path clean node: r = 9, fill `paper`, 1.5px `ink` stroke.
- Infected and reachable: r = 11, fill `zona`; in light mode plus a 1px `zona` halo at r = 17 (no halo in dark).
- Infected but barred (keyv): r = 11, no fill, 1.5px `barred` stroke, dash `3 3`.
- Infected, not yet published at this instant: drawn as an on-path clean node.
- Field dots: every other package in the graph at its BFS ring, angle from a stable hash of its name within its door's sector, r = 2.5, `field-dot`. Drawn first, never interactive.

**Edges.** Orthogonal polar routing, as a zone chart would draw it: a radial segment out from the parent to the midpoint between the rings, an arc along that mid-radius to the child's angle, then a radial segment into the child.
- Exposed: 2.5px `zona` (2px in dark), solid, round caps.
- Barred: 1.25px `barred`, `stroke-dasharray: 5 4`.
- Neutral path segment (clean link on the way to a target): 1.5px `ink`.

**The gate (barrier arm).** Every edge whose target has a malicious version carries a gate on its last radial segment, 14 units before the child. A pivot dot (r = 3) plus an arm 22 units long:
- **Shut:** the arm crosses the edge at 90°, 3px `ink`. The range does not accept any malicious version published so far.
- **Open:** the arm is rotated to lie along the edge (0°), 3px `zona`, and the edge beyond it is exposed.
- **Not yet:** no malicious version of the target is published at this instant; the gate is shut and drawn in `rule-strong`.

**The zone (hatched wedge).** For each door with an exposed path: a wedge over that door's angular span, from r = 0 to the radius of the deepest reachable infected node + 18. Fill `url(#hatch)`: a pattern of 45° lines, 1.5 units wide, 8 units apart, `zona-hatch`, over a `zona-wash` fill. The wedge edge is 1px `zona`, `stroke-dasharray: 2 4`. This is the one region-scale colour field on the page.

**The front.** A 3px `zona` arc across the exposed door's span, at the ring of the *nearest* reachable infected node. Its overlay label is "FRENTE · 1 SALTO". Across the stylelint log it steps inward: 3 saltos (the `cacheable` family, ~10:06), 2 (`flat-cache@6.1.24`, 10:10:55), 1 (`file-entry-cache@11.1.6`, 10:13:02). The exact rows come from `data.json`, never from this file.

**Legend corner** (HTML, bottom-right inside the chart box, `label` style, `ink-2`): "116 NO GRAFO · 6 NO CAMINHO", and under it the method line "Faixas do grafo coletado em {fetchedAt} (deps.dev); raiz resolvida no instante escolhido", with a link to the method note.

**Labels on the chart.**
- Phone (< 700px chart width): the root, the infected reachable nodes (short name + version in `code`, 12px) and the front label. Clean nodes carry only their hop-order number ("2", "3a"). Ranges are *not* drawn on phones; they live in the ledger.
- Desktop: every path node is labelled with name@version, and each exposed or barred edge gets a range tag on its arc segment. The tag is `code` 12px on a `paper-raised` backing with 2px/6px padding: "^11.1.5 · aceitava 11.1.6" in `zona`, or "^5.6.0 · barrado" in `ink-2`.
- Every labelled node is a `<button>` overlay (hit area at least 44×44px) that selects the node (see "E se").

**Accessibility.** The SVG has `role="img"` plus a `<title>` (the headline sentence) and a `<desc>`, a one-line summary for the current instant ("10:13:02 UTC. Caminho: stylelint → file-entry-cache → flat-cache → cacheable…; keyv barrado em 3 arestas"). The ledger and the log are the complete text equivalent.

## The morning (second signature): `Stepper` + `EventLog`

The morning of 4 August is a finite list. Built once from `data.json` per preset:

```ts
type Entry =
  | { kind: 'start';   at: '09:30:00' }                                   // "antes do primeiro evento"
  | { kind: 'publish'; at: string; pkg: string; version: string;
      verdict: { open: number /* hops */ } | { barred: string /* range */ } | 'sem-efeito' }
  | { kind: 'removal'; at: '10:39'; source: 'StepSecurity' };
```

Only publish events of packages in the current preset's collapsed graph are listed. The verdict is computed by the same exposure rule the chart uses, at that entry's instant, and covered by a Vitest test (stylelint must yield `keyv@6.0.0 → barrado ^5.6.0`, `flat-cache@6.1.24 → abre 2 saltos`, `file-entry-cache@11.1.6 → abre 1 salto`).

**Stepper** (directly under the chart, at the chart's width, 44px tall, three cells, square, joined):
- Left: "◂ ANTERIOR" (`stepper-button`, `label` style 12px). Disabled on the first entry.
- Centre: the clock readout, "10:13:02" in `clock` 20px plus "UTC" in `label`, `ink`. On the removal entry it reads "10:39" with "~" before it, as StepSecurity states it.
- Right: "PRÓXIMO EVENTO ▸" (`stepper-button`, `label` style 12px, `ink` fill with `paper` text: the one filled control, since forward is the expected direction). Disabled on the removal entry.
- Under the stepper, a single `aria-live="polite"` line in body 15px `ink-2`, also visible: "10:13:02 UTC · `file-entry-cache` 11.1.6 publicada. `^11.1.5` aceitava: caminho aberto a 1 salto."
- Keyboard: both buttons are native `<button>`s; no global shortcuts.

**EventLog** (section "A MANHÃ DE 4 DE AGOSTO"; on phone directly under the stepper line, on desktop in the left column between the preset tabs and CAMINHO): an `<ol>` whose rows are `<button>`s, ruled, one per entry. Tapping a row jumps to that instant.
- Row grid: `[gate 16px] [time 64px] [name@version 1fr] [verdict auto]`, 8px gaps, `min-height: 44px`, 1px `rule` bottom border, no background.
- Gate glyph: a 12px copy of the chart's barrier arm, so the row and the chart speak the same sign: open arm in `zona` for "abre", shut bar in `ink` for "barrado", shut bar in `rule-strong` for "sem efeito" and for rows after the current one.
- Time: `clock` 15px, "10:13:02".
- Name: `code` 13px, "file-entry-cache@11.1.6" (a `<wbr>` after `@` so a long scoped name can break there, never mid-name).
- Verdict: `label` 11px: "ABRE 1 SALTO" in `zona`; "BARRADO · ^5.6.0" (the range in `code`, not caps) in `ink-2`; "SEM EFEITO" in `ink-2`.
- Start row: "09:30:00 · nenhuma versão publicada".
- Removal row: a 1px dashed `rule-strong` top border, "~10:39 · remoção começa (StepSecurity)", verdict "GRAFO SEM MUDANÇA". Selecting it leaves the chart as the previous entry drew it, and the live line says why: "A hora de saída de cada versão não é pública; o gráfico fica como estava."
- Current row: `aria-current="step"`, `paper-raised` background, 3px `ink` left bar, name in `ink` 14px.
- Rows after the current one: text in `ink-2`, gate glyph in `rule-strong` ("ainda não").
- Default current row per preset: the door event (stylelint: `file-entry-cache@11.1.6` 10:13:02; got: `cacheable-request@13.0.20` 10:11:24), or the last publish row where nothing opens (eslint).
- In "E se" mode the log and stepper are disabled (`aria-disabled`, 0.5 opacity on the gate glyphs only) with the note "O horário só vale para o ChainDrop."

## Component inventory

1. **Masthead strip** (40px): "RAIO DE EXPLOSÃO" in `label` on the left, and the instant in `clock` at 13px on the right ("04·08·2026 10:13:02 UTC"), which follows the stepper. A 1px `ink` rule under it. This is not a nav bar: there are no links in it.
2. **Headline** (`h1`, display): the sentence for the current preset at its default entry. Templates, filled from the data and covered by a Vitest test:
   - exposed: "**{n}** dos **{total}** pacotes do ChainDrop entravam por {doors === 1 ? 'um único' : n} {dependency kind}." (stylelint → "5 dos 444 pacotes do ChainDrop entravam por um único devDependency.")
   - one hop: "`got` 15.1.0 puxava um pacote infectado a **1** salto."
   - none: "**Nenhum caminho.** As faixas do `eslint` 10.8.0 não aceitavam nenhuma versão do ChainDrop."
   - At any other entry it switches to the instant form: "Às 10:10:55 UTC, o ChainDrop estava a **2** saltos do `stylelint`." / "Às 09:30 UTC, nenhuma versão do ChainDrop estava publicada."
3. **Qualifier** (`qualifier`, `ink-2`, 6px under the headline, one line at ≥ 360px): the condition that makes the headline true. At the default entry: "npm install sem lockfile, 4 ago 2026, a partir de 10:13 UTC" (the door event's hh:mm). At other entries: "npm install sem lockfile, 4 ago 2026, às 10:10:55 UTC". For eslint's default: "npm install sem lockfile, 4 ago 2026, 09:30–10:39 UTC". `npm install` is prose here, not a code chip, to keep the line one line.
4. **Deck** (body, `ink-2`, max 38rem): the brief's second sentence ("O `keyv`, onde o ataque começou, ficou de fora: `^5.6.0` não aceita `6.0.0`."). Below the fold on phones; its condition already sits in the qualifier.
5. **Preset tabs** (`role="tablist"`, three equal columns, 48px, 1px `ink` border, joined with no gaps): the name in `code` 13px, and a sub-line in `label` 11px ("5 INFECTADOS", "1 SALTO", "NENHUM CAMINHO"). The selected tab is `ink` fill with `paper` text. Switching resets the log to that preset's default entry.
6. **ZoneChart**: as above.
7. **Stepper** and 8. **EventLog**: as above.
9. **Path ledger** (`ol`, "CAMINHO"): one row per node on the collapsed paths at the current instant, in hop order, grouped by door.
   - Gutter column 56px: the hop figure (`hop-figure`), with a 2px vertical spine linking the rows. The spine is `zona` where the edge into the next row is exposed, and dashed `barred` where it is barred.
   - Content line 1: `name@version` in `code` 14px, `ink`.
   - Line 2: the range tag plus the verdict in words ("aceitava 11.1.6 · publicada 10:13:02 UTC" in `zona`, or "barrado: não aceita 6.0.0" in `ink-2`).
   - Right side: a `MAL-2026-11970 ↗` link to osv.dev (`code` 12px, underlined 1px, offset 3px).
   - The whole row is a button that selects the node on the chart (two-way highlight). Selected row: `paper-raised` background plus a 3px `ink` left bar.
   - Barred edges follow in a closing group, "BARRADOS PELA FAIXA", so the contrast is always visible.
   - More than 5 paths to one target: "+ {k} caminhos para `{name}`" expands in place.
10. **E se** (section "E SE FOSSE OUTRO PACOTE"): a single-line combobox (`role="combobox"`, 48px, `paper-raised`, square, 1px `rule-strong`) over every package in the current preset's graph, with the results listbox below it (max 6 rows, `code`). Picking one retargets the whole page: the headline becomes "Se `{x}` for comprometido: **{p}** caminhos, o mais curto a **{k}** saltos.", the qualifier becomes "hipótese, no grafo do `{preset}` coletado em {fetchedAt}", the wedge and front move to it, and the gates switch to "on path / not" (magenta shows *reach*, since there is no malicious version). Tapping any labelled chart node does the same. A "Voltar ao ChainDrop" text button clears it.
11. **O que fazer**: four numbered clauses (`hop-figure` numerals). Each is a body sentence plus one command block (`code` on `paper-raised`, 1px `rule` border, horizontally scrollable, with a copy button):
   1. See your own path: `npm ls keyv flat-cache file-entry-cache cacheable cacheable-request --all`, with "compare as versões com a lista em Fontes e método".
   2. `npm ci` with the lockfile committed.
   3. `"overrides": { "file-entry-cache": "11.1.5" }`.
   4. `npm install --ignore-scripts` during an incident window, with the note "o ChainDrop entrava por `preinstall`".
   Written as instructions, not as claims about anyone. This replaces the v1 paste form (cut: see PRODUCT.md, "Deferred to v2").
12. **Fontes e método**: a definition list, one entry per source, each with its licence and link: the Datadog IOC CSV (Apache-2.0; "444 pacotes, 2.236 versões no arquivo usado; a StepSecurity conta 2.212"), "Dados de dependências: deps.dev (Google), CC BY 4.0", OSV / ossf/malicious-packages (Apache-2.0), the npm registry (publication times), StepSecurity (the ~10:39 removal statement). Then "Dados coletados uma vez em {fetchedAt}; a página não consulta nada ao abrir." Then the limits, one sentence each: the graph as collected vs. 4 August's; the unpublished version's ranges are assumed; a lockfile plus `npm ci` changes everything; removal times per version are not known. Body 15px, `ink-2`.

## States

All states render in the same frame: the chart's rings and rim are always drawn, and only the content inside changes. No spinners, no skeletons (nothing loads), no empty illustrations.

- **Default (server-rendered, no JS required):** stylelint at its door entry (10:13:02 UTC), fully drawn, log and ledger complete. Without JS the tabs, the log rows and the stepper buttons are links (`?caso=got&t=101124`) read through `searchParams`; every state is a pure function of `(caso, t)`, so the page is fully steppable without JS. With JS, the same state lives client-side and the URL follows via `history.replaceState`, so any instant can be shared.
- **Zero paths (a result, not an error):** the headline is "**Nenhum caminho.** …" at full display size. The chart shows the barred edges with their shut gates and no wedge. The ledger shows only "BARRADOS PELA FAIXA". The log still lists every publish event, each "BARRADO" or "SEM EFEITO".
- **Before the first publish (start entry):** every gate is "not yet", there is no wedge and the front is hidden. Headline in the instant form; the ledger lists the path nodes with "nenhuma versão maliciosa publicada ainda".
- **Removal entry:** the chart as the previous entry drew it; the live line explains that per-version removal times are unknown. Never animate the zone shrinking.
- **Small graph** (under 4 nodes in the collapsed view): R stays at 3, so the rings never collapse into a single target shape. The legend corner still shows the counts.
- **Unknown `caso` or `t` in the URL:** falls back to the stylelint default entry, no error message (the URL is a convenience, not an input).

## Motion

Motion shows what the chart does in life: gates open when a version is published, and the zone closes toward the centre. Time moves only when the reader steps. There are no hover flourishes, no ambient animation and no autoplay. Content is always fully drawn at rest.

Curves: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-inout: cubic-bezier(0.65, 0, 0.35, 1)`. All transitions are CSS (`transition` on SVG attributes via `r`/`transform`/`stroke-dashoffset` custom properties); there is no JS animation loop.

- **Preset switch:**
  - Field dots do not move.
  - Exposed and neutral edges draw from the root outward with `stroke-dashoffset` from path length to 0: 360ms `--ease-out`, staggered by hop at 70ms.
  - The wedge grows via an SVG mask circle `r` from 0 to its final value: 520ms `--ease-out`, starting 80ms in.
  - Overlay labels fade in over 160ms after their edge lands.
  - The headline and qualifier swap with a 120ms opacity out/in. The text does not slide.
- **Step (the signature moment; "Próximo evento ▸", "◂ anterior", or a log row):** the chart goes from the current entry's state straight to the chosen entry's state.
  - Every gate that opens swings (arm `rotate` 90° → 0°, 220ms `--ease-out`, colour `ink` → `zona` at 50%), and the edge beyond it draws in magenta (300ms, starting when the arm lands).
  - Every gate whose target just got a malicious version that its range refuses (keyv at 09:35 against `^5.6.0`) **holds**: the arm shakes by `translate` 0 → 2 → −2 → 0 units over 180ms and stays shut. Only on a forward single step, where the reader is looking at that one event.
  - The wedge and the front step **inward** as nearer rings open: `r` transition 400ms `--ease-inout`. The front label changes on landing ("FRENTE · 3 SALTOS" → "2" → "1").
  - Stepping backward runs the same transitions in reverse (gates close, wedge `r` grows back out), with no shake.
  - A tap on a distant row goes directly to that state with the same durations; it never replays the intermediate rows.
  - The new current row's background switches instantly; the clock readout and live line update on tap, not on landing.
  - A step during a running transition retargets from the current in-flight values (CSS transitions do this by default).
- **Selection (ledger ↔ chart):** the node ring grows from r + 0 to r + 6, 2px `ink`, over 140ms `--ease-out`. The row background changes instantly.
- **Reduced motion (`prefers-reduced-motion: reduce`):** no dash drawing, no wedge growth, no arm rotation and no shake. States switch instantly. The stepping controls are identical for everyone. The 120ms opacity crossfade on the headline remains.

## First viewport

### 390 × 844 (phone, portrait)

From top to bottom, with 16px side gutters (358px content):

| # | Element | Height | Running total |
|---|---|---|---|
| 1 | Labs showcase banner (from the route, two lines) | 56 | 56 |
| 2 | Masthead strip: "RAIO DE EXPLOSÃO" / "04·08·2026 10:13:02 UTC", 1px `ink` rule | 40 | 96 |
| 3 | gap | 8 | 104 |
| 4 | Headline, `10.5vw` ≈ 41px, three lines: "**5** dos **444** pacotes do ChainDrop entravam por um único devDependency." | 120 | 224 |
| 5 | gap | 6 | 230 |
| 6 | Qualifier, one line, `ink-2`: "npm install sem lockfile, 4 ago 2026, a partir de 10:13 UTC" | 21 | 251 |
| 7 | gap | 12 | 263 |
| 8 | Preset tabs, 358 × 48: `stylelint` 17.14.1 / 5 INFECTADOS (selected), `got` 15.1.0 / 1 SALTO, `eslint` 10.8.0 / NENHUM CAMINHO | 48 | 311 |
| 9 | gap | 8 | 319 |
| 10 | **ZoneChart, 340 × 340**, centred (9px inset each side) | 340 | 659 |
| 11 | gap, then the stepper (44px) | 8 + 44 | 711 |

The chart ends at 659px, the same line the earlier layout reached (662px) before the qualifier existed: the 21px line was paid for by the 12 → 8 gaps around the masthead and chart, the 16 → 12 gap above the tabs, and a chart trimmed from 358 to 340. The chart and the qualifier must be fully visible above the fold on a 390 × 844 phone with browser chrome; the stepper may peek or sit just below. Below 360px wide the qualifier may wrap to two lines and the chart shrinks by the same 21px (`width: min(340px, 100svh − 504px, 100%)`).

In the chart: root disc labelled `stylelint 17.14.1`, rings 1–4 (plus 5 if keyv sits deeper); the `file-entry-cache` door on the right-hand half of the dial from 12 o'clock under the hatched wedge; infected labels `file-entry-cache 11.1.6` on ring 1, `flat-cache 6.1.24`, `cacheable 2.5.1`, `@cacheable/memory`, `@cacheable/utils`; the front arc on ring 1, "FRENTE · 1 SALTO"; keyv's dashed hollow node beyond shut gates; the left half the stippled "outras N diretas" sector; legend corner "116 NO GRAFO · 6 NO CAMINHO".

Below the fold: the live line, A MANHÃ DE 4 DE AGOSTO (the log, ~8 rows × 44px), the deck, CAMINHO, E SE, O QUE FAZER, FONTES E MÉTODO.

### 1440 × 900 (desktop)

The sheet is 1360px wide with 40px gutters, on 12 columns with a 32px gap. The banner is about 36px.

- The masthead strip spans all 12 columns (40px).
- **Left, columns 1–5 (about 540px):**
  - 32px gap.
  - The headline at the clamp max, 4.5rem (72px/0.95), three lines, about 205px.
  - 8px gap, then the qualifier (15px, one line, `ink-2`).
  - 16px gap, then the deck (17px, `ink-2`, 2–3 lines).
  - 24px gap, then the preset tabs (540 × 48).
  - 32px gap, then A MANHÃ DE 4 DE AGOSTO: the log, rows at 40px on desktop (pointer), so its first 5–6 rows sit above the fold, the current door row among them.
  - CAMINHO, E SE follow on scroll in this same column.
- **Right, columns 6–12 (about 788px), sticky at top 24px:**
  - The ZoneChart at `min(788px, calc(100svh - 36px - 40px - 24px - 44px - 32px))`, about 700px square on 900px, centred in the column. Every path node is labelled with name@version, the range tags sit on the edges ("^11.1.5 · aceitava 11.1.6", "^5.6.0 · barrado" ×3), and the sector names run along the rim.
  - The stepper under the chart at the chart's width, with the live line below it.
- While the left column scrolls, the chart and stepper stay in view, so a click on any log row or ledger row shows its effect beside it. Hovering or focusing a ledger row highlights its node, and the reverse. Hover is only a convenience: focus and tap do the same.
- Below both columns, full width: O QUE FAZER as four columns (two at 1024–1279px), then FONTES E MÉTODO as two columns.

## Build budget (~16h)

Data script and `data.json` 3h · polar layout + collapse (pure, tested) 4h · ZoneChart SVG + overlays 3.5h · EventLog + Stepper + URL state 1.5h · ledger, headline/qualifier templates, E se 2h · sections, dark tokens, responsive, finish review 2h. Cut to hit the budget: the v1 paste form, its API route and its states; the continuous clock and its `requestAnimationFrame` replay.

## Do's and Don'ts

- **Do** write the verdict in words on every edge the reader can see (ledger always; chart on desktop; log per event).
- **Do** keep the ring spacing equal. Distance on the chart is hop count, and nothing else may change a radius.
- **Do** show barred edges and "barrado" log rows with the same care as exposed ones. The contrast is the thesis.
- **Do** keep the qualifier on the line under the headline at every entry and preset. The headline is never shown without its condition.
- **Don't** add a play button, a time track, a scrubber, autoplay or any continuous-time control. Time is the log.
- **Don't** add a force layout, zoom/pan, glow, drop shadows, gradients (the hatch pattern is the only fill texture), rounded cards, or a dark-neon "threat map". In dark mode, no saturated pink and no halos.
- **Don't** use magenta for anything that is not exposure or reach: not for links, errors, focus or the filled stepper button.
- **Don't** use Martian Mono, or any mono for the clock. Sofia Sans (three widths) + Fragment Mono 400 only.
- **Don't** fetch anything at runtime. If a number is not in `data.json`, it is not on the page.
- **Don't** animate on page load. The chart arrives drawn, and motion happens only in response to the reader (tab, step, row, selection).
- **Don't** show a hover-only tooltip. Every datum on the chart has a tap target, a log row or a ledger row.
- **Don't** name maintainers, and don't say anyone was infected.

## Desvios na implementação

Registrados depois do build (2026-09-26), contra a especificação acima. Onde o texto acima e o que foi entregue divergem, vale esta lista.

1. **A frase da primeira tela diz "4 dos 444", não "5".** O registro do npm dá `@cacheable/utils@2.5.1` às 10:14:21 UTC, depois do evento-porta (`file-entry-cache@11.1.6`, 10:13:02). No instante padrão, o grafo alcança 4 versões infectadas; a quinta entra um passo depois, e a frase acompanha o passo. A aba do stylelint diz "ATÉ 5 INFECTADOS" (a contagem no fim da manhã), para não contradizer a frase. Coberto por teste em `data.test.ts`.
2. **"Nenhum caminho." em tinta, não em magenta.** A frase do eslint usa uma peça `lead` (peso da frase, cor `ink`): magenta é só exposição, e um zero não é exposição. Coberto por teste.
3. **As abas de caso são um `nav` de links com `aria-current`, não `role="tablist"`.** Não há painéis nem navegação por setas; `tab` anunciaria um widget que não existe. Os links funcionam sem JS (`?caso=`), como o estado padrão pede.
4. **No celular (< 480px) a aba mostra só o nome do pacote.** `stylelint 17.14.1` não cabe em 119px a 13px; a versão aparece no rótulo da raiz no gráfico e no caminho.
5. **A frente é um `path` cujo `d` transiciona**, não um círculo com `r` e `rotate`. O círculo rotacionado desenhava o arco no quadrante errado. Navegador sem transição de `d` troca o arco na hora, sem estado intermediário errado.
6. **Rótulos do gráfico com posicionamento guloso e linhas de chamada.** Um rótulo tenta os oito lugares ao redor do nó, depois lugares empilhados acima e abaixo com uma linha fina até o nó; nenhum rótulo cobre outro, nem cruza o anel de marcas (para o nome do setor na borda ficar legível). No celular, o que não cabe cai para o número do salto (às vezes `@cacheable/memory`, o `keyv` barrado e o rótulo "FRENTE · 1 SALTO", que colide com "1 SALTO" no anel 1). O arco da frente continua desenhado, e a linha ao vivo e o CAMINHO dizem a distância em palavras.
7. **Nó barrado rotulado "5.6.0 · barrado"**, com a versão, não só "barrado".
8. **Abaixo de 360px, "Próximo ▸"** no lugar de "Próximo evento ▸", para os três blocos do passo caberem em 288px.
9. **Linha do registro no celular (< 520px) em duas linhas:** o veredito vai para baixo do nome. Em uma linha, "nenhuma versão publicada" quebrava em três.
10. **Comandos de "O que fazer" quebram linha** em vez de rolar na horizontal: em quatro colunas a 1440px, a rolagem escondia metade de cada comando. O botão copiar copia o comando inteiro.
11. **Tamanhos:** nomes dos setores na borda a 36 unidades SVG (12px num gráfico de 340px; 17 unidades, também ≈ 12px, a partir de 600px de gráfico) e rótulos dos anéis a 12px, para nenhum rótulo do gráfico ficar abaixo do mínimo de 12px.
12. **Sem formulário de `package.json` e sem rota de API.** O brief previa um modo ao vivo contra o deps.dev; a regra do Labs é buscar uma vez, e o PRODUCT.md já o adiava para a v2. O "e se" roda sobre os três grafos pré-calculados.
13. **`semver` entrou como devDependency**, usado só pelo script de dados e pelos testes (`rules.ts`). O script grava em cada aresta as versões maliciosas que a faixa aceita, e a página só lê isso: `semver` não vai para o bundle do cliente.
