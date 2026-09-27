---
name: Bot de WhatsApp, IA vs Jev
description: A WhatsApp-bot benchmark read as a Brazilian clinic waiting room — a verde-água wall with a chair rail and a darker barrado, one black LED housing with amber dot-matrix figures, thermal-paper tickets and receipts, plastic queue keys, a red call button and a laminated notice taped to the wall.
colors:
  wall: "#A8D8CA"
  wall-deep: "#93CBBB"
  rail: "#6FAE9C"
  rail-light: "#C4E6DC"
  ink: "#0F2E28"
  ink-2: "#24463F"
  housing: "#121513"
  housing-2: "#1B1F1D"
  housing-rule: "#2C3230"
  silk: "#D3DBD7"
  silk-dim: "#97A39E"
  amber: "#FFB020"
  amber-off: "#33270F"
  red: "#FF5A4A"
  red-off: "#3A1512"
  ok: "#3FBF6F"
  paper: "#F7F5EF"
  paper-print: "#262624"
  paper-faded: "#62615C"
  plastic: "#DDE3E1"
  plastic-edge: "#B9C2BF"
  button: "#D23A2E"
  button-edge: "#9E2219"
  glass: "#EEF6F3"
  bot: "#1E3A35"
  bot-ink: "#F1F7F4"
  bad-figure: "#9B1C12"
  hazard-yellow: "#F2C200"
  hazard-black: "#141414"
  reception: "#FFF4D6"
  reception-ink: "#3D2B00"
  barred: "#F9E1DD"
  barred-ink: "#5C1A12"
  failed-strip: "#FBE9E6"
  notice: "#FFFFFF"
typography:
  answer:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "clamp(1.625rem, 1rem + 2.6vw, 3.1rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "clamp(1.375rem, 1rem + 1.2vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.01em"
    textTransform: uppercase
  signage:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
    textTransform: uppercase
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  conversation:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  led-lg:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "clamp(2rem, 1.2rem + 2.4vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tnum"
  led-md:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1
  led-sm:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1
  led-call:
    fontFamily: "Doto, monospace"
    fontSize: "clamp(3rem, 2rem + 3vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1
  thermal:
    fontFamily: "Red Hat Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  rail: "2px"
  notice: "3px"
  key-sm: "5px"
  cell: "6px"
  key: "8px"
  housing: "10px"
  bubble: "10px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  sheet-max: "76rem"
  notice-max: "46rem"
  section-top: "clamp(3.5rem, 8vw, 6rem)"
  rail-gap: "clamp(2rem, 5vw, 3rem)"
  measure: "64ch"
  answer-measure: "34ch"
components:
  housing:
    backgroundColor: "{colors.housing}"
    textColor: "{colors.silk}"
    rounded: "{rounded.housing}"
    padding: "1rem clamp(0.75rem, 2vw, 1.5rem) 1.25rem"
  board:
    backgroundColor: "{colors.housing-2}"
    textColor: "{colors.amber}"
    rounded: "{rounded.cell}"
  queue-row:
    backgroundColor: "rgb(255 255 255 / 0.34)"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    padding: "0.6rem 0.75rem"
  queue-key:
    backgroundColor: "{colors.plastic}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    size: "2.5rem"
  receipt:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-print}"
    typography: "{typography.thermal}"
    padding: "1.25rem 1.1rem 1.75rem"
  caller-led:
    backgroundColor: "{colors.housing}"
    textColor: "{colors.red}"
    rounded: "{rounded.key}"
    padding: "1.25rem 1rem"
  ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-print}"
    width: "min(92%, 15.5rem)"
    padding: "1rem 1rem 1.4rem"
  call-button:
    backgroundColor: "{colors.button}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "1rem 1.25rem"
  call-button-hover:
    backgroundColor: "#E0443A"
  switch-option:
    backgroundColor: "{colors.plastic}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cell}"
    padding: "0.45rem 0.85rem"
  switch-option-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.glass}"
  window-col:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.key}"
  window-head:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.glass}"
    padding: "0.7rem 0.9rem"
  line-patient:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
  line-bot:
    backgroundColor: "{colors.bot}"
    textColor: "{colors.bot-ink}"
    rounded: "{rounded.bubble}"
  line-reception:
    backgroundColor: "{colors.reception}"
    textColor: "{colors.reception-ink}"
    rounded: "{rounded.bubble}"
  line-barred:
    backgroundColor: "{colors.barred}"
    textColor: "{colors.barred-ink}"
    rounded: "{rounded.bubble}"
  notice:
    backgroundColor: "{colors.notice}"
    textColor: "{colors.ink}"
    rounded: "{rounded.notice}"
    padding: "clamp(1.5rem, 4vw, 2.5rem)"
  hazard-tape:
    backgroundColor: "{colors.hazard-yellow}"
    textColor: "{colors.hazard-black}"
    padding: "0.55rem 1rem"
