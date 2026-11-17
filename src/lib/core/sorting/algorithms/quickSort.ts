import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Quick Sort with Lomuto partitioning and the last element as pivot.
 * Average O(n log n), worst O(n^2), in-place, not stable.
 */
export function* quickSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  yield* quickRange(ctx, 0, n - 1);
  ctx.mark([0], 'sorted', [0, n]);
}

function* quickRange(ctx: SortContext, lo: number, hi: number): SortGenerator {
  if (lo > hi) return;
  if (lo === hi) {
    ctx.mark([lo], 'sorted');
    return;
  }

  ctx.enterDepth();
  ctx.pass(`Partition ${lo}–${hi}`);
  ctx.mark([lo], 'active', [lo, hi + 1]);

  const pivot = ctx.read(hi);
  ctx.mark([hi], 'pivot');

  let store = lo;
  for (let i = lo; i < hi; i += 1) {
    if (ctx.compareValue(i, pivot) < 0) {
      if (i !== store) ctx.swap(i, store);
      store += 1;
    }
    if (ctx.tick()) yield;
  }

  if (store !== hi) ctx.swap(store, hi);
  ctx.mark([store], 'sorted');

  yield* quickRange(ctx, lo, store - 1);
  yield* quickRange(ctx, store + 1, hi);
  ctx.leaveDepth();
}
