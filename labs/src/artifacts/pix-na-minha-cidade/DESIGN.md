---
name: Pix na minha cidade
description: A city's Pix habit printed as a queue ticket (senha) from a red dispenser on a repartição wall; the ticket is the shareable card.
colors:
  parede: "#E8E2D4"
  barra: "#B89F74"
  filete: "#6B5436"
  ink-barra: "#15130F"
  dispenser: "#D23A1E"
  dispenser-press: "#B42D16"
  slot: "#3A0F08"
  paper: "#F4F5F0"
  paper-shade: "#E7E9E2"
  ink: "#1F1D1A"
  ink-soft: "#5A5750"
  panel: "#141311"
  bezel: "#2A2825"
  bezel-label: "#B9B4AA"
  led: "#FF4A2E"
  led-ghost: "#2B1714"
  on-dispenser: "#FFFFFF"
typography:
  display:
    fontFamily: "Archivo (variable), sans-serif"
    fontVariationSettings: "'wdth' 125"
    fontWeight: 900
    fontSize: "clamp(6.5rem, 32vw, 10rem)"
    lineHeight: 0.82
    letterSpacing: "-0.02em"
    fontFeature: "tnum, lnum"
  title:
    fontFamily: "Archivo (variable), sans-serif"
    fontVariationSettings: "'wdth' 112"
    fontWeight: 800
    fontSize: "1.375rem to 1.75rem"
    lineHeight: 1.1
  city:
    fontFamily: "Archivo (variable), sans-serif"
    fontVariationSettings: "'wdth' 100"
    fontWeight: 800
    fontSize: "1.75rem (mobile) / 2rem (>=720px)"
    lineHeight: 1.1
  sentence:
    fontFamily: "Archivo (variable), sans-serif"
    fontWeight: 500
    fontSize: "1.125rem (mobile) / 1.1875rem (>=720px)"
    lineHeight: "24px (one print line)"
  body:
    fontFamily: "Archivo (variable), system-ui, sans-serif"
    fontWeight: 400
    fontSize: "0.9375rem to 1.0625rem"
    lineHeight: 1.5
  thermal:
    fontFamily: "Martian Mono (variable), ui-monospace, monospace"
    fontVariationSettings: "'wdth' 100 (normal) / 'wdth' 112.5 (double-width)"
    fontWeight: "400 / 700"
    fontSize: "0.65625rem to 0.875rem"
    lineHeight: "1.5rem (the print line)"
    letterSpacing: "0 to 0.06em"
rounded:
  none: "0"
  control: "4px"
  slot: "5px"
  panel: "6px"
  housing-wide: "14px 14px 4px 4px"
spacing:
  unit: "4px"
  print-line: "24px"
  gutter-mobile: "16px"
  gutter-wide: "48px"
  section: "72px (mobile) / 96px (wide)"
  measure: "38rem"
  container: "1240px"
components:
  housing:
    backgroundColor: "{colors.dispenser}"
    textColor: "{colors.on-dispenser}"
    padding: "12px 16px 0 (mobile, 132px tall) / 24px 24px 0 (wide)"
  slot:
    backgroundColor: "{colors.slot}"
    height: "10px"
    rounded: "{rounded.slot}"
  search-input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    height: "56px"
    rounded: "{rounded.control}"
  print-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "56px"
  ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "16px 16px 20px"
    width: "min(100% - 32px, 400px)"
  second-strip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "16px 16px 20px"
    width: "min(100% - 32px, 400px)"
  reverse-chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "2px 6px"
  share-button:
    backgroundColor: "{colors.dispenser}"
    textColor: "{colors.on-dispenser}"
    height: "56px"
    rounded: "{rounded.control}"
  share-button-hover:
    backgroundColor: "{colors.dispenser-press}"
  link-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "48px"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.control}"
  led-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.led}"
    rounded: "{rounded.panel}"
    padding: "16px 20px (mobile) / 24px 32px (wide)"
  roll:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
---

# Design System: Pix na minha cidade

Scope: this showcase only (`/demo/pix-na-minha-cidade`). Nothing here binds Labs or the other artifacts. Product truth lives in `PRODUCT.md` beside this file; the research, numbers and states in `BRIEF.md`. Tokens become custom properties on the artifact's root element (`.sala`) in `pix.module.css`; the Labs banner keeps its own global styles.

This file was written **before** the build, as the build's spec (the workflow asked for it up front). After the build, re-document from the built page and correct anything that moved.

## Direction contract

Ship this as an HTML comment, the first child of the artifact's root element (the tarken artifact does the same with `DIRECTION`), so it survives the production build. Grep the build output for `c189c88b`.

