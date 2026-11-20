# Pixel Sort Visualizer

Turn an image into a sorting-algorithm playground. Choose a block size, pick an algorithm, and watch the scrambled image rearrange live until the original composition is restored — entirely in your browser.

The image is the data structure. The algorithm is the process. Live image reconstruction is the visualization.

## What it does

- Upload a PNG, JPEG, or WebP image, or try the locally generated sample poster.
- Divide the image into individual pixels or 8×8, 16×16, 32×32, 64×64, or 128×128 blocks.
- See the exact grid dimensions and sortable element count before a run.
- Shuffle with Fisher–Yates and keep the same shuffled permutation across algorithms.
- Run Bubble, Selection, Insertion, Merge, Quick, Shell, Heap, Counting, Radix, or Bucket Sort.
- Watch the image rearrange on a Canvas 2D notebook sheet with compare, swap, write, pivot, and sorted highlights.
- Read exact comparisons, swaps, writes, reads, total operations, active compute time, auxiliary writes, passes, and recursion depth.
- Play, pause, resume, step, reset, shuffle, restore the original, and change the playback speed up to 32×.
- Switch between educational playback (one event at a time) and performance playback (batched updates for large runs).
- Inspect the current operation, its indices, and a short explanation.
- Open the full algorithm reference with complexity, stability, in-place, and implementation notes.
- Switch between the Warm Graphite, Misty Blue, and Coral Dusk palettes; the choice persists and recolors both the interface and the canvas highlights.
- See worker errors and validation failures as actionable alerts, and large-image notices with a clear suggestion to use a larger block size.

Everything is client-side. Image bytes, thumbnails, and pixel data never leave the browser.

## Quick start

