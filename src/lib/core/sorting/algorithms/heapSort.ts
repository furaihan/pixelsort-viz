import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Heap Sort. Builds a max-heap by target index, then repeatedly moves the
 * largest element to the end. O(n log n), in-place, not stable.
 */
export function* heapSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  for (let start = (n - 2) >> 1; start >= 0; start -= 1) {
    yield* siftDown(ctx, start, n);
  }

  for (let end = n - 1; end > 0; end -= 1) {
    ctx.swap(0, end);
    ctx.mark([end], 'sorted');
    yield* siftDown(ctx, 0, end);
  }

  ctx.mark([0], 'sorted');
}

function* siftDown(ctx: SortContext, root: number, size: number): SortGenerator {
  for (;;) {
    let child = root * 2 + 1;
    if (child >= size) break;

    if (child + 1 < size) {
      if (ctx.compare(child, child + 1) < 0) child += 1;
      if (ctx.tick()) yield;
    }

    if (ctx.compare(root, child) < 0) {
      ctx.swap(root, child);
      root = child;
      if (ctx.tick()) yield;
    } else {
      break;
    }
  }
}