```
THESIS: Your city's place in Brazil's Pix habit is a senha: a queue ticket printed from a dispenser, number big, place in line under it, source in the fine print. Refuses the "Wrapped" gradient story card and the data-journalism dashboard.
OWN-WORLD: A repartição waiting room in its other canonical paint scheme: a warm "gelo" wall over an ochre-brown oil barra with a dark brown filete; a tomato-red molded dispenser with a maroon slot; cool thermal paper with ESC/POS print modes (double-width Archivo numerals, Martian Mono lines, reverse-print chips, dotted leaders, torn zigzag edge); a black LED caller panel in red seven-segment digits with ghost cells.
STORY: The reader sees São Paulo's ticket (38 Pix por usuário, Brasil 43, senha 2.805 de 5.571), types their own city into the dispenser, watches a new ticket print, and posts it.
FIRST VIEWPORT: 390px (banner counted at 56px): a 132px red dispenser holding the title and search, the senha hanging from its slot (city, number, the Brasil sentence, the place-in-line rows, torn edge), the share button under the torn edge; the second strip (bars, 12 months, valor médio, fine print) prints below the fold. 1440px: dispenser + ticket left (440px), LED panel "2805" and the whole queue plotted right.
FORM: senha de fila (thermal ticket + caller panel), 7th of 7 grounded candidates; seed c189c88b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

### How the direction was chosen (unattended run)

No question tool reached Daniel in this workflow, so the impeccable interview and the choice page did not run; the assigned direction ships and the alternates below are recorded for him to overrule.

- **Rut, kept out:** the Spotify-Wrapped-style gradient story card (the brief's literal reading of "shareable card") and its opposite, a sober data-journalism dashboard with a choropleth. Also out: anything Pix-teal or bank-app-like.
- **Grounded candidates, by resonance:** 1 figurinha de álbum (one sticker per municipality); 2 cartão-postal de banca "Lembrança de…"; 3 lambe-lambe da gráfica popular; 4 comprovante de Pix (the literal one); 5 cartolina de feira em pincel atômico; 6 placa de entrada de cidade; **7 senha de fila (assigned)**.
- **Challengers weighed** (fused, on audience identification and product clarity): *seven-segment display family* is the strongest and is native to the assigned world already (every Brazilian waiting room has a red LED "SENHA" panel), so its segment grammar is absorbed into the LED panel rather than replacing the ticket. *Azulejo station hall* identifies strongly in São Luís, Salvador and Belém but weakly in the South, and makes a city card into a tile panel that says less than a ticket. *Cassette j-card* (side A city / side B Brasil) fuses poorly because a mixtape has no notion of rank. Otome choice frame, sewing-pattern envelope and fluid-ink basin fuse poorly: none carries "one number, a place in line, a source".
- Why the senha holds: the brief's own sentence is "São Paulo está no meio da fila". A place among 5,571 is literally a queue number; every Brazilian has held a paper senha at a bank, INSS, cartório, açougue or farmácia; and a senha is a thing you keep and show. It looks like nothing else in the set (a replay, a token dashboard, a supply-chain inspector, an energy map).

## Overview

**Creative North Star: "Pegue sua senha"**

The page is a waiting-room wall. At the top, a red dispenser holds the search; out of its slot hangs a thermal ticket with the city's answer. The ticket is the product: the same object on the page and in the PNG that gets posted. The LED caller panel says the place in line; a long paper roll shows the whole line of 5,571. The source is printed on the ticket, as fine print is on every real one.

**Key characteristics:**
- Two materials only carry content: thermal paper (answers) and the LED panel (the place in line). The wall and the dispenser are the setting.
- Print modes are the type system: normal line, double-width numerals, reverse-print chip, dotted leaders, dashed rules. No other typographic devices.
- Square paper corners; the only rounded things are physical molded parts (slot, housing on wide screens, panel bezel, controls at 4px).
- Neutral wording. The queue has a front and a back, not winners: "usa mais" / "usa menos".

### Queue direction (fixed)

Position 1 is the municipality with the **most** Pix por usuário in ago/2026; 5.571 the fewest. This matches the brief's figures (São Paulo 2.805º, Manaus 3º). Every surface that draws the queue draws the front on the left.

## Colors

Strategy: **Committed**. The dispenser red owns the top band of the first viewport on the phone (about 16% of the screen) and every primary action; the wall owns the rest as a two-tone painted field. The wall is **warm** and the paper is **cool**: that temperature split makes the ticket read as thermal paper and not as a cream editorial card, and it keeps this showcase apart from its siblings (see "Distance from the other showcases").

Checked contrasts (WCAG relative luminance, computed 2026-09-25): ink on paper 15.35:1; ink-soft on paper 6.58:1; white on dispenser 4.81:1 (bold labels 17px and up only); white on dispenser-press 6.31:1; ink on parede 13.02:1; ink-soft on parede 5.58:1; **ink #1F1D1A on barra 6.61:1, below the 7:1 target**, so text set on the barra uses `ink-barra` #15130F at 7.29:1 (the barra keeps its canonical #B89F74 rather than being lightened out of the ochre); LED on panel 5.54:1. Non-text: dispenser against parede 3.73:1; paper against parede 1.18:1 and against barra 2.32:1 (the ticket's edge is carried by its drop-shadow and torn teeth, not by the ground).

- **Dispenser red** (`dispenser` #D23A1E): the housing, the primary button, the selected city's bar in the queue and its marker. A molded-plastic tomato red, deliberately orange of the banks' crimsons. Never used for text on paper, never as a "bad" signal.
- **Dispenser press** (`dispenser-press` #B42D16): hover/active of red controls.
- **Slot** (`slot` #3A0F08): the dispenser's mouth; the ticket emerges from it.
- **Parede** (`parede` #E8E2D4, "gelo") and **Barra** (`barra` #B89F74, ochre-brown oil), split by **Filete** (`filete` #6B5436, 6px, dark brown): the oil-painted half wall of a public office, the warm scheme of INSS agencies, fóruns and old bank halls. Hard stops, never a blended gradient.
- **Ink on barra** (`ink-barra` #15130F): the only text color allowed on the barra (7.29:1). `ink-soft` never sits on the barra (2.83:1); captions that fall there are set in `ink-barra` or moved onto paper.
- **Paper** (`paper` #F4F5F0): thermal paper, cool and neutral. It stays cooler than the wall; never warm it toward cream or ivory to "match" the barra. **Paper shade** (`paper-shade` #E7E9E2): active rows, the Brasil hatch ground.
- **Ink** (`ink` #1F1D1A) / **Ink soft** (`ink-soft` #5A5750): thermal print; ink-soft only for fine print, axis labels and secondary lines.
- **Panel** (`panel` #141311), **Bezel** (`bezel` #2A2825), **Bezel label** (`bezel-label` #B9B4AA), **LED** (`led` #FF4A2E), **LED ghost** (`led-ghost` #2B1714): the caller panel only.

Shadows are warm-tinted to sit on the painted wall: `rgb(60 44 24 / α)` wherever a shadow is specified below. No green-tinted or neutral-grey shadows.

No Pix teal anywhere, no bank colors, no purple/blue.

### Distance from the other showcases

Side by side in the portfolio, raio-de-explosao sits on cool paper #EDEFEA, curtailment-br on enamel #DDE6DF over a sage console #A9C3B5, conta-de-tokens on a cool grey panel #DADDD8: three cool, pale, grey-green grounds. This one is the only warm ground in the set (gelo over ochre-brown by day, warm black by night), with a tomato dispenser and cool white paper as the figures. Do not drift the wall back toward grey, green or neutral; if a tweak is needed, move along the ochre axis.

### Dark (prefers-color-scheme: dark): "a repartição à noite"

The lights are off in the room; paper is still paper and the panel glows.
- `parede` #1E1A15, `barra` #2A231B, `filete` #5C4A30 (the painted line still catches a little light: 2.04:1 against the wall). Warm blacks, never neutral grey.
- Text set directly on the wall uses `#EDE6D8` (13.93:1 on parede, 12.48:1 on barra) and, for secondary lines, `#C2B6A2` (8.66:1 on parede, 7.76:1 on barra). `ink-barra` is not used in dark.
- `paper` #E9EAE4, `paper-shade` #DADCD4 (still cool: the ticket is the brightest, coolest thing in the dark room); ink unchanged (14.30:1 on dark paper).
- `dispenser` unchanged (3.60:1 against the dark wall); the housing gains `box-shadow: 0 0 0 1px rgb(255 255 255 / .06)`. Warm shadows deepen to `rgb(0 0 0 / .45)`.
- LED glow rises from `drop-shadow(0 0 6px rgb(255 74 46 / .55))` to `drop-shadow(0 0 10px rgb(255 74 46 / .7))`.
- Guarded as elsewhere in Labs: `@media (prefers-color-scheme: dark)` on the artifact root. The PNG is always rendered in the light palette.