---

# Design System: Bot de WhatsApp, IA vs Jev

Scope: this showcase only (`/demo/bot-whatsapp-ia-vs-jev`). Nothing here binds other artifacts. Every token lives as a custom property on the artifact root class (`.wall` in `painel.module.css`), not on `:root`, because the Labs `globals.css` owns `:root` and `body`. There is no dark variant: the page is a lit waiting room and does not respond to `prefers-color-scheme`.

## Direction contract

Shipped as the first child of the root element (a hidden `<div hidden>` with the comment in `dangerouslySetInnerHTML`, in `BotWhatsappIaVsJev.tsx`), so the production build can be grepped for `bc5faa75`:

```
THESIS: The benchmark is the clinic's waiting room: every case is a ticket called and the four bots are service windows answering the same patient. It refuses the SaaS chatbot landing and the leaderboard dashboard.
OWN-WORLD: Verde-água painted wall (#A8D8CA) over a darker barrado band; one black LED housing with amber dot-matrix figures (Doto) and red failure LEDs; thermal-paper tickets and receipts (Red Hat Mono); Barlow Semi Condensed signage; a laminated notice held by tape; hazard tape marks test data.
STORY: The reader sees who solved how much with the difficult patient and what guardrails change, finds where each window fails, reads what reached the patient, then calls tickets to read the four conversations side by side.
FIRST VIEWPORT: The answer sentence full width on the wall; the LED panel with four windows by four columns directly under it.
FORM: waiting-room ticket panel, candidate 3 of 7; seed bc5faa75.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

## Overview

**Creative North Star: "Painel de senha"**

The benchmark measures one job, a Brazilian clinic's WhatsApp desk, so the page is that clinic's waiting room. Each test case is a *senha* (ticket) that gets called; each of the four bots is a *guichê* (service window) answering the same patient. The reader stands in front of a painted verde-água wall with a chair rail and a darker barrado band at the bottom; one black LED housing hangs on it with amber dot-matrix figures; queue keys are plastic; receipts and tickets are thermal paper; the method is a laminated notice held up by two strips of tape.

The page reads top to bottom as a visit: the answer sentence painted on the wall, the LED panel with the 4 × 2 × 2 result matrix, the queues (per task), the receipts (what reached the patient), the wait/cost LED table, the call station (ticket dispenser + red call button + four window columns with the conversations), and the notice. Everything renders on the server; the ticket being read lives in the query string, and every control is a link.

It rejects the SaaS chatbot landing (gradient hero, chat-bubble mockups, logos) and the leaderboard dashboard (ranked cards, overall score, trophy colours). There is no overall score and no brand colour: models are data.

**Key Characteristics:**
- One light world (verde-água wall, dark green ink) with exactly two dark objects: the LED housings (main panel and wait table) and the caller LED.
- Every result figure on a dark surface is amber Doto dot-matrix, and it is real text.
- Red is reserved for failure and for the "called" ticket code; green only accompanies a written "Resolveu"/"ok".
- Materials, not cards: housing with screws, thermal paper with a torn zig-zag edge, plastic keys with a bottom lip, a pill-shaped red button with a pressable edge, a slightly rotated taped notice.
- Hazard tape exists only for synthetic (test) data.
- Motion is two one-shot moments at the call station, both removed under reduced motion.

## Colors

A cool, desaturated clinic green with one amber light source and one red alarm; everything else is paper and plastic.

### Primary
- **Painel Amber** (`amber`): the dot-matrix LED colour. It means *a result figure* — percentages on the board, window numbers, wait/cost values. Carries a soft `text-shadow: 0 0 0.3em rgb(255 176 32 / 0.45)` glow. 10.1:1 on Housing, 9.1:1 on Housing 2. Also the focus outline colour for the board's cell links, and an 8% amber wash on cell hover.
- **Unlit Amber** (`amber-off`): the unlit LED dots — a 7px radial-dot grid (`radial-gradient(circle, amber-off 1.1px, transparent 1.4px)`) painted on the board's Housing 2 face, so the figures sit on a visible matrix.

### Secondary
- **Failure Red** (`red`): LED red. The called ticket code on the caller LED (6.0:1 on Housing), the dot of the "Falhou" status, and the "−N com o difícil" drop line on the board (5.4:1 on Housing 2). **Unlit Red** (`red-off`) is the caller LED's dot grid.
- **Call Button Red** (`button`) with **Button Edge** (`button-edge`) as its 5px pressable lip; hover `#E0443A`. White label at 4.8:1.
- **Bad Figure** (`bad-figure`): the wall-side counterpart of failure red, for queue figures under 50% (5.2:1 on Wall) and for the failed function-call outcome text.
- **Ok Green** (`ok`): LED green for the "Resolveu" status dot, the ok function-call dot, and the "+N com o difícil" line on the board (7.1:1 on Housing 2). The status labels themselves use lighter tints: `#8FE6AD` (Resolveu) and `#FFB3AB` (Falhou), 9.8:1 and 8.5:1 on the Ink window head.

