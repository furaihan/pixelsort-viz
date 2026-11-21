import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * Bucket Sort with sqrt(n) buckets and insertion sort inside each bucket.
 * Average O(n + k) under a uniform distribution; worst O(n^2). Stable in this
 * implementation because distribution preserves order and insertion sort uses
 * a strict greater-than comparison.
 */
export function* bucketSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
  const counts = new Uint32Array(bucketCount + 1);
  const output = new Uint32Array(n);

  const bucketOf = (key: number): number =>
    Math.min(bucketCount - 1, Math.floor((key * bucketCount) / n));

  ctx.pass('pass.countBuckets', { count: bucketCount });
  for (let i = 0; i < n; i += 1) {
    const key = ctx.read(i);
    const bucket = bucketOf(key);
    const count = ctx.countRead(counts, bucket + 1);
    ctx.countWrite(counts, bucket + 1, count + 1);
    if (ctx.tick()) yield;
  }

  ctx.pass('pass.bucketBoundaries');
  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const count = ctx.countRead(counts, bucket + 1);
    const previous = ctx.countRead(counts, bucket);
    ctx.countWrite(counts, bucket + 1, count + previous);
    if (ctx.tick()) yield;
  }

  ctx.pass('pass.scatterBuckets');
  for (let i = 0; i < n; i += 1) {
    const key = ctx.read(i);
    const bucket = bucketOf(key);
    const position = ctx.countRead(counts, bucket);
    ctx.countWrite(counts, bucket, position + 1);
    ctx.writeAux(output, position, key);
    if (ctx.tick()) yield;
  }

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = bucket === 0 ? 0 : ctx.countRead(counts, bucket - 1);
    const end = ctx.countRead(counts, bucket);
    if (end - start < 2) continue;

    ctx.pass('pass.sortBucket', { bucket: bucket + 1, count: bucketCount });
    for (let i = start + 1; i < end; i += 1) {
      const key = ctx.readAux(output, i);
      let j = i - 1;

      while (j >= start) {
        const value = ctx.readAux(output, j);
        if (ctx.compareValues(value, key, j, j + 1, true) <= 0) break;
        ctx.writeAux(output, j + 1, value);
        j -= 1;
        if (ctx.tick()) yield;
      }

      if (j + 1 !== i) ctx.writeAux(output, j + 1, key);
      if (ctx.tick()) yield;
    }
  }

  ctx.pass('pass.writeBucketsBack');
  for (let i = 0; i < n; i += 1) {
    ctx.write(i, ctx.readAux(output, i));
    if (ctx.tick()) yield;
  }

  ctx.mark([0], 'sorted', [0, n]);
}
