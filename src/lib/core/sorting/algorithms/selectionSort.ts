import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Selection Sort. Scans the unsorted region for the smallest target index and
 * swaps it into place. Not stable in this swap-based implementation.
 */
export function* selectionSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  for (let i = 0; i < n - 1; i += 1) {
    let min = i;
    ctx.mark([min], 'active', [i, n]);

    for (let j = i + 1; j < n; j += 1) {
      if (ctx.compare(j, min) < 0) {
        min = j;
        ctx.mark([min], 'active', [i, n]);
      }
      if (ctx.tick()) yield;
    }

    if (min !== i) ctx.swap(i, min);
    ctx.mark([i], 'sorted');
    if (ctx.tick()) yield;
  }

  ctx.mark([n - 1], 'sorted');
}