### Neutral — the wall
- **Verde-água Wall** (`wall`): the page ground above the rail. Ink on it is 9.3:1, Ink 2 is 6.6:1.
- **Barrado** (`wall-deep`): the darker band below the rail, covering the bottom 29.4rem of the page. Ink 2 on it stays 5.7:1.
- **Chair Rail** (`rail`) with a 2px **Rail Highlight** (`rail-light`) on top: the painted rail at the barrado edge, and repeated as an 8px rule above every section. Rail light is also the "Guichê N" plate text on the Ink window head (10.9:1).
- **Ink** (`ink`): text, window heads, the current switch option, focus outlines on the wall.
- **Ink 2** (`ink-2`): ledes, meta line, secondary labels.

### Neutral — the housing
- **Housing** (`housing`): the LED case, table header rows, the caller LED face.
- **Housing 2** (`housing-2`): the board's lit face under the dot grid.
- **Housing Rule** (`housing-rule`): row dividers inside the housing and the 2px inset top highlight of the case.
- **Silkscreen** (`silk`, 13.0:1) and **Silkscreen Dim** (`silk-dim`, 7.0:1): printed labels on the case — title, column heads, window names, "não rodou".

### Neutral — paper, plastic, glass
- **Thermal Paper** (`paper`), **Print** (`paper-print`, 13.9:1) and **Faded Print** (`paper-faded`, 5.7:1): receipts and the ticket. Faded print is the dashed tear lines and small uppercase headers.
- **Plastic** (`plastic`) with **Plastic Edge** (`plastic-edge`): queue keys, the dispenser slot, switch options.
- **Glass** (`glass`): the window column's counter surface under the conversations; Ink 2 on it is 9.4:1.
- **Bot Green** (`bot`) with **Bot Ink** (`bot-ink`, 11.3:1): the attendant's message and the "Saiu no lugar" replacement.

### Conversation line colours
- **Patient**: plain white bubble, Ink text.
- **Reception** (`reception` / `reception-ink`, 12.4:1): a warm note-paper bubble for "Recepção assumiu".
- **Barred** (`barred` / `barred-ink`, 10.5:1): a pink slip for blocked or discarded bot text; strikethrough line `#B3261E`, 2px.
- **Failed checks strip** (`failed-strip`): the bottom band of a window listing failed verifications, text `#5C1A12`.

### Hazard tape
- **Hazard Yellow** / **Hazard Black** (`hazard-yellow`, `hazard-black`): `repeating-linear-gradient(-45deg, …)` 18px stripes with a solid yellow label patch, 11.0:1. Only for `data.synthetic`.

### Named Rules
**The Amber Is A Result Rule.** Amber Doto means "this is a measured figure". It never decorates, never labels, never appears on the wall. On the wall the same figures are set in Ink (the LED legend numbers drop their glow and turn Ink).

**The Red Is Failure Rule.** Red appears only for failure (Falhou dot, failed call dot and text, drops, under-50% figures) and for the called ticket code — the one thing a real panel lights red. It is never a hover state, a heading, or an accent.

**The Never Colour Alone Rule.** Every status is also written: "Resolveu"/"Falhou", "ok"/the failure outcome, "+N / −N com o difícil", "Barrada pelo guardrail", "não rodou". The lone exception in the build is the under-50% queue figure, whose red tint is emphasis on a number that is itself printed.

