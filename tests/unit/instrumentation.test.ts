import { describe, expect, it } from 'vitest';
import { SortContext } from '../../src/lib/core/sorting/instrumentation';

function createContext(
  values: number[],
  mode: 'step' | 'sample' = 'step',
  batchSize = 10,
  now: () => number = () => 0,
): SortContext {
  return new SortContext(Uint32Array.from(values), {
    mode,
    batchSize,
    sampleIntervalMs: 100,
    now,
  });
}

describe('SortContext instrumentation', () => {
  it('counts a comparison as one comparison and two reads', () => {
    const context = createContext([2, 1]);
    expect(context.compare(0, 1)).toBe(1);
    expect(context.counters.comparisons).toBe(1);
    expect(context.counters.reads).toBe(2);
    expect(context.events[0]).toMatchObject({
      type: 'compare',
      i: 0,
      j: 1,
      a: 2,
      b: 1,
    });
  });

  it('counts a swap as one swap, two reads, and two writes', () => {
    const context = createContext([2, 1]);
    context.swap(0, 1);
    expect(Array.from(context.a)).toEqual([1, 2]);
    expect(context.counters.swaps).toBe(1);
    expect(context.counters.reads).toBe(2);
    expect(context.counters.writes).toBe(2);
    expect(context.events[0]).toMatchObject({ type: 'swap', i: 0, j: 1 });
  });

  it('counts a write and an auxiliary write', () => {
    const context = createContext([0, 1]);
    const aux = new Uint32Array(2);
    context.write(0, 7);
    context.writeAux(aux, 1, 9);
    expect(context.counters.writes).toBe(2);
    expect(context.counters.auxWrites).toBe(1);
    expect(Array.from(context.a)).toEqual([7, 1]);
    expect(Array.from(aux)).toEqual([0, 9]);
  });

  it('counts a pass', () => {
    const context = createContext([0, 1]);
    context.pass('Gap 4');
    expect(context.counters.passes).toBe(1);
    expect(context.events[0]).toMatchObject({ type: 'pass', label: 'Gap 4' });
  });

  it('yields when the step batch is full', () => {
    const context = createContext([2, 1], 'step', 2);
    context.compare(0, 1);
    expect(context.tick()).toBe(false);
    context.compare(0, 1);
    expect(context.tick()).toBe(true);
  });

  it('emits a delta on the sample cadence', () => {
    let time = 0;
    const context = createContext([0, 1], 'sample', 10, () => time);
    context.write(0, 1);
    for (let i = 0; i < 255; i += 1) {
      expect(context.tick()).toBe(false);
    }
    time = 200;
    expect(context.tick()).toBe(true);
    expect(context.events).toHaveLength(1);
    const event = context.events[0];
    expect(event.type).toBe('delta');
    if (event.type === 'delta') {
      expect(Array.from(event.indices)).toEqual([0]);
      expect(Array.from(event.values)).toEqual([1]);
    }
  });

  it('returns a copy of the final permutation', () => {
    const context = createContext([1, 0]);
    context.swap(0, 1);
    const result = context.finish();
    expect(result.permutation).not.toBe(context.a);
    expect(Array.from(result.permutation)).toEqual([0, 1]);
    expect(result.counters.swaps).toBe(1);
  });
});
