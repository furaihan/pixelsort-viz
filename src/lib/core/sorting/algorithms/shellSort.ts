import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Shell Sort using the Knuth gap sequence (1, 4, 13, 40, ...).
 * Complexity depends on the gap sequence; this implementation is not stable.
 */
export function* shellSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  let gap = 1;
  while (gap < n / 3) gap = gap * 3 + 1;

  for (; gap >= 1; gap = Math.floor(gap / 3)) {
    ctx.pass('pass.gap', { gap });

    for (let i = gap; i < n; i += 1) {
      const key = ctx.read(i);
      let j = i;

      while (j >= gap) {
        const value = ctx.read(j - gap);
        if (ctx.compareValues(value, key, j - gap, j) <= 0) break;
        ctx.write(j, value);
        j -= gap;
        if (ctx.tick()) yield;
      }

      if (j !== i) ctx.write(j, key);
      if (ctx.tick()) yield;
    }
  }

  ctx.mark([0], 'sorted', [0, n]);
}