## Typography

Loaded with `next/font/google` in `BotWhatsappIaVsJev.tsx` (not the root layout), each as a CSS variable on the root:

```ts
const led = Doto({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-led', display: 'swap' });
const sign = Barlow_Semi_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-sign', display: 'swap' });
const text = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-text', display: 'swap' });
const thermal = Red_Hat_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-thermal', display: 'swap' });
```

**LED Font:** Doto (dot-matrix), fallback `ui-monospace, monospace`
**Signage Font:** Barlow Semi Condensed
**Body Font:** Atkinson Hyperlegible Next, fallback `ui-sans-serif, system-ui, sans-serif`
**Thermal Font:** Red Hat Mono

**Character:** Four voices, one per material. Doto is the lit panel; Barlow Semi Condensed is the painted and silkscreened signage of a public service counter; Atkinson Hyperlegible Next is the patient-facing reading voice, chosen for legibility of badly written Portuguese in the transcripts; Red Hat Mono is the thermal printer.

### Hierarchy
- **Answer** (h1, Barlow Semi Condensed 600, `clamp(1.625rem, 1rem + 2.6vw, 3.1rem)`, 1.1, −0.012em): the generated answer sentence, painted on the wall, `max-width: 34ch`, `text-wrap: balance`.
- **Headline** (h2, Barlow Semi Condensed 700, `clamp(1.375rem, 1rem + 1.2vw, 2rem)`, 1.15, 0.01em, uppercase, balanced): section signs. The notice title is the same voice at 1.5rem.
- **Silkscreen title** (Barlow 700, 0.9375rem, 0.14em, uppercase, Silk): the housing's printed name "Painel de atendimento".
- **Signage labels** (Barlow 600, 0.8125–0.875rem, 0.06–0.14em, uppercase): column heads, queue heads, switch labels, caller labels, window plates, status labels, "não rodou".
- **Body** (Atkinson 400, 1rem/1.55): meta and ledes, `max-width` 62–64ch.
- **Conversation** (Atkinson 400, 0.9375rem/1.45): transcript lines; each line's speaker tag is Barlow 600 0.6875rem 0.1em uppercase at 75% opacity.
- **LED** (Doto 900, line-height 1, `tabular-nums`, `nowrap`): `lg` `clamp(2rem, 1.2rem + 2.4vw, 3.25rem)` for board figures and window numbers; `md` 1.75rem (defined, not used in the build); `sm` 1.125rem for legends and the wait table. The called code is Doto 900 `clamp(3rem, 2rem + 3vw, 4.5rem)` in red. The call button's next-code chip is Doto too.
- **Wall figures** (Barlow 700, 1.375rem, 1.125rem under 52rem, `tabular-nums`): queue percentages — signage figures, not LED, because they sit on the wall.
- **Thermal** (Red Hat Mono 400/600, 0.8125rem/1.5): receipts, the ticket, model ids under window names, `code` in function calls and the notice. The ticket's big code is the exception: Barlow 700 2.75rem, the way dispensers print it.

### Named Rules
**The LED Text Is Real Text Rule.** Every LED figure is a text node in Doto, never an image, canvas or SVG. The dot-grid is a background on the container, not on the glyphs.

