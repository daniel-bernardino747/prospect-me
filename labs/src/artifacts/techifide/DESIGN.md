---
name: Intake call sheet
description: Techifide's three job ads read as a jackfield normalling schedule, and run as the intake call's sheet; every claim is tied to its lane of the ad or to the call.
colors:
  glass: "#0a0a0a"
  glass-raised: "#121110"
  amber: "#ffb000"
  amber-dim: "#7a5200"
  amber-deep: "#2a1c00"
  amber-edge: "#9a6a00"
  ivory: "#f2efe6"
  ivory-dim: "#bdb8aa"
typography:
  role:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "clamp(1.5rem, 6.6vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1
  count:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "3.5rem (5.5rem at 64rem+)"
    fontWeight: 800
    lineHeight: 0.9
    fontFeature: "tnum"
  headline:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "1.375rem to 2rem"
    fontWeight: 700
    lineHeight: 1
  block:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
  legend:
    fontFamily: "Sofia Sans Extra Condensed, sans-serif"
    fontSize: "0.75rem to 1rem"
    fontWeight: 600
    letterSpacing: "0.04em to 0.12em"
  body:
    fontFamily: "Sofia Sans Condensed, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: "0"
  ring: "50%"
spacing:
  gutter-mobile: "1rem"
  gutter-wide: "2rem"
  lane: "2rem"
  block: "3rem"
  measure: "38rem"
  sheet: "76rem"
components:
  ad-key:
    textColor: "{colors.amber}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    padding: "0 0.625rem"
    height: "44px"
  ad-key-hover:
    backgroundColor: "{colors.amber-deep}"
  count-plate:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.glass}"
    typography: "{typography.count}"
  plate:
    textColor: "{colors.amber}"
    typography: "{typography.legend}"
    padding: "0.125rem 0.4rem"
  quote:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ivory}"
    padding: "0.625rem 0.75rem"
  level-key:
    textColor: "{colors.amber}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    height: "44px"
  level-key-selected:
    backgroundColor: "{colors.amber-deep}"
  field-input:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.625rem"
    height: "44px"
  action:
    textColor: "{colors.amber}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    padding: "0 0.875rem"
    height: "44px"
---

# Design System: Intake call sheet

Scope: this artifact only (`/techifide`). Labs hosts one world per company; nothing here binds other artifacts. The direction contract is the `DIRECTION` comment in `Techifide.tsx`, shipped hidden in the HTML. Tokens are custom properties on `.glass` in `techifide.module.css`.

## Overview

**Creative North Star: "The Normalling Schedule"**

The ad is the jackfield. Its lines are numbered lanes (L00 is the title), and every claim on the page, a brief field, a Role Fit level, a contradiction, is tied to its lane by an amber link rail. What the ad does not say is a tie with a gap in it: a question for the intake call. The page rejects the HR-tech score dashboard and any "X of 11" coverage figure; the one number it inverts is the count of questions still open. Reading order: the ad keys, the role, the must-haves, the count and its questions, then the brief, the dimensions, the Role Fit Profile with its exports, what is worth confirming, the ad itself lane by lane, the sources and the method. The page is also the call's sheet: a question opens to a level and a note, the template's empty fields take what the call says, and the count falls as the call answers.

**Key Characteristics:**
- Black glass with a lane grid drifting one hairline per second behind static type, inside dark edge gutters.
- One signal amber for every mark; ivory for anything read as a sentence.
- One condensed grotesque in two widths: Extra Condensed caps for legends, Condensed upright for prose.
- State carried by the rail's stroke and a written plate, never by colour.
- Square corners; the only curve is the ring at the end of a rail.

## Colors

Restrained: black ground, one signal colour, one prose colour. No Techifide magenta or purple.

### Primary
- **Signal Amber** (`amber`): every mark: the mark, ad keys, h1, legends, lane numbers, rails and rings, plates, block heads, rules, link underlines, the count plate.

### Neutral
- **Black Glass** (`glass`): the ground; the count's digit.
- **Raised Glass** (`glass-raised`): the inside of a quote frame.
- **Ivory** (`ivory`): questions, quotes, claim labels, ad lines.
- **Ivory Dim** (`ivory-dim`, ~10:1 on glass): meta line, leads, "Not in the ad", Techifide's descriptions, sources, footer.
- **Dim Amber** (`amber-dim`): row rules only, never text.
- **Deep Amber** (`amber-deep`): hover on keys and rings, the selected level key's fill, the `:target` lane and question.
- **Amber Edge** (`amber-edge`, ~3.9:1 on raised glass): input and textarea borders and the dashed Clear button only; the non-text contrast floor with room.

