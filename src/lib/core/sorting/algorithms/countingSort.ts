import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Counting Sort over the target-index keys. Because the keys are exactly
 * 0..n-1, k = n and the sort is O(n) here. Stable in this implementation.
 * Count-array operations are counted as auxiliary reads and writes.
 */
export function* countingSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  const counts = new Uint32Array(n + 1);
  const output = new Uint32Array(n);

  ctx.pass('Count target indices');
  for (let i = 0; i < n; i += 1) {
    const key = ctx.read(i);
    const count = ctx.countRead(counts, key);
    ctx.countWrite(counts, key, count + 1);
    if (ctx.tick()) yield;
  }

  ctx.pass('Build starting positions');
  let total = 0;
  for (let key = 0; key < n; key += 1) {
    const count = ctx.countRead(counts, key);
    ctx.countWrite(counts, key, total);
    total += count;
    if (ctx.tick()) yield;
  }

  ctx.pass('Place elements');
  for (let i = 0; i < n; i += 1) {
    const key = ctx.read(i);
    const position = ctx.countRead(counts, key);
    ctx.countWrite(counts, key, position + 1);
    ctx.writeAux(output, position, key);
    if (ctx.tick()) yield;
  }

  ctx.pass('Write back to the image');
  for (let i = 0; i < n; i += 1) {
    ctx.write(i, ctx.readAux(output, i));
    if (ctx.tick()) yield;
  }

  ctx.mark([0], 'sorted', [0, n]);
}
