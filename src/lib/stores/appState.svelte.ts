import { computeGrid } from '../core/image/grid';
import type { BlockSize, GridSpec, ImageSource } from '../core/image/imageTypes';
import { ImageLoadError, WARN_IMAGE_PIXELS, decodeImageFile } from '../core/image/decodeImage';
import { createSampleImage } from '../core/image/sampleImage';
import {
  fisherYates,
  identityPermutation,
  isPermutation,
  isSorted,
  randomSeed,
} from '../core/image/shuffle';
import { getAlgorithm } from '../core/sorting/registry';
import {
  emptyCounters,
  type AlgorithmId,
  type Counters,
  type SortEvent,
  type SortVisualEvent,
} from '../core/sorting/types';
import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
import { OverlayTracker } from '../core/visualization/overlayState';
import { applyEventToPermutation } from '../core/visualization/eventPlayer';
import type { WorkerResponse } from '../core/workers/workerMessages';
import { i18n, msg, type LocalizedText } from '../i18n/index.svelte';
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
  text: LocalizedText;
}

export const SPEED_PRESETS = [0.5, 1, 2, 4, 8, 16, 32] as const;

export function speedToEventsPerSecond(speed: number): number {
  const table: Record<number, number> = { 0.5: 3, 1: 8, 2: 20, 4: 50, 8: 120, 16: 300, 32: 900 };
  return table[speed] ?? 8;
}

export function speedLabel(speed: number): string {
  return `${speed}×`;
}