**The One Inversion Rule.** Exactly one solid amber plate per screen: the count. Selected keys are doubled, lane plates and quote captions are outlined.

## Typography

**Legend Font:** Sofia Sans Extra Condensed 500–800 (`--font-legend`), via `next/font/google`
**Prose Font:** Sofia Sans Condensed 400–600 (`--font-prose`, fallback `system-ui, sans-serif`)

**Character:** placard caps on a machine-room schedule for anything scanned; a narrow, plain sentence face for anything read.

### Hierarchy
- **Role** (700, `clamp(1.5rem, 6.6vw, 2.75rem)`, 1.0, uppercase, balanced): the ad's title, amber.
- **Count** (800, 3.5rem, 5.5rem at 64rem+, tabular): knocked out of the amber plate.
- **Headline** (700, 1.375rem, 2rem at 64rem+, uppercase): "questions your intake call still has to answer".
- **Block head** (700, 1.75rem, uppercase, amber rule below): section h2.
- **Legends** (uppercase, tracked): mark 800/1.25rem/0.03em; keys 700/1rem/0.06em; section legend 700/0.875rem/0.12em; dimension names 600/0.9375rem/0.06em (0.875rem/0.08em as a question prefix); plates 700/0.8125rem/0.08em; lane numbers 700/0.9375rem tabular; lane tags 600/0.75rem.
- **Body** (Condensed 400, 1.0625rem/1.3): questions and quotes; ad lines, leads and sources 0.9375rem; footer 0.875rem. Prose never exceeds `measure`.

**The Prose Is Never Caps Rule.** Questions, quotes and ad lines are sentence case in ivory; caps are only for legends.

## Layout

Mobile-first, one column, with `.sheet` padded `gutter + 0.75rem`. On a phone the strip scrolls away with the page. At 64rem+: a sticky strip, and a two-column sheet (22rem legend column, sticky at 4.5rem, holding role and must-haves; the work on the right), max 76rem, strip and footer aligned to the column. Blocks sit 3rem apart; `scroll-margin-top` clears the strip on anchors.

**The First Screen Rule.** At 390 × 844, with no scrolling: the ad keys, the role, every must-have, the count with its headline and the first three questions. At 390 × 664 (a LinkedIn in-app browser, measured by simulation), the first two questions show whole.

## Elevation & Depth

Flat. No shadows; depth is the drifting lane grid behind static type and the hairline frames. The `:target` lane gets inset amber hairlines top and bottom.

## Shapes

Square everywhere. Rails are 1px amber lines ending in a 9px ring (1.5px stroke). The quote is a 1px amber frame on raised glass with an amber-ruled caption row.

## Components

### Ad keys
Three 44px keys in the strip (Fullstack / ML / QA), links to `?ad=`, outlined amber. The current one is a 3px double outline with `aria-current="page"`.

### Call sheet
- **Question rows** are `<details>`: closed, a row reads as the ad left it plus a dashed **Record** plate at the end; answered, the plate turns solid and reads **Call n**. Open, it shows Techifide's description of the dimension, the level control and a note.
- **Level control:** a fieldset of five native radios (one tab stop, arrow keys), each inside a 44px outlined key with a legend-font numeral; the checked key is doubled (3px double) on deep amber. Scale ends read "1 · Very little" and "A great deal · 5". A "Clear level" text button appears only when a level is set. Keys, scale ends and note share the `measure` width.
- **Template inputs:** each empty field keeps its "Not in the ad" line, gapped rail and **Open** plate, and gains a 44px input ("Add from the call"). Typed, the line reads "From the call", the rail closes and the plate says **Call**.
- **Dimensions** carry the same control inside their row; the plate shows the lane while the ad's level stands, **Call n** once the call changes it or adds a note, **Ask nn** while open.
- **Live count:** the count and its sentence follow the call; at zero the sentence becomes a link, "Role Fit Profile ready: export it".
- **Role Fit Profile:** one row per dimension in Techifide's published order: name, a five-cell meter (filled cells up to the level, 0.75rem squares), the numeral, "from the ad, line n" / "from the call" / "to confirm", and the note. Then the actions: Download .docx, Print / PDF, Copy as text (outlined 44px legend buttons) and a dashed "Clear this call" that arms on the first tap (solid amber, "Tap again to clear this call"). A `role="status"` line reports the result.
- **Bar:** fixed to the bottom once the sheet is touched, "Call sheet in progress, kept in this browser." with a **Profile** key; the page reserves its height below the last line, and it hides while a text field has focus.
- **Print sheet:** Print / PDF shows only a plain black-on-white sheet: title, ad URL, "prepared on <date>", the filled template as a two-column table and the profile as a headed table (Dimension / Level / Note from the call), with the Labs banner above.

