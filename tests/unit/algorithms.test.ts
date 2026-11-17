import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from '../../src/lib/core/sorting/registry';
import { SortContext } from '../../src/lib/core/sorting/instrumentation';
import type { AlgorithmId, Counters, SortEvent } from '../../src/lib/core/sorting/types';
import {
  fisherYates,
  identityPermutation,
  isPermutation,
  isSorted,
} from '../../src/lib/core/image/shuffle';
import { applyEventToPermutation } from '../../src/lib/core/visualization/eventPlayer';

const algorithmIds = Object.keys(ALGORITHMS) as AlgorithmId[];
const sizes = [0, 1, 2, 3, 10, 50, 100];

interface RunResult {
  permutation: Uint32Array;
  counters: Counters;
  events: SortEvent[];
}

function run(id: AlgorithmId, input: Uint32Array, mode: 'step' | 'sample' = 'step'): RunResult {
  const context = new SortContext(input.slice(), {
    mode,
    batchSize: 1_000_000,
    sampleIntervalMs: 1000,
    now: () => 0,
  });
  const generator = ALGORITHMS[id].run(context);
  let result = generator.next();
  while (!result.done) result = generator.next();
  return {
    permutation: context.a,
    counters: context.counters,
    events: context.events,
  };
}

function reversePermutation(length: number): Uint32Array {
  const permutation = new Uint32Array(length);
  for (let i = 0; i < length; i += 1) permutation[i] = length - 1 - i;
  return permutation;
}

function sumOps(events: SortEvent[]): Omit<Counters, 'maxDepth'> {
  const totals = {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    reads: 0,
    auxWrites: 0,
    passes: 0,
  };
  for (const event of events) {
    if (!('ops' in event)) continue;
    totals.comparisons += event.ops.c;
    totals.reads += event.ops.r;
    totals.writes += event.ops.w;
    totals.swaps += event.ops.s;
    totals.auxWrites += event.ops.aw;
    totals.passes += event.ops.p;
  }
  return totals;
}

for (const id of algorithmIds) {
  const metadata = ALGORITHMS[id].metadata;

  describe(metadata.name, () => {
    for (const size of sizes) {
      it(`sorts a random permutation of ${size} elements`, () => {
        const input = fisherYates(size, 1000 + size);
        const { permutation, counters } = run(id, input);
        expect(isSorted(permutation)).toBe(true);
        expect(isPermutation(permutation)).toBe(true);
        expect(counters.comparisons).toBeGreaterThanOrEqual(0);
        expect(counters.reads).toBeGreaterThanOrEqual(0);
        expect(counters.writes).toBeGreaterThanOrEqual(0);
        expect(counters.swaps).toBeGreaterThanOrEqual(0);
        expect(counters.auxWrites).toBeGreaterThanOrEqual(0);
      });
    }

    it('handles already sorted input', () => {
      const input = identityPermutation(50);
      const { permutation } = run(id, input);
      expect(isSorted(permutation)).toBe(true);
    });

    it('handles reverse sorted input', () => {
      const input = reversePermutation(50);
      const { permutation } = run(id, input);
      expect(isSorted(permutation)).toBe(true);
    });

    it('produces the same result in step and sample mode', () => {
      const input = fisherYates(80, 4242);
      const step = run(id, input, 'step');
      const sample = run(id, input, 'sample');
      expect(Array.from(sample.permutation)).toEqual(Array.from(step.permutation));
      expect(sample.counters).toEqual(step.counters);
    });

    it('reproduces the final permutation from the event stream', () => {
      const input = fisherYates(60, 777);
      const { permutation, events } = run(id, input, 'step');
      const replay = input.slice();
      for (const event of events) {
        applyEventToPermutation(replay, event);
      }
      expect(Array.from(replay)).toEqual(Array.from(permutation));
    });

    it('event deltas sum to the counters', () => {
      const input = fisherYates(60, 888);
      const { counters, events } = run(id, input, 'step');
      const totals = sumOps(events);
      expect(totals.comparisons).toBe(counters.comparisons);
      expect(totals.reads).toBe(counters.reads);
      expect(totals.writes).toBe(counters.writes);
      expect(totals.swaps).toBe(counters.swaps);
      expect(totals.auxWrites).toBe(counters.auxWrites);
      expect(totals.passes).toBe(counters.passes);
    });
  });
}
