import {
  emptyCounters,
  type Counters,
  type MarkRole,
  type OpDelta,
  type SortEvent,
  type SortMode,
} from './types';

export interface SortContextOptions {
  mode: SortMode;
  batchSize: number;
  sampleIntervalMs: number;
  now?: () => number;
}

function makeOps(partial: Partial<OpDelta>): OpDelta {
  return { c: 0, r: 0, w: 0, s: 0, aw: 0, p: 0, ...partial };
}

/**
 * The single instrumentation contract every algorithm uses.
 *
 * Conventions:
 * - compare(i, j) counts one comparison and two reads.
 * - compareValue(i, key) counts one comparison and one read.
 * - swap(i, j) counts one swap, two reads, and two writes.
 * - write(i, value) counts one write.
 * - writeAux / countWrite count one write and one auxiliary write.
 * - Total tracked operations = comparisons + reads + writes. Swaps are not
 *   added again because their reads and writes are already counted.
 */
export class SortContext {
  readonly a: Uint32Array;
  readonly n: number;
  readonly mode: SortMode;
  readonly batchSize: number;
  readonly counters: Counters = emptyCounters();
  events: SortEvent[] = [];

  private readonly dirtyFlags: Uint8Array;
  private readonly dirtyList: number[] = [];
  private tickCount = 0;
  private lastSampleAt: number;
  private sampleIntervalMs: number;
  private readonly now: () => number;
  private depth = 0;

  constructor(a: Uint32Array, options: SortContextOptions) {
    this.a = a;
    this.n = a.length;
    this.mode = options.mode;
    this.batchSize = Math.max(1, options.batchSize);
    this.sampleIntervalMs = Math.max(16, options.sampleIntervalMs);
    this.now = options.now ?? (() => performance.now());
    this.lastSampleAt = this.now();
    this.dirtyFlags = new Uint8Array(this.n);
  }

  setSampleInterval(ms: number): void {
    this.sampleIntervalMs = Math.max(16, ms);
  }

  private record(ops: OpDelta): void {
    this.counters.comparisons += ops.c;
    this.counters.reads += ops.r;
    this.counters.writes += ops.w;
    this.counters.swaps += ops.s;
    this.counters.auxWrites += ops.aw;
    this.counters.passes += ops.p;
  }

  private markDirty(index: number): void {
    if (this.dirtyFlags[index] === 0) {
      this.dirtyFlags[index] = 1;
      this.dirtyList.push(index);
    }
  }

  read(index: number): number {
    const value = this.a[index];
    const ops = makeOps({ r: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'read', index, value, ops });
    }
    return value;
  }

  readAux(aux: Uint32Array, index: number): number {
    const value = aux[index];
    const ops = makeOps({ r: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'read', index, value, aux: true, ops });
    }
    return value;
  }

  compare(i: number, j: number, aux = false): number {
    const a = this.a[i];
    const b = this.a[j];
    const ops = makeOps({ c: 1, r: 2 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'compare', i, j, a, b, aux, ops });
    }
    return a - b;
  }

  compareValue(index: number, against: number, aux = false): number {
    const value = this.a[index];
    const ops = makeOps({ c: 1, r: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'compare-value', index, value, against, aux, ops });
    }
    return value - against;
  }

  /** Compare two values that were already read. Counts one comparison. */
  compareValues(a: number, b: number, i: number, j: number, aux = false): number {
    const ops = makeOps({ c: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'compare', i, j, a, b, aux, ops });
    }
    return a - b;
  }

  swap(i: number, j: number): void {
    if (i === j) return;
    const a = this.a[i];
    const b = this.a[j];
    const ops = makeOps({ s: 1, r: 2, w: 2 });
    this.record(ops);
    this.a[i] = b;
    this.a[j] = a;
    this.markDirty(i);
    this.markDirty(j);
    if (this.mode === 'step') {
      this.events.push({ type: 'swap', i, j, ops });
    }
  }

  write(index: number, value: number): void {
    this.a[index] = value;
    const ops = makeOps({ w: 1 });
    this.record(ops);
    this.markDirty(index);
    if (this.mode === 'step') {
      this.events.push({ type: 'write', index, value, ops });
    }
  }

  writeAux(aux: Uint32Array, index: number, value: number): void {
    aux[index] = value;
    const ops = makeOps({ w: 1, aw: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'write', index, value, aux: true, ops });
    }
  }

  countRead(counts: Uint32Array, index: number): number {
    const value = counts[index];
    const ops = makeOps({ r: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'read', index, value, aux: true, ops });
    }
    return value;
  }

  countWrite(counts: Uint32Array, index: number, value: number): void {
    counts[index] = value;
    const ops = makeOps({ w: 1, aw: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'write', index, value, aux: true, ops });
    }
  }

  mark(indices: number[], role: MarkRole, range?: [number, number]): void {
    if (this.mode === 'step') {
      this.events.push({ type: 'mark', indices, role, range, ops: makeOps({}) });
    }
  }

  pass(label: string): void {
    const ops = makeOps({ p: 1 });
    this.record(ops);
    if (this.mode === 'step') {
      this.events.push({ type: 'pass', label, ops });
    }
  }

  enterDepth(): void {
    this.depth += 1;
    if (this.depth > this.counters.maxDepth) this.counters.maxDepth = this.depth;
  }

  leaveDepth(): void {
    if (this.depth > 0) this.depth -= 1;
  }

  /**
   * Called by algorithms after an operation. In step mode it yields when the
   * event batch is full. In sample mode it yields on a time cadence and emits
   * one compact delta or snapshot.
   */
  tick(): boolean {
    if (this.mode === 'step') {
      return this.events.length >= this.batchSize;
    }

    this.tickCount += 1;
    if ((this.tickCount & 0xff) !== 0) return false;
    const now = this.now();
    if (now - this.lastSampleAt < this.sampleIntervalMs) return false;
    this.lastSampleAt = now;
    this.pushSample();
    return true;
  }

  private pushSample(): void {
    const count = this.dirtyList.length;
    if (count === 0) {
      this.events.push({ type: 'delta', indices: new Uint32Array(0), values: new Uint32Array(0) });
      return;
    }

    if (count > this.n / 2) {
      this.events.push({ type: 'snapshot', data: this.a.slice() });
      for (let i = 0; i < count; i += 1) this.dirtyFlags[this.dirtyList[i]] = 0;
      this.dirtyList.length = 0;
      return;
    }

    const indices = new Uint32Array(count);
    const values = new Uint32Array(count);
    for (let i = 0; i < count; i += 1) {
      const index = this.dirtyList[i];
      indices[i] = index;
      values[i] = this.a[index];
      this.dirtyFlags[index] = 0;
    }
    this.dirtyList.length = 0;
    this.events.push({ type: 'delta', indices, values });
  }

  takeEvents(): SortEvent[] {
    if (this.events.length === 0) return [];
    const events = this.events;
    this.events = [];
    return events;
  }

  finish(): { counters: Counters; permutation: Uint32Array } {
    return {
      counters: { ...this.counters },
      permutation: this.a.slice(),
    };
  }
}
