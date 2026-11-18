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
  | { type: 'continue' }
  | { type: 'cancel' }
  | { type: 'set-sample-interval'; ms: number }
  | { type: 'set-batch-size'; batchSize: number };

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
