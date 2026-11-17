# Pixel Sort Visualizer

Turn an image into a sorting-algorithm playground. Choose a block size, pick an algorithm, and watch the scrambled image rearrange live until the original composition is restored — entirely in your browser.

The image is the data structure. The algorithm is the process. Live image reconstruction is the visualization.

## What it does

- Upload a PNG, JPEG, or WebP image, or try the locally generated sample poster.
- Divide the image into individual pixels or 8×8, 16×16, 32×32, 64×64, or 128×128 blocks.
- See the exact grid dimensions and sortable element count before a run.
- Shuffle with Fisher–Yates and keep the same shuffled permutation across algorithms.
- Run Bubble, Selection, Insertion, Merge, Quick, Shell, Heap, Counting, Radix, or Bucket Sort.
- Watch the image rearrange on a Canvas 2D proof sheet with compare, swap, write, pivot, and sorted highlights.
- Read exact comparisons, swaps, writes, reads, total operations, active compute time, auxiliary writes, passes, and recursion depth.
- Play, pause, resume, step, reset, shuffle, restore the original, and change the playback speed.
- Switch between educational playback (one event at a time) and performance playback (batched updates for large runs).
- Inspect the current operation, its indices, and a short explanation.
- Open the full algorithm reference with complexity, stability, in-place, and implementation notes.
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

## Architecture

```text
src/
  App.svelte                     page shell, keyboard shortcuts, layout
  app.css                        global tokens, reset, shared controls
  lib/
    components/                  Svelte 5 UI components
    core/
      image/                     decode, grid math, Fisher–Yates, sample image
      sorting/                   types, instrumentation, registry, algorithms
      visualization/             Canvas renderer and event application
      workers/                   worker protocol and sorting worker
    stores/
      appState.svelte.ts         run lifecycle, playback queue, worker client
    utils/                       formatting and workload guardrails
tests/unit/                      shuffle, grid, algorithms, instrumentation, events
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
- **Performance mode:** the worker samples the working permutation on a time cadence and posts compact deltas or snapshots. The main thread applies them at animation-frame cadence.

The worker waits for an acknowledgement after each batch, so the main-thread queue stays bounded. Pausing simply stops consuming and acknowledging. Reset, shuffle, restore, algorithm changes, and granularity changes terminate the worker and rebuild the run state.

### Rendering

`CanvasRenderer` owns the source RGBA buffer, a reusable output `ImageData`, and a separate overlay canvas. The main canvas is rendered at the image's natural resolution; the overlay is rendered at display resolution with device-pixel-ratio awareness. Compare and swap highlights are drawn as misregistered lime/pink outlines with labels, so state is not communicated by color alone.

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

The optional `scripts/verify-*.mjs` files drive the app in headless Chrome with `playwright-core` for visual and integration checks. They require a local Chrome install and a running dev server. They are not part of the unit test suite.

## Known limitations and post-MVP work

- The UI is English-only. Copy is centralized in components, but there is no i18n framework yet.
- Pseudocode highlighting, race mode, side-by-side metric comparison, export, and theme customization are post-MVP.
- Performance thresholds are initial guardrails; benchmark on representative desktop and mobile devices before treating them as final.
- Fully transparent pixels may have their RGB values normalized by the browser's canvas pipeline. The visible result matches the browser-decoded image, not necessarily the original file bytes.
- The app intentionally ships a single dark print-lab theme. A light theme would be a different visual world, not a toggle.

## Design and product context

- `PRODUCT.md` records the product truth, users, constraints, and the pinned Electric Pop palette.
- `DESIGN.md` records the visual system: the proof-sheet world, two-ink palette, type ramp, layout, components, and guardrails.
- `.impeccable/design.json` is the machine-readable design sidecar.
- `.impeccable/surfaces/src-app-svelte.md` is the surface brief and direction contract.

## Privacy

All decoding, shuffling, sorting, and rendering happen locally. There is no analytics that captures image contents, no upload endpoint, and no server-side algorithm execution.
