export type AlgorithmId =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'merge'
  | 'quick'
  | 'shell'
  | 'heap'
  | 'counting'
  | 'radix'
  | 'bucket'
  | 'pancake';

export type AlgorithmCategory = 'beginner' | 'intermediate' | 'advanced';

export type SortMode = 'step' | 'sample';

export type MarkRole = 'pivot' | 'sorted' | 'active' | 'range';

export type AuxKind = 'buffer' | 'counts';

export interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
  reads: number;
  auxWrites: number;
  passes: number;
  maxDepth: number;
}

export function emptyCounters(): Counters {
  return {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    reads: 0,
    auxWrites: 0,
    passes: 0,
    maxDepth: 0,
  };
}

/**
 * Per-event operation deltas. The main thread accumulates these so the
 * displayed counters match the displayed event exactly, even while stepping.
 */
export interface OpDelta {
  c: number;
  r: number;
  w: number;
  s: number;
  aw: number;
  p: number;
}

/**
 * An algorithm operation that can be drawn on the visualization overlay.
 *
 * Performance playback does not retain every operation. It carries the most
 * meaningful operation from each sampled window instead, so large runs still
 * explain what is happening without building an unbounded event history.
 */
export type SortVisualEvent =
  | {
      type: 'compare';
      i: number;
      j: number;
      a: number;
      b: number;
      aux?: boolean;
      auxKind?: AuxKind;
      ops: OpDelta;
    }
  | {
      type: 'compare-value';
      index: number;
      value: number;
      against: number;
      aux?: boolean;
      auxKind?: AuxKind;
      ops: OpDelta;
    }
  | { type: 'read'; index: number; value: number; aux?: boolean; auxKind?: AuxKind; ops: OpDelta }
  | { type: 'swap'; i: number; j: number; a: number; b: number; ops: OpDelta }
  | { type: 'write'; index: number; value: number; aux?: boolean; auxKind?: AuxKind; ops: OpDelta }
  | {
      type: 'mark';
      indices: number[];
      role: MarkRole;
      range?: [number, number];
      ops: OpDelta;
    }
  | {
      type: 'pass';
      /** Translation key (e.g. 'pass.bubble'); localized by the i18n layer. */
      key: string;
      params?: Record<string, number>;
      ops: OpDelta;
    };

export type SortEvent =
  | SortVisualEvent
  | {
      type: 'delta';
      indices: Uint32Array;
      values: Uint32Array;
      /** The best operation observed while producing this sampled frame. */
      focus?: SortVisualEvent;
    }
  | {
      type: 'snapshot';
      data: Uint32Array;
      /** The best operation observed while producing this sampled frame. */
      focus?: SortVisualEvent;
    }
  | { type: 'complete'; counters: Counters; elapsedMs: number; validated: boolean };

export interface AlgorithmMetadata {
  id: AlgorithmId;
  name: string;
  category: AlgorithmCategory;
  description: string;
  bestTime: string;
  averageTime: string;
  worstTime: string;
  spaceComplexity: string;
  stable: boolean | 'depends';
  inPlace: boolean | 'depends';
  notes?: string[];
  /** Used by the workload guard. */
  quadratic: boolean;
  /** Superlinear but not quadratic (e.g. Shell sort); warns at large sizes. */
  superlinear: boolean;
}

export type SortGenerator = Generator<void, void, void>;

export interface AlgorithmDefinition {
  metadata: AlgorithmMetadata;
  run: (context: import('./instrumentation').SortContext) => SortGenerator;
}