## Typography

Loaded with `next/font/google` in the artifact component, as `tarken-fila-da-safra` does:

```ts
import { Archivo, Martian_Mono } from 'next/font/google';
const print = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-print' });
const thermal = Martian_Mono({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-thermal' });
```

Both are variable (Archivo wdth 62–125, wght 100–900; Martian Mono wdth 75–112.5, wght 100–800; verified in `next/font`'s font data). Width is the expressive axis, standing in for the ESC/POS print modes.

- **Display / double-width numeral** (Archivo, `wdth` 125, 900, `clamp(6.5rem, 32vw, 10rem)` (125px at 390, a 102px line box), lh 0.82, tracking -0.02em, `tnum lnum`): the Pix-por-usuário number on the ticket. Rounded to an integer ("38"); the exact value ("38,1") appears in the comparison bars.
- **Title** (Archivo, `wdth` 112, 800): the page h1 in the housing (22px mobile, 28px wide) and section heads on the wall (24px / 32px).
- **City** (Archivo, `wdth` 100, 800, 28px / 32px): the ticket's city name, IBGE spelling ("São Paulo").
- **Sentence** (Archivo 500, 18px/24px on phones so it sits on the print line; 19px/24px from 720px): the one comparison sentence on the ticket. Three lines at 390 for São Paulo.
- **Body** (Archivo 400, 15–17px, lh 1.5): context line, method, captions on the wall. Measure 38rem.
- **Thermal** (Martian Mono): every "printed" line: ticket header, key-value rows, axis labels, fine print, button labels on dark. Sizes: 14px (rows, values at 700), 13px (unit line), 12px (headers, uppercase, tracking .06em), 11px (axis), 10.5px/15px (fine print). Double-width variant `wdth` 112.5 for the header "PIX NA MINHA CIDADE". The ticket's vertical rhythm is the **print line: 24px**; every ticket block sits on multiples of it.

Numbers everywhere use `font-variant-numeric: tabular-nums` and pt-BR formatting (`2.805`, `38,1`, `R$ 243`).

## Layout

Spacing unit 4px; steps 4, 8, 12, 16, 24, 32, 48, 72, 96. Sections on the wall are separated by 72px (mobile) / 96px (≥1080px), more above a heading than below it (heading margin 0 0 16px).

The wall: the artifact root `.sala` paints
`background: linear-gradient(to bottom, var(--parede) 0 var(--barra-y), var(--filete) var(--barra-y) calc(var(--barra-y) + 6px), var(--barra) calc(var(--barra-y) + 6px));`
with `--barra-y: 440px` (mobile), `560px` (≥1080px). Hard stops. At 390 the filete crosses behind the senha at the sentence; the share row, the second strip and everything after sit on the barra, which is why every wall caption below the ticket uses `ink-barra`.

Breakpoints: `<720px` one column, gutter 16px; `720–1079px` one column centered, max 560px, ticket 400px; `≥1080px` two columns inside a 1240px container with 48px gutters: `grid-template-columns: 440px 1fr; column-gap: 72px`.

### First viewport at 390×844 (usable ~390×750)

Recounted with the Labs banner as the sibling specs measure it at this width: two lines, **56px**. Every y is from the top of the document; the fold is at ~750.

| y | Block | Height |
|---|---|---|
| 0–56 | Labs banner (global, two lines) | 56 |
| 56–188 | **Housing**, full bleed, red, padding 12px 16px 0: h1 "Pix na minha cidade" (Title 22px, 24px line box) · 10px · search row 56 · 12px · slot 10 · 8px under the slot. The visible label "Qual é a sua cidade?" leaves the housing on phones: it becomes the input's placeholder, and the `<label>` stays in the DOM, visually hidden. | 132 |
| 183 | Senha top, tucked 5px into the slot's lip | |
| 183–241 | Padding 16 · header row 24 · dashed rule (8 + 2 + 8) | 58 |
| 241–273 | City + UF chip | 32 |
| 281–383 | "38" (Display, 125px, 102px line box) | 102 |
| 383–407 | Unit line "Pix por usuário em agosto de 2026" | 24 |
| 415–487 | Sentence, 3 print lines (Brasil 43 is in it) | 72 |
| 495–513 | Dashed rule | 18 |
| 513–585 | Position rows: SENHA NO BRASIL 2.805 / 5.571 · NO ESTADO (SP) 331 / 645 · ENTRE AS CAPITAIS 25 / 27 | 72 |
| 593–609 | Source line "FONTE: BCB · ODbL · AGO/2026" | 16 |
| 609–636 | Padding 20 + torn teeth 7 | 27 |
| 648–704 | **"Compartilhar senha"**, 12px under the torn edge | 56 |
| 716–764 | "Copiar link" (straddles the fold; fine) | 48 |
| 780– | **Second strip**, below the fold | |

Headroom: the share button ends 46px above the fold. A four-line sentence (a long name such as "Santa Rita do Passa Quatro") adds 24px and still clears it. A two-line city name **and** a four-line sentence add 56px and let the button slip ~10px under the fold; that combination is accepted. The city, the number, the sentence with Brasil 43 and the senha row stay fully above the fold in every case (the senha row ends at ≤ 641 in the worst case).

Two moves get there, and both are kept:
1. **Housing tightened to 132px** (from ~150): 12px top padding, the visible field label folded into the placeholder.
2. **The ticket prints in two tears.** The senha (the part you hold in the queue) ends with its torn edge right after the position rows and a one-line source; the comparison bars, the 12-month sparkline, "VALOR MÉDIO POR PIX" and the full fine print print on a **second strip** under the share row. The first draft counted a single ~520px ticket; its content actually measures ~770px, which would have put the button near y 970.

Both pieces are in the server HTML on first paint (nothing hidden, deferred or animated); the second strip simply sits under the share row.

### First viewport at 1440×900

- Banner (one line at this width, ~36px), then 48px.
- **Left column (440px):** housing with radius 14px 14px 4px 4px, padding 24px 24px 0, h1 28px, and the visible label "Qual é a sua cidade?" back above the search row (there is room here); the senha (392px) hanging from the slot with `transform: rotate(-0.8deg); transform-origin: 50% 0` (it hangs, it is not a card on a table). Share row under it: "Compartilhar senha" and "Copiar link" side by side (1fr auto). The second strip follows under the share row, unrotated, and crosses the fold. Same two-tear structure as on the phone: one component tree, no desktop-only ticket.
- **Right column (≈ 680px):** from the same top line:
  - The **LED panel**, full column width: "SENHA" label on the bezel (Thermal 12px 700, bezel-label), four seven-segment cells 148px tall, "de 5.571" to their right baseline-aligned (Thermal 16px, bezel-label), and a second line under the digits: "São Paulo · 38 Pix por usuário em ago/2026" (Thermal 13px, bezel-label). Panel height ≈ 250px.
  - 40px, then **the queue** (roll) at 280px tall with its title "A fila inteira" above it on the wall.
  - The record line (context) under the roll.
- The barra line (`560px`) crosses behind both columns at mid-height: the dispenser and panel are "mounted" above it, the roll reaches below it.

Below the fold on both: the queue (mobile only, since desktop shows it above), the 27 capitals, the method and sources.

## Components

### Housing (dispenser)
Red molded box. `box-shadow: inset 0 2px 0 rgb(255 255 255 / .18), inset 0 -3px 0 rgb(0 0 0 / .18)`; wide screens add `0 12px 24px rgb(60 44 24 / .24)`. Holds the h1, the search form and the slot. The search is a real `<form method="get" action="">` with `<input name="q">`: without JavaScript the server resolves `?q=` and renders the ticket (or the no-match / homonym list as a server-rendered list under the housing).

### Search typeahead (combobox)
- Client only, over the 58 KB index. Normalizes NFD, strips diacritics, lowercases; matches prefix of name first, then word-start, then substring. Two-letter UF input ("SP") lists that state's municipalities by payers, capital first.
- `role="combobox"` on the input, `aria-expanded`, `aria-controls`, `aria-activedescendant`; listbox of at most 7 options, each 52px tall, on paper, printed style: name (Archivo 17px 600) + reverse-print UF chip + state name (Thermal 12px, ink-soft). Active option: `paper-shade` ground with a 4px dispenser-red bar at the left edge. Arrow keys move, Enter selects, Esc closes. Polite live region: "7 municípios encontrados" / "Nenhum município com esse nome".
- The listbox drops from the input's bottom edge, full housing width minus gutters, over the ticket, `box-shadow: 0 10px 20px rgb(60 44 24 / .28)`, square corners.

### Ticket (the card): the senha and the second strip

The ticket prints in two tears of the same paper: **the senha** (the answer, above the fold) and **the second strip** (the evidence), with the share row between them on the wall. In the PNG they are one continuous strip joined at a perforation (see "The shareable PNG"): same blocks, same order, same type.

Paper ground on both; faint thermal banding `background-image: repeating-linear-gradient(0deg, rgb(0 0 0 / .015) 0 1px, transparent 1px 3px)`. Bottom edges torn: each piece gets
`mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%;` (7px-deep teeth). The second strip's top edge is torn too (the same mask mirrored `at top`), since it came off the roll above. Shadows go on wrappers, since the mask clips them: `filter: drop-shadow(0 1px 0 rgb(0 0 0 / .08)) drop-shadow(0 10px 14px rgb(60 44 24 / .24))`.

Every block sits on the 24px print line.

**The senha** (`<article aria-labelledby="ticket-city">`), padding 16px 16px 20px:
1. **Header row:** "PIX NA MINHA CIDADE" (Thermal 12px 700, `wdth` 112.5, tracking .06em) left; "AGO/2026" right. Then a 2px dashed ink rule (`border-top: 2px dashed`), 8px margins.
2. **City:** "São Paulo" (City) followed by the UF as a **reverse-print chip** (ink ground, paper text, Thermal 13px 700, padding 2px 6px, vertically centered, 8px gap). Long names wrap; the chip stays with the last word (`white-space: nowrap` on last word + chip).
3. **Number:** "38" (Display). Underneath, the unit line: "Pix por usuário em agosto de 2026" (Thermal 13px). Screen-reader text on the number: "38 Pix por usuário, em média".
4. **Sentence** (Sentence type): "Quem usa Pix em São Paulo fez, em média, 38 Pix em agosto. A média do Brasil é 43." Pattern fixed: `Quem usa Pix em {cidade} fez, em média, {n} Pix em agosto. A média do Brasil é 43.` The number is an average over the city's PF payers; the sentence never reads as if every user did it. Nothing else judges the gap.
5. **Outlier note** (only when payers > estimated population): a reverse-print block, full width, padding 8px 10px, Thermal 12px: "ATENÇÃO  Números afetados por pessoas que não moram no município (ex.: fronteira)." (Adds ~48px; in the outlier case the share button may cross the fold.)
6. Dashed rule. **Position rows** (key … value, dotted leaders: key and value in a flex row, a `flex: 1` spacer with `border-bottom: 2px dotted ink-soft` at baseline), Thermal 14px, values 700:
   - "SENHA NO BRASIL ……… 2.805 / 5.571"
   - "NO ESTADO (SP) ……… 331 / 645"
   - "ENTRE AS CAPITAIS ……… 25 / 27" (capitals only)
   - Small sample (< 2.000 payers): the Brasil row's value becomes the decile phrase, e.g. "entre os 10% que mais usam", and the state row is omitted.
7. **Source line** (Thermal 10.5px/16px, ink-soft): "FONTE: BCB · ODbL · AGO/2026". The full attribution is on the second strip; the senha is never unsourced on its own.
8. Torn edge.

**The second strip** (`<section aria-label="Detalhes da senha de {cidade}">`), padding 16px 16px 20px, torn top and bottom:
1. **Comparison bars:** two 10px bars on one scale (`0 … max(city, brasil) × 1.15`), 8px apart, labels left-aligned above each in Thermal 12px: "São Paulo 38,1" (solid ink bar) and "Brasil 43,2" (paper-shade bar with `repeating-linear-gradient(45deg, ink 0 1.5px, transparent 1.5px 5px)`). The difference reads by length and by the numbers, not by color.
2. **Sparkline** (SVG, 100% × 56px, `vector-effect: non-scaling-stroke`): city polyline 2px ink, Brasil polyline 1.5px ink `stroke-dasharray: 2 3`. End labels at the right in Thermal 11px ("38", "43"); "set/25" and "ago/26" under the ends. Caption above: "12 MESES: SÃO PAULO × BRASIL" (Thermal 11px 700). `role="img"` with an `aria-label` giving first and last values of both.
3. **Row:** "VALOR MÉDIO POR PIX ……… R$ 243".
4. Dashed rule, then **fine print** (Thermal 10.5px/15px, ink-soft): "Fonte: Banco Central do Brasil, Estatísticas do Pix (dadosabertos.bcb.gov.br/dataset/pix), ODbL. Nomes e população: IBGE. Métrica: FGV EAESP, Geografia do Pix 2. Médias por usuário; só pessoas físicas; município de residência de quem paga." Then the URL `labs.teamdbsolutions.com/demo/pix-na-minha-cidade`, then, centered, "GUARDE SUA SENHA" (Thermal 11px 700, tracking .1em).
5. Torn edge.

### Slot
Described in the first viewport. When a new ticket is loading, a 6px LED dot (`led`) sits at the slot's right end and blinks at 1Hz (the busy lamp). Otherwise hidden.

### Share row
- **"Compartilhar senha"** (primary): dispenser red, white Archivo `wdth` 112 700 17px, height 56px, radius 4px, full width on mobile. Hover `dispenser-press`; active `translateY(1px)` + `inset 0 2px 0 rgb(0 0 0 / .2)`. Focus: `outline: 3px solid ink; outline-offset: 3px`.
  - Renders the 1080×1350 PNG, then `navigator.share({ files: [file], title, text: "{cidade}: {n} Pix por usuário em agosto. E a sua cidade?", url })` (always "por usuário", so it reads as an average, never "fez {n} Pix") when `navigator.canShare({ files })` is true.
  - Unsupported: label is "Baixar imagem" from hydration on, and it downloads `pix-{cidade-slug}-{uf}.png`.
  - Rendered `hidden` in the server HTML and revealed on hydration (no dead button without JS).
- **"Copiar link"** (secondary): 48px, transparent, 2px ink border, ink Archivo 600 16px. Copies `…/demo/pix-na-minha-cidade?c={ibge}`. Without JS, the link is shown as selectable text under the ticket instead.
- **Printed slip** (feedback): a 36px paper strip that slides out from under the button with "LINK COPIADO" / "IMAGEM SALVA" (Thermal 12px 700), holds 1.4s, retracts. `role="status"`.

### Context line
Under the second strip, on the barra, in `ink-barra` (light) / `#C2B6A2` (dark): "Em 4 de setembro de 2026 o Pix bateu recorde: 318.073.816 transações em um dia (Banco Central, via Metrópoles)." Body 15px; "via Metrópoles" links to the article. Never inside the ticket.

### LED caller panel
Black panel with a 6px bezel (`box-shadow: inset 0 0 0 6px var(--bezel), 0 8px 18px rgb(60 44 24 / .28)`), radius 6px. Label "SENHA" printed on the bezel area, top-left.
- **Digits:** hand-built SVG seven-segment cells (component `Segmentos`, no font). Each cell 0.56:1 (w:h), segments are hexagonal bars 14% of cell height thick, 4% gaps, 6° italic skew. Unlit segments are drawn in `led-ghost`, lit in `led` with the drop-shadow glow. Always 4 cells; numbers under 1.000 leave leading cells as **ghost 8s**, never zeros. Heights: 64px (mobile), 148px (≥1080px).
- To the right: "de 5.571" (Thermal, bezel-label). Wide screens add the second line with city and number.
- Small sample: all four cells show only the middle segment lit ("- - - -"), and the second line reads "posição exata omitida: poucos usuários".
- `aria-hidden` on the SVG; a visually hidden sentence carries "Senha 2.805 de 5.571 municípios".
- Mobile placement: heading of "A fila inteira" section (after the context line), not in the first viewport.

### The queue ("A fila inteira")
Title (Title 24px) on the wall (the barra on phones, so `ink-barra`): "A fila inteira"; subtitle (Body 15px, `ink-barra`, never ink-soft on the barra): "5.571 municípios, do que mais usa Pix por usuário ao que menos usa."
A paper strip ("o rolo") with straight ends and the torn mask on its right end only, padding 16px. Inside, a server-rendered SVG:
- `viewBox="0 0 558 200"`, `preserveAspectRatio="none"`, `shape-rendering="crispEdges"`, height 200px (mobile) / 240px (wide). 558 columns = ranks in groups of 10 (last group 1), each column a 1-unit bar at the group's **median** value, ink-soft.
- Y from 0 to the 99th percentile; bars above it are clipped at the top with a 3-unit ink cap and the note "valores acima de {p99} cortados no topo" under the strip (Thermal 11px).
- Brasil: a horizontal dashed ink line at 43,2 with the label "Brasil 43" at its right end above the line (HTML overlay, Thermal 12px 700; not SVG text, which would stretch).
- The city: its column drawn 3 units wide in dispenser red, with an HTML label above it: "São Paulo · 38 · 2.805º" and a 1px ink leader. The label flips to the column's left side when the column is in the right 30%.
- Capitals: 27 short ticks (6 units) under the baseline; labels only for the first capital in the queue (Manaus), the last (Florianópolis) and the city if it is a capital.
- Axis: "frente da fila" at left, "fim da fila" at right (Thermal 11px, ink-soft).
- Text alternative under the SVG (visually hidden list is not enough; also visible): "São Paulo está em 2.805º. Manaus, a capital mais à frente, em 3º."

### Capitals list ("As 27 capitais")
On a paper roll (same material). Rows 44px: rank (Thermal 13px, 3ch, tnum), name (Archivo 16px 600) + UF chip, a thermal-dither bar (`repeating-linear-gradient(90deg, ink 0 2px, transparent 2px 3px)`, width proportional to the value on a 0–max scale), value (Thermal 14px 700, right). The Brasil reference is inserted at its place as a row with a 2px dashed top and bottom border: "Brasil 43,2". The current city, if a capital, is **reverse print** (ink ground, paper text, bar in paper). Each row is a link to `?c={ibge}` (whole row target, 44px). Wide: two columns of 14 / 13 rows plus the Brasil row where it falls.

### Method and sources
On the wall (barra), Body 15px/24px in `ink-barra`, max 38rem. Subheads in Thermal 12px 700 uppercase. Content per the brief: metric definition (`QT_PagadorPF / QT_PES_PagadorPF`), month, Brasil = sum / sum and its assumption, why PF only, residence vs where the Pix happens, BCB (ODbL) + IBGE + FGV with links, the record line, the MED 2.0 national note (2.925.121 contestados in mar/2026), "dados obtidos em {fetchedAt}", and "Os dados derivados desta página estão sob ODbL (ver DATA-LICENSE)".

### Slips (notices)
A 44px paper strip under the slot or above the ticket, Thermal 13px, square, `role="status"`. Used for: invalid `?c`, print error, no-JS no-match header. A slip pushes the senha down 44px; in the invalid-`?c` state the share button may cross the fold, which is accepted (the slip is the news there).

## States

- **Default (no `?c`):** São Paulo ticket, SSR, no animation. Never an empty screen.
- **Invalid or unknown `?c`:** São Paulo ticket plus a slip above it: "Não achamos esse município. Mostrando São Paulo."
- **Loading (client city change):** the input shows the chosen name; the button label becomes "IMPRIMINDO…" and is `aria-disabled`; the slot's busy lamp blinks; the current ticket stays and the ticket region is `aria-busy="true"`. Navigation uses `router.push('?c=…', { scroll: false })` inside `useTransition`.
- **Error (navigation fails or takes > 8s):** busy lamp off; a slip under the slot: "Não deu para imprimir agora." with an underlined "Tentar de novo" button (48px tall hit area). The old ticket remains.
- **Search, no match:** one non-selectable row "Nenhum município com esse nome." followed by "Talvez:" and 3 prefix suggestions as options. Server version (no JS, `?q=`): the same content as a list under the housing, suggestions as links.
- **Homonyms:** options show name + UF chip + state name ("Bom Jesus · PI", "· RS", "· SC"); no auto-pick. Server `?q=` with several exact matches renders the list instead of a ticket change.
- **Small sample (< 2.000 payers):** metric shown plainly; rank replaced by the decile phrase on the ticket; LED shows dashes; queue label drops the rank ("Serra da Saudade · 51").
- **Outlier (payers > estimated population):** reverse-print "ATENÇÃO" block on the ticket; metric intact; the same note printed in the PNG.
- **Capital vs not:** the "ENTRE AS CAPITAIS" row and the capital highlight in the list exist only for capitals.
- **Share unsupported:** "Baixar imagem"; slip "IMAGEM SALVA".
- **No JavaScript:** search via GET, ticket and queue render, share button absent, link shown as text.

## The shareable PNG

Canvas 1080×1350 (4:5), always light palette, drawn by the client with the same fonts. Resolve the real family names from the next/font variables (`getComputedStyle(root).getPropertyValue('--font-print')`) and `await document.fonts.load('900 100px <family>')` for both faces before drawing.

The PNG is the ticket unrolled: the senha and the second strip printed as **one continuous strip** joined at a perforation, as the printer hands it over before anyone tears it. Print line in the PNG: 36px (1.5×).

- Ground: dispenser red, full canvas.
- y 48–88: "PIX NA MINHA CIDADE" (Martian Mono 700, 30px, white, wdth 112.5) left at x 96; "AGO/2026" right at x 984.
- y 120: the slot, x 110–970, 24px tall, radius 12, `slot` color.
- Ticket: x 150–930 (780px wide, 700px content), top at y 132 (under the slot's lip). Shadow `0 16px 28px rgb(0 0 0 / .25)`.

| y | Block |
|---|---|
| 168–216 | City (Archivo 800, 42px) + UF chip |
| 216–396 | Number (Display, 220px, 180px line box) |
| 396–432 | Unit line (Martian Mono 20px) |
| 444–516 | Sentence `Quem usa Pix em {cidade} fez, em média, {n} Pix em agosto. A média do Brasil é 43.` (Archivo 500, 28px/36px, 2 lines) |
| 528–544 | Dashed rule |
| 552–660 | Position rows (Martian Mono 21px, values 700) |
| 672–708 | **Perforation**: 6px dots at 14px pitch across the full width, a 10px semicircular notch cut into each side edge. No scissors icon. |
| 720–816 | Comparison bars (labels 18px, bars 15px) |
| 828–972 | 12-month sparkline: caption, 84px plot, end labels |
| 984–1020 | "VALOR MÉDIO POR PIX ……… R$ 243" |
| 1032–1188 | Dashed rule, fine print (Martian Mono 16px/24px, ink-soft): full BCB/ODbL attribution, IBGE, FGV, "médias por usuário; só pessoas físicas", page URL with `?c=` |
| 1200–1224 | "GUARDE SUA SENHA" |
| 1236–1250 | Torn edge, 28px teeth, 14px deep |

- The outlier "ATENÇÃO" block, when present, prints between the sentence and the rows.
- Fit rule: measure the laid-out height before drawing; if the torn edge would pass y 1290 (long city, 3-line sentence, outlier note), step the number down 20px at a time to a floor of 160px. The fine print and attribution never shrink below 16px and are never cut.
- Output `canvas.toBlob('image/png')`; file name `pix-{cidade-slug}-{uf}.png`.

## Motion

The one orchestrated motion is the printer. Everything else is state feedback.

- **Tear (old ticket):** 200ms, `cubic-bezier(0.4, 0, 1, 1)`: `transform: translateY(24px) rotate(3deg); opacity: 0`, transform-origin top right.
- **Feed (new senha):** starts at 200ms, 640ms, `steps(20, end)`: from `translateY(calc(-100% - 12px))` to `translateY(0)`, inside a wrapper with `clip-path: inset(0 -48px -96px -48px)` whose top edge is the slot, so the paper appears to come out of the mouth line by line. On wide screens the -0.8deg hang applies after the feed ends (transition 240ms ease-out).
- **Second strip:** not attached to the slot and usually below the fold, so it does not feed; its contents swap with a 150ms opacity crossfade when the senha finishes feeding.
- **LED:** digits swap instantly at the end of the feed (segments die and ignite, nothing slides), then the panel blinks twice: keyframes opacity 1 → .25 → 1 → .25 → 1 over 360ms, `steps(1)` per phase.
- **Busy lamp:** 1s period, 50% on, `steps(1)`.
- **Listbox open:** 120ms, `cubic-bezier(0.2, 0, 0, 1)`, opacity 0 → 1 and translateY(-4px) → 0. Close: instant.
- **Button press:** 80ms ease-out.
- **Printed slip:** out 160ms `cubic-bezier(0.2, 0, 0, 1)` (translateY(-100%) → 0), hold 1400ms, back 160ms ease-in.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no tear, feed, blink, or slip travel. The new ticket replaces the old with a 150ms opacity crossfade; LED digits swap instantly; busy lamp is steady on; slips appear and disappear without movement.
- First paint never animates; content is visible by default and animation only runs on a client-driven city change.

## Do's and Don'ts

**Do**
- Keep the ticket the same object on the page and in the PNG: the senha and the second strip on the page, the same blocks joined at the perforation in the PNG.
- Say "em média" in every sentence that states the number; "por usuário" in every label.
- Keep the wall warm and the paper cool.
- Print the source on the ticket and on the PNG.
- Use the fixed sentence pattern (with "em média") and "usa mais / usa menos".
- Keep touch targets ≥ 48px (search row and primary button 56px).
- Keep every value readable as text; bars and LED are redundant encodings.

**Don't**
- No Pix logo, Pix teal, BCB identity, bank colors, or Wrapped-style gradients.
- No cool grey-green grounds or green-tinted shadows (the sibling showcases own that register); no cream or ivory paper.
- No ink-soft text on the barra.
- No choropleth, no glass, no rounded cards, no icon tiles.
- No words like "campeã", "atrasada", "lanterna", no trophies or medals for rank 1.
- No QR code on the ticket (on a Pix-themed image it reads as a payment code).
- No invented users, share counts or testimonials; no reasons attributed to a city.
- No zero-padded senha numbers ("0038"): ghost cells on the LED, plain numbers on paper.

## Desvios na implementação

Built 2026-09-25/26 from this spec; screenshots at 390×844 and 1440×900 checked against "First viewport" above. Where the build moved, it is recorded here.

- **Labs banner is three lines at 390px, not two** (75px, not 56). It is global and not this artifact's to change. Everything below shifts ~19px: the housing is 75–207, the senha 202–647, and "Compartilhar senha" ends at 715, still ~130px above the fold at 844. The 1440 banner is 36px, as counted.
- **Queue label: slides instead of flipping.** The spec flips the city's label to the left of its leader past 70% of the queue. At 390px a centre-of-the-queue city (São Paulo, 50%) already ran off the roll. The label now slides along its own width in proportion to the column's place (`--at`, 0 at the front, 1 at the back): it starts at the leader at the front, ends at it at the back, and is centred in the middle, so it stays inside the roll at every width. The leader stays on the column.
- **Capital names under the roll: only the front and the back** (Manaus, Florianópolis). The spec also named the city when it is a capital, but that third name collided with the others on a phone ("São Paulo" over "Florianópolis"), and the city already carries its own label above the roll. Its tick stays red.
- **Search placeholder is transparent from 1080px**, where the visible label "Qual é a sua cidade?" is back above the field; the placeholder only repeated it. On phones the placeholder still carries the question, as specified.
- **Wide (≥1080px): "As 27 capitais" and the method use the room's 1240px container** and its left edge, instead of a centred 560px column. At 560px the two-column capitals list truncated six names ("Campo Grand…", "Belo Horizonte…"); the name column is 15rem wide there. The method's paragraphs keep the 38rem measure.
- **Open listbox stacking.** The senha hangs over the slot's lip (z-index 5) above the housing (4), which trapped the combobox's listbox behind the ticket. While the list is open, the housing rises to z-index 8.
- **Sparkline end labels read "38" and "BR 43"**, not "38" and "43": the two labels sit a few pixels apart at the plot's right edge, and "BR" says which line is which without relying on the dash pattern.
- **The fetch script is `labs/scripts/pix-na-minha-cidade.ts`** (the brief said `scripts/fetch-pix.ts`), after the tarken pattern. It asks Olinda only for the PF columns (`$select`), so PJ never enters memory.
- **`data.json` is 569 KB**, not the brief's estimated 1,76 MB: the monthly series is stored as Pix por usuário ×10 (one integer per month), which the brief allowed. It is read on the server only; the browser gets the search index and the chosen city. A snapshot test (`snapshot.test.ts`) pins it to the brief's confirmed figures.
- **Share on desktop Chrome/Edge (Windows)** opens the operating system's share sheet, since `navigator.canShare({ files })` is true there; download is the path only where file sharing is unsupported, as specified.

### Finish review (2026-09-26)

Impeccable critique and audit, run single-context (no sub-agent tool in that session). The detector found only advisory "colour outside DESIGN.md" hits: the alpha blacks of the shadows and the `#000` of the torn-edge mask, which this file specifies in prose. Fixed as above: the open listbox rendering under the ticket (P0), the queue label leaving the roll on phones (P1), the colliding capital labels (P2) and the truncated capital names on wide screens (P2). Verified after the fixes: no horizontal scroll at 390 or 1440; the search, the homonym list, the invalid `?c`, small-sample, outlier and long-name states; dark mode; keyboard order (field, Imprimir, Compartilhar, Copiar link, the strip's links, the capitals) with a visible focus ring; `aria-activedescendant` on arrow keys; the 1080×1350 PNG for São Paulo, Pacaraima (outlier note) and Vila Bela da Santíssima Trindade (two-line name). Not verified: a real phone's share sheet, and screen-reader output (checked only in the markup).
