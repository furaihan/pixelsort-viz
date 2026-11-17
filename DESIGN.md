---
name: Pixel Sort Visualizer
description: A risograph-inspired sorting-algorithm playground where an image is the data structure.
colors:
  jet-black: "#111111"
  panel-black: "#171717"
  raised-black: "#1d1d1d"
  electric-lime: "#C6FF00"
  hot-pink: "#FF1493"
  soft-lime: "#E6FF80"
  bubblegum-pink: "#FF75BD"
  text-primary: "#F4F4EC"
  text-muted: "#A6A69A"
  text-dim: "#7C7C72"
  line: "#2B2B2B"
  line-strong: "#3A3A3A"
  danger: "#FF5C5C"
  warning: "#FFC857"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.2vw, 42px)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  data:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, monospace"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
rounded:
  sm: "9px"
  md: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.electric-lime}"
    textColor: "{colors.jet-black}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.soft-lime}"
    textColor: "{colors.jet-black}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  panel:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "15px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "5px"
    padding: "0 7px"
    height: "22px"
---

# Design System: Pixel Sort Visualizer

## Overview

**Creative North Star: "The Proof Sheet"**

Pixel Sort Visualizer is a working algorithm lab presented as a two-ink risograph proof sheet. The image is the print, the algorithm is the press, and every operation is an impression. The interface is dark because the work happens on a screen in a dim room, not because dark is the category default. The two inks — electric lime and hot pink — do real jobs: lime is the press and the primary action, pink is the comparison and the second impression. Soft lime and bubblegum pink are tints, not new voices.

The canvas is the dominant object. It sits inside a proof frame with registration marks, a dashed inner rule, and a live impression strip. The right rail is a compact stack of functional panels: image, granularity, algorithm, statistics, inspector. The panels share a shell but not a template; each one is shaped by its data. The world enters through type, palette, density, and one signature move — misregistered two-ink highlights — never through a poster layout or costume controls.

The signature move is the misregistration. When two elements are compared, their outlines separate into a lime impression and a hot-pink impression, slightly out of register. When the image is restored, the inks snap back into registration. The current operation is stamped onto the proof sheet in the same two-ink language. The result should feel like a print lab that happens to be a sorting visualizer, not a dashboard wearing a neon skin.

**Key Characteristics:**
- Jet-black paper ground with a faint halftone dot texture.
- Electric lime and hot pink as the only saturated inks; soft lime and bubblegum pink as tints.
- Archivo Variable for the press voice; JetBrains Mono Variable for measurements, indices, and counters.
- A proof-sheet canvas frame with registration marks, a dashed inner rule, and a live impression strip.
- Misregistered lime/pink outlines for compare and swap; line style and labels carry state alongside color.
- Dense, legible data panels with 1px borders and no nested cards.
- Standard web controls, rebuilt in the world's type and palette.

## Colors

The palette is a two-ink print system on black paper: one acid lime, one hot pink, and a small set of tints and neutrals that keep the data readable.

