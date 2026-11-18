import { isPermutation, isSorted } from '../image/shuffle';
import { SortContext } from '../sorting/instrumentation';
import { getAlgorithm } from '../sorting/registry';
import type { SortEvent } from '../sorting/types';
import type { WorkerRequest, WorkerResponse } from './workerMessages';

interface WorkerScope {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
}

const scope = self as unknown as WorkerScope;

interface RunState {
  runId: number;
  context: SortContext;
  generator: Generator<void, void, void>;
  cancelled: boolean;
  activeMs: number;
  resume: (() => void) | null;
}

let run: RunState | null = null;

function transferablesFor(events: SortEvent[]): Transferable[] | undefined {
  const transfer: Transferable[] = [];
  for (const event of events) {
    if (event.type === 'delta') {
      transfer.push(event.indices.buffer, event.values.buffer);
    } else if (event.type === 'snapshot') {
      transfer.push(event.data.buffer);
    }
  }
  return transfer.length > 0 ? transfer : undefined;
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

function postCancelled(state: RunState): void {
  scope.postMessage({
    type: 'cancelled',
    runId: state.runId,
    counters: { ...state.context.counters },
    elapsedMs: state.activeMs,
  });
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
        postCancelled(state);
        return;
      }

      const events = state.context.takeEvents();
      if (events.length > 0) {
        const transfer = state.context.mode === 'sample' ? transferablesFor(events) : undefined;
        scope.postMessage(
          {
            type: 'batch',
            runId: state.runId,
            events,
            counters: { ...state.context.counters },
            elapsedMs: state.activeMs,
          },
          transfer,
        );
        await waitForContinue(state);
        if (state.cancelled) {
          postCancelled(state);
          return;
        }
        state.context.resetSampleClock();
      }

      result = step();
    }

    if (state.cancelled) {
      postCancelled(state);
      return;
    }

    // Flush the tail in both modes. Step mode can finish with fewer than a full
    // batch; sample mode can have dirty positions since the last time window.
    state.context.flushPending();
    const remaining = state.context.takeEvents();
    if (remaining.length > 0) {
      scope.postMessage(
        {
          type: 'batch',
          runId: state.runId,
          events: remaining,
          counters: { ...state.context.counters },
          elapsedMs: state.activeMs,
        },
        state.context.mode === 'sample' ? transferablesFor(remaining) : undefined,
      );
    }

    const final = state.context.finish();
    const validated = isPermutation(final.permutation) && isSorted(final.permutation);
    scope.postMessage(
      {
        type: 'done',
        runId: state.runId,
        permutation: final.permutation,
        counters: final.counters,
        elapsedMs: state.activeMs,
        validated,
      },
      [final.permutation.buffer],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The sorting worker failed.';
    scope.postMessage({ type: 'error', runId: state.runId, message });
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

    if (!isPermutation(message.permutation)) {
      scope.postMessage({
        type: 'error',
        runId: message.runId,
        message: 'The sorting run started with an invalid permutation.',
      });
      return;
    }

    const context = new SortContext(message.permutation, {
      mode: message.mode,
      batchSize: message.batchSize,
      sampleIntervalMs: message.sampleIntervalMs,
    });
    const algorithm = getAlgorithm(message.algorithmId);
    const state: RunState = {
      runId: message.runId,
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
    return;
  }

  if (message.type === 'set-batch-size') {
    run.context.setBatchSize(message.batchSize);
  }
});
