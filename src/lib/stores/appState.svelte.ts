import { computeGrid } from '../core/image/grid';
import type { BlockSize, GridSpec, ImageSource } from '../core/image/imageTypes';
import { ImageLoadError, WARN_IMAGE_PIXELS, decodeImageFile } from '../core/image/decodeImage';
import { createSampleImage } from '../core/image/sampleImage';
import { fisherYates, identityPermutation, randomSeed } from '../core/image/shuffle';
import { getAlgorithm } from '../core/sorting/registry';
import {
  emptyCounters,
  type AlgorithmId,
  type Counters,
  type SortEvent,
} from '../core/sorting/types';
import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
import { OverlayTracker } from '../core/visualization/overlayState';
import { applyEventToPermutation } from '../core/visualization/eventPlayer';
import type { WorkerResponse } from '../core/workers/workerMessages';
import { formatNumber } from '../utils/format';
import {
  EDUCATIONAL_RECOMMENDED_MAX,
  assessWorkload,
  type PlaybackMode,
  type WorkloadAssessment,
} from '../utils/workload';

export type RunStatus =
  | 'empty'
  | 'image-loaded'
  | 'configured'
  | 'scrambled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'error';

export interface ImageInfo {
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  megapixels: number;
}

export interface LogEntry {
  id: number;
  type: string;
  text: string;
}

export const SPEED_PRESETS = [0.5, 1, 2, 4, 8, 16, 32] as const;

export function speedToEventsPerSecond(speed: number): number {
  if (speed >= 32) return Number.POSITIVE_INFINITY;
  const table: Record<number, number> = { 0.5: 3, 1: 8, 2: 20, 4: 50, 8: 120, 16: 300 };
  return table[speed] ?? 8;
}

export function speedLabel(speed: number): string {
  return speed >= 32 ? 'TURBO' : `${speed}×`;
}

const STEP_BATCH_SIZE = 512;
const STEP_LOW_WATERMARK = 256;
const TURBO_BATCH_SIZE = 4096;
const TURBO_LOW_WATERMARK = 2048;

function countAligned(permutation: Uint32Array): number {
  let count = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] === i) count += 1;
  }
  return count;
}

function isLoggableEvent(event: SortEvent): boolean {
  switch (event.type) {
    case 'compare':
    case 'compare-value':
    case 'swap':
    case 'write':
    case 'pass':
    case 'complete':
      return true;
    case 'mark':
      return event.role === 'pivot' || event.role === 'sorted' || Boolean(event.range);
    default:
      return false;
  }
}

export class AppState {
  status = $state<RunStatus>('empty');
  imageInfo = $state<ImageInfo | null>(null);
  gridInfo = $state<GridSpec | null>(null);
  blockSize = $state<BlockSize>(32);
  algorithmId = $state<AlgorithmId>('bubble');
  mode = $state<PlaybackMode>('educational');
  speed = $state(1);
  counters = $state<Counters>(emptyCounters());
  activeMs = $state(0);
  alignedCount = $state(0);
  currentEvent = $state<SortEvent | null>(null);
  currentLabel = $state('Drop an image to begin.');
  currentDetail = $state('PNG, JPEG, or WebP. Everything stays in this browser.');
  eventLog = $state<LogEntry[]>([]);
  error = $state<string | null>(null);
  uploadError = $state<string | null>(null);
  notice = $state<string | null>(null);
  isLoadingImage = $state(false);
  ghostOriginal = $state(false);
  seed = $state(0);

  image: ImageSource | null = null;
  grid: GridSpec | null = null;
  permutation: Uint32Array | null = null;
  initialPermutation: Uint32Array | null = null;

  private renderer: CanvasRenderer | null = null;
  private worker: Worker | null = null;
  private queue: SortEvent[] = [];
  private queueIndex = 0;
  private awaitingBatch = false;
  private stepPending = false;
  private pendingDone: Extract<WorkerResponse, { type: 'done' }> | null = null;
  private pendingCounters: Counters | null = null;
  private liveCounters: Counters = emptyCounters();
  private liveAlignedCount = 0;
  private initialAlignedCount = 0;
  private workerElapsed = 0;
  private lastFrame = 0;
  private lastStatsFlush = 0;
  private eventBudget = 0;
  private imageDirty = true;
  private dirtyIndices: number[] | null = null;
  private overlay = new OverlayTracker();
  private overlayDirty = true;
  private logId = 0;
  private rafId = 0;
  private pendingEvent: SortEvent | null = null;
  private pendingRawLogs: SortEvent[] = [];
  private modeManuallySet = false;
  private loadToken = 0;

