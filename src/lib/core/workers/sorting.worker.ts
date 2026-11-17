import { isSorted } from '../image/shuffle';
import { SortContext } from '../sorting/instrumentation';
import { getAlgorithm } from '../sorting/registry';
import type { Counters, SortEvent } from '../sorting/types';
import type { WorkerRequest, WorkerResponse } from './workerMessages';

interface WorkerScope {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
}

const scope = self as unknown as WorkerScope;

interface RunState {
  context: SortContext;
  generator: Generator<void, void, void>;
  cancelled: boolean;
  activeMs: number;
  resume: (() => void) | null;
}

let run: RunState | null = null;

function transferablesFor(events: SortEvent[]): Transferable[] {
  const transfer: Transferable[] = [];
  for (const event of events) {
    if (event.type === 'delta') {
      transfer.push(event.indices.buffer, event.values.buffer);
    } else if (event.type === 'snapshot') {
      transfer.push(event.data.buffer);
    }
  }
  return transfer;
}

function waitForContinue(state: RunState): Promise<void> {
  return new Promise((resolve) => {
    state.resume = resolve;
  });
}

function release(state: RunState): void {
  const resume = state.resume;
  state.resume = null;
  resume?.();
}

async function execute(state: RunState): Promise<void> {
  const step = (): IteratorResult<void, void> => {
    const started = performance.now();
    const next = state.generator.next();
    state.activeMs += performance.now() - started;
    return next;
  };

  try {
    let result = step();

    while (!result.done) {
      if (state.cancelled) {
        scope.postMessage({
          type: 'cancelled',
          counters: { ...state.context.counters },
          elapsedMs: state.activeMs,
        });
        return;
      }

      const events = state.context.takeEvents();
      if (events.length > 0) {
        scope.postMessage(
          {
            type: 'batch',
            events,
            counters: { ...state.context.counters },
            elapsedMs: state.activeMs,
          },
          transferablesFor(events),
        );
        await waitForContinue(state);
        if (state.cancelled) {
          scope.postMessage({
            type: 'cancelled',
            counters: { ...state.context.counters },
            elapsedMs: state.activeMs,
          });
          return;
        }
      }

      result = step();
    }

    const final = state.context.finish();
    const validated = isSorted(final.permutation);
    scope.postMessage(
      {
        type: 'done',
        permutation: final.permutation,
        counters: final.counters,
        elapsedMs: state.activeMs,
        validated,
      },
      [final.permutation.buffer],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The sorting worker failed.';
    scope.postMessage({ type: 'error', message });
  } finally {
    if (run === state) run = null;
  }
}

scope.addEventListener('message', (event) => {
  const message = event.data;

  if (message.type === 'start') {
    if (run) {
      run.cancelled = true;
      release(run);
    }

    const context = new SortContext(message.permutation, {
      mode: message.mode,
      batchSize: message.batchSize,
      sampleIntervalMs: message.sampleIntervalMs,
    });
    const algorithm = getAlgorithm(message.algorithmId);
    const state: RunState = {
      context,
      generator: algorithm.run(context),
      cancelled: false,
      activeMs: 0,
      resume: null,
    };
    run = state;
    void execute(state);
    return;
  }

  if (!run) return;

  if (message.type === 'continue') {
    release(run);
    return;
  }

  if (message.type === 'cancel') {
    run.cancelled = true;
    release(run);
    return;
  }

  if (message.type === 'set-sample-interval') {
    run.context.setSampleInterval(message.ms);
  }
});
