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

describe('instrumentation regressions', () => {
  it('shift-based sorts read each compared element exactly once', () => {
    // Insertion sort used to read a[j] twice per shift (compareValue + read),
    // inflating its read counters ~2x against shell sort's identical operation.
    // Convention: reads = key reads + one read per comparison.
    const n = 200;
    const input = fisherYates(n, 42);

    const insertion = run('insertion', input);
    expect(insertion.counters.reads).toBe(insertion.counters.comparisons + n - 1);

    const shell = run('shell', input);
    let gap = 1;
    while (gap < n / 3) gap = gap * 3 + 1;
    let keyReads = 0;
    for (; gap >= 1; gap = Math.floor(gap / 3)) keyReads += n - gap;
    expect(shell.counters.reads).toBe(shell.counters.comparisons + keyReads);
  });

  it('every algorithm narrates at least one pass', () => {
    const input = fisherYates(50, 9);
    for (const id of Object.keys(ALGORITHMS) as AlgorithmId[]) {
      const { counters } = run(id, input);
      expect(counters.passes, `${id} passes`).toBeGreaterThan(0);
    }
  });

  it('compare highlights track the moving hole during shifts', () => {
    // The B operand of a shift comparison is the hole the key will land in,
    // not the key's original position (which holds a shifted value after pass 1).
    for (const id of ['insertion', 'shell'] as AlgorithmId[]) {
      const { events } = run(id, fisherYates(60, 777));
      let checked = 0;
      for (let i = 0; i + 1 < events.length; i += 1) {
        const event = events[i];
        const next = events[i + 1];
        if (event.type === 'compare' && !event.aux && next.type === 'write' && !next.aux) {
          expect(event.j, `${id} compare B-index`).toBe(next.index);
          checked += 1;
        }
      }
      expect(checked, `${id} shift comparisons`).toBeGreaterThan(0);
    }
  });

  it('shell sort uses the full Knuth gap sequence', () => {
    // floor(n/3) in the gap loop used to drop the largest gap (13 for n=13).
    const { events } = run('shell', fisherYates(13, 5));
    const gaps = events
      .filter((event) => event.type === 'pass')
      .map((event) => (event.type === 'pass' ? event.params?.gap : undefined));
    expect(gaps).toEqual([13, 4, 1]);
  });

  it('quick sort keeps bounded depth and near-linearithmic work on sorted input', () => {
    // Last-element Lomuto used to degrade to n^2 comparisons and depth n here.
    const n = 2000;
    const { permutation, counters } = run('quick', identityPermutation(n));
    expect(isSorted(permutation)).toBe(true);
    // Depth accumulates across the smaller-side recursion: ~log2(n), not 1 or n.
    expect(counters.maxDepth).toBeGreaterThan(1);
    expect(counters.maxDepth).toBeLessThan(30);
    expect(counters.comparisons).toBeLessThan(25 * n);
  });

  it('counting sort narrates count-table activity in sample mode', () => {
    let time = 0;
    const ctx = new SortContext(fisherYates(300, 9), {
      mode: 'sample',
      batchSize: 1,
      sampleIntervalMs: 16,
      now: () => (time += 20),
    });
    const generator = ALGORITHMS.counting.run(ctx);
    let result = generator.next();
    while (!result.done) result = generator.next();
    ctx.flushPending();
    const focuses = ctx.events
      .filter((event) => event.type === 'delta' || event.type === 'snapshot')
      .map((event) => (event.type === 'delta' || event.type === 'snapshot' ? event.focus : null));
    expect(focuses.some((focus) => focus && 'auxKind' in focus && focus.auxKind === 'counts')).toBe(
      true,
    );
  });

  it('bucket sort counts the boundary reads of every bucket', () => {
    // Boundary reads used to bypass ctx.countRead entirely.
    const n = 100;
    const bucketCount = Math.floor(Math.sqrt(n));
    const { events } = run('bucket', fisherYates(n, 3));
    const countReads = events.filter(
      (event) => event.type === 'read' && event.auxKind === 'counts',
    ).length;
    // count phase n + prefix 2b + boundaries (2b - 1) + scatter n
    expect(countReads).toBe(2 * n + 4 * bucketCount - 1);
  });
});