### Screening a candidate
- **Summary:** the candidate's label in legend caps and "N of M must-haves shown in the CV · K to ask", numerals in amber legend type (not plates: the count keeps the page's one inversion).
- **Evidence rows:** each must-have in the ad's order; evidenced rows are `<details>` with an unbroken rail and a **Cnn** plate (the CV's own lanes), opening to the CV quote in the hairline frame captioned "CV line Cnn"; a must-have the CV does not show gets a gapped rail, an **Ask** plate and "Not in the CV: ask about it in the interview."
- **Interview questions:** the question-list grammar (number, dimension prefix, prose) with a small underlined **Cnn** link to the CV line it builds on.
- **The CV:** every line as lanes `C00`–`Cnn`, rings on cited lines, `:target` doubling like the ad's lanes. Always open, so a Cnn link lands.
- **Screening video:** a 10 s silent loop (720×900, WebM VP9 then MP4 H.264, ~0.8 MB each, poster at 6.5 s) in the page's own world: the CV drops in, the twelve rails draw one by one with the cited CV line lit, WebAssembly lands gapped on **Ask**, then the "11" plate and three questions. Framed by a 1px amber border with a dim caption. At 64rem+ it sits in the fixed legend column; below, it opens the candidate section and the first screen gets one amber link, "See a CV screened against this role". Rendered in one place only (client check of the width), autoplays muted and looped, and under `prefers-reduced-motion` shows the poster with native controls instead.

### Must-haves
A wrapping legend of short labels, each followed by its lane tag (`L21`). Each is a link to that lane of the ad, with a hit area extended by `::after` beyond its line height.

### Count and questions
The count plate beside the headline, then an ordered list: a two-digit number (the order is the priority) and the question, led by its dimension as a small amber prefix. Each `li` is `#q-n`, highlighted when targeted.

### Rails and plates
`Rail` carries state by stroke: **unbroken** = quoted; **gap** (a fixed 0.75rem break before the ring, min-width 2.75rem) = open; **cross-tick** (one 35° tick at mid-rail) = worth confirming; **doubled** (two 1px lines) = the claim is open. The plate beside it says the same in words: `L07`, `Open`, `Ask 02`, `Confirm`.

### Claims
Native `<details>`: the summary is the label, its rail and plate (44px min height); the body holds the reading and Techifide's own description where it applies, then the quote frame with "Lane L07" linking into the ad.

### The ad, lane by lane
An ordered list of every line as captured, `L00`–`Lnn`, each `#lN`. A ring marks a lane something above is tied to; the targeted lane fills the ring, doubles its rules, and shows "Back to must-haves".

### Sources and method
Sources list each capture with its date and the two lines quoted from Techifide's own pages. The footer's single line says how it was made: an LLM proposed, code kept only verbatim quotes, a human reviewed the questions, and it replaces no part of the call.

### States and focus
Focus-visible: `2px solid ivory`, offset 2px, on links and summaries. Hover never carries meaning: it tints keys and rings `amber-deep`.

### Motion
- **Drift:** the lane grid moves 2rem every 32s (one hairline per second), linear, forever. It is the page's only motion.
- Key background 160ms ease-out; `:target` lane background 300ms ease-out.
- `prefers-reduced-motion: reduce` stops the drift and both transitions; print hides the grid.

## Do's and Don'ts

### Do:
- **Do** tie every claim to a lane, and show the ad's words, never the model's copy.
- **Do** pair every rail state with its written plate.
- **Do** keep the count the only solid plate on screen.
- **Do** say "Not in the ad" plainly, and name the listing's metadata when it says what the text does not.
- **Do** say where every level came from, the ad's line or the call, in every export.
- **Do** keep the call's answers in the browser; nothing on the page sends them anywhere.

### Don't:
- **Don't** headline a coverage score, or call anything in the ad missing, vague or wrong.
- **Don't** use Techifide's logo, magenta or purple.
- **Don't** set prose in caps or in amber.
- **Don't** add radius, shadows, cards, icons, or a second signal colour.
- **Don't** let a broken tie animate closed.
