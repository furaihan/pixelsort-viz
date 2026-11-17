import type { AlgorithmId, Counters, SortEvent, SortMode } from '../sorting/types';

export type WorkerRequest =
  | {
      type: 'start';
      permutation: Uint32Array;
      algorithmId: AlgorithmId;
      mode: SortMode;
      batchSize: number;
      sampleIntervalMs: number;
    }
  | { type: 'continue' }
  | { type: 'cancel' }
  | { type: 'set-sample-interval'; ms: number };

export type WorkerResponse =
  | { type: 'batch'; events: SortEvent[]; counters: Counters; elapsedMs: number }
  | {
      type: 'done';
      permutation: Uint32Array;
      counters: Counters;
      elapsedMs: number;
      validated: boolean;
    }
  | { type: 'cancelled'; counters: Counters; elapsedMs: number }
  | { type: 'error'; message: string };
