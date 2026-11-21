import type { AlgorithmId, Counters, SortEvent, SortMode } from '../sorting/types';

export type WorkerRequest =
  | {
      type: 'start';
      runId: number;
      permutation: Uint32Array;
      algorithmId: AlgorithmId;
      mode: SortMode;
      batchSize: number;
      sampleIntervalMs: number;
    }
  | { type: 'continue'; runId: number }
  | { type: 'cancel'; runId: number }
  | { type: 'set-sample-interval'; runId: number; ms: number }
  | { type: 'set-batch-size'; runId: number; batchSize: number };

export type WorkerResponse =
  | { type: 'batch'; runId: number; events: SortEvent[]; counters: Counters; elapsedMs: number }
  | {
      type: 'done';
      runId: number;
      permutation: Uint32Array;
      counters: Counters;
      elapsedMs: number;
      validated: boolean;
    }
  | { type: 'cancelled'; runId: number; counters: Counters; elapsedMs: number }
  | { type: 'error'; runId: number; message: string };
