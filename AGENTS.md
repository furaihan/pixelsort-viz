# AGENTS.md

## Stack
- Vite 8 + Svelte 5 (runes only) + TypeScript + Tailwind 4, no SSR, no backend.
- Bun 1.4.4 (`packageManager` + committed `bun.lock`). npm works for scripts but the lockfile is Bun's.
- Image bytes never leave the browser.

## Commands
- `bun run dev` — Vite dev server (default `5173`).
- `bun run build` — production bundle to `dist/`.
- `bun run preview` — preview `dist/` (default `4173`).
- `bun run check` — `svelte-check` on `tsconfig.app.json` + `tsc -p tsconfig.node.json`. Run after any `.svelte`/`.ts` change.
- `bun run test` — Vitest unit suite (`tests/unit/`). `bun run test:watch` for watch.
- `bun run format` — Prettier (Svelte + Tailwind class sorting). `format:check` verifies.
- Single test file: `bunx vitest run tests/unit/<name>.test.ts`.

## Architecture that changes how you work
- **Sorting model**: sortable element = its original row-major index. `permutation[position]` is the source element. Sorting the `Uint32Array` ascending restores the image exactly. Algorithms sort by index, not color. Same shuffled permutation is preserved across algorithm switches (fair comparison).
- **All 10 algorithms are generators** that yield via `SortContext` (`src/lib/core/sorting/instrumentation.ts`). Do not add a new event channel; use `compare`, `compareValue`, `compareValues`, `swap`, `write`, `writeAux`, `readAux`, `countRead`, `countWrite`, `mark`, `pass`, `tick`. `tick()` controls batching.
- **Counters are per-event deltas** (`OpDelta` on every `SortVisualEvent`). `totalOps = comparisons + reads + writes`. Swaps are reported separately and never double-added (their reads/writes are already counted). Rendering reads are excluded. A displayed counter must equal the sum of deltas on the displayed event — never accumulate counters only on `done`.
- **Two playback modes, one worker**:
  - `educational` (step): worker posts up to 512 events/batch, main thread plays one at a time; `step()` inspects a single event.
  - `performance` (sample): worker samples the permutation on a time cadence, posts compact `delta`/`snapshot` events with the best `focus` event for the window; main thread applies at animation-frame cadence.
  - Worker waits for `{type:'continue'}` after each batch (bounded queue). Reset/shuffle/restore/algorithm/granularity changes **must** `terminateWorker()` and rebuild.
  - `activeRunId`/`runSequence` guard: stale worker messages are dropped on mismatch.
- **Worker protocol** is `WorkerRequest`/`WorkerResponse` in `src/lib/core/workers/workerMessages.ts`. Any new message kind must be added to both sides and handled in `appState.handleWorkerMessage` + `sorting.worker.ts`.
- **Registry is the single source for algorithms**: `src/lib/core/sorting/registry.ts` (`ALGORITHMS`, `ALGORITHM_LIST`, `ALGORITHM_GROUPS`, `getAlgorithm`). Workload guard derives `quadratic`/`superlinear` from registry metadata — do not duplicate the flags elsewhere.
- **Workload thresholds live only in** `src/lib/utils/workload.ts`. Do not hardcode numbers in components. The app never silently switches algorithm/granularity; it explains and suggests.

## Conventions that differ from defaults
- **Themes**: `src/lib/theme/palettes.ts` `THEMES` is the source of truth. Adding a theme = one entry + its `nameKey` in **both** EN/ID catalogs (`src/lib/i18n/messages.ts`) + its `ink` in the pre-paint map in `index.html`. The theme test guards all three against drift. Never hardcode palette hexes in components — consume `--color-*` tokens. Canvas palette derives via `getCanvasPalette`.
- **Tailwind 4 config is in `src/app.css` only** (no `tailwind.config.js`). `@theme` holds tokens and mirrors the default theme as the pre-JS fallback (guarded by `tests/unit/theme.test.ts`). `@source` is explicit with automatic detection off (`source(none)`) — only `src/` and `index.html` are scanned. Adding a file outside `src/` that contains class names will not generate utilities.
- **State variants are whole class strings, not layered.** Overlapping utilities of the same property resolve by stylesheet order, not class order.
- **`rounded-sm`/`rounded-md` are overridden** to 6px/12px in `@theme` — not Tailwind defaults.
- **i18n**: English + Bahasa Indonesia only. `msg(key)` returns a `LocalizedText` (key + params), resolved at render via `i18n.text()`. Pass events carry a translation key directly; `i18n.passMessage` falls back to the raw key (visible) so a missing catalog entry is not silent. EN/ID key parity and pass-label parity are unit-tested — add the same keys to both catalogs.
- **No component `<style>` blocks.** All styling is Tailwind utilities from `src/app.css`. Shared primitives are `@utility` (`panel`, `btn`, `chip`, `alert`, `label`, `mono`, `checkerboard`, `speed-range`).
- **Accessibility is a hard rule**: compare/swap/write/pivot/sorted state is never color-only — always pair with word/icon/shape. Focus is 2px accent outline at 2px offset. `prefers-reduced-motion` clamps all motion to 0.01ms. Live regions must not stream during a run.

## Tests
- `tests/unit/` is the fast suite: shuffle determinism, grid ceiling division + edge tiles, all 10 algorithms (empty/1/2/sorted/reverse/random, step+sample equivalence, event replay), instrumentation counters + per-event deltas, event application, theme registry completeness + `@theme`/pre-paint drift, workload guardrails + registry flag parity, pass-label localization + EN/ID parity, playback presets, overlay/range geometry, image tiles.
- `bun run check` + `bun run test` is the minimum verification loop. There is no lint script.
- `scripts/verify-*.mjs` are optional headless-Chrome integration checks (not in the unit suite). They require local Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and a running dev server (`bun run dev --host 127.0.0.1` for `5173` scripts; `bun run build && bun run preview` for `verify-production.mjs` on `4173`). Known-stale: `verify-upload`, `verify-state`, `verify-interrupt` predate the current UI — do not trust their failures without checking the app first.

## Gotchas
- Edge tiles keep their natural size; the unused part of their block cell is transparent. A small edge tile must never stretch.
- Main canvas renders at the image's natural resolution; overlay canvas renders at display resolution with DPR awareness.
- Reset, shuffle, restore, algorithm change, and granularity change all rebuild run state from scratch (new worker, new seed/identity). Preserve the `initialPermutation` semantics: `setAlgorithm` restores the **initial shuffled** permutation, not the current one.
- `window.__pixelSort` is attached only in dev for headless verification; do not rely on it in production code.