Requires [Bun](https://bun.sh/) (the project uses Bun for installs and scripts).

```bash
bun install
bun run dev
```

Open the local URL Vite prints. The app is a standard Vite + Svelte 5 client-side application; there is no SSR, backend, or database.

If you prefer npm, the same scripts work with `npm install` and `npm run dev`, but the committed lockfile is `bun.lock`.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the Vite dev server. |
| `bun run build` | Build the production client bundle into `dist/`. |
| `bun run preview` | Preview the production build. |
| `bun run check` | Run `svelte-check` and the TypeScript project check. |
| `bun run test` | Run the Vitest unit suite. |
| `bun run test:watch` | Run Vitest in watch mode. |
| `bun run format` | Format with Prettier (Svelte + Tailwind class sorting). |
| `bun run format:check` | Verify formatting without writing. |

## Architecture

```text
src/
  App.svelte                     page shell, keyboard shortcuts, layout
  app.css                        design tokens (@theme), base layer, shared utilities
  lib/
    components/                  Svelte 5 UI components
    core/
      image/                     decode, grid math, Fisher–Yates, sample image
      sorting/                   types, instrumentation, registry, algorithms
      visualization/             Canvas renderer and event application
      workers/                   worker protocol and sorting worker
    stores/
      appState.svelte.ts         run lifecycle, playback queue, worker client
    theme/                       palette registry and active-theme store
    utils/                       formatting and workload guardrails
tests/unit/                      shuffle, grid, algorithms, instrumentation, events, themes, workload, i18n
scripts/                         optional Playwright verification scripts
```

### Sorting model

Every sortable element is an identity equal to its original row-major position. The working permutation is a `Uint32Array` where `permutation[position]` is the source element at that position. Sorting the permutation ascending restores the original image exactly.

The algorithms sort by that position metadata, not by color. The same shuffled permutation is preserved when you switch algorithms, so comparisons are fair.

### Instrumentation

All algorithms use the shared `SortContext` helpers:

- `compare(i, j)` counts one comparison and two reads.
- `compareValue(i, key)` counts one comparison and one read.
- `swap(i, j)` counts one swap, two reads, and two writes.
- `write(i, value)` counts one write.
- `writeAux` / `countWrite` count one write and one auxiliary write.
- `pass(label)` counts one pass.

Total tracked operations = comparisons + reads + writes. Swaps are reported separately and are not added again because their reads and writes are already counted. Rendering reads are excluded.

Each step event carries its own operation deltas, so the displayed counters match the displayed event exactly, even while stepping. In performance mode, the worker sends compact deltas or snapshots with exact cumulative counters.

### Worker and playback

Sorting runs in a Web Worker. The worker runs the selected algorithm as a generator and posts bounded batches:

- **Educational mode:** up to 512 events per batch. The main thread plays them at the selected speed and supports single-step inspection.
- **Performance mode:** the worker samples the working permutation on a time cadence and posts compact deltas or snapshots with the most meaningful operation from that sample window. The main thread applies them at animation-frame cadence, so large runs still show compare, swap, write, and pivot focus without retaining every event.

The worker waits for an acknowledgement after each batch, so the main-thread queue stays bounded. Pausing simply stops consuming and acknowledging. Reset, shuffle, restore, algorithm changes, and granularity changes terminate the worker and rebuild the run state.

### Rendering

`CanvasRenderer` owns the source RGBA buffer, a reusable output `ImageData`, and a separate overlay canvas. The main canvas is rendered at the image's natural resolution; the overlay is rendered at display resolution with device-pixel-ratio awareness. Compare and swap highlights are drawn as misregistered Misty Blue/Soft Coral outlines with labels, so state is not communicated by color alone.

Edge tiles keep their natural size. The unused part of their block cell is transparent, so a small edge tile never stretches. The final permutation is validated, and the reconstructed image matches the original decoded arrangement.

## Workload guardrails

Thresholds are tunable configuration in `src/lib/utils/workload.ts`, not product claims:

- O(n²) algorithms warn above 3,000 elements and are disabled above 25,000.
- Educational mode is recommended up to 12,000 elements and limited to 60,000.
- The safe element limit is 8,000,000.
- Images are limited to 20 MP and 40 MB.
- Performance mode is auto-selected for large runs unless you choose a mode manually.

The app never silently changes your algorithm or granularity. If a run is too large, it explains why and suggests a larger block size or a faster algorithm.

## Testing

```bash
bun run test
bun run check
```

The unit suite covers:

- Fisher–Yates permutation validity, determinism, and edge cases.
- Ceiling-division grid math and partial edge tiles.
- All ten algorithms on empty, single, two-element, random, sorted, and reverse-sorted inputs.
- Step/sample mode equivalence and event-stream replay.
- Instrumentation counters and per-event deltas.
- Event application to the working permutation.
- Theme registry completeness, unique ids, canvas palette derivation, and the CSS `@theme` fallback drift guard.
- Workload guardrails and registry quadratic-flag parity.
- Pass-label localization drift guard (every algorithm's emitted labels) and EN/ID dictionary key parity.
- Playback-speed presets and overlay/range geometry.

The optional `scripts/verify-*.mjs` files drive the app in headless Chrome with `playwright-core` for visual and integration checks. They require a local Chrome install and a dev server on `127.0.0.1:5173` (`bun run dev --host 127.0.0.1`). They are not part of the unit test suite. `verify-upload`, `verify-state` and `verify-interrupt` currently fail on stale expectations that predate the current UI.

## Styling

Tailwind 4 is the styling layer, configured entirely in `src/app.css` (no `tailwind.config.js`):

- `@theme` holds the design tokens from `DESIGN.md`. It mirrors the default theme in `src/lib/theme/palettes.ts` and is the pre-JS fallback; a unit test guards the two against drift. At runtime the active theme writes the same `--color-*` properties on `<html>`, so every utility follows the selected palette.
- The theme registry (`src/lib/theme/palettes.ts`) is the single source of truth for palettes. Adding a theme is one registry entry, its `ink` value in the `index.html` pre-paint hint, and a display-name key in both message catalogs (see below); the dropdown, persistence, CSS variables, and canvas palette derive from it automatically.
- `@custom-variant` defines the design's max-width breakpoints (`shell`, `narrow`, `compact`, `tight`, `tiny`) plus `short` for `max-height: 820px`. Tailwind's own `max-*` variants are exclusive, which would shift each boundary by a pixel.
- `@utility` holds the shared primitives (`panel`, `btn`, `chip`, `alert`, `label`, `mono`, `checkerboard`, `speed-range`). Component markup uses utilities directly; there are no component `<style>` blocks.
- `@source` is explicit and automatic detection is off (`@import 'tailwindcss' source(none)`), so only `src/` and `index.html` are scanned. Without that, class names mentioned in `README.md`, `DESIGN.md` or the verify scripts would generate dead utilities.

Two conventions worth knowing: overlapping utilities of the same property resolve by stylesheet order, not class order, so state variants are built as whole class strings rather than layered on top of a base; and `--radius-sm`/`--radius-md` are overridden to the design's 6px/12px, so `rounded-sm`/`rounded-md` are not Tailwind's defaults.

### Adding a theme

1. Add one entry to `THEMES` in `src/lib/theme/palettes.ts` with a unique `id`, `name`, `nameKey`, optional `scheme`, and a complete `tokens` object.
2. Add the `nameKey` display-name string to both the EN and ID catalogs in `src/lib/i18n/messages.ts` (e.g. `theme.myTheme`).
3. Add its `ink` value to the pre-paint map in `index.html`.
4. Run `bun run test` and `bun run check`.

The header dropdown, persistence, CSS variables, and canvas palette derive from the registry. The theme test enforces token completeness, canvas palette derivation, the `@theme` fallback, and the pre-paint map.

## Known limitations and post-MVP work

- The UI supports English and Bahasa Indonesia. The first visit follows the browser language when it is Indonesian; the header selector overrides and persists the choice locally.
- Pseudocode highlighting, race mode, side-by-side metric comparison, and export are post-MVP.
- Performance thresholds are initial guardrails; benchmark on representative desktop and mobile devices before treating them as final.
- Fully transparent pixels may have their RGB values normalized by the browser's canvas pipeline. The visible result matches the browser-decoded image, not necessarily the original file bytes.
- The app ships three dark palettes — Warm Graphite (default), Misty Blue, and Coral Dusk — plus a registry that makes adding more a one-object change. All are dark; a light palette would be a different visual world, but the theme contract already carries a per-theme `scheme` for native controls.

## Design and product context

- `PRODUCT.md` records the product truth, users, constraints, and the pinned Warm Minimalist Dark Mode palette.
- `DESIGN.md` records the visual system: The Run Ledger notebook world, the warm graphite palette, type ramp, layout, components, and guardrails.
- `.impeccable/design.json` is the machine-readable design sidecar.
- `.impeccable/surfaces/src-app-svelte.md` is the surface brief and direction contract.

## Privacy

All decoding, shuffling, sorting, and rendering happen locally. There is no analytics that captures image contents, no upload endpoint, and no server-side algorithm execution.
