import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Bubble Sort with an early exit when a pass makes no swaps.
 * Stable, in-place, O(n) best / O(n^2) average and worst.
 */
export function* bubbleSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  for (let end = n - 1; end > 0; end -= 1) {
    ctx.pass(`Bubble pass · end ${end}`);
    let swapped = false;

    for (let i = 0; i < end; i += 1) {
      if (ctx.compare(i, i + 1) > 0) {
        ctx.swap(i, i + 1);
        swapped = true;
      }
      if (ctx.tick()) yield;
    }

    ctx.mark([end], 'sorted');
    if (!swapped) {
      ctx.mark([0], 'sorted', [0, end]);
      break;
    }
  }

  ctx.mark([0], 'sorted');
}