  get hasImage(): boolean {
    return this.imageInfo !== null;
  }

  get algorithm() {
    return getAlgorithm(this.algorithmId);
  }

  get workload(): WorkloadAssessment | null {
    return this.gridInfo ? assessWorkload(this.gridInfo, this.algorithmId, this.mode) : null;
  }

  get canStart(): boolean {
    return (
      Boolean(this.permutation) && (this.workload?.canStart ?? false) && this.status !== 'running'
    );
  }

  get isRunning(): boolean {
    return this.status === 'running';
  }

  get isPaused(): boolean {
    return this.status === 'paused';
  }

  get isComplete(): boolean {
    return this.status === 'completed';
  }

  get totalOps(): number {
    return this.counters.comparisons + this.counters.reads + this.counters.writes;
  }

  get alignedPercent(): number {
    const total = this.gridInfo?.elementCount ?? 0;
    if (total === 0) return 0;
    return Math.floor((this.alignedCount / total) * 100);
  }

  get statusLabel(): string {
    switch (this.status) {
      case 'empty':
        return 'NO IMAGE';
      case 'image-loaded':
        return 'IMAGE LOADED';
      case 'configured':
        return 'CONFIGURED';
      case 'scrambled':
        return 'READY';
      case 'running':
        return 'RUNNING';
      case 'paused':
        return 'PAUSED';
      case 'completed':
        return 'COMPLETE';
      case 'error':
        return 'ERROR';
    }
  }

