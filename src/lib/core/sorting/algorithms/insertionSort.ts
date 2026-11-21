import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Insertion Sort. Builds a sorted prefix by shifting larger elements right and
 * writing the key into its place. Stable, in-place, O(n) best / O(n^2) worst.
 */
export function* insertionSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  ctx.mark([0], 'sorted');

  for (let i = 1; i < n; i += 1) {
    ctx.pass('pass.insert', { index: i });
    const key = ctx.read(i);
    let j = i - 1;

    while (j >= 0) {
      const value = ctx.read(j);
      if (ctx.compareValues(value, key, j, j + 1) <= 0) break;
      ctx.write(j + 1, value);
      j -= 1;
      if (ctx.tick()) yield;
    }

    if (j + 1 !== i) ctx.write(j + 1, key);
    ctx.mark([i], 'sorted', [0, i + 1]);
    if (ctx.tick()) yield;
  }
}
