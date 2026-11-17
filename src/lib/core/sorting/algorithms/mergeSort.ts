import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Top-down Merge Sort with one auxiliary buffer. Stable, O(n log n) time,
 * O(n) space. Auxiliary writes are counted separately from main-array writes.
 */
export function* mergeSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  const aux = new Uint32Array(n);
  yield* mergeRange(ctx, aux, 0, n);
  ctx.mark([0], 'sorted', [0, n]);
}

function* mergeRange(ctx: SortContext, aux: Uint32Array, lo: number, hi: number): SortGenerator {
  if (hi - lo < 2) return;
  const mid = (lo + hi) >>> 1;
  ctx.enterDepth();
  yield* mergeRange(ctx, aux, lo, mid);
  yield* mergeRange(ctx, aux, mid, hi);
  yield* merge(ctx, aux, lo, mid, hi);
  ctx.leaveDepth();
}

function* merge(
  ctx: SortContext,
  aux: Uint32Array,
  lo: number,
  mid: number,
  hi: number,
): SortGenerator {
  ctx.pass(`Merge ${lo}–${hi - 1}`);
  ctx.mark([lo], 'active', [lo, hi]);

  let i = lo;
  let j = mid;
  let k = lo;

  while (i < mid && j < hi) {
    const left = ctx.read(i);
    const right = ctx.read(j);
    if (ctx.compareValues(left, right, i, j) <= 0) {
      ctx.writeAux(aux, k, left);
      i += 1;
    } else {
      ctx.writeAux(aux, k, right);
      j += 1;
    }
    k += 1;
    if (ctx.tick()) yield;
  }

  while (i < mid) {
    ctx.writeAux(aux, k, ctx.read(i));
    i += 1;
    k += 1;
    if (ctx.tick()) yield;
  }

  while (j < hi) {
    ctx.writeAux(aux, k, ctx.read(j));
    j += 1;
    k += 1;
    if (ctx.tick()) yield;
  }

  for (let p = lo; p < hi; p += 1) {
    ctx.write(p, ctx.readAux(aux, p));
    if (ctx.tick()) yield;
  }
}