### Primary
- **Electric Lime** (#C6FF00): The press. Primary actions, active selections, sorted states, focus rings, and the most important data values. It is the only color allowed on a primary button.
- **Soft Lime** (#E6FF80): The lime tint. Body text on black, secondary data, hover fills, and the "write" state. It is a reading color, not an action color.

### Secondary
- **Hot Pink** (#FF1493): The second impression. Compare and swap highlights, the "B" element, the primary button's misregistration offset, and secondary emphasis. It is never used for a primary action.
- **Bubblegum Pink** (#FF75BD): The pink tint. Muted pink labels, pivot outlines, and hover accents. It is the readable pink for small text on black.

### Neutral
- **Jet Black** (#111111): The page ground and the canvas surround. The paper.
- **Panel Black** (#171717): Panel surfaces and the proof frame. One step up from the page.
- **Raised Black** (#1D1D1D): Inputs, metric cells, and inset surfaces. The third tonal layer.
- **Text Primary** (#F4F4EC): Primary copy and headings. A warm white, not pure white.
- **Text Muted** (#A6A69A): Secondary copy, descriptions, and labels.
- **Text Dim** (#7C7C72): Tertiary metadata, footnotes, and disabled-adjacent text.
- **Line** (#2B2B2B): Panel borders and dividers.
- **Line Strong** (#3A3A3A): Input borders, proof-frame borders, and control outlines.
- **Danger** (#FF5C5C): Errors and destructive actions.
- **Warning** (#FFC857): Workload warnings and large-run notices.

### Named Rules
**The Two-Ink Rule.** Lime and pink are the only saturated inks. They are reserved for action, state, and the signature misregistration. A screen with lime and pink scattered as decoration has broken the rule.

**The Registration Rule.** Compare and swap highlights are offset lime/pink outlines. Sorted states align into a single lime mark. The offset is the visual grammar of the product: two impressions finding their register.

**The Local Rule.** Privacy is a visual promise, not a footnote. The lock icon and the "100% local" language use the same lime as the primary action because keeping the image local is part of the product's job.

## Typography

**Display Font:** Archivo Variable (with Archivo, ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo Variable (same stack)
**Label/Mono Font:** JetBrains Mono Variable (with JetBrains Mono, ui-monospace, monospace)

**Character:** A heavy grotesque for the press and a precise mono for the measurements. Archivo carries the voice — tight, blocky, confident, a little streetwear. JetBrains Mono carries the evidence — counters, indices, complexity, seeds, and the small uppercase labels that name a panel's job. The pairing is deliberately two-voice: one speaks, one measures.

### Hierarchy
- **Display** (900, clamp(28px, 3.2vw, 42px), 0.98): The empty-state headline and the guide title. Tight tracking (-0.04em), balanced line breaks.
- **Headline** (900, 28px, 1.05): Dialog titles and major section headings. Uppercase only when the phrase is a label, not a sentence.
- **Title** (800, 18px, 1.1): Panel titles and the algorithm name. Uppercase, 0.1em tracking, 11px in the panel head.
- **Body** (400, 15px, 1.5): Descriptions, guide copy, and empty-state support. Measure stays under 72ch.
- **Label** (700, 9px, 0.12em, uppercase): Panel labels, metric names, proof metadata, and control captions. Mono, never body copy.
- **Data** (700, 19px, 1.1): Counters, element counts, grid dimensions, and complexity values. Tabular numerals, tight tracking.

### Named Rules
**The Measurement Rule.** Monospace is for data, indices, counters, seeds, and code-like labels. It is never the body voice. If a sentence could be read aloud comfortably, it is not mono.

**The One Voice Rule.** Archivo carries every heading, button, and paragraph. There is no display/body pairing beyond the mono measurement layer. A third face would be a costume.

## Layout

The app is a single-page workspace with a 1600px maximum width. On desktop it is a two-column grid: the stage at roughly 1.55fr and the control rail at 0.9fr, with a 20px gap and 24px page padding. The stage is sticky at 20px from the top so the proof sheet stays visible while the rail scrolls. The rail is a 14px stack of panels: image, granularity, algorithm, statistics, inspector.

The proof frame is the visual anchor. It has 12px padding, a 1px line-strong border, a 14px radius, and a dashed inner rule inset 6px. The canvas sits inside a checkerboard wrapper with an 8px radius. The proof head is a compact strip with a registration mark, a mono label, and the image dimensions. The now strip sits below the canvas with a stamped event label, a one-line explanation, and the element count.

The desktop canvas is capped at 48vh so the full stage — canvas, now strip, and playback controls — fits a short laptop viewport. Below 820px viewport height the stage stops being sticky, so the playback controls are reachable by ordinary scrolling. Below 1100px the workspace becomes a single column and the stage stops being sticky. Below 700px the page padding drops to 14px, the canvas becomes width-constrained by the column, the canvas note and element count hide, and the playback controls wrap. Below 380px the proof metadata hides and the proof label drops to 8px. The 320px layout is the floor: no horizontal overflow, no clipped controls, and the rail panels remain full width.

The spacing rhythm is tight inside groups and generous between them: 4px for label-to-value, 8px for control gaps, 14px for panel padding and rail gaps, 20px for the workspace gap, 28px for the page's bottom padding. More space sits above a heading than below it.

## Elevation & Depth

The system is flat by default. Panels use a 1px border and a tonal step, not a shadow. The proof frame is a printed surface: a 1px line-strong border, a tonal step from the page, and a dashed inner rule. It carries no shadow. The guide dialog is the only shadowed surface (`0 30px 90px rgba(0, 0, 0, 0.6)`) because it is a protected reading layer that must separate from the work.

The primary button carries a 3px hot-pink offset (`box-shadow: 3px 3px 0 #FF1493`). This is not a general elevation token. It is a print misregistration: the lime impression and the pink impression are slightly out of register. It belongs to the primary action only. On press, the button translates 2px and the offset collapses to 1px, as if the impression is being pulled into register.

### Shadow Vocabulary
- **Dialog** (`0 30px 90px rgba(0, 0, 0, 0.6)`): The guide dialog only.
- **Primary misregistration** (`3px 3px 0 #FF1493`): The primary button's print offset. Not a depth system.

### Named Rules
**The One-Offset Rule.** The hard offset belongs to the primary action. It is a misregistration, not a default card shadow. A second hard offset on a panel, chip, or secondary button is a costume.

## Shapes

Controls use a 9px radius. Panels use a 14px radius. Chips use a 5px radius. Status pills use a 999px radius. Borders are 1px, except the proof frame's 1px line-strong border and the primary button's 1px lime border. The proof frame's inner rule is 1px dashed at 16% soft lime.

The brand mark is two overlapping 20px squares with 2px black borders: lime on the top-left, hot pink on the bottom-right, with a screen blend where they overlap. It is the smallest expression of the registration idea. The canvas is a crisp rectangle with an 8px radius; there are no organic blobs, geometric masks, or decorative clip paths.

## Components

### Buttons
- **Shape:** 9px radius, 38px minimum height, 13px horizontal padding, 7px icon gap.
- **Primary:** Electric lime background, jet-black text, 1px lime border, 3px hot-pink misregistration offset. Used for Start, Resume, Replay, and the empty-state Choose image action.
- **Hover / Focus:** Primary hover shifts to soft lime; active translates 2px and collapses the offset to 1px. Focus is a 2px lime outline with a 2px offset. Ghost buttons gain a 7% lime tint on hover.
- **Secondary / Ghost:** Transparent background, 1px line-strong border, text primary. Used for Step, Shuffle, Reset, Restore, and the guide trigger. Icon-only buttons are 38px square with an aria-label and title.

### Chips
- **Style:** Transparent background, 1px line-strong border, 5px radius, 22px height, 9px mono uppercase with 0.08em tracking.
- **State:** Lime chips for local/active/sorted, pink chips for quadratic/compare, soft-lime chips for neutral metadata. Chips are labels, not buttons.

### Cards / Containers
- **Corner Style:** 14px radius.
- **Background:** Panel black (#171717) on the jet-black page; raised black (#1D1D1D) for inset metric cells and inputs.
- **Shadow Strategy:** Flat by default; the proof frame uses a border and tonal step, and the guide dialog is the only shadowed surface.
- **Border:** 1px line (#2B2B2B) for panels, 1px line-strong (#3A3A3A) for inputs and the proof frame.
- **Internal Padding:** 15px panel body, 13px panel head, 12px proof frame.

### Inputs / Fields
- **Style:** Raised black background, 1px line-strong border, 8px radius, 42px minimum height, 12px horizontal padding. The select uses a custom chevron in muted text.
- **Focus:** 2px lime outline with a 2px offset. Hover shifts the border to soft lime.
- **Error / Disabled:** Errors use the danger color in an alert with a 1px danger border and an 8% danger fill. Disabled controls drop to 40% opacity and keep their shape.

### Navigation
- **Style:** A 64px top bar with a 1px line border and a 12px backdrop blur. The brand lockup is a 30px registration mark plus a two-line wordmark: "PIXEL SORT" in 17px Archivo 900 and "VISUALIZER" in 8px mono with 0.24em tracking.
- **States:** The status pill is a 26px pill with a 6px dot: lime for live/done, bubblegum for paused, danger for error, muted for idle. The guide trigger is a ghost button; on mobile it collapses to a 34px icon button.

### Signature Components
**The Proof Frame.** A 14px-radius panel with a 1px line-strong border, a 12px padding, a dashed inner rule, a registration mark, a mono proof label, and a live impression strip. The canvas sits inside a checkerboard wrapper. The now strip below the canvas carries a rotated event stamp (lime for sorted/complete, pink for compare/swap/pivot, soft lime for read/write) and a one-line explanation. This is the product's identity; it should not be reduced to a generic card.

**The Misregistered Highlight.** Compare events draw a lime solid outline offset (-2, -2) and a hot-pink dashed outline offset (2, 2), each with an A/B label. Swap events draw both outlines plus a connecting line with arrowheads and a SWAP label. Pivot events use a pink dashed outline with a P label. Sorted events use a lime tick. The line style and label carry the state alongside the color.

**The Metric Cell.** A raised-black cell with a 9px mono label and a 19px mono value. The total-ops and active-compute cells use lime. The secondary row (aux writes, passes, max depth) uses soft lime and shows an em dash when the metric does not apply.

## Implementation

The YAML frontmatter above is the human-readable spec. The executable copy lives in `src/app.css`:

- Colors, radii, spacing, fonts and the type scale are `@theme` entries, which generate the utilities (`bg-lime`, `rounded-md`, `text-label`, `p-3.5`).
- The design's max-width breakpoints are `@custom-variant`s (`shell` 1100, `narrow` 760, `compact` 700, `tight` 480, `tiny` 380) plus `short` for `max-height: 820px`.
- Shared primitives are `@utility` blocks: `panel`, `panel-head`, `panel-title`, `panel-body`, `panel-note`, `label`, `btn`, `btn-primary`, `btn-ghost`, `btn-small`, `chip`, `chip-lime`, `chip-pink`, `chip-soft`, `alert`, `alert-warning`, `mono`, `checkerboard`, `speed-range`.
- `--radius-sm` and `--radius-md` are overridden to 9px and 14px, so `rounded-sm`/`rounded-md` follow this system rather than Tailwind's defaults.

When a value here changes, change it in `@theme` first; the frontmatter should follow.

## Do's and Don'ts

### Do:
- **Do** use electric lime for primary actions, active selections, sorted states, and the most important data value.
- **Do** use hot pink for compare/swap highlights, the second impression, and secondary emphasis.
- **Do** use soft lime for body text and readable secondary data on black.
- **Do** keep the canvas the largest object on the screen and the proof frame the anchor surface.
- **Do** pair every color-coded state with a line style, label, or text description.
- **Do** use JetBrains Mono for counters, indices, seeds, complexity, and panel labels.
- **Do** keep the image local and say so in the interface.
- **Do** use the 3px pink offset only on the primary action and the proof frame.

### Don't:
- **Don't** scatter lime and pink as decoration. They are inks with jobs.
- **Don't** use gradient text, glowing edges, or a generic neon-on-black dashboard treatment.
- **Don't** use a hard offset shadow on panels, chips, or secondary buttons.
- **Don't** use monospace for body copy or long descriptions.
- **Don't** use emoji or Unicode glyphs as icons; use the authored SVG icon set.
- **Don't** rely on color alone to communicate compare, swap, write, pivot, or sorted states.
- **Don't** add a light theme; the pinned world is a dark print lab.
- **Don't** turn the right rail into a grid of identical icon-heading-text cards. Each panel is shaped by its data.
- **Don't** use a modal for a task that can be done inline; the guide dialog is optional reading, not a required step.