const STEP_BATCH_SIZE = 512;
const STEP_LOW_WATERMARK = 256;
const FAST_BATCH_SIZE = 4096;
const FAST_LOW_WATERMARK = 2048;

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
  currentLabel = $state<LocalizedText>(msg('state.dropLabel'));
  currentDetail = $state<LocalizedText>(msg('state.dropDetail'));
  eventLog = $state<LogEntry[]>([]);
  error = $state<LocalizedText | null>(null);
  uploadError = $state<LocalizedText | null>(null);
  notice = $state<LocalizedText | null>(null);
  isLoadingImage = $state(false);
  ghostOriginal = $state(false);
  seed = $state(0);
  runNumber = $state(0);

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
  private runSequence = 0;
  private activeRunId = 0;

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
    return i18n.statusLabel(this.status);
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
    return i18n.t(this.mode === 'educational' ? 'mode.educational' : 'mode.performance');
  }

  get speedLabel(): string {
    return speedLabel(this.speed);
  }

  get sampleFps(): number {
    return Math.round(1000 / Math.max(16, this.sampleIntervalMs()));
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
      this.renderer.renderOverlay(this.overlay.snapshot(), performance.now(), true);
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
        this.uploadError = i18n.errorMessage(
          error instanceof Error ? error.message : 'The sample image could not be created.',
        );
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
      this.runNumber = 0;
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
          ? msg('state.largeImageNotice', { megapixels: this.imageInfo.megapixels })
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
        this.uploadError = i18n.errorMessage(
          error instanceof ImageLoadError
            ? error.message
            : 'The image could not be decoded. It may be corrupted or use an unsupported encoding.',
        );
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
    this.runNumber = 0;
    this.status = 'empty';
    this.resetRunStats();
    this.currentLabel = msg('state.dropLabel');
    this.currentDetail = msg('state.dropDetail');
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
      this.currentLabel = msg('state.algorithmChangedLabel');
      this.currentDetail = msg('state.algorithmChangedDetail');
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
    this.currentLabel = msg('state.shuffledLabel');
    this.currentDetail = msg('state.shuffledDetail');
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
    this.currentLabel = this.permutation ? msg('state.resetLabel') : msg('state.dropLabel');
    this.currentDetail = this.permutation ? msg('state.resetDetail') : msg('state.dropDetail');
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
    this.currentLabel = msg('state.restoredLabel');
    this.currentDetail = msg('state.restoredDetail');
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
    return this.speed >= 32 ? FAST_BATCH_SIZE : STEP_BATCH_SIZE;
  }

  private currentLowWatermark(): number {
    return this.speed >= 32 ? FAST_LOW_WATERMARK : STEP_LOW_WATERMARK;
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
                  : 22;
    return Math.round(1000 / fps);
  }

  private beginRun(paused: boolean): void {
    if (!this.permutation || !this.grid) return;
    const workload = this.workload;
    if (workload && !workload.canStart) {
      this.error = workload.blockers[0] ?? msg('error.runTooLarge');
      return;
    }

    this.terminateWorker();
    this.resetRunStats();
    this.spawnWorker();
    this.runNumber += 1;
    this.status = paused ? 'paused' : 'running';
    this.awaitingBatch = true;
    this.stepPending = paused;
    this.lastFrame = performance.now();
    this.eventBudget = 0;
    this.currentLabel = paused ? msg('state.pausedLabel') : msg('state.sortingLabel');
    this.currentDetail = paused ? msg('state.pausedDetail') : msg('state.sortingDetail');

    this.worker?.postMessage({
      type: 'start',
      runId: this.activeRunId,
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
      this.error = i18n.errorMessage(event.message || 'The sorting worker failed.');
      this.terminateWorker();
    };
  }

  private terminateWorker(): void {
    // Invalidate responses before detaching the worker. A terminated worker can
    // still have a message already queued in the browser's event loop.
    this.activeRunId = ++this.runSequence;
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
    if (message.runId !== this.activeRunId) return;

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
      this.error = msg('error.workerRetry', { message: i18n.errorMessage(message.message) });
      this.currentEvent = null;
      this.currentLabel = msg('state.runStoppedLabel');
      this.currentDetail = msg('state.runStoppedDetail');
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
    const validated =
      done.validated && isPermutation(done.permutation) && isSorted(done.permutation);
    this.permutation = done.permutation;
    this.liveAlignedCount = countAligned(done.permutation);
    this.alignedCount = this.liveAlignedCount;
    this.liveCounters = { ...done.counters };
    this.workerElapsed = done.elapsedMs;
    this.status = validated ? 'completed' : 'error';
    this.currentEvent = {
      type: 'complete',
      counters: done.counters,
      elapsedMs: done.elapsedMs,
      validated,
    };
    this.currentLabel = validated ? msg('state.completeLabel') : msg('state.validationFailedLabel');
    this.currentDetail = validated
      ? msg('state.completeDetail')
      : msg('state.validationFailedDetail');
    this.pendingEvent = null;
    this.pendingRawLogs = [];
    this.markCanvasDirty();
    if (validated) {
      this.overlay.setComplete(this.grid?.elementCount ?? 0);
    } else {
      this.overlay.reset();
      this.error = msg('error.validationRetry');
    }
    this.overlayDirty = true;
    this.eventLog = [
      {
        id: this.logId++,
        type: 'complete',
        text: validated ? msg('state.completeLog') : msg('state.validationFailedLog'),
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
    this.eventBudget += (eventsPerSecond * dt) / 1000;
    budget = Math.floor(this.eventBudget);
    this.eventBudget -= budget;

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

    if ((event.type === 'delta' || event.type === 'snapshot') && event.focus) {
      this.applySampleFocus(event.focus, now);
    }

    if (this.overlay.applyEvent(event, now, this.transientTtlMs(), this.status === 'paused')) {
      this.overlayDirty = true;
    }
  }

  /**
   * Sampled frames already applied their permutation delta. Replay only the
   * semantic presentation event so swap/write focus is not applied twice and
   * counters remain algorithm-authored.
   */
  private applySampleFocus(event: SortVisualEvent, now: number): void {
    this.pendingEvent = event;
    if (isLoggableEvent(event)) {
      this.pendingRawLogs.push(event);
      if (this.pendingRawLogs.length > 6) this.pendingRawLogs.shift();
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
    this.currentLabel = msg('state.readyLabel');
    this.currentDetail = msg('state.readyDetail');
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
    label: LocalizedText;
    detail: LocalizedText;
    log: LogEntry | null;
  } {
    switch (event.type) {
      case 'compare': {
        const order = msg(event.a < event.b ? 'event.orderBefore' : 'event.orderAfter', {
          a: event.a,
          b: event.b,
        });
        const label = msg(event.aux ? 'event.compareAuxLabel' : 'event.compareLabel');
        const detail = msg('event.compareDetail', {
          location: event.aux ? msg('event.compareSlots') : msg('event.comparePositions'),
          i: event.i,
          j: event.j,
          a: event.a,
          b: event.b,
          order,
        });
        return {
          label,
          detail,
          log: {
            id: this.logId++,
            type: 'compare',
            text: msg('log.compare', {
              i: event.i,
              j: event.j,
              suffix: event.aux ? msg('error.auxSuffix') : '',
            }),
          },
        };
      }
      case 'compare-value': {
        const order = msg(event.value < event.against ? 'event.orderBefore' : 'event.orderAfter', {
          a: event.value,
          b: event.against,
        });
        const label = msg(event.aux ? 'event.compareValueAuxLabel' : 'event.compareValueLabel');
        const detail = msg('event.compareValueDetail', {
          location: event.aux ? msg('event.auxSlot') : msg('event.position'),
          index: event.index,
          value: event.value,
          against: event.against,
          order,
        });
        return {
          label,
          detail,
          log: {
            id: this.logId++,
            type: 'compare',
            text: msg('log.compareKey', { index: event.index }),
          },
        };
      }
      case 'read': {
        if (event.auxKind === 'counts') {
          return {
            label: msg('event.readCountLabel'),
            detail: msg('event.readCountDetail', { index: event.index, value: event.value }),
            log: null,
          };
        }
        const location = msg(event.aux ? 'event.auxSlot' : 'event.position');
        return {
          label: msg(event.aux ? 'event.readAuxLabel' : 'event.readLabel'),
          detail: msg('event.readDetail', {
            location,
            index: event.index,
            value: event.value,
            meaning: msg(event.aux ? 'event.readAuxMeaning' : 'event.readMainMeaning', {
              value: event.value,
            }),
          }),
          log: null,
        };
      }
      case 'swap':
        return {
          label: msg('event.swapLabel'),
          detail: msg('event.swapDetail', {
            i: event.i,
            j: event.j,
            a: event.a,
            b: event.b,
          }),
          log: {
            id: this.logId++,
            type: 'swap',
            text: msg('log.swap', { i: event.i, j: event.j }),
          },
        };
      case 'write': {
        if (event.auxKind === 'counts') {
          return {
            label: msg('event.writeCountLabel'),
            detail: msg('event.writeCountDetail', { index: event.index, value: event.value }),
            log: {
              id: this.logId++,
              type: 'write',
              text: msg('log.countWrite', { index: event.index, value: event.value }),
            },
          };
        }
        return {
          label: msg(event.aux ? 'event.writeAuxLabel' : 'event.writeLabel'),
          detail: msg('event.writeDetail', {
            meaning: msg(event.aux ? 'event.writeAuxMeaning' : 'event.writeMainMeaning', {
              index: event.index,
              value: event.value,
            }),
          }),
          log: {
            id: this.logId++,
            type: 'write',
            text: msg('log.write', {
              index: event.index,
              suffix: event.aux ? msg('error.auxSuffix') : '',
            }),
          },
        };
      }
      case 'mark': {
        if (event.role === 'pivot') {
          return {
            label: msg('event.pivotLabel'),
            detail: msg('event.pivotDetail', { index: event.indices[0] ?? 0 }),
            log: {
              id: this.logId++,
              type: 'pivot',
              text: msg('log.pivot', { index: event.indices[0] ?? 0 }),
            },
          };
        }
        if (event.role === 'sorted') {
          return {
            label: msg('event.sortedLabel'),
            detail: event.range
              ? msg('event.sortedRangeDetail', { start: event.range[0], end: event.range[1] - 1 })
              : msg('event.sortedPositionDetail', { index: event.indices[0] ?? 0 }),
            log: {
              id: this.logId++,
              type: 'sorted',
              text: event.range
                ? msg('log.sortedRange', { start: event.range[0], end: event.range[1] - 1 })
                : msg('log.sortedPosition', { index: event.indices[0] ?? 0 }),
            },
          };
        }
        if (event.range) {
          return {
            label: msg('event.rangeLabel'),
            detail: msg('event.rangeDetail', { start: event.range[0], end: event.range[1] - 1 }),
            log: {
              id: this.logId++,
              type: 'range',
              text: msg('log.range', { start: event.range[0], end: event.range[1] - 1 }),
            },
          };
        }
        return { label: msg('event.markLabel'), detail: msg('event.markDetail'), log: null };
      }
      case 'pass':
        return {
          label: msg('event.passLabel'),
          detail: msg('event.passDetail', { label: i18n.passMessage(event.label) }),
          log: {
            id: this.logId++,
            type: 'pass',
            text: msg('log.pass', { label: i18n.passMessage(event.label) }),
          },
        };
      case 'delta':
        return {
          label: msg('event.batchLabel'),
          detail: msg('event.batchDetail', { count: event.indices.length }),
          log: null,
        };
      case 'snapshot':
        return {
          label: msg('event.snapshotLabel'),
          detail: msg('event.snapshotDetail', { count: event.data.length }),
          log: null,
        };
      case 'complete':
        return {
          label: msg('event.completeLabel'),
          detail: event.validated
            ? msg('event.completeDetail')
            : msg('event.completeInvalidDetail'),
          log: {
            id: this.logId++,
            type: 'complete',
            text: event.validated ? msg('state.completeLog') : msg('state.validationFailedLog'),
          },
        };
    }
  }
}

export const app = new AppState();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __pixelSort?: AppState }).__pixelSort = app;
}