  get statusTone(): 'idle' | 'live' | 'paused' | 'done' | 'error' {
    switch (this.status) {
      case 'running':
        return 'live';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'done';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  }

  get modeLabel(): string {
    return this.mode === 'educational' ? 'EDUCATIONAL' : 'PERFORMANCE';
  }

  get speedLabel(): string {
    return speedLabel(this.speed);
  }

  get sampleFps(): number {
    return Math.round(1000 / this.sampleIntervalMs());
  }

  attachRenderer(renderer: CanvasRenderer): void {
    this.renderer = renderer;
    if (this.image && this.grid) {
      renderer.setImage(this.image, this.grid);
      if (this.permutation) {
        renderer.renderImage(this.permutation, this.ghostOriginal, null);
        this.imageDirty = false;
        this.dirtyIndices = [];
      }
      renderer.renderOverlay(this.overlay.snapshot(), performance.now(), true);
      this.overlayDirty = false;
    }
  }

  /** Dev-only diagnostics used by the headless verification scripts. */
  forceRender(): void {
    if (this.renderer && this.permutation) {
      this.renderer.renderImage(this.permutation, this.ghostOriginal, null);
      this.imageDirty = false;
      this.dirtyIndices = [];
    }
  }

  /** Dev-only diagnostics used by the headless verification scripts. */
  debugState(): {
    permutation: number[] | null;
    imageData: number[] | null;
    imageAt: number[] | null;
    renderer: ReturnType<CanvasRenderer['debugState']> | null;
  } {
    return {
      permutation: this.permutation ? Array.from(this.permutation.slice(0, 20)) : null,
      imageData: this.image ? Array.from(this.image.data.slice(0, 20)) : null,
      imageAt: this.image ? Array.from(this.image.data.slice(41920 * 4, 41920 * 4 + 4)) : null,
      renderer: this.renderer?.debugState() ?? null,
    };
  }

  detachRenderer(): void {
    this.renderer?.destroy();
    this.renderer = null;
  }

  start(): void {
    if (this.rafId || typeof requestAnimationFrame === 'undefined') return;
    const loop = (now: number): void => {
      this.frame(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  dispose(): void {
    this.stop();
    this.terminateWorker();
    this.detachRenderer();
  }

  async loadImage(file: File): Promise<void> {
    const token = ++this.loadToken;
    await this.decodeAndApplyImage(file, token);
  }

  async loadSample(): Promise<void> {
    const token = ++this.loadToken;
    this.isLoadingImage = true;
    this.uploadError = null;
    try {
      const file = await createSampleImage();
      if (token !== this.loadToken) return;
      await this.decodeAndApplyImage(file, token);
    } catch (error) {
      if (token === this.loadToken) {
        this.uploadError =
          error instanceof Error ? error.message : 'The sample image could not be created.';
      }
    } finally {
      if (token === this.loadToken) this.isLoadingImage = false;
    }
  }

  private async decodeAndApplyImage(file: File, token: number): Promise<void> {
    this.isLoadingImage = true;
    this.uploadError = null;
    try {
      const image = await decodeImageFile(file);
      if (token !== this.loadToken) return;
      this.terminateWorker();
      this.image = image;
      this.imageInfo = {
        width: image.width,
        height: image.height,
        fileName: image.fileName,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        megapixels: (image.width * image.height) / 1_000_000,
      };
      this.grid = computeGrid(image.width, image.height, this.blockSize);
      this.gridInfo = this.grid;
      this.autoSelectMode();
      this.notice =
        image.width * image.height > WARN_IMAGE_PIXELS
          ? `Large image: ${this.imageInfo.megapixels.toFixed(1)} MP. Rendering may be slower; a larger block size keeps the run responsive.`
          : null;
      this.shuffle();
      this.renderer?.setImage(image, this.grid);
      if (this.permutation) {
        this.renderer?.renderImage(this.permutation, this.ghostOriginal, null);
        this.imageDirty = false;
        this.dirtyIndices = [];
      }
    } catch (error) {
      if (token === this.loadToken) {
        this.uploadError =
          error instanceof ImageLoadError
            ? error.message
            : 'The image could not be loaded. Try another file.';
      }
    } finally {
      if (token === this.loadToken) this.isLoadingImage = false;
    }
  }

  clearImage(): void {
    this.loadToken += 1;
    this.isLoadingImage = false;
    this.terminateWorker();
    this.image = null;
    this.imageInfo = null;
    this.grid = null;
    this.gridInfo = null;
    this.permutation = null;
    this.initialPermutation = null;
    this.initialAlignedCount = 0;
    this.liveAlignedCount = 0;
    this.alignedCount = 0;
    this.seed = 0;
    this.status = 'empty';
    this.resetRunStats();
    this.currentLabel = 'Drop an image to begin.';
    this.currentDetail = 'PNG, JPEG, or WebP. Everything stays in this browser.';
    this.renderer?.clear();
    this.uploadError = null;
    this.notice = null;
  }

  setBlockSize(size: BlockSize): void {
    if (size === this.blockSize) return;
    this.terminateWorker();
    this.blockSize = size;
    if (this.image) {
      this.grid = computeGrid(this.image.width, this.image.height, size);
      this.gridInfo = this.grid;
      this.autoSelectMode();
      this.renderer?.setImage(this.image, this.grid);
      this.shuffle();
    }
  }

  setAlgorithm(id: AlgorithmId): void {
    if (id === this.algorithmId) return;
    this.terminateWorker();
    this.algorithmId = id;
    if (this.initialPermutation) {
      this.permutation = this.initialPermutation.slice();
      this.liveAlignedCount = this.initialAlignedCount;
      this.alignedCount = this.initialAlignedCount;
      this.status = 'scrambled';
      this.resetRunStats();
      this.currentLabel = 'Algorithm changed. The same shuffle is ready.';
      this.currentDetail = 'The initial shuffled arrangement is preserved for a fair comparison.';
    }
  }

  setMode(mode: PlaybackMode): void {
    this.modeManuallySet = true;
    if (mode === this.mode) return;
    if (this.status === 'running' || this.status === 'paused') {
      this.reset();
    }
    this.mode = mode;
    if (this.worker) {
      this.worker.postMessage({ type: 'set-sample-interval', ms: this.sampleIntervalMs() });
    }
  }

  setSpeed(value: number): void {
    const prevTurbo = this.speed >= 32;
    this.speed = value;
    const nextTurbo = this.speed >= 32;
    if (this.worker) {
      if (this.mode === 'performance') {
        this.worker.postMessage({ type: 'set-sample-interval', ms: this.sampleIntervalMs() });
      } else if (prevTurbo !== nextTurbo) {
        this.worker.postMessage({ type: 'set-batch-size', batchSize: this.currentBatchSize() });
      }
    }
  }

  toggleGhost(): void {
    this.ghostOriginal = !this.ghostOriginal;
    this.markCanvasDirty();
  }

  shuffle(): void {
    if (!this.grid) return;
    this.terminateWorker();
    this.seed = randomSeed();
    this.initialPermutation = fisherYates(this.grid.elementCount, this.seed);
    this.permutation = this.initialPermutation.slice();
    this.initialAlignedCount = countAligned(this.initialPermutation);
    this.liveAlignedCount = this.initialAlignedCount;
    this.alignedCount = this.initialAlignedCount;
    this.status = 'scrambled';
    this.resetRunStats();
    this.currentLabel = 'Shuffled and ready.';
    this.currentDetail = 'The image is a random permutation of its original tiles.';
  }

  reset(): void {
    this.terminateWorker();
    if (this.initialPermutation) {
      this.permutation = this.initialPermutation.slice();
      this.liveAlignedCount = this.initialAlignedCount;
      this.alignedCount = this.initialAlignedCount;
      this.status = 'scrambled';
    } else {
      this.liveAlignedCount = 0;
      this.alignedCount = 0;
      this.status = this.image ? 'image-loaded' : 'empty';
    }
    this.resetRunStats();
    this.currentLabel = this.permutation
      ? 'Reset to the initial shuffle.'
      : 'Drop an image to begin.';
    this.currentDetail = this.permutation
      ? 'The same shuffled arrangement is ready to run again.'
      : 'PNG, JPEG, or WebP. Everything stays in this browser.';
  }

  restoreOriginal(): void {
    if (!this.grid) return;
    this.terminateWorker();
    this.permutation = identityPermutation(this.grid.elementCount);
    this.liveAlignedCount = this.grid.elementCount;
    this.status = 'completed';
    this.resetRunStats();
    this.alignedCount = this.grid.elementCount;
    this.currentEvent = {
      type: 'complete',
      counters: emptyCounters(),
      elapsedMs: 0,
      validated: true,
    };
    this.currentLabel = 'Original arrangement restored.';
    this.currentDetail = 'No sorting run is active. Shuffle to start again.';
    this.overlay.setComplete(this.grid.elementCount);
    this.overlayDirty = true;
    this.markCanvasDirty();
  }

  startRun(): void {
    if (!this.permutation) return;
    if (this.status === 'running') return;
    if (this.status === 'paused') {
      this.resume();
      return;
    }
    if (this.workload && !this.workload.canStart) return;
    if (this.status === 'completed' || this.status === 'error') {
      this.permutation = this.initialPermutation?.slice() ?? this.permutation;
      this.liveAlignedCount = this.initialPermutation
        ? this.initialAlignedCount
        : countAligned(this.permutation);
      this.alignedCount = this.liveAlignedCount;
      this.status = 'scrambled';
      this.resetRunStats();
    }
    this.beginRun(false);
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    if (this.overlay.onPause()) this.overlayDirty = true;
    this.flushStats();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.lastFrame = performance.now();
    this.eventBudget = 0;
    if (this.overlay.onResume()) this.overlayDirty = true;
    this.requestMore();
  }

  step(): void {
    if (!this.permutation) return;
    if (this.mode === 'performance') return;
    if (this.status !== 'paused' && this.workload && !this.workload.canStart) return;
    if (this.status === 'running') this.pause();

    if (this.status === 'completed' || this.status === 'error') {
      this.permutation = this.initialPermutation?.slice() ?? this.permutation;
      this.liveAlignedCount = this.initialPermutation
        ? this.initialAlignedCount
        : countAligned(this.permutation);
      this.alignedCount = this.liveAlignedCount;
      this.status = 'scrambled';
      this.resetRunStats();
    }

    if (
      this.status === 'scrambled' ||
      this.status === 'image-loaded' ||
      this.status === 'configured'
    ) {
      this.beginRun(true);
      return;
    }

    if (this.status !== 'paused') return;

    if (this.queue.length > this.queueIndex) {
      if (this.overlay.prepareForStep()) this.overlayDirty = true;
      this.applyNextEvent(performance.now());
      this.flushStats();
      if (this.pendingDone && this.queue.length === this.queueIndex) this.finalizeDone();
    } else if (this.pendingDone) {
      this.finalizeDone();
    } else {
      this.stepPending = true;
      this.requestMore(true);
    }
  }

  dismissUploadError(): void {
    this.uploadError = null;
  }

  dismissNotice(): void {
    this.notice = null;
  }

  private autoSelectMode(): void {
    if (this.modeManuallySet || !this.grid) return;
    this.mode =
      this.grid.elementCount > EDUCATIONAL_RECOMMENDED_MAX ? 'performance' : 'educational';
  }

  private currentBatchSize(): number {
    return this.speed >= 32 ? TURBO_BATCH_SIZE : STEP_BATCH_SIZE;
  }

  private currentLowWatermark(): number {
    return this.speed >= 32 ? TURBO_LOW_WATERMARK : STEP_LOW_WATERMARK;
  }

  private transientTtlMs(): number {
    const eps = speedToEventsPerSecond(this.speed);
    if (!Number.isFinite(eps)) return 110;
    return Math.max(110, Math.min(280, Math.round(1100 / eps)));
  }

  private sampleIntervalMs(): number {
    const fps =
      this.speed <= 0.5
        ? 4
        : this.speed <= 1
          ? 6
          : this.speed <= 2
            ? 10
            : this.speed <= 4
              ? 15
              : this.speed <= 8
                ? 20
                : this.speed <= 16
                  ? 24
                  : 30;
    return Math.round(1000 / fps);
  }

  private beginRun(paused: boolean): void {
    if (!this.permutation || !this.grid) return;
    const workload = this.workload;
    if (workload && !workload.canStart) {
      this.error = workload.blockers[0] ?? 'This run is too large to start safely.';
      return;
    }

    this.terminateWorker();
    this.resetRunStats();
    this.spawnWorker();
    this.status = paused ? 'paused' : 'running';
    this.awaitingBatch = true;
    this.stepPending = paused;
    this.lastFrame = performance.now();
    this.eventBudget = 0;
    this.currentLabel = paused ? 'Paused — step through the first operation.' : 'Sorting…';
    this.currentDetail = paused
      ? 'Use Step to advance one event at a time.'
      : 'The worker is computing and the canvas is playing back events.';

    this.worker?.postMessage({
      type: 'start',
      permutation: this.permutation.slice(),
      algorithmId: this.algorithmId,
      mode: this.mode === 'educational' ? 'step' : 'sample',
      batchSize: this.mode === 'educational' ? this.currentBatchSize() : 1,
      sampleIntervalMs: this.sampleIntervalMs(),
    });
    this.flushStats();
  }

  private spawnWorker(): void {
    this.worker = new Worker(new URL('../core/workers/sorting.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
    this.worker.onerror = (event) => {
      this.status = 'error';
      this.error = event.message || 'The sorting worker failed.';
      this.terminateWorker();
    };
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
    this.awaitingBatch = false;
    this.queue = [];
    this.queueIndex = 0;
    this.stepPending = false;
    this.pendingDone = null;
    this.pendingCounters = null;
  }

  private handleWorkerMessage(message: WorkerResponse): void {
    if (message.type === 'batch') {
      this.awaitingBatch = false;
      this.workerElapsed = message.elapsedMs;
      this.liveCounters.maxDepth = Math.max(this.liveCounters.maxDepth, message.counters.maxDepth);
      if (this.mode === 'performance') {
        this.pendingCounters = message.counters;
      }
      this.queue.push(...message.events);

      if (this.stepPending) {
        this.stepPending = false;
        if (this.overlay.prepareForStep()) this.overlayDirty = true;
        this.applyNextEvent(performance.now());
        this.flushStats();
        if (this.pendingDone && this.queue.length === this.queueIndex) this.finalizeDone();
        return;
      }

      if (
        this.status === 'running' &&
        this.mode === 'educational' &&
        this.speed >= 32 &&
        this.queue.length - this.queueIndex <= this.currentLowWatermark()
      ) {
        this.requestMore();
      }
      return;
    }

    if (message.type === 'done') {
      this.awaitingBatch = false;
      this.pendingDone = message;
      if (this.queue.length === this.queueIndex) this.finalizeDone();
      return;
    }

    if (message.type === 'cancelled') {
      this.awaitingBatch = false;
      this.worker = null;
      return;
    }

    if (message.type === 'error') {
      this.awaitingBatch = false;
      this.status = 'error';
      this.error = `${message.message} Reset and try again.`;
      this.currentEvent = null;
      this.currentLabel = 'Run stopped.';
      this.currentDetail = 'The sorting worker reported an error. Reset and try again.';
      this.pendingEvent = null;
      this.pendingRawLogs = [];
      this.flushStats();
      this.terminateWorker();
    }
  }

  private finalizeDone(): void {
    const done = this.pendingDone;
    if (!done) return;
    this.pendingDone = null;
    this.permutation = done.permutation;
    this.liveAlignedCount = countAligned(done.permutation);
    this.alignedCount = this.liveAlignedCount;
    this.liveCounters = { ...done.counters };
    this.workerElapsed = done.elapsedMs;
    this.status = done.validated ? 'completed' : 'error';
    this.currentEvent = {
      type: 'complete',
      counters: done.counters,
      elapsedMs: done.elapsedMs,
      validated: done.validated,
    };
    this.currentLabel = done.validated
      ? 'Complete — original arrangement restored.'
      : 'Validation failed.';
    this.currentDetail = done.validated
      ? 'Every element is back in its original position.'
      : 'The final permutation is not the original arrangement. Reset and try again.';
    this.pendingEvent = null;
    this.pendingRawLogs = [];
    this.markCanvasDirty();
    if (done.validated) {
      this.overlay.setComplete(this.grid?.elementCount ?? 0);
    } else {
      this.overlay.reset();
      this.error = 'The final permutation did not validate. Reset and try again.';
    }
    this.overlayDirty = true;
    this.eventLog = [
      {
        id: this.logId++,
        type: 'complete',
        text: done.validated ? 'Complete — original restored' : 'Validation failed',
      },
      ...this.eventLog,
    ].slice(0, 6);
    this.flushStats();
    this.terminateWorker();
  }

  private frame(now: number): void {
    if (this.status === 'running') this.advance(now);

    if (this.renderer) {
      if (this.imageDirty && this.permutation) {
        this.renderer.renderImage(this.permutation, this.ghostOriginal, this.dirtyIndices);
        this.imageDirty = false;
        this.dirtyIndices = [];
      }
      if (this.overlay.prune(now)) {
        this.overlayDirty = true;
      }
      this.renderer.renderOverlay(this.overlay.snapshot(), now, this.overlayDirty);
      this.overlayDirty = false;
    }

    if (this.status === 'running' && now - this.lastStatsFlush >= 100) {
      this.flushStats();
      this.lastStatsFlush = now;
    }
  }

  private advance(now: number): void {
    const dt = this.lastFrame > 0 ? Math.min(100, now - this.lastFrame) : 16;
    this.lastFrame = now;

    if (this.mode === 'performance') {
      let applied = 0;
      while (applied < 4 && this.applyNextEvent(now)) applied += 1;
      if (this.pendingDone && this.queue.length === this.queueIndex) this.finalizeDone();
      if (this.queue.length - this.queueIndex === 0) this.requestMore();
      return;
    }

    const eventsPerSecond = speedToEventsPerSecond(this.speed);
    let budget: number;
    if (!Number.isFinite(eventsPerSecond)) {
      budget = TURBO_BATCH_SIZE * 2;
    } else {
      this.eventBudget += (eventsPerSecond * dt) / 1000;
      budget = Math.floor(this.eventBudget);
      this.eventBudget -= budget;
    }

    let applied = 0;
    while (applied < budget && this.applyNextEvent(now)) applied += 1;
    if (this.pendingDone && this.queue.length === this.queueIndex) this.finalizeDone();
    if (this.queue.length - this.queueIndex <= this.currentLowWatermark()) this.requestMore();
  }

  private requestMore(force = false): void {
    if (!this.worker || this.awaitingBatch || this.pendingDone) return;
    if (!force && this.status !== 'running') return;
    const queued = this.queue.length - this.queueIndex;
    const low = this.mode === 'performance' ? 0 : this.currentLowWatermark();
    if (force || queued <= low) {
      this.awaitingBatch = true;
      this.worker.postMessage({ type: 'continue' });
    }
  }

  private applyNextEvent(now: number): boolean {
    if (this.queueIndex >= this.queue.length) return false;
    const event = this.queue[this.queueIndex];
    this.queueIndex += 1;
    this.applyEvent(event, now);
    if (this.queueIndex > 1024) {
      this.queue = this.queue.slice(this.queueIndex);
      this.queueIndex = 0;
    }
    return true;
  }

  private applyEvent(event: SortEvent, now: number): void {
    this.pendingEvent = event;
    if (isLoggableEvent(event)) {
      this.pendingRawLogs.push(event);
      if (this.pendingRawLogs.length > 6) this.pendingRawLogs.shift();
    }

    if ('ops' in event) {
      const { ops } = event;
      this.liveCounters.comparisons += ops.c;
      this.liveCounters.reads += ops.r;
      this.liveCounters.writes += ops.w;
      this.liveCounters.swaps += ops.s;
      this.liveCounters.auxWrites += ops.aw;
      this.liveCounters.passes += ops.p;
    }

    switch (event.type) {
      case 'swap':
        if (this.permutation && event.i !== event.j) {
          const p = this.permutation;
          const before = (p[event.i] === event.i ? 1 : 0) + (p[event.j] === event.j ? 1 : 0);
          if (applyEventToPermutation(p, event)) {
            const after = (p[event.i] === event.i ? 1 : 0) + (p[event.j] === event.j ? 1 : 0);
            this.liveAlignedCount += after - before;
            this.markCanvasDirty([event.i, event.j]);
          }
        }
        break;
      case 'write':
        if (!event.aux && this.permutation) {
          const p = this.permutation;
          const idx = event.index;
          const wasAligned = idx >= 0 && idx < p.length && p[idx] === idx ? 1 : 0;
          if (applyEventToPermutation(p, event)) {
            const isAligned = p[idx] === idx ? 1 : 0;
            this.liveAlignedCount += isAligned - wasAligned;
            this.markCanvasDirty([idx]);
          }
        }
        break;
      case 'delta':
        if (this.permutation && event.indices.length > 0) {
          const p = this.permutation;
          if (event.indices.length <= 20_000) {
            let alignedDelta = 0;
            for (let k = 0; k < event.indices.length; k += 1) {
              const idx = event.indices[k];
              if (idx < p.length) {
                if (p[idx] === idx) alignedDelta -= 1;
                p[idx] = event.values[k];
                if (p[idx] === idx) alignedDelta += 1;
              }
            }
            this.liveAlignedCount += alignedDelta;
          } else {
            applyEventToPermutation(p, event);
            this.liveAlignedCount = countAligned(p);
          }
          if (event.indices.length <= 512) {
            this.markCanvasDirty(Array.from(event.indices));
          } else {
            this.markCanvasDirty();
          }
        }
        if (this.pendingCounters) {
          this.liveCounters = { ...this.pendingCounters };
          this.pendingCounters = null;
        }
        break;
      case 'snapshot':
        this.permutation = event.data;
        this.liveAlignedCount = countAligned(event.data);
        if (this.pendingCounters) {
          this.liveCounters = { ...this.pendingCounters };
          this.pendingCounters = null;
        }
        this.markCanvasDirty();
        break;
      case 'complete':
        this.status = 'completed';
        this.liveCounters = { ...event.counters };
        this.workerElapsed = event.elapsedMs;
        if (this.permutation) this.liveAlignedCount = countAligned(this.permutation);
        this.markCanvasDirty();
        break;
    }

    if (this.overlay.applyEvent(event, now, this.transientTtlMs(), this.status === 'paused')) {
      this.overlayDirty = true;
    }
  }

  private markCanvasDirty(indices?: number[]): void {
    this.imageDirty = true;
    if (!indices) {
      this.dirtyIndices = null;
      return;
    }
    if (this.dirtyIndices === null) return;
    for (let i = 0; i < indices.length; i += 1) {
      this.dirtyIndices.push(indices[i]);
    }
    if (this.dirtyIndices.length > 512) {
      this.dirtyIndices = null;
    }
  }

  private flushStats(): void {
    this.counters = { ...this.liveCounters };
    this.activeMs = this.workerElapsed;
    this.alignedCount = this.liveAlignedCount;

    if (this.pendingRawLogs.length > 0) {
      const formatted: LogEntry[] = [];
      for (let i = this.pendingRawLogs.length - 1; i >= 0; i -= 1) {
        const entry = this.describeEvent(this.pendingRawLogs[i]).log;
        if (entry) formatted.push(entry);
      }
      if (formatted.length > 0) {
        this.eventLog = [...formatted, ...this.eventLog].slice(0, 6);
      }
      this.pendingRawLogs = [];
    }

    if (this.pendingEvent) {
      const description = this.describeEvent(this.pendingEvent);
      this.currentEvent = this.pendingEvent;
      this.currentLabel = description.label;
      this.currentDetail = description.detail;
      this.pendingEvent = null;
    }
  }

  private resetRunStats(): void {
    this.liveCounters = emptyCounters();
    this.workerElapsed = 0;
    this.counters = emptyCounters();
    this.activeMs = 0;
    this.currentEvent = null;
    this.currentLabel = 'Ready to sort.';
    this.currentDetail = 'Press Start or step through the first operation.';
    this.pendingEvent = null;
    this.pendingRawLogs = [];
    this.eventLog = [];
    this.overlay.reset();
    this.overlayDirty = true;
    this.markCanvasDirty();
    this.error = null;
    this.pendingDone = null;
    this.pendingCounters = null;
    this.queue = [];
    this.queueIndex = 0;
    this.awaitingBatch = false;
    this.stepPending = false;
    this.eventBudget = 0;
    this.lastFrame = 0;
  }

  private describeEvent(event: SortEvent): {
    label: string;
    detail: string;
    log: LogEntry | null;
  } {
    switch (event.type) {
      case 'compare': {
        const label = event.aux ? 'Compare · aux buffer' : 'Compare';
        const detail = `Positions ${formatNumber(event.i)} and ${formatNumber(event.j)} · target indices ${formatNumber(event.a)} and ${formatNumber(event.b)}.`;
        return {
          label,
          detail,
          log: {
            id: this.logId++,
            type: 'compare',
            text: `Compare ${formatNumber(event.i)} ↔ ${formatNumber(event.j)}${event.aux ? ' (aux)' : ''}`,
          },
        };
      }
      case 'compare-value': {
        const label = event.aux ? 'Compare key · aux buffer' : 'Compare key';
        const detail = `Position ${formatNumber(event.index)} holds ${formatNumber(event.value)}; the key is ${formatNumber(event.against)}.`;
        return {
          label,
          detail,
          log: {
            id: this.logId++,
            type: 'compare',
            text: `Compare ${formatNumber(event.index)} with key`,
          },
        };
      }
      case 'read': {
        if (event.auxKind === 'counts') {
          return {
            label: 'Read · count table',
            detail: `Count slot [${formatNumber(event.index)}] → ${formatNumber(event.value)}.`,
            log: null,
          };
        }
        return {
          label: event.aux ? 'Read · aux buffer' : 'Read',
          detail: `${event.aux ? 'Aux slot' : 'Position'} ${formatNumber(event.index)} → ${formatNumber(event.value)}.`,
          log: null,
        };
      }
      case 'swap':
        return {
          label: 'Swap',
          detail: `Positions ${formatNumber(event.i)} and ${formatNumber(event.j)} exchange places.`,
          log: {
            id: this.logId++,
            type: 'swap',
            text: `Swap ${formatNumber(event.i)} ↔ ${formatNumber(event.j)}`,
          },
        };
      case 'write': {
        if (event.auxKind === 'counts') {
          return {
            label: 'Write · count table',
            detail: `Count slot [${formatNumber(event.index)}] ← ${formatNumber(event.value)}.`,
            log: {
              id: this.logId++,
              type: 'write',
              text: `Count[${formatNumber(event.index)}] ← ${formatNumber(event.value)}`,
            },
          };
        }
        return {
          label: event.aux ? 'Write · aux buffer' : 'Write',
          detail: `${event.aux ? 'Aux slot' : 'Position'} ${formatNumber(event.index)} ← ${formatNumber(event.value)}.`,
          log: {
            id: this.logId++,
            type: 'write',
            text: `Write ${formatNumber(event.index)}${event.aux ? ' (aux)' : ''}`,
          },
        };
      }
      case 'mark': {
        if (event.role === 'pivot') {
          return {
            label: 'Pivot',
            detail: `Position ${formatNumber(event.indices[0] ?? 0)} is the partition pivot.`,
            log: {
              id: this.logId++,
              type: 'pivot',
              text: `Pivot ${formatNumber(event.indices[0] ?? 0)}`,
            },
          };
        }
        if (event.role === 'sorted') {
          return {
            label: 'Sorted',
            detail: event.range
              ? `Positions ${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)} are sorted.`
              : `Position ${formatNumber(event.indices[0] ?? 0)} is in its final place.`,
            log: {
              id: this.logId++,
              type: 'sorted',
              text: event.range
                ? `Sorted ${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)}`
                : `Sorted ${formatNumber(event.indices[0] ?? 0)}`,
            },
          };
        }
        if (event.range) {
          return {
            label: 'Active range',
            detail: `Positions ${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)} are being worked on.`,
            log: {
              id: this.logId++,
              type: 'range',
              text: `Range ${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)}`,
            },
          };
        }
        return { label: 'Mark', detail: 'The algorithm marked an element.', log: null };
      }
      case 'pass':
        return {
          label: 'Pass',
          detail: event.label,
          log: { id: this.logId++, type: 'pass', text: event.label },
        };
      case 'delta':
        return {
          label: 'Batch update',
          detail: `${formatNumber(event.indices.length)} positions updated in this frame.`,
          log: null,
        };
      case 'snapshot':
        return {
          label: 'Snapshot',
          detail: `${formatNumber(event.data.length)} elements captured.`,
          log: null,
        };
      case 'complete':
        return {
          label: 'Complete',
          detail: event.validated
            ? 'Every element is back in its original position.'
            : 'The final permutation did not validate.',
          log: {
            id: this.logId++,
            type: 'complete',
            text: event.validated ? 'Complete — original restored' : 'Complete — validation failed',
          },
        };
    }
  }
}

export const app = new AppState();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __pixelSort?: AppState }).__pixelSort = app;
}
