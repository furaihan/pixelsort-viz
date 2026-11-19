---
name: Pixel Sort Visualizer
description: A minimalist sorting-algorithm playground where an image is the data structure.
colors:
  obsidian: "#111116"
  dark-slate: "#171921"
  raised-slate: "#1d1f28"
  glacier-blue: "#9ACCF0"
  quantum-violet: "#6C75A5"
  signal-red: "#F14B50"
  pixel-grey: "#D8DCE8"
  text-muted: "#B8BCC8"
  text-dim: "#9CA0B0"
  line: "#D8DCE8"
  line-strong: "#6C75A5"
  danger: "#F14B50"
  warning: "#F14B50"
themes:
  default: "quantum-signal"
  registry: "src/lib/theme/palettes.ts"
  available:
    - "quantum-signal"
    - "midnight-splash"
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
    backgroundColor: "{colors.glacier-blue}"
    textColor: "{colors.obsidian}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.glacier-blue}"
    textColor: "{colors.obsidian}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pixel-grey}"
    rounded: "{rounded.sm}"
    padding: "0 13px"
    height: "38px"
  panel:
    backgroundColor: "{colors.dark-slate}"
    textColor: "{colors.pixel-grey}"
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

**Creative North Star: "Warm Minimalist Algorithmic Lab"**

Pixel Sort Visualizer is a working algorithm lab presented in an Obsidian-based, minimalist, futuristic dark aesthetic. The image is the data structure, the sorting algorithm is the process, and every operation is visualized with clean precision. The interface is dominated by the palette's dark background and Glacier Blue accents, with Signal Red as the urgent highlight and Quantum Violet as the secondary accent, providing high contrast without harshness.

The canvas is the dominant object. It sits inside a proof frame with registration marks, a dashed inner rule, and a live impression strip. The right rail is a compact stack of functional panels: image, granularity, algorithm, statistics, inspector. The panels share a shell but not a template; each one is shaped by its data.

