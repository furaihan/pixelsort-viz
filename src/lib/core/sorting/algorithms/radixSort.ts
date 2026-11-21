import type { SortContext } from '../instrumentation';
import type { SortGenerator } from '../types';

/**
 * LSD Radix Sort, base 256. The number of passes depends on the largest target
 * index. Each pass is copied back into the working array so the image updates
 * after every digit; that adds n writes per pass.
 */
export function* radixSort(ctx: SortContext): SortGenerator {
  const n = ctx.n;
  if (n < 2) {
    if (n === 1) ctx.mark([0], 'sorted');
    return;
  }

  const bits = 32 - Math.clz32(n - 1);
  const passes = Math.max(1, Math.ceil(bits / 8));
  const output = new Uint32Array(n);

  for (let pass = 0; pass < passes; pass += 1) {
    const shift = pass * 8;
    const counts = new Uint32Array(257);

    ctx.pass('pass.radix', { pass: pass + 1, passes, byte: pass });

    for (let i = 0; i < n; i += 1) {
      const value = ctx.read(i);
      const digit = (value >>> shift) & 0xff;
      const count = ctx.countRead(counts, digit + 1);
      ctx.countWrite(counts, digit + 1, count + 1);
      if (ctx.tick()) yield;
    }

    for (let digit = 0; digit < 256; digit += 1) {
      const count = ctx.countRead(counts, digit + 1);
      const previous = ctx.countRead(counts, digit);
      ctx.countWrite(counts, digit + 1, count + previous);
      if (ctx.tick()) yield;
    }

    for (let i = 0; i < n; i += 1) {
      const value = ctx.read(i);
      const digit = (value >>> shift) & 0xff;
      const position = ctx.countRead(counts, digit);
      ctx.countWrite(counts, digit, position + 1);
      ctx.writeAux(output, position, value);
      if (ctx.tick()) yield;
    }

    for (let i = 0; i < n; i += 1) {
      ctx.write(i, ctx.readAux(output, i));
      if (ctx.tick()) yield;
    }
  }

  ctx.mark([0], 'sorted', [0, n]);
}
