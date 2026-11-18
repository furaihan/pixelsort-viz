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

const OPS_ZERO: OpDelta = Object.freeze({ c: 0, r: 0, w: 0, s: 0, aw: 0, p: 0 });
const OPS_READ: OpDelta = Object.freeze({ c: 0, r: 1, w: 0, s: 0, aw: 0, p: 0 });
const OPS_COMPARE: OpDelta = Object.freeze({ c: 1, r: 2, w: 0, s: 0, aw: 0, p: 0 });
const OPS_COMPARE_VALUE: OpDelta = Object.freeze({ c: 1, r: 1, w: 0, s: 0, aw: 0, p: 0 });
const OPS_COMPARE_VALUES: OpDelta = Object.freeze({ c: 1, r: 0, w: 0, s: 0, aw: 0, p: 0 });
const OPS_SWAP: OpDelta = Object.freeze({ c: 0, r: 2, w: 2, s: 1, aw: 0, p: 0 });
const OPS_WRITE: OpDelta = Object.freeze({ c: 0, r: 0, w: 1, s: 0, aw: 0, p: 0 });
const OPS_WRITE_AUX: OpDelta = Object.freeze({ c: 0, r: 0, w: 1, s: 0, aw: 1, p: 0 });
const OPS_PASS: OpDelta = Object.freeze({ c: 0, r: 0, w: 0, s: 0, aw: 0, p: 1 });

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
  readonly counters: Counters = emptyCounters();
  events: SortEvent[] = [];

  private batchSize: number;
  private readonly isStepMode: boolean;
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
    this.isStepMode = options.mode === 'step';
    this.batchSize = Math.max(1, options.batchSize);
    this.sampleIntervalMs = Math.max(16, options.sampleIntervalMs);
    this.now = options.now ?? (() => performance.now());
    this.lastSampleAt = this.now();
    this.dirtyFlags = this.isStepMode ? new Uint8Array(0) : new Uint8Array(this.n);
  }

  setBatchSize(batchSize: number): void {
    this.batchSize = Math.max(1, Math.round(batchSize));
  }

  setSampleInterval(ms: number): void {
    this.sampleIntervalMs = Math.max(16, ms);
  }

  /**
   * Resets the sample window after the worker resumes from waiting on the main
   * thread so rendering or pause duration never shrinks the next compute slice.
   */
  resetSampleClock(): void {
    this.lastSampleAt = this.now();
    this.tickCount = 0;
  }

  private markDirty(index: number): void {
    if (!this.isStepMode && this.dirtyFlags[index] === 0) {
      this.dirtyFlags[index] = 1;
      this.dirtyList.push(index);
    }
  }

  read(index: number): number {
    const value = this.a[index];
    this.counters.reads += 1;
    if (this.isStepMode) {
      this.events.push({ type: 'read', index, value, ops: OPS_READ });
    }
    return value;
  }

  readAux(aux: Uint32Array, index: number): number {
    const value = aux[index];
    this.counters.reads += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'read',
        index,
        value,
        aux: true,
        auxKind: 'buffer',
        ops: OPS_READ,
      });
    }
    return value;
  }

  compare(i: number, j: number, aux = false): number {
    const a = this.a[i];
    const b = this.a[j];
    this.counters.comparisons += 1;
    this.counters.reads += 2;
    if (this.isStepMode) {
      this.events.push({
        type: 'compare',
        i,
        j,
        a,
        b,
        aux,
        ...(aux ? { auxKind: 'buffer' as const } : {}),
        ops: OPS_COMPARE,
      });
    }
    return a - b;
  }

  compareValue(index: number, against: number, aux = false): number {
    const value = this.a[index];
    this.counters.comparisons += 1;
    this.counters.reads += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'compare-value',
        index,
        value,
        against,
        aux,
        ...(aux ? { auxKind: 'buffer' as const } : {}),
        ops: OPS_COMPARE_VALUE,
      });
    }
    return value - against;
  }

  /** Compare two values that were already read. Counts one comparison. */
  compareValues(a: number, b: number, i: number, j: number, aux = false): number {
    this.counters.comparisons += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'compare',
        i,
        j,
        a,
        b,
        aux,
        ...(aux ? { auxKind: 'buffer' as const } : {}),
        ops: OPS_COMPARE_VALUES,
      });
    }
    return a - b;
  }

  swap(i: number, j: number): void {
    if (i === j) return;
    const a = this.a[i];
    const b = this.a[j];
    this.counters.swaps += 1;
    this.counters.reads += 2;
    this.counters.writes += 2;
    this.a[i] = b;
    this.a[j] = a;
    if (!this.isStepMode) {
      this.markDirty(i);
      this.markDirty(j);
    } else {
      this.events.push({ type: 'swap', i, j, ops: OPS_SWAP });
    }
  }

  write(index: number, value: number): void {
    this.a[index] = value;
    this.counters.writes += 1;
    if (!this.isStepMode) {
      this.markDirty(index);
    } else {
      this.events.push({ type: 'write', index, value, ops: OPS_WRITE });
    }
  }

  writeAux(aux: Uint32Array, index: number, value: number): void {
    aux[index] = value;
    this.counters.writes += 1;
    this.counters.auxWrites += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'write',
        index,
        value,
        aux: true,
        auxKind: 'buffer',
        ops: OPS_WRITE_AUX,
      });
    }
  }

  countRead(counts: Uint32Array, index: number): number {
    const value = counts[index];
    this.counters.reads += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'read',
        index,
        value,
        aux: true,
        auxKind: 'counts',
        ops: OPS_READ,
      });
    }
    return value;
  }

  countWrite(counts: Uint32Array, index: number, value: number): void {
    counts[index] = value;
    this.counters.writes += 1;
    this.counters.auxWrites += 1;
    if (this.isStepMode) {
      this.events.push({
        type: 'write',
        index,
        value,
        aux: true,
        auxKind: 'counts',
        ops: OPS_WRITE_AUX,
      });
    }
  }

  mark(indices: number[], role: MarkRole, range?: [number, number]): void {
    if (this.isStepMode) {
      this.events.push({ type: 'mark', indices, role, range, ops: OPS_ZERO });
    }
  }

  pass(label: string): void {
    this.counters.passes += 1;
    if (this.isStepMode) {
      this.events.push({ type: 'pass', label, ops: OPS_PASS });
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
    if (this.isStepMode) {
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
