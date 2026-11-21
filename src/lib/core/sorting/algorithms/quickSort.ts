import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Quick Sort with Lomuto partitioning and a median-of-three pivot. Recurses
 * into the smaller side and loops on the larger, so stack depth stays O(log n)
 * even on adversarial input. Average O(n log n), worst O(n^2), in-place,
 * not stable.
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
  while (lo < hi) {
    ctx.pass('pass.partition', { start: lo, end: hi });
    ctx.mark([lo], 'active', [lo, hi + 1]);

    // Median-of-three: order lo, mid, hi, then park the median at hi as pivot.
    // This removes the sorted / reverse-sorted worst case of a last-element pivot.
    if (hi - lo >= 2) {
      const mid = (lo + hi) >>> 1;
      if (ctx.compare(mid, lo) < 0) ctx.swap(mid, lo);
      if (ctx.compare(hi, mid) < 0) {
        ctx.swap(hi, mid);
        if (ctx.compare(mid, lo) < 0) ctx.swap(mid, lo);
      }
      ctx.swap(mid, hi);
      if (ctx.tick()) yield;
    }

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

    // Recurse into the smaller partition; iterate on the larger one.
    if (store - lo < hi - store) {
      yield* quickRange(ctx, lo, store - 1);
      lo = store + 1;
    } else {
      yield* quickRange(ctx, store + 1, hi);
      hi = store - 1;
    }
  }
  ctx.leaveDepth();

  if (lo === hi) ctx.mark([lo], 'sorted');
}
