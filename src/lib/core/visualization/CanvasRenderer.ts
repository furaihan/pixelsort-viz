import { elementRect } from '../image/grid';
import type { GridSpec, ImageSource } from '../image/imageTypes';
import type { Highlight, OverlaySnapshot } from './overlayState';
import { computeRangeShape, type RangeShape, type Rect2D } from './rangeGeometry';
import { i18n } from '../../i18n/index.svelte';

export type { Highlight, OverlaySnapshot };

const LIME = '#9ACCF0'; // Glacier Blue — primary accent
const LIME_SOFT_STROKE = 'rgba(154, 204, 240, 0.8)';
const LIME_TINT = 'rgba(154, 204, 240, 0.08)';
const PINK = '#F14B50'; // Signal Red — highlight accent
const SOFT_LIME = '#6C75A5'; // Quantum Violet — secondary accent
const BUBBLEGUM = '#6C75A5'; // Quantum Violet
const INK = '#111116'; // Obsidian
const INK_BACKING = 'rgba(17, 17, 22, 0.75)';

function rectsOverlap(a: Rect2D, b: Rect2D): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private wrapper: HTMLElement | null = null;
  private mainContext: CanvasRenderingContext2D | null = null;
  private overlayContext: CanvasRenderingContext2D | null = null;
  private originalCanvas: HTMLCanvasElement | null = null;
  private source: ImageSource | null = null;
  private grid: GridSpec | null = null;
  private source32: Uint32Array | null = null;
  private output: ImageData | null = null;
  private output32: Uint32Array | null = null;
  private lastPermutation: Uint32Array | null = null;
  private renderedPermutation: Uint32Array | null = null;
  private renderedGhost = false;
  private resizeObserver: ResizeObserver | null = null;
  private cssWidth = 0;
  private cssHeight = 0;
  private dpr = 1;
  private overlayNeedsRedraw = true;
  private renderedLocale: string | null = null;
  private onResizeCallback: (() => void) | null = null;

  attach(
    mainCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    wrapper: HTMLElement,
    onResize?: () => void,
  ): void {
    this.destroy();
    this.mainCanvas = mainCanvas;
    this.overlayCanvas = overlayCanvas;
    this.wrapper = wrapper;
    this.onResizeCallback = onResize ?? null;
    this.mainContext = mainCanvas.getContext('2d', { alpha: true });
    this.overlayContext = overlayCanvas.getContext('2d', { alpha: true });
    this.originalCanvas = document.createElement('canvas');

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(wrapper);
    this.resize();
  }

  setImage(image: ImageSource, grid: GridSpec): void {
    this.source = image;
    this.grid = grid;
    this.source32 = new Uint32Array(
      image.data.buffer,
      image.data.byteOffset,
      image.data.byteLength >>> 2,
    );
    this.output = new ImageData(
      new Uint8ClampedArray(image.data.length),
      image.width,
      image.height,
    );
    this.output32 = new Uint32Array(this.output.data.buffer);
    this.renderedPermutation = null;
    this.renderedGhost = false;

    if (this.mainCanvas) {
      this.mainCanvas.width = image.width;
      this.mainCanvas.height = image.height;
    }

    if (this.originalCanvas) {
      this.originalCanvas.width = image.width;
      this.originalCanvas.height = image.height;
      const context = this.originalCanvas.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = false;
        context.putImageData(
          new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
          0,
          0,
        );
      }
    }

    this.resize();
  }

  resize(): void {
    if (!this.wrapper || !this.overlayCanvas || !this.overlayContext) return;
    const width = this.wrapper.clientWidth;
    const height = this.wrapper.clientHeight;
    if (width <= 0 || height <= 0) return;
    this.cssWidth = width;
    this.cssHeight = height;
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.overlayCanvas.width = Math.max(1, Math.round(width * this.dpr));
    this.overlayCanvas.height = Math.max(1, Math.round(height * this.dpr));
    this.overlayContext.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.overlayNeedsRedraw = true;
    this.onResizeCallback?.();
  }

  renderImage(
    permutation: Uint32Array,
    ghostOriginal: boolean,
    dirtyIndices?: readonly number[] | null,
  ): void {
    if (!this.grid || !this.source32 || !this.output32 || !this.output || !this.mainContext) {
      return;
    }
    this.lastPermutation = permutation;

    const { width, height, blockSize, columns, elementCount } = this.grid;

    const canIncremental =
      this.renderedPermutation !== null &&
      this.renderedPermutation.length === elementCount &&
      this.renderedGhost === ghostOriginal &&
      dirtyIndices !== null &&
      dirtyIndices !== undefined &&
      dirtyIndices.length <= Math.max(256, elementCount >>> 3);

    if (canIncremental && dirtyIndices) {
      if (dirtyIndices.length === 0) return;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let anyChanged = false;

      if (blockSize === 1) {
        for (let i = 0; i < dirtyIndices.length; i += 1) {
          const pos = dirtyIndices[i];
          if (pos < 0 || pos >= elementCount) continue;
          const src = permutation[pos];
          if (this.renderedPermutation![pos] === src) continue;
          this.renderedPermutation![pos] = src;
          this.output32[pos] = this.source32[src];
          const px = pos % width;
          const py = (pos / width) | 0;
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px + 1 > maxX) maxX = px + 1;
          if (py + 1 > maxY) maxY = py + 1;
          anyChanged = true;
        }
      } else {
        for (let i = 0; i < dirtyIndices.length; i += 1) {
          const pos = dirtyIndices[i];
          if (pos < 0 || pos >= elementCount) continue;
          const src = permutation[pos];
          if (this.renderedPermutation![pos] === src) continue;
          this.renderedPermutation![pos] = src;
          const destColumn = pos % columns;
          const destRow = (pos / columns) | 0;
          const dx = destColumn * blockSize;
          const dy = destRow * blockSize;
          const dw = Math.min(blockSize, width - dx);
          const dh = Math.min(blockSize, height - dy);
          this.copyTile(src, dx, dy, dw, dh, width, height, blockSize, columns);
          if (dx < minX) minX = dx;
          if (dy < minY) minY = dy;
          if (dx + dw > maxX) maxX = dx + dw;
          if (dy + dh > maxY) maxY = dy + dh;
          anyChanged = true;
        }
      }

      if (!anyChanged) return;

      const rw = maxX - minX;
      const rh = maxY - minY;
      if (rw * rh < width * height * 0.45) {
        this.mainContext.putImageData(this.output, 0, 0, minX, minY, rw, rh);
        if (ghostOriginal && this.originalCanvas) {
          this.mainContext.save();
          this.mainContext.globalAlpha = 0.18;
          this.mainContext.imageSmoothingEnabled = false;
          this.mainContext.drawImage(this.originalCanvas, minX, minY, rw, rh, minX, minY, rw, rh);
          this.mainContext.restore();
        }
        return;
      }

      this.mainContext.putImageData(this.output, 0, 0);
      this.drawGhostFull(ghostOriginal);
      return;
    }

    // Full pass (only copies tiles that actually differ if output32 is already warm).
    if (!this.renderedPermutation || this.renderedPermutation.length !== elementCount) {
      if (blockSize === 1) {
        for (let i = 0; i < elementCount; i += 1) {
          this.output32[i] = this.source32[permutation[i]];
        }
      } else {
        for (let position = 0; position < elementCount; position += 1) {
          const destColumn = position % columns;
          const destRow = (position / columns) | 0;
          const dx = destColumn * blockSize;
          const dy = destRow * blockSize;
          const dw = Math.min(blockSize, width - dx);
          const dh = Math.min(blockSize, height - dy);
          this.copyTile(permutation[position], dx, dy, dw, dh, width, height, blockSize, columns);
        }
      }
      this.renderedPermutation = permutation.slice();
    } else {
      if (blockSize === 1) {
        for (let i = 0; i < elementCount; i += 1) {
          const src = permutation[i];
          if (this.renderedPermutation[i] !== src) {
            this.renderedPermutation[i] = src;
            this.output32[i] = this.source32[src];
          }
        }
      } else {
        for (let position = 0; position < elementCount; position += 1) {
          const src = permutation[position];
          if (this.renderedPermutation[position] !== src) {
            this.renderedPermutation[position] = src;
            const destColumn = position % columns;
            const destRow = (position / columns) | 0;
            const dx = destColumn * blockSize;
            const dy = destRow * blockSize;
            const dw = Math.min(blockSize, width - dx);
            const dh = Math.min(blockSize, height - dy);
            this.copyTile(src, dx, dy, dw, dh, width, height, blockSize, columns);
          }
        }
      }
    }

    this.renderedGhost = ghostOriginal;
    this.mainContext.putImageData(this.output, 0, 0);
    this.drawGhostFull(ghostOriginal);
  }

  private drawGhostFull(ghostOriginal: boolean): void {
    if (!ghostOriginal || !this.originalCanvas || !this.mainContext) return;
    this.mainContext.save();
    this.mainContext.globalAlpha = 0.18;
    this.mainContext.imageSmoothingEnabled = false;
    this.mainContext.drawImage(this.originalCanvas, 0, 0);
    this.mainContext.restore();
  }

  private copyTile(
    sourceIndex: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    width: number,
    height: number,
    blockSize: number,
    columns: number,
  ): void {
    const sourceColumn = sourceIndex % columns;
    const sourceRow = (sourceIndex / columns) | 0;
    const sx = sourceColumn * blockSize;
    const sy = sourceRow * blockSize;
    const sw = Math.min(blockSize, width - sx);
    const sh = Math.min(blockSize, height - sy);

    // Edge tiles keep their natural size. The unused part of their B x B
    // cell is transparent, so a small edge tile never stretches.
    if (sw < blockSize || sh < blockSize) {
      for (let row = 0; row < dh; row += 1) {
        const dest = (dy + row) * width + dx;
        this.output32!.fill(0, dest, dest + dw);
      }
    }

    const copyWidth = Math.min(sw, dw);
    const copyHeight = Math.min(sh, dh);
    for (let row = 0; row < copyHeight; row += 1) {
      const sourceOffset = (sy + row) * width + sx;
      const destOffset = (dy + row) * width + dx;
      for (let column = 0; column < copyWidth; column += 1) {
        this.output32![destOffset + column] = this.source32![sourceOffset + column];
      }
    }
  }

  renderOverlay(overlay: OverlaySnapshot, now: number, force = false): void {
    if (!this.overlayContext || !this.grid) return;
    if (!force && !this.overlayNeedsRedraw && this.renderedLocale === i18n.locale) return;
    this.overlayNeedsRedraw = false;
    this.renderedLocale = i18n.locale;

    const context = this.overlayContext;
    context.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // 1. Persistent sorted regions and singletons.
    this.drawSortedState(context, overlay.sortedRanges);

    // 2. Scoped active range.
    if (overlay.activeRange) {
      this.drawRange(
        context,
        overlay.activeRange[0],
        overlay.activeRange[1],
        SOFT_LIME,
        [6, 5],
        i18n.t('event.range'),
        false,
      );
    }

    // 3. Active element marker (e.g. Selection Sort's current min).
    if (overlay.activeIndex !== null && overlay.activeIndex !== overlay.pivotIndex) {
      this.drawElement(context, overlay.activeIndex, BUBBLEGUM, [3, 4], 0, 0);
    }

    // 4. Active partition pivot.
    if (overlay.pivotIndex !== null) {
      this.drawElementWithBadge(context, overlay.pivotIndex, PINK, [4, 4], 0, 0, 'P');
    }

    // 5. Transient operation highlights.
    for (const highlight of overlay.transients) {
      if (highlight.ttl !== Number.POSITIVE_INFINITY && now - highlight.createdAt > highlight.ttl) {
        continue;
      }
      this.drawHighlight(context, highlight);
    }
  }

  clear(): void {
    if (this.mainContext && this.mainCanvas) {
      this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    }
    if (this.overlayContext) {
      this.overlayContext.clearRect(0, 0, this.cssWidth, this.cssHeight);
    }
    this.lastPermutation = null;
    this.renderedPermutation = null;
    this.renderedGhost = false;
    this.overlayNeedsRedraw = true;
    this.renderedLocale = null;
  }

  /** Dev-only diagnostics used by the headless verification scripts. */
  debugState(): {
    permutation: number[] | null;
    source: number[] | null;
    output: number[] | null;
    compare: {
      total: number;
      differing: number;
      firstDiff: {
        index: number;
        source: number;
        output: number;
        sourceIndexes: number[];
      } | null;
    } | null;
    sameBuffer: boolean;
  } {
    let compare: {
      total: number;
      differing: number;
      firstDiff: {
        index: number;
        source: number;
        output: number;
        sourceIndexes: number[];
      } | null;
    } | null = null;
    if (this.source32 && this.output32) {
      let differing = 0;
      let firstDiff: {
        index: number;
        source: number;
        output: number;
        sourceIndexes: number[];
      } | null = null;
      for (let i = 0; i < this.source32.length; i += 1) {
        if (this.source32[i] !== this.output32[i]) {
          differing += 1;
          if (!firstDiff) {
            const sourceIndexes: number[] = [];
            for (let j = 0; j < this.source32.length && sourceIndexes.length < 8; j += 1) {
              if (this.source32[j] === this.output32[i]) sourceIndexes.push(j);
            }
            firstDiff = {
              index: i,
              source: this.source32[i],
              output: this.output32[i],
              sourceIndexes,
            };
          }
        }
      }
      compare = { total: this.source32.length, differing, firstDiff };
    }
    return {
      permutation: this.lastPermutation ? Array.from(this.lastPermutation.slice(0, 20)) : null,
      source: this.source32 ? Array.from(this.source32.slice(0, 20)) : null,
      output: this.output32 ? Array.from(this.output32.slice(0, 20)) : null,
      compare,
      sameBuffer: Boolean(
        this.source32 && this.output32 && this.source32.buffer === this.output32.buffer,
      ),
    };
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.onResizeCallback = null;
    this.mainCanvas = null;
    this.overlayCanvas = null;
    this.wrapper = null;
    this.mainContext = null;
    this.overlayContext = null;
    this.originalCanvas = null;
    this.source = null;
    this.grid = null;
    this.source32 = null;
    this.output = null;
    this.output32 = null;
    this.lastPermutation = null;
    this.renderedPermutation = null;
  }

  private displayRect(index: number): Rect2D | null {
    if (
      !this.grid ||
      index < 0 ||
      index >= this.grid.elementCount ||
      this.cssWidth <= 0 ||
      this.cssHeight <= 0
    ) {
      return null;
    }
    const rect = elementRect(index, this.grid);
    const scaleX = this.cssWidth / this.grid.width;
    const scaleY = this.cssHeight / this.grid.height;
    let x = rect.x * scaleX;
    let y = rect.y * scaleY;
    let w = rect.w * scaleX;
    let h = rect.h * scaleY;
    const minimum = this.grid.blockSize === 1 ? 7 : 4;
    if (w < minimum) {
      x -= (minimum - w) / 2;
      w = minimum;
    }
    if (h < minimum) {
      y -= (minimum - h) / 2;
      h = minimum;
    }
    return { x, y, w, h };
  }

  private drawSortedState(
    context: CanvasRenderingContext2D,
    sortedRanges: ReadonlyArray<readonly [number, number]>,
  ): void {
    if (!this.grid || sortedRanges.length === 0) return;

    const total = this.grid.elementCount;
    if (sortedRanges.length === 1 && sortedRanges[0][0] === 0 && sortedRanges[0][1] >= total) {
      context.save();
      context.strokeStyle = LIME;
      context.lineWidth = 2;
      context.setLineDash([]);
      context.strokeRect(1, 1, Math.max(0, this.cssWidth - 2), Math.max(0, this.cssHeight - 2));
      context.restore();
      return;
    }

    const singletons: number[] = [];
    for (let i = 0; i < sortedRanges.length; i += 1) {
      const [start, end] = sortedRanges[i];
      if (end - start === 1) {
        singletons.push(start);
      } else if (end - start >= 2) {
        this.drawRange(context, start, end, LIME_SOFT_STROKE, [], '', true);
      }
    }

    if (singletons.length > 0) {
      context.save();
      context.strokeStyle = LIME;
      context.lineWidth = 2;
      context.setLineDash([]);
      context.beginPath();
      for (let i = 0; i < singletons.length; i += 1) {
        const rect = this.displayRect(singletons[i]);
        if (!rect) continue;
        const tick = Math.min(7, Math.max(4, Math.min(rect.w, rect.h) * 0.4));
        const rx = Math.min(this.cssWidth - 1, rect.x + rect.w);
        const ry = Math.min(this.cssHeight - 1, rect.y + rect.h);
        context.moveTo(rx - tick, ry - 1);
        context.lineTo(rx - 1, ry - 1);
        context.lineTo(rx - 1, ry - tick);
      }
      context.stroke();
      context.restore();
    }
  }

  private drawHighlight(context: CanvasRenderingContext2D, highlight: Highlight): void {
    if (highlight.kind === 'compare' && highlight.indices.length >= 2) {
      const [a, b] = highlight.values ?? [];
      this.drawCompare(
        context,
        highlight.indices[0],
        highlight.indices[1],
        this.targetBadge(highlight.aux ? 'A*' : 'A', a),
        this.targetBadge(highlight.aux ? 'B*' : 'B', b),
      );
      return;
    }

    if (highlight.kind === 'compare-value' && highlight.indices.length >= 1) {
      const [value, against] = highlight.values ?? [];
      const label =
        value !== undefined && against !== undefined
          ? `#${value} vs #${against}`
          : i18n.shortLabel(highlight.label ?? 'KEY');
      this.drawCompareValue(context, highlight.indices[0], label);
      return;
    }

    if (highlight.kind === 'swap' && highlight.indices.length >= 2) {
      this.drawSwap(context, highlight.indices[0], highlight.indices[1], highlight.values);
      return;
    }

    if (highlight.kind === 'write' && highlight.indices.length >= 1) {
      const color = highlight.aux ? BUBBLEGUM : SOFT_LIME;
      const dash = highlight.aux ? [3, 3] : [2, 3];
      const base = i18n.shortLabel(highlight.label ?? (highlight.aux ? 'AUX' : 'W'));
      const label = this.targetBadge(base, highlight.values?.[0]);
      this.drawElementWithBadge(context, highlight.indices[0], color, dash, 0, 0, label);
      return;
    }

    if (highlight.kind === 'read' && highlight.indices.length >= 1) {
      this.drawRead(context, highlight.indices[0], highlight.aux);
    }
  }

  /** "A" becomes "A #12" so the canvas names the target being compared. */
  private targetBadge(base: string, value: number | undefined): string {
    return value === undefined ? base : `${base} #${value}`;
  }

  private drawCompare(
    context: CanvasRenderingContext2D,
    indexA: number,
    indexB: number,
    labelA: string,
    labelB: string,
  ): void {
    const rectA = this.displayRect(indexA);
    const rectB = this.displayRect(indexB);
    if (!rectA || !rectB) return;

    this.strokeBox(context, rectA.x - 2, rectA.y - 2, rectA.w, rectA.h, LIME, []);
    this.strokeBox(context, rectB.x + 2, rectB.y + 2, rectB.w, rectB.h, PINK, [5, 4]);

    const boxA = this.measureBadge(context, labelA, rectA.x - 2, rectA.y - 2, rectA.h, false);
    let boxB = this.measureBadge(context, labelB, rectB.x + 2, rectB.y + 2, rectB.h, false);
    if (rectsOverlap(boxA, boxB)) {
      boxB = this.measureBadge(context, labelB, rectB.x + 2, rectB.y + 2, rectB.h, true);
    }
    // Adjacent tiles can still collide once both labels carry a target index.
    // Push B clear of A rather than letting one badge cover the other.
    if (rectsOverlap(boxA, boxB)) {
      const below = Math.max(boxA.y + boxA.h + 2, rectB.y + rectB.h + 2);
      boxB = {
        ...boxB,
        y: Math.min(below, Math.max(0, this.cssHeight - boxB.h)),
      };
    }

    this.paintBadge(context, labelA, boxA, LIME);
    this.paintBadge(context, labelB, boxB, PINK);
  }

  private drawCompareValue(context: CanvasRenderingContext2D, index: number, label: string): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    this.strokeBox(context, rect.x - 2, rect.y - 2, rect.w, rect.h, LIME, []);
    this.strokeBox(context, rect.x + 2, rect.y + 2, rect.w, rect.h, PINK, [5, 4]);
    const box = this.measureBadge(context, label, rect.x - 2, rect.y - 2, rect.h + 4, false);
    this.paintBadge(context, label, box, PINK);
  }

  private drawElement(
    context: CanvasRenderingContext2D,
    index: number,
    color: string,
    dash: number[],
    offsetX: number,
    offsetY: number,
  ): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    this.strokeBox(context, rect.x + offsetX, rect.y + offsetY, rect.w, rect.h, color, dash);
  }

  private drawElementWithBadge(
    context: CanvasRenderingContext2D,
    index: number,
    color: string,
    dash: number[],
    offsetX: number,
    offsetY: number,
    label: string,
  ): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    this.strokeBox(context, rect.x + offsetX, rect.y + offsetY, rect.w, rect.h, color, dash);
    if (label) {
      const box = this.measureBadge(
        context,
        label,
        rect.x + offsetX,
        rect.y + offsetY,
        rect.h,
        false,
      );
      this.paintBadge(context, label, box, color);
    }
  }

  private strokeBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    dash: number[],
  ): void {
    context.save();
    context.lineWidth = 3.5;
    context.strokeStyle = INK_BACKING;
    context.setLineDash([]);
    context.strokeRect(x, y, w, h);

    context.strokeStyle = color;
    context.lineWidth = 2;
    context.setLineDash(dash);
    context.strokeRect(x, y, w, h);
    context.restore();
  }

  private drawSwap(
    context: CanvasRenderingContext2D,
    a: number,
    b: number,
    values?: number[],
  ): void {
    const first = this.displayRect(a);
    const second = this.displayRect(b);
    if (!first || !second) return;

    this.strokeBox(context, first.x, first.y, first.w, first.h, LIME, []);
    this.strokeBox(context, second.x, second.y, second.w, second.h, PINK, []);

    const ax = first.x + first.w / 2;
    const ay = first.y + first.h / 2;
    const bx = second.x + second.w / 2;
    const by = second.y + second.h / 2;
    const dist = Math.hypot(bx - ax, by - ay);

    context.save();
    context.strokeStyle = INK_BACKING;
    context.lineWidth = 3;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.stroke();

    context.strokeStyle = PINK;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.stroke();

    if (dist >= 10) {
      const headSize = Math.min(7, dist * 0.3);
      this.drawArrowHead(context, ax, ay, bx, by, PINK, headSize);
      this.drawArrowHead(context, bx, by, ax, ay, LIME, headSize);
    }
    context.restore();

    const midX = (ax + bx) / 2;
    const topY = Math.min(first.y, second.y);
    const bottomY = Math.max(first.y + first.h, second.y + second.h);
    const swapLabel = i18n.t('event.swap');
    const [valueA, valueB] = values ?? [];
    const label =
      valueA !== undefined && valueB !== undefined
        ? `${swapLabel} #${valueA} ↔ #${valueB}`
        : swapLabel;
    const box = this.measureCenteredBadge(context, label, midX, topY, bottomY);
    this.paintBadge(context, label, box, PINK);
  }

  private drawArrowHead(
    context: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    size: number,
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(
      toX - size * Math.cos(angle - Math.PI / 6),
      toY - size * Math.sin(angle - Math.PI / 6),
    );
    context.lineTo(
      toX - size * Math.cos(angle + Math.PI / 6),
      toY - size * Math.sin(angle + Math.PI / 6),
    );
    context.closePath();
    context.fill();
    context.restore();
  }

  private drawRead(context: CanvasRenderingContext2D, index: number, aux = false): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    context.save();
    context.fillStyle = INK;
    context.beginPath();
    context.arc(cx, cy, 4.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = aux ? BUBBLEGUM : SOFT_LIME;
    context.beginPath();
    context.arc(cx, cy, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private drawRange(
    context: CanvasRenderingContext2D,
    start: number,
    end: number,
    color: string,
    dash: number[],
    label: string,
    fillTint: boolean,
  ): void {
    if (!this.grid) return;
    const shape = computeRangeShape(start, end, this.grid, this.cssWidth, this.cssHeight);
    if (!shape) return;

    this.traceShape(context, shape, color, dash, fillTint);

    if (label) {
      const box = this.measureBadge(context, label, shape.anchor.x, shape.anchor.y, 12, false);
      this.paintBadge(context, label, box, color);
    }
  }

  private traceShape(
    context: CanvasRenderingContext2D,
    shape: RangeShape,
    color: string,
    dash: number[],
    fillTint: boolean,
  ): void {
    context.save();
    context.lineJoin = 'miter';

    const tracePath = (): void => {
      context.beginPath();
      if (shape.kind === 'rects') {
        for (let i = 0; i < shape.rects.length; i += 1) {
          const r = shape.rects[i];
          const rx = Math.max(0.75, Math.min(r.x, this.cssWidth - 1.5));
          const ry = Math.max(0.75, Math.min(r.y, this.cssHeight - 1.5));
          const rw = Math.max(1, Math.min(r.w, this.cssWidth - rx - 0.75));
          const rh = Math.max(1, Math.min(r.h, this.cssHeight - ry - 0.75));
          context.rect(rx, ry, rw, rh);
        }
      } else {
        const pts = shape.points;
        for (let i = 0; i < pts.length; i += 1) {
          const px = Math.max(0.75, Math.min(pts[i].x, this.cssWidth - 0.75));
          const py = Math.max(0.75, Math.min(pts[i].y, this.cssHeight - 0.75));
          if (i === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
      }
    };

    tracePath();
    if (fillTint) {
      context.fillStyle = LIME_TINT;
      context.fill();
    }

    context.strokeStyle = INK_BACKING;
    context.lineWidth = 2.75;
    context.setLineDash([]);
    context.stroke();

    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.setLineDash(dash);
    context.stroke();
    context.restore();
  }

  private measureBadge(
    context: CanvasRenderingContext2D,
    text: string,
    anchorX: number,
    anchorY: number,
    anchorHeight: number,
    preferBottom: boolean,
  ): Rect2D {
    context.font = '700 10px "JetBrains Mono Variable", monospace';
    const width = context.measureText(text).width + 8;
    const height = 15;
    const x = Math.max(0, Math.min(anchorX, this.cssWidth - width));
    let y: number;
    if (!preferBottom && anchorY - height - 2 >= 0) {
      y = anchorY - height - 2;
    } else if (anchorY + anchorHeight + 2 + height <= this.cssHeight) {
      y = anchorY + anchorHeight + 2;
    } else {
      y = Math.max(0, Math.min(anchorY - height - 2, this.cssHeight - height));
    }
    return { x, y, w: width, h: height };
  }

  private measureCenteredBadge(
    context: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    topY: number,
    bottomY: number,
  ): Rect2D {
    context.font = '700 10px "JetBrains Mono Variable", monospace';
    const width = context.measureText(text).width + 8;
    const height = 15;
    const x = Math.max(0, Math.min(centerX - width / 2, this.cssWidth - width));
    let y: number;
    if (topY - height - 3 >= 0) {
      y = topY - height - 3;
    } else if (bottomY + 3 + height <= this.cssHeight) {
      y = bottomY + 3;
    } else {
      y = Math.max(0, Math.min((topY + bottomY) / 2 - height / 2, this.cssHeight - height));
    }
    return { x, y, w: width, h: height };
  }

  private paintBadge(
    context: CanvasRenderingContext2D,
    text: string,
    box: Rect2D,
    color: string,
  ): void {
    context.save();
    context.font = '700 10px "JetBrains Mono Variable", monospace';
    context.fillStyle = INK;
    context.fillRect(box.x, box.y, box.w, box.h);
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.fillText(text, box.x + 4, box.y + box.h / 2 + 0.5);
    context.restore();
  }
}