**Key Characteristics:**
- Obsidian (#111116) main background with a faint halftone dot texture in Quantum Violet.
- Glacier Blue (#9ACCF0) for the primary action, the selected option, live status and counters, completion marks, links, and focus.
- Signal Red (#F14B50) for compare and swap highlights, pivot markers, the quadratic warning, errors, and the primary button's offset.
- Quantum Violet (#6C75A5) for structure: panel icons, input and panel rules, secondary chips, and the speed control. Never small text.
- Pixel Grey (#D8DCE8) for primary text, headings, dividers, and interface elements.
- Archivo Variable for typography; JetBrains Mono Variable for measurements, indices, and counters.
- Misregistered Glacier Blue/Signal Red outlines for compare and swap; line style and labels carry state alongside color.
- Accent color is a signal, not surface: the chrome stays Obsidian, slate, and grey. Solid blue marks the primary action (Start/Resume, Choose image), the current-operation stamp for sorted or completed states, and the brand mark; a selected block size uses a blue border with a 10% tint.

## Colors

The palette is Obsidian-based with Glacier Blue as the primary accent, Signal Red as the highlight accent, and Quantum Violet as the secondary accent; Pixel Grey supplies typography, dividers, and interface neutrals. The direction is bold and futuristic: one dominant accent, one punch of red, and a violet that adds dimension without competing. Quantum Signal is the default palette; Midnight Splash is the alternate. Both are defined in the theme registry and selected from the header.

### Primary Accents & CTA
- **Glacier Blue** (#9ACCF0): The primary action, the selected option, live status and live counters, sorted/completion marks, focus rings, links, and the empty-state upload action.
- **Signal Red** (#F14B50): Highlight accent — compare/swap boxes, pivot markers, the quadratic warning, errors and destructive actions, and the primary button's offset.

### Neutrals & Surfaces
- **Obsidian** (#111116): Main page background and canvas surround.
- **Dark Slate** (#171921): Cards, containers, panels, and secondary surfaces (derived Obsidian lift).
- **Raised Slate** (#1d1f28): Inset metric cells, inputs, and raised surfaces (derived Obsidian lift).
- **Pixel Grey** (#D8DCE8): Primary text, headings, dividers, and interface elements.
- **Quantum Violet** (#6C75A5): Structural secondary accent — panel-title icons, panel and input rules, the proof-frame inner rule, secondary chips, the speed control, and hover borders. It is never used for small text: at 3.7:1 against the Obsidian ground it misses the 4.5:1 body-text floor.
- **Text Muted** (#B8BCC8): Secondary copy, descriptions, and labels.
- **Text Dim** (#9CA0B0): Tertiary copy and metadata.
- **Danger** (#F14B50): Errors and destructive actions.
- **Warning** (#F14B50): Workload warnings and large-run notices.

### Named Rules
**The Signal Rule.** Color marks where the user acts or live state changes. Solid Glacier Blue is reserved for the primary action (Start/Resume, Choose image), the current-operation stamp when the event is sorted or complete, and the brand mark; a selected option uses a Glacier Blue border with a 10% tint. Live counters and status are blue while a run is active or complete. Everything else — panel chrome, metadata, labels, values, helper copy — is Pixel Grey or Text Muted.

**The Tone Rule.** Glacier Blue and Quantum Violet provide clear, bold contrast against the Obsidian ground and Pixel Grey text without jarring saturation; Signal Red is the single visual punch.

**The Registration Rule.** Compare and swap highlights use offset Glacier Blue/Signal Red outlines. Sorted states align into a single Glacier Blue mark.

## Themes

Themes are data, not CSS. `src/lib/theme/palettes.ts` is the single source of truth: each theme is one entry in `THEMES` with a display name, an optional native `scheme`, and a `tokens` object. The active theme writes the tokens to `--color-*` custom properties on `<html>`; Tailwind utilities already reference those variables, so every component and the canvas overlay follow the selection without per-theme CSS. The choice persists in `localStorage` and is applied by the theme store before the app mounts. A small inline pre-paint hint in `index.html` sets `--color-ink` from the saved theme before the bundle runs, so a cold load does not flash the default background; the theme test keeps that map in sync with `THEMES`.

### Token contract

| Token | Required | Role | CSS variables | Default |
| --- | --- | --- | --- | --- |
| `ink` | yes | Primary background | `--color-ink` | — |
| `ink2` | yes | Panels, containers | `--color-ink-2` | — |
| `ink3` | yes | Inset/raised surfaces | `--color-ink-3` | — |
| `ink4` | yes | Highest surface | `--color-ink-4` | — |
| `line` | yes | Subtle borders | `--color-line` | — |
| `structural` | yes | Secondary structure | `--color-line-strong`, `--color-bubblegum`, `--color-violet` | — |
| `accent` | yes | Primary accent | `--color-lime`, `--color-soft-lime` | — |
| `highlight` | yes | Focal accent | `--color-pink`, `--color-danger`, `--color-warning` | — |
| `text` | yes | Primary text | `--color-text` | — |
| `muted` | yes | Secondary copy | `--color-muted` | — |
| `muted2` | yes | Tertiary copy | `--color-muted-2` | — |
| `lineStrong` | no | Strong borders | `--color-line-strong` | `structural` |
| `accentSoft` | no | Hover accent | `--color-soft-lime` | `accent` |
| `danger` | no | Errors | `--color-danger` | `highlight` |
| `warning` | no | Warnings | `--color-warning` | `highlight` |

### Palette 02 — Midnight Splash

Mood: bold, immersive, tech-forward, energetic.

| Color | Hex | Role | Token |
| --- | --- | --- | --- |
| Arcade Ink | `#182644` | Primary background, structural foundation | `ink` |
| Pool Blue | `#7EEFFF` | Highlights, interactive elements | `accent` |
| Bubblegum | `#FF5076` | Focal accent, CTA, emphasis | `highlight` |
| Deep Navy | `#263D60` | Secondary background, surfaces, containers | `ink2` / `ink3` |
| Ice Mist | `#DCEBF2` | Light text, subtle surfaces, borders | `text` / `line` |
| Muted Pool Blue | `#6C9BD1` | Derived secondary structure | `structural` |

### Adding a theme

1. Add one entry to `THEMES` in `src/lib/theme/palettes.ts` with a unique `id`, `name`, optional `scheme`, and a complete `tokens` object. The `satisfies Record<string, ThemeDefinition>` clause makes a missing required token a compile error.
2. Add the theme's `ink` value to the pre-paint map in `index.html` so a cold load with that theme saved does not flash the default background. The theme test fails if the map is missing or out of sync.
3. Run `bun run test` and `bun run check`.
4. Done. The header dropdown, persistence, CSS variables, and canvas palette derive from the registry.

Adding a new *token* (rather than a theme) is the one extension point that touches more than one file: add it to `ThemeTokens` (optional with a default), `resolveCssVars`, the `@theme` fallback, and the expected-variable list in the theme test.

## Typography

**Display Font:** Archivo Variable (with Archivo, ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo Variable (same stack)
**Label/Mono Font:** JetBrains Mono Variable (with JetBrains Mono, ui-monospace, monospace)

### Hierarchy
- **Display** (900, clamp(28px, 3.2vw, 42px), 0.98): Empty-state headline and guide title.
- **Headline** (900, 28px, 1.05): Dialog titles and major section headings.
- **Title** (800, 18px, 1.1): Panel titles and algorithm names.
- **Body** (400, 15px, 1.5): Descriptions, guide copy, and empty-state support.
- **Label** (700, 9px, 0.12em, uppercase): Panel labels, metric names, proof metadata, and control captions.
- **Data** (700, 19px, 1.1): Counters, element counts, grid dimensions, and complexity values.

## Layout

The app is a single-page workspace with a 1600px maximum width. On desktop it is a two-column grid: stage at ~1.55fr and control rail at ~0.9fr, with a 20px gap and 24px page padding. The proof frame is the visual anchor with 12px padding, a 1px line-strong border, 14px radius, and dashed inner rule.

## Elevation & Depth

The system is flat by default with tonal steps between Dark Slate panels and Obsidian ground. The primary button carries a 3px Signal Red offset (`box-shadow: 3px 3px 0 #F14B50`). On press, the button translates 2px and the offset collapses to 1px.

## Shapes

Controls use a 9px radius. Panels use a 14px radius. Chips use a 5px radius. Status pills use a 999px radius. Borders are 1px, except the proof frame's 1px line-strong border and primary button's 1px Glacier Blue border.

## Components

### Buttons
- **Shape:** 9px radius, 38px minimum height, 13px horizontal padding, 7px icon gap.
- **Primary:** Glacier Blue background, Obsidian text, 1px Glacier Blue border, 3px Signal Red offset. Used for Start, Resume, Replay, and empty-state Choose image action.
- **Secondary / Ghost:** Transparent background, 1px line-strong border, Pixel Grey text; hover raises the fill to Raised Slate and the border to Pixel Grey. Used for Step, Shuffle, Reset, Restore, and guide trigger.

### Chips
- **Style:** Transparent background, 1px line-strong border, 5px radius, 22px height, 9px mono uppercase.
- **State:** Glacier Blue chips for live status, Signal Red chips for the quadratic warning, and a Quantum Violet border with Text Muted copy for granularity and secondary metadata. Algorithm properties (stable, in place) use the neutral chip; the value word carries the state.

### Cards / Containers
- **Corner Style:** 14px radius.
- **Background:** Dark slate (#171921) on Obsidian page; raised slate (#1d1f28) for inset metric cells and inputs.
- **Border:** 1px Pixel Grey (#D8DCE8) for panels, 1px Quantum Violet (#6C75A5) for inputs and proof frame.

### Inputs / Fields
- **Style:** Raised slate background, 1px Quantum Violet border, 8px radius, 42px minimum height, 12px horizontal padding.
- **Focus:** 2px Glacier Blue outline with a 2px offset.

## Implementation

The default theme's tokens are defined in `@theme` in `src/app.css` and mirrored in this frontmatter and in `src/lib/theme/palettes.ts`; a unit test guards the CSS fallback against drift. At runtime the theme store writes the active palette's tokens to `--color-*` on `<html>`, so all utilities and the canvas overlay follow the selection.
