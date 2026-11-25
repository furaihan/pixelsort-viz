import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Pancake Sort. Finds the largest target index in the unsorted prefix,
 * flips the prefix to bring it to the front, then flips the whole prefix
 * to place it at the end. O(n^2), in-place, not stable.
 */
export function* pancakeSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  for (let end = n - 1; end > 0; end -= 1) {
    ctx.pass('pass.pancake', { end });
    let max = 0;
    ctx.mark([max], 'active', [0, end + 1]);

    for (let i = 1; i <= end; i += 1) {
      if (ctx.compare(i, max) > 0) {
        max = i;
        ctx.mark([max], 'active', [0, end + 1]);
      }
      if (ctx.tick()) yield;
    }

    if (max !== end) {
      if (max !== 0) yield* flipPrefix(ctx, max);
      yield* flipPrefix(ctx, end);
    }

    ctx.mark([end], 'sorted');
    if (ctx.tick()) yield;
  }

  ctx.mark([0], 'sorted');
}

function* flipPrefix(ctx: SortContext, k: number): SortGenerator {
  for (let lo = 0, hi = k; lo < hi; lo += 1, hi -= 1) {
    ctx.swap(lo, hi);
    if (ctx.tick()) yield;
  }
}
