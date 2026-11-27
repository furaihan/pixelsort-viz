---
name: "Pixel Sort — The Run Ledger"
description: "A student's lab notebook on graph paper: every sort is a numbered, dated experiment, read from honest counters and signed off with a stamp."
colors:
  ground: "#252729"
  panel: "#2b2e30"
  inset: "#343a3d"
  raised: "#3d4447"
  rule: "#3a3f42"
  rule-strong: "#6e8891"
  accent: "#9cbbc5"
  accent-soft: "#9cbbc5"
  focal: "#e99588"
  structure: "#6e8891"
  text: "#eae2d8"
  muted: "#b9c4c6"
  muted-2: "#9aa8ac"
  danger: "#e27262"
  warning: "#d9a05b"
typography:
  display:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(24px, 2.2vw, 32px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Courier Prime', ui-monospace, 'Cascadia Code', monospace"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  body:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "'Courier Prime', ui-monospace, 'Cascadia Code', monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  stats-label:
    fontFamily: "'Atkinson Hyperlegible', 'Schibsted Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.02em"
  data:
    fontFamily: "'Courier Prime', ui-monospace, 'Cascadia Code', monospace"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0em"
  data-sm:
    fontFamily: "'Courier Prime', ui-monospace, 'Cascadia Code', monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "12px"
  pill: "999px"
spacing:
  "1.5": "6px"
  "2": "8px"
  "2.5": "10px"
  "3": "12px"
  "3.5": "14px"
  "4": "16px"
  "6": "24px"
components:
  button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  button-hover:
    backgroundColor: "{colors.inset}"
  button-primary:
    backgroundColor: "{colors.focal}"
    textColor: "{colors.ground}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #e99588 88%, white)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  button-small:
    height: "32px"
    padding: "0 10px"
  field:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 36px 0 12px"
    height: "40px"
  chip:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "22px"
  chip-accent:
    textColor: "{colors.accent}"
  chip-focal:
    textColor: "{colors.focal}"
  stamp:
    textColor: "{colors.focal}"
    rounded: "2px"
    padding: "2px 10px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
  panel-head:
    padding: "12px 16px"
  panel-body:
    padding: "16px"
  label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  alert:
    backgroundColor: "color-mix(in srgb, #e27262 8%, transparent)"
    textColor: "color-mix(in srgb, #e27262 25%, #eae2d8)"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Pixel Sort — The Run Ledger

## Overview

**Creative North Star: "The Run Ledger"**

The interface is a student's lab notebook on matte graphite cardstock. Every sort is a numbered, dated experiment entry: the uploaded image is the specimen plate taped to the sheet with registration corners, the counters are a right-aligned tabular data table, the current operation is a margin observation with proportional cost ticks, and completion presses a VERIFIED sign-off stamp. The sheet is a surface, not a diagram — a soft lamp washes down matte cardstock with fine paper tooth, with no page-wide grid or lattice; the sorting blocks live on the specimen alone. The world lends type, palette, density, and the stamp/sign-off signature; the controls underneath stay standard, scanable web controls (Operate mode). No costume, no theme-park chrome.

This world replaced the incumbent "Quantum Signal" neon-dashboard look; there was no seeded catalog world and no prior DESIGN.md. The pinned palette is a binding product commitment (PRODUCT.md): Warm Minimalist Dark Mode in Midnight Graphite, Dark Slate, Misty Blue, Soft Coral, and Cloud Cream — warm, minimal, sophisticated, calming. The build honors it with matte pastel accents on graphite, two self-hosted type voices, and a flat tonal surface ladder instead of glow. Three sibling themes (Warm Graphite default, Misty Blue, Coral Dusk) live inside the same world: same roles, same form language, different light.

**Key Characteristics:**
- Matte graphite sheet with fine paper tooth under a single soft overhead light; no page-wide grid or dot lattice. Sorting blocks live on the specimen, never in the wallpaper.
- Two primary type voices: Schibsted Grotesk speaks the UI; Courier Prime types every number, stamp, and metadata line. Atkinson Hyperlegible is reserved for the data-table row labels for legibility.
- Two accents with fixed roles: coral is the verb (active operation, primary action), mist is the noun (selection, focus, sorted/verified).
- Flat tonal depth (ground → panel → inset → raised) with 1px pencil rules; shadows only on floating layers.
- Honest, glanceable data: tabular numerals, right-aligned counters, proportional operation ticks, a stamp pressed once at completion.
- Calm motion: 160ms control transitions, one 220ms stamp press, a soft live pulse; everything collapses under reduced motion.

## Colors

A warm graphite night desk: matte mist and coral on deep slate, cream ink, and pencil-gray rules — never neon, never pure black or pure white. All values are normative in the frontmatter; components consume them only as `--color-*` custom properties.

### Primary
- **Soft Coral** (`focal`): the active operation and the primary action. Primary button fill (with ground-colored text), live total-ops and compute-time figures, compare/swap/pivot ticks and log types, the RUN № stamp, the caret in text inputs, and the live-status chip. Its rarity is the point: coral marks what is happening *now*.

### Secondary
- **Misty Blue** (`accent`): selection and interactive structure. Focus rings, links, text selection background, the active granularity cell, sorted/complete states, the VERIFIED stamp, the speed-range thumb, and dropzone hover. `accent-soft` is its alias for link hover (defaults to `accent` per theme).
- **Slate Structure** (`structure`): secondary structure — panel-title icons, registration crosses, legend marks, the read-dot, metadata icons. `rule-strong` carries the same hue family for interactive frames (field borders, chip borders, scrollbar thumbs).

### Neutral
- **Midnight Graphite** (`ground`): the notebook sheet — page background, primary-button text, selection text, scrollbar-thumb border, canvas overlay ink.
- **Panel Graphite** (`panel`): panel surfaces — data table, conditions, margin notes, header (at 90% with blur), popover and dialog bodies.
- **Dark Slate** (`inset`): inset surfaces — fields, metric cells, plate backing, idle granularity cells, button hover.
- **Raised Slate** (`raised`): the highest tonal step — empty-state mosaic cells, active-cell backing.
- **Pencil Rule** (`rule`): subtle 1px borders and dividers — panel frames, row lines (at 60%), section separators, footer border.
- **Cloud Cream** (`text`): primary ink — headings, body copy, counter values; also the soft light and paper tooth of the sheet, and the translucent tape strips.
- **Mist Muted** (`muted`): secondary copy — labels, panel notes, descriptions, idle chip text.
- **Slate Metadata** (`muted-2`): tertiary copy — timestamps, file metadata, footer, speed presets, log type tags.

### Semantic
- **Ember Red** (`danger`) and **Lab Amber** (`warning`): shared across all three themes — they carry meaning, not mood. Danger frames error alerts, the NOT VERIFIED stamp, and the remove-image hover; amber frames workload warnings and notices. Both appear as `color-mix` tints (border 45%/40%, background 8%/7%, text 25% toward cream), never as solid fills.

### The theme family
`src/lib/theme/palettes.ts` is the single registry; `app.css` `@theme` mirrors the default and a unit test (`tests/unit/theme.test.ts`) guards the two against drift (case-insensitive hex compare). At runtime the theme store writes all 15 `--color-*` properties onto `<html>` before paint, persists to `localStorage['pixel-sort-theme']`, syncs `color-scheme` and the `theme-color` meta, and an inline pre-paint hint in `index.html` prevents a cold-load flash. The canvas overlay palette is derived from the same tokens (`getCanvasPalette`), so it can never drift.

- **Warm Graphite** (default, pinned): the palette above.
- **Misty Blue**: a cooler night at the same desk — blue-slate sheet, mist still primary, coral still focal.
- **Coral Dusk**: a warmer evening — coral takes the interactive role, mist marks the work. The hues swap; the roles never do.

### Browser surface
The world themes the browser chrome itself: `::selection` is accent on ground; the text caret is focal; scrollbars are thin with rule-strong thumbs bordered in ground (pill radius); every mono figure sets `font-variant-numeric: tabular-nums`.

### Named Rules
**The Token-Role Rule.** Accent and focal are roles, not hexes. Every theme binds selection/focus/links to `--color-accent` and the active operation/primary action to `--color-focal`. Coral Dusk swaps the hues but never the roles; no component may hardcode a palette hex.
**The Semantic Constant Rule.** Danger and warning keep one hex pair across the whole family. State meaning must not shift with the mood of the sheet.

## Typography

**Display/UI Font:** Schibsted Grotesk Variable (self-hosted via `@fontsource-variable/schibsted-grotesk`; falls back to ui-sans-serif, system-ui, Segoe UI)
**Body Font:** same grotesque, 400 at 14px/1.5
**Label/Mono Font:** Courier Prime 400/700 (self-hosted via `@fontsource/courier-prime`; falls back to ui-monospace, Cascadia Code)
**Data-table row labels:** Atkinson Hyperlegible 700 (self-hosted WOFF2 in `public/fonts`); used only for the operation names in the statistics table.

**Character:** a warm Scandinavian grotesque speaks the interface while a typewriter face types the record. The pairing is the notebook: prose in pen, data on the typewriter. Headings tighten (-0.02em); labels and metadata track wide (0.08–0.14em) and set uppercase.

### Hierarchy
- **Display** (700, clamp(24px, 2.2vw, 32px)/1.05, -0.02em): the guide dialog title — the only display voice in the app.
- **Title** (700, 20px/1.2, mono): panel titles (DATA TABLE, CONDITIONS, margin notes), set in Courier Prime with a structure-colored icon; the run-entry elapsed clock and the data-table counter figures also sit at 20px mono.
- **Body** (400, 14px/1.5): default copy; descriptions and notes step down to 12–13px in muted, prose capped near 54–72ch.
- **Label** (700, 11px/1.2, 0.12em, uppercase, mono): field and section labels — the notebook's printed captions. Statistics-table row labels are an exception: Atkinson Hyperlegible 700, 14px/1.35, 0.02em, uppercase.
- **Data** (700, 22px/1.1, mono, tabular): the sortable-element count in the granularity panel — the big pre-run figure.
- **Data-sm** (700, 15px/1.2, mono, tabular): secondary figures — aux writes, passes, max depth, grid dimensions, the observation-strip count.

Micro-labels and metadata sit on an 11px floor: status chips, speed-scale ticks, the playback status and shortcut lines, the block-size readout, file meta, the source-resolution label, legend labels, the total formula, and definition terms all set 11px. Statistics-table row labels are 14px for legibility. A compact 10px tier survives for secondary accents only — the footer, PX unit suffixes, log type tokens, the in-place percent, the guide subtitle and step badges. Two 9px spots (the guide's reference-table headers, the uploader's size-limit tag) are carried drift below the floor, not ramp steps.

### Named Rules
**The Two-Voice Rule.** The grotesque speaks; the typewriter types. Every figure that is read, compared, or counted — counters, seeds, dates, dimensions, complexity, stamps — is Courier Prime with tabular numerals. Atkinson Hyperlegible is a narrow exception for statistics-table row labels only. Prose paragraphs never set in mono.
**The 11px Floor Rule.** Micro-labels and metadata set at 11px; the 10px tier is reserved for secondary accents (unit suffixes, log type tokens, the footer, the in-place percent). Nothing new ships below 10px — the guide table's 9px headers are drift to retire, not a license.

## Layout

A two-column workspace on a ruled sheet, capped at `min(1600px, 100%)` and centered. The main grid is `minmax(0, 1.78fr) / minmax(340px, 1fr)` with a 24px column gap and 24px side padding (20px top, 28px bottom). Left: the run-entry header and specimen plate, the observation strip, and the margin-note inspector. Right: a sticky rail (top 20px) ordered DATA TABLE → playback row → CONDITIONS — playback sits above conditions so the primary action stays within the 900px desktop fold. The header is a 58px-min bar that wraps (flex-wrap with a 6px row gap) so its controls never overflow — 0 horizontal overflow measured at 390px; the footer is a thin ruled strip with the local-only note and shortcuts. Before a specimen is mounted, the workspace holds a 440px-minimum empty panel with vertically centered content, so the blank sheet keeps its presence instead of collapsing. Spacing rides Tailwind's 4px base: 16px between panels, 12px inside panel heads, 10px/6px for tight clusters.

Breakpoints are **inclusive max-width** custom variants (deliberately not Tailwind's exclusive `max-*`, which would shift every boundary by one pixel):

| Variant | Query | Behavior |
| --- | --- | --- |
| `shell` | ≤ 1100px | Single column; both columns dissolve (`display: contents`) and stack by `order`: workspace + observation (1) → playback (2) → data table (3) → conditions (4) → margin notes (5). |
| `narrow` | ≤ 760px | Header padding 14px; local badge hides; guide button becomes a 34px icon-only square; granularity grid 6 → 3 columns. |
| `compact` | ≤ 700px | Rhythm tightens to 14px gaps/padding; plate grows to 52vh (from 48vh); primary action flexes full-width; footer shortcuts, playback shortcut line, observation-strip count, and source-resolution note hide; guide table scrolls horizontally. |
| `tight` | ≤ 480px | Brand 23 → 20px; notebook tag hides; theme/language selects cap 150 → 120px; inspector legend 3 → 2 columns. |
| `tiny` | ≤ 380px | Header gap 8px; plate dimension readout hides. |
| `short` | ≤ 820px height | Rail stops sticking (static), so short viewports scroll naturally. |

The page never narrows below 320px. The specimen plate sizes as `min(100%, 48vh × aspect)` with the image's own aspect ratio, so the picture stays the star without pushing the controls off-screen.

### Named Rules
**The Matte Sheet Rule.** The body is matte graphite cardstock: one broad cream wash from the top of the sheet (5% at center, stepping down through 3% and 1% to nothing at the corners) over `public/textures/paper-tooth.png`, a seamless 256px white-on-alpha fibre texture generated by `scripts/generate-paper-tooth.py` (seed 20261127). No two-axis grid, dot lattice, or geometric pattern. The image is the only geometry; block size is read in the plate caption, never painted on the wallpaper.

## Elevation & Depth

The sheet is flat by default. Depth is tonal, not shadowed: a four-step ladder (ground → panel → inset → raised) separated by 1px pencil rules, with rule-strong reserved for interactive frames. Shadows exist only where something genuinely floats above the sheet — the algorithm popover and the guide dialog — plus two hairline treatments on the speed range. The header is the one translucent surface (panel at 90% with an 8px backdrop blur); the dialog dims the sheet behind a 70% black, 4px-blurred backdrop.

### Shadow Vocabulary
- **Float-popover** (`box-shadow: 0 18px 50px rgba(0,0,0,0.5)`): the algorithm info popover only.
- **Float-dialog** (`box-shadow: 0 24px 70px rgba(0,0,0,0.55)`): the guide dialog only.
- **Track-inset** (`box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-rule) 60%, transparent)`): the speed-range groove.
- **Thumb-ring** (`box-shadow: 0 0 0 1px var(--color-accent)`): the speed-range thumb's halo.

### Named Rules
**The Flat Sheet Rule.** Resting surfaces carry no shadow. If a surface is not a popover or dialog, its depth comes from tone and a 1px rule — never from a drop shadow, and never from a hard offset shadow.

## Shapes

Corners are quiet and consistent: gently curved controls (6px, `rounded.sm`), softly rounded sheets and panels (12px, `rounded.md`), and full pills (999px) for chips, the range track, and scrollbar thumbs. The stamp is the deliberate exception — a 2px corner and a 2px border, the crisp rectangle of a rubber stamp. Micro-marks (operation ticks, legend swatches, mosaic cells) sit at 1–2px; mode segments at 4px; guide step badges at 5px; inset grids (complexity table, reference table, note cards) at 8px.

Borders are 1px pencil rules; interactive frames upgrade to rule-strong. Dashed strokes mean "not yet mounted": the empty plate, the full dropzone, and the write-state legend swatch (dotted). The specimen plate carries the world's signature geometry: two translucent tape strips (96×24px, cream at 15% with a 10% border, rotated -3° and +2°) and four 18px registration crosses in structure, offset 9px past the corners. Behind transparent images sits a 12px checkerboard (16px on the plate) in ground/inset. Canvas pixels render with `image-rendering: pixelated` — the specimen is never smoothed.

## Components

### Buttons
Workhorse controls, tactile but restrained: 38px min-height, 6px corners, 1px rule border, panel fill, 13px/600 UI type with 0.01em tracking, 7px icon gap.
- **Primary:** focal fill and border, ground text, 700 weight; min-width 142px on the playback action. Hover lifts the fill toward white (`color-mix(in srgb, focal 88%, white)`); active presses down 1px.
- **Default:** panel fill; hover moves to inset with a rule-strong border.
- **Ghost:** transparent fill and border; hover reveals inset + rule. Used for step/shuffle/reset/restore and icon-heavy utility rows.
- **Small:** 32px min-height, 10px side padding, 12px type — header selects and plate utilities.
- **States:** all transitions 160ms ease (background, border, color, transform); disabled at 0.4 opacity with `not-allowed`; focus draws the shared accent ring.

### Chips
Pill-shaped typed tags: 22px min-height, 8px side padding, mono 11px/700 uppercase with 0.08em tracking, 1px rule-strong border, muted text. Variants tint border and text together via `color-mix`: accent (45% border), focal (50%), soft (structure at 55%, muted text). The header status chip is live: `data-tone` maps running → focal, paused → muted, done → accent, error → danger, with a 1.5px pulse dot while running. Chips always carry words — color never speaks alone.

### Panels
The notebook's cards: panel fill, 1px rule border, 12px corners, no shadow. Head is a 12px/16px padded row with a bottom rule, title in mono 20px/700 with a 16px structure icon, and a status chip on the right. Body pads 16px; notes set 12px/1.5 muted. Sections inside a panel separate with a top rule and 12px breathing room.

### Data table
The honest ledger. Row labels are mono 11px/700 uppercase muted, left-aligned; values are 20px mono tabular (title size), right-aligned, cream — except total ops and active compute, which turn focal while running or complete. Rows pad 5px vertically and divide with rule at 60%; the last row is open. Below a ruled separator, a three-column aux row (aux writes, passes, max depth) sets `data-sm` figures under `label` captions, then an 11px mono total-formula line and a collapsible definitions list (11px terms and copy). Empty figures render as em-dashes, never as fake zeros.

### Fields & selects
The `field` select: 40px min-height, inset fill, 1px rule-strong border, 6px corners, 13px/600 text, 36px right padding for a pointer-events-none chevron; hover shifts the border to accent. Header theme/language selects reuse the small button shell with 11px mono text, capped at 150px wide (120px at tight). Every select carries a visible or sr-only label.

### Segmented controls
Granularity is a six-cell radio grid (three columns at narrow): 40px-min cells, 6px corners, mono 16px figure with a 10px unit suffix. Idle cells are inset with rule borders and muted text; the active cell inverts to accent fill with ground text. Focus rings the whole cell via `:has(input:focus-visible)`. The mode toggle is a smaller inset-framed group with 4px segments; the active segment tints accent at 15% with accent text. Both expose `aria-pressed`/radio semantics.

### Speed range
A 4px inset groove with the track-inset hairline and a 16px accent thumb bordered 2px in ground (14px on Firefox), haloed by the thumb-ring. Focus offset widens to 4px. Preset captions run 11px mono beneath, the active preset brightening to cream; `aria-valuetext` announces the human speed label.

### Stamps
The signature sign-off. RUN № sets 17px mono in a 2px focal border with 2px corners; the VERIFIED stamp presses in at 13px with a 14px check icon, tone accent when validated and danger when not. The press is a single 220ms `stamp-press` (scale 1.14 → 1, opacity 0 → 1, cubic-bezier(0.16, 1, 0.3, 1)) from an already-visible default — it never loops and never gates the content.

### Alerts
Ruled notices, not banners: 6px corners, 10px/12px padding, 12px/1.45 text, a 15–16px icon, and `color-mix` tints of danger (errors, `role="alert"`) or warning (workload notes, `role="status"`). Dismissible notices carry a 22px ghost close square.

### Observation strip
The margin note: a 12px-rounded panel at 70% tone with a `label` caption, the current operation in 13px bold over a 12px muted detail (two-line clamp), and up to eight proportional cost ticks — 5px wide, height 6 + 4×weight capped at 24px, toned focal (compare/swap/pivot), accent (sorted/complete), or structure (reads/writes). The element count sits right in 15px mono over a 10px aligned-percent caption. `aria-live` is polite at rest and off while running, so the stream never floods screen readers.

### Specimen plate
The taped image: aspect-locked wrapper, checkerboard backing, 1px rule-strong frame, pixelated main canvas plus a pointer-events-none overlay canvas, tape strips and registration crosses as described in Shapes. The wrapper is `role="img"` with a live label naming the current operation; a block-size caption above states the block pitch, and a pulsing focal dot marks a live run. Unmounted, the plate gives way to the empty mount: a 440px-min dashed panel (panel at 60%, 12px corners, rule-strong dashes) with centered content — a 4×4 mosaic of 14px cells in the tonal ladder sparked with accent/focal/structure, a 20px headline, a 13px description capped at 54ch, and the full uploader.

### Inspector legend & log
Margin notes below the plate: six legend marks pair a distinct shape with each color (dashed inset = compare, corner dot = swap, dotted frame = write, dashed P = pivot, check = sorted, center dot = read), so state is never color-alone; legend labels set 11px. The recent log lists type tokens (10px mono uppercase, toned by operation) beside truncated 11px descriptions.

### Dialog & popover
The guide is a native modal dialog: min(980px, 100vw − 28px), 88vh max, 12px corners, rule-strong frame, float-dialog shadow, blurred 70% backdrop; display title over a mono subtitle, numbered 01–03 steps in 28px framed badges, and a grouped reference table with inset header cells. The algorithm popover is a 340px native popover with the float-popover shadow, flipping above its trigger near the viewport floor.

### Uploader
Full mode: a dashed rule-strong dropzone (126px min, 12px corners, inset at 40%) with a focal choose-button; hover tints accent at 6%, drag-over deepens to 10% with an accent border and a 0.995 scale press. Compact mode: a solid inset row with a 30px accent-tinted upload square. Keyboard-activatable (`role="button"`, Enter/Space), with a sample-image ghost button alongside.

### Shared states & accessibility
- **Focus:** `:focus-visible` draws a 2px accent outline at 2px offset everywhere (4px on the range; whole-cell on granularity). A skip link to the workspace appears on first focus.
- **Reduced motion:** a global clamp collapses every animation and transition to 0.01ms and forces auto scroll behavior.
- **Live regions:** header status and the VERIFIED stamp are `role="status"`; errors are `role="alert"`; the observation strip gates its politeness while running; the canvas carries a descriptive `role="img"` label.
- **Keyboard:** Space plays/pauses/resumes, ArrowRight steps (educational mode), R resets — all suppressed while focus is inside a control. The page ships an sr-only h1 and keeps `document.lang` in sync with the EN/ID locale.
- **Localization:** every string runs through the EN/ID message catalog, including dates (`en-US`/`id-ID`), theme names, and number formatting.

## Do's and Don'ts

### Do:
- **Do** set every counted figure in Courier Prime with `tabular-nums`, right-aligned in the data table, and turn total ops/compute focal only while running or complete.
- **Do** consume colors exclusively as `--color-*` tokens so all three themes (and the derived canvas palette) stay in sync; add new themes only in `palettes.ts`.
- **Do** keep the sheet matte and ungridded — one soft light, irregular paper tooth, no geometric pattern — and read the block size in the plate caption, not in the wallpaper.
- **Do** press the VERIFIED stamp exactly once at completion (220ms stamp-press) and keep its content visible without animation.
- **Do** pair every state color with a word, icon, or distinct shape (chips carry labels; the legend pairs marks with names).
- **Do** draw focus as a 2px accent outline at 2px offset, and honor the global reduced-motion clamp for any new motion.
- **Do** keep danger and warning at their shared semantic hexes across every theme.
- **Do** keep the right rail ordered data table → playback → conditions so the primary action stays within the 900px desktop fold, and let the header wrap rather than overflow.

### Don't:
- **Don't** reintroduce the replaced Quantum Signal look: no neon glows, no saturated cyan/magenta chrome, no bars-and-panels dashboard framing. Accents stay matte pastels on graphite.
- **Don't** put drop shadows on resting surfaces, and never use hard offset shadows; only popovers and dialogs float.
- **Don't** hardcode palette hexes in components or set prose paragraphs in the mono voice.
- **Don't** add a third accent hue or let coral mark selection: focal is the verb, accent is the noun, in every theme.
- **Don't** loop the stamp press, reintroduce a page-wide grid or dot lattice behind the workspace, or introduce motion that survives `prefers-reduced-motion`.
- **Don't** communicate compare/swap/write/pivot/sorted state by color alone, and don't let live regions stream during a run.
- **Don't** smooth the specimen canvas; pixels render pixelated, and partial edge tiles render without cropping or stretching.
- **Don't** set new micro-labels below 11px, or reach for the 10px accent tier outside its established uses (unit suffixes, log type tokens, the footer, the in-place percent).