**The One Voice Per Material Rule.** Doto only inside a housing (and the call button's code chip); Red Hat Mono only on paper and for machine strings; Barlow for anything painted, printed on a case or on a plate; Atkinson for sentences people read.

## Layout

Phone-first, single column of sections on the wall, centred in `max-width: 76rem` with `padding-inline: clamp(1rem, 4vw, 2.5rem)`. Sections start `clamp(3.5rem, 8vw, 6rem)` down, each preceded by the painted chair rail (8px, `border-radius: 2px`, 2px Rail light over Rail) and `clamp(2rem, 5vw, 3rem)` of wall. The wall itself is a single `linear-gradient` on `.wall`: Wall until 30rem from the bottom, 0.2rem Rail light, 0.4rem Rail, then Barrado; `min-height: 100vh`, `padding-bottom: 5rem`.

**First viewport:** hazard tape (only when synthetic) → answer sentence + meta line → the LED housing with the result matrix, full sheet width.

**`--cols`** is set inline from the number of windows (4) on queues, receipts and window columns, so the grids follow the data rather than a fixed count.

### Breakpoints (all `max-width` except the last)
- **64rem (min-width):** receipts and window columns become `repeat(var(--cols, 4), minmax(0, 1fr))` — one column per guichê, side by side. Below it they use `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))`.
- **60rem:** the call station goes from three columns (caller LED `minmax(14rem,1fr)`, dispenser `minmax(16rem,1.1fr)`, controls `minmax(16rem,1.2fr)`) to two, with the controls spanning below.
- **56rem:** the board table unrolls. `thead` hides; a visible two-column legend strip ("Sem guardrails: padrão · difícil" / "Com guardrails: padrão · difícil", `aria-hidden`) replaces it; each window becomes a 4-column grid row with the window name spanning the top; LED figures shrink to `clamp(1.25rem, 5.5vw, 1.75rem)`; "X de N" becomes "X/N" and the drop line hides.
- **52rem:** the queue header hides and a window legend (LED number + name) appears above the rows; each queue row becomes `repeat(var(--cols), 1fr)` with the queue name spanning the top, and each cell prints its own "Guichê N" label via `::before` from `data-label`. The wait table hides window names in its header (numbers stay) and scrolls horizontally inside its housing (`min-width: 34rem`, `overflow-x: auto`).
- **36rem:** the call station stacks to one column.

The notice sits apart: `max-width: 46rem`, centred, `clamp(4rem, 9vw, 7rem)` above.

## Elevation & Depth

Physical objects on a wall, lit from above. Depth is real shadow, not tonal layering, and each material has its own.

### Shadow Vocabulary
- **Housing** (`0 2px 0 housing-rule inset, 0 18px 36px -18px rgb(15 46 40 / 0.55), 0 4px 10px rgb(15 46 40 / 0.25)`): the LED case hangs off the wall with a lit top edge. The wait housing uses the first two.
- **Caller LED** (`0 14px 28px -18px rgb(15 46 40 / 0.7)`).
- **Thermal paper** (`0 10px 18px -12px rgb(15 46 40 / 0.55)` receipt; `0 12px 18px -12px … 0.6` ticket): paper lifting slightly off the wall.
- **Plastic key** (`0 3px 0 plastic-edge, 0 5px 8px rgb(15 46 40 / 0.2)`); switch option `0 2px 0 plastic-edge`; current option sinks: `0 2px 0 #000 inset`.
- **Call button** (`0 5px 0 button-edge, 0 9px 16px rgb(15 46 40 / 0.3)`), pressed `0 1px 0 button-edge, 0 3px 6px …` with `translateY(4px)`.
- **Window column** (`0 0 0 2px ink, 0 14px 26px -18px rgb(15 46 40 / 0.6)`): a 2px ink frame drawn as a shadow, plus drop.
- **Notice** (`0 1px 0 rgb(255 255 255 / 0.9) inset, 0 18px 30px -20px rgb(15 46 40 / 0.6)`): the laminate's top sheen. The tape strips get `0 1px 2px rgb(15 46 40 / 0.15)`.
- **LED glow**: `text-shadow` 0.3em at 45% (amber and red), 0.25em at 50% on the called code; status dots `0 0 6px` in their colour.

### Named Rules
**The Every Object Has A Material Rule.** A new surface must be one of the existing materials (housing, paper, plastic, glass, laminate, tape) and take its shadow. No generic card shadow, no blur, no glassmorphism.

## Shapes

Square-ish objects with small, material-true radii: the housing 10px, keys and window columns 8px, board and switches 6px, links inside panels 5–6px, the notice 3px, the rail 2px. Two shapes break the rhythm on purpose: the call button is a full pill (999px), and conversation bubbles are 10px with the speaker's corner pinched to 2px (patient top-left, bot top-right). Paper is not rounded: receipts and the ticket have a torn zig-zag bottom made with a `conic-gradient` mask (14px teeth on receipts, 12px on the ticket). The housing carries two screw heads (0.55rem radial-gradient circles) in its top corners. The notice is rotated −0.5deg, its tape strips −4deg and 5deg.

## Components

### LED housing and board ("Painel de atendimento")
The one black object that answers the question. Housing with screws, a silkscreen row (title left, "casos resolvidos, em % · toque num número para ver as conversas" right in Silk dim), optional hazard tape, then a real `<table>` with a visually hidden caption.
- **Header:** two rows on Housing — "Sem guardrails" / "Com guardrails" as `colgroup` headers in Silk with a Housing rule underline; then "Padrão" / "Difícil" in Silk dim signage.
- **Row header:** amber LED window number (lg) + window name in Barlow 600 Silk with the model id below in Red Hat Mono 0.75rem Silk dim.
- **Cells:** each figure is a link (`?cenario=&persona=&modo=`) with the amber LED percentage, "X de N" in Silk dim, and on the difícil column the change from padrão in words ("−12 com o difícil", red; "+N", green). Hover: 8% amber wash; focus: amber outline. The `aria-label` spells out window, mode, persona, value and n.
- **Not run:** "não rodou" in Silk dim uppercase signage, never 0.

### Queues ("Onde cada um erra, fila por fila")
An ARIA table (`role="table"`, rows, cells) on the wall, rows as translucent white strips (34%) with 8px radius. The row header is a **plastic queue key** (2.5rem square, Plastic with a 3px Plastic-edge lip, Barlow 700 1.25rem letter) + the task name and "N casos × R". Each window cell holds two links, "sem" and "com" (Barlow uppercase 0.8125rem Ink 2) followed by the figure (Barlow 700 1.375rem, Ink; Bad figure under 50%). Hover: 60% white.

### Thermal receipts ("O que chegou ao paciente")
One receipt per window, Red Hat Mono on Thermal paper with a torn bottom. Centred uppercase header (Guichê N, name in 600), a `dl` of three totals (sem guardrails saíram / com guardrails escreveu / com guardrails saíram), a dashed tear, then a small table of occurrence kinds with "sem" and "com" columns and "(N barradas)" in faded print, or "Nenhuma afirmação sem lastro." Footer: "Agiu sem confirmação: N (sem guardrails, em R execuções)".

### Wait LED table ("Quanto custa cada atendimento")
A second housing (no screws) holding a right-aligned `<table>`: window LED numbers + names as column heads, one `tbody` per mode introduced by a Silk-dim uppercase mode row, five metric rows (mensagens do bot, funções por caso, p50, p95, custo) with amber LED `sm` values. Scrolls inside its housing under 52rem.

### Call station ("As conversas, senha por senha")
The signature. Three parts in a row:
- **Caller LED:** Housing with a red-off dot grid, "Senha" label, the red Doto ticket code with glow, "guichês 1 a 4". It is `aria-live="polite"` and keyed on ticket + persona + mode so it re-mounts (and blinks) on every call.
- **Dispenser + ticket:** a plastic slot (Plastic / black mouth / Plastic edge) and the thermal ticket under it: queue and kind in faded uppercase, the code in Barlow 700 2.75rem, the case title between dashed tears, persona · mode at the foot. Keyed on ticket id so it re-prints.
- **Controls** (`<nav aria-label="Chamar senha">`, all links): the red pill **call button** "Chamar próxima senha" with the next code in Doto; an underlined "Senha anterior (code)" text link; two **switches** (Paciente: Padrão/Difícil; Modo) as rows of plastic options where the current one is `aria-current="true"`, Ink with Glass text, sunk; and a `<details>` "Todas as senhas (N)" whose summary has a CSS triangle that rotates 90deg when open, listing every ticket in a scrollable 16rem box (current = Ink).

### Window columns
One per guichê, Glass counter with a 2px Ink frame. Head on Ink: "Guichê N" plate in Rail light, name in Barlow 600, and a status at the right — dot + word, "Resolveu" or "Falhou". Body is an `<ol>` of lines:
- **Paciente:** white bubble, left, pinched top-left.
- **Atendente:** Bot green bubble, indented left 1.5rem, pinched top-right.
- **Função:** no bubble; a small dot (green ok / `#D63A2F` fail, `aria-hidden`), the call in Red Hat Mono, then "ok" or the failure outcome in Barlow 700 (Bad figure when failed).
- **Barrada pelo guardrail:** pink slip with the original in `<del>` (2px red strike) and a nested Bot green "Saiu no lugar" block with what was actually sent.
- **Descartada:** the same pink slip, struck, labelled "a recepção já tinha assumido".
- **Recepção assumiu:** warm note-paper bubble.
Under the conversation, failed checks sit in a pink strip (`aria-label="Verificações que falharam"`), each with a bold label and its detail. A window that did not run says "Não rodou nesta rodada."

### Laminated notice ("Como foi medido")
White sheet, 3px radius, laminate sheen, −0.5deg, two translucent beige tape strips at the top corners (`aria-hidden`). Barlow 700 uppercase title, a bulleted method list in Atkinson with model ids in Red Hat Mono, a meta line with run date and every model, and two bold underlined links (repository, portfolio).

### Hazard tape
A `<p role="note">` with diagonal yellow/black stripes and a solid yellow uppercase label. Appears at the top of the page and inside the housing only when `data.synthetic`; in production synthetic data returns 404.

## Motion

Two one-shot moments, both at the call station, both tied to a server render of a new ticket (keyed elements re-mount; nothing loops, nothing animates on scroll).
- **Called** (the caller LED code): `called 1.4s steps(1, end) 1` — hard on/off steps, opacity 1 → 0.12 at 15% and 45%, back to 1 at 30% and 60%: two blinks, then steady, like a panel announcing a number.
- **Printed** (the ticket): `printed 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both` — `clip-path: inset(0 0 100% 0) → inset(0)` with `translateY(-0.75rem) → none`, the ticket feeding out of the slot after the blink starts.
- **Micro:** call button `transform`/`box-shadow` 0.12s ease-out on press; the ticket-index triangle rotates in 0.15s.

**Reduced motion** (`prefers-reduced-motion: reduce`): the called blink and the printed reveal are removed (the code and ticket render final), and the call button's transition is off. The details triangle still turns.

## Accessibility

- LED figures, ticket codes and status words are real text; decorative parts (dot grids, screws, slot, tape strips, queue-key letters, call dots) are backgrounds or `aria-hidden`.
- Tables are real tables with visually hidden captions and scoped headers; the queue grid uses ARIA table roles; the mobile board legend is `aria-hidden` because the cell links carry full `aria-label`s (window, mode, persona, value, "X de N").
- Status is never colour alone (see The Never Colour Alone Rule). Text contrast in the palette is ≥ 5.2:1 everywhere measured, except the white call-button label at 4.8:1 (AA for its 1.0625rem bold uppercase).
- Focus: `outline: 3px solid ink; outline-offset: 3px` on every wall link; amber on the board's cell links.
- The caller LED is a polite live region; the current ticket and switch option use `aria-current`.
- Everything works without JavaScript: navigation is plain links to query strings.

## Do's and Don'ts

### Do:
- **Do** keep every compared figure in a housing as amber Doto with `tabular-nums`, and on the wall as Barlow 700 in Ink.
- **Do** write every status in words next to its colour ("Resolveu", "Falhou", "ok", "−N com o difícil", "Barrada pelo guardrail").
- **Do** show "não rodou" for a brain that did not run, never 0 and never an empty cell.
- **Do** carry the n with every figure ("X de N", "N casos × R", "em R execuções").
- **Do** make every figure a link into its conversations (`?cenario=&persona=&modo=`).
- **Do** build new surfaces from the existing materials and their shadows; start each section with the painted chair rail.
- **Do** drive column counts from `--cols` (number of windows), not hard-coded 4.
- **Do** keep motion to the called blink and the printed ticket, and remove both under reduced motion.

### Don't:
- **Don't** use amber for anything that is not a measured result, and don't put amber on the wall.
- **Don't** use red for anything but failure and the called code; no red hovers, headings or accents.
- **Don't** render LED figures as images, SVG or canvas, or put the dot grid on the glyphs.
- **Don't** show hazard tape for real data, or use it as decoration.
- **Don't** add an overall score, ranking, trophy, logos or brand colours for Claude, GPT or Jev.
- **Don't** add a second dark theme or turn the wall dark; the only dark objects are the housings and the caller LED.
- **Don't** add decimals to percentages.
- **Don't** add generic cards, gradients on data, blur, glass or scroll-triggered animation.
- **Don't** swap the four faces for one another (Doto outside a panel, Red Hat Mono for prose, Atkinson for signage).

## Notes on the build

- `.led_red`, `.led_dim` and `.led_md` are defined but the `Led` component is only ever called with the default amber tone and the `sm`/`lg` sizes; red LED text appears only through the caller LED's own class.
- `boardCorner` and `queueHeadName` are referenced in the TSX but have no rules in `painel.module.css`; they are inert hooks.
- The `.wall a:focus-visible` outline applies to links only; the `<summary>` of the ticket index relies on the browser's default focus ring.
