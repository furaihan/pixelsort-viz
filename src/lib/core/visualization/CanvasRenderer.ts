import { elementRect } from '../image/grid';
import type { GridSpec, ImageSource } from '../image/imageTypes';
import type { MarkRole } from '../sorting/types';

export interface Highlight {
  kind: 'compare' | 'swap' | 'write' | 'read' | 'pivot' | 'sorted' | 'active';
  indices: number[];
  role?: MarkRole;
  range?: [number, number];
  createdAt: number;
  ttl: number;
  label?: string;
}

const LIME = '#C6FF00';
const PINK = '#FF1493';
const SOFT_LIME = '#E6FF80';
const BUBBLEGUM = '#FF75BD';
const INK = '#111111';

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
  private resizeObserver: ResizeObserver | null = null;
  private cssWidth = 0;
  private cssHeight = 0;
  private dpr = 1;

  attach(mainCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement, wrapper: HTMLElement): void {
    this.destroy();
    this.mainCanvas = mainCanvas;
    this.overlayCanvas = overlayCanvas;
    this.wrapper = wrapper;
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
    this.output = new ImageData(new Uint8ClampedArray(image.data.length), image.width, image.height);
    this.output32 = new Uint32Array(this.output.data.buffer);

    if (this.mainCanvas) {
      this.mainCanvas.width = image.width;
      this.mainCanvas.height = image.height;
    }

    if (this.originalCanvas) {
      this.originalCanvas.width = image.width;
      this.originalCanvas.height = image.height;
      const context = this.originalCanvas.getContext('2d');
      if (context) {
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
  }

  renderImage(permutation: Uint32Array, ghostOriginal: boolean): void {
    if (!this.grid || !this.source32 || !this.output32 || !this.output || !this.mainContext) {
      return;
    }
    this.lastPermutation = permutation;

    const { width, height, blockSize, columns, elementCount } = this.grid;

    if (blockSize === 1) {
      for (let i = 0; i < elementCount; i += 1) {
        this.output32[i] = this.source32[permutation[i]];
      }
    } else {
      for (let position = 0; position < elementCount; position += 1) {
        const sourceIndex = permutation[position];
        const sourceColumn = sourceIndex % columns;
        const sourceRow = Math.floor(sourceIndex / columns);
        const sx = sourceColumn * blockSize;
        const sy = sourceRow * blockSize;
        const sw = Math.min(blockSize, width - sx);
        const sh = Math.min(blockSize, height - sy);

        const destColumn = position % columns;
        const destRow = Math.floor(position / columns);
        const dx = destColumn * blockSize;
        const dy = destRow * blockSize;
        const dw = Math.min(blockSize, width - dx);
        const dh = Math.min(blockSize, height - dy);

        // Edge tiles keep their natural size. The unused part of their B x B
        // cell is transparent, so a small edge tile never stretches.
        if (sw < blockSize || sh < blockSize) {
          for (let row = 0; row < dh; row += 1) {
            const dest = (dy + row) * width + dx;
            this.output32.fill(0, dest, dest + dw);
          }
        }

        const copyWidth = Math.min(sw, dw);
        const copyHeight = Math.min(sh, dh);
        for (let row = 0; row < copyHeight; row += 1) {
          const sourceOffset = (sy + row) * width + sx;
          const destOffset = (dy + row) * width + dx;
          for (let column = 0; column < copyWidth; column += 1) {
            this.output32[destOffset + column] = this.source32[sourceOffset + column];
          }
        }
      }
    }

    this.mainContext.putImageData(this.output, 0, 0);

    if (ghostOriginal && this.originalCanvas) {
      this.mainContext.save();
      this.mainContext.globalAlpha = 0.18;
      this.mainContext.drawImage(this.originalCanvas, 0, 0);
      this.mainContext.restore();
    }
  }

  renderOverlay(highlights: Highlight[], now: number): void {
    if (!this.overlayContext || !this.grid) return;
    const context = this.overlayContext;
    context.clearRect(0, 0, this.cssWidth, this.cssHeight);

    for (const highlight of highlights) {
      if (now - highlight.createdAt > highlight.ttl) continue;
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
  }

  private displayRect(index: number): { x: number; y: number; w: number; h: number } | null {
    if (!this.grid) return null;
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

  private drawHighlight(context: CanvasRenderingContext2D, highlight: Highlight): void {
    if (highlight.range) {
      this.drawRange(context, highlight.range, highlight.kind === 'sorted' ? LIME : SOFT_LIME);
      return;
    }

    if (highlight.kind === 'compare' && highlight.indices.length >= 2) {
      this.drawElement(context, highlight.indices[0], LIME, [], -2, -2, 'A');
      this.drawElement(context, highlight.indices[1], PINK, [5, 4], 2, 2, 'B');
      return;
    }

    if (highlight.kind === 'swap' && highlight.indices.length >= 2) {
      this.drawSwap(context, highlight.indices[0], highlight.indices[1]);
      return;
    }

    if (highlight.kind === 'pivot' && highlight.indices.length >= 1) {
      this.drawElement(context, highlight.indices[0], PINK, [4, 4], 0, 0, 'P');
      return;
    }

    if (highlight.kind === 'write' && highlight.indices.length >= 1) {
      this.drawElement(context, highlight.indices[0], SOFT_LIME, [2, 3], 0, 0, 'W');
      return;
    }

    if (highlight.kind === 'read' && highlight.indices.length >= 1) {
      this.drawRead(context, highlight.indices[0]);
      return;
    }

    if (highlight.kind === 'sorted' && highlight.indices.length >= 1) {
      this.drawSorted(context, highlight.indices[0]);
      return;
    }

    if (highlight.kind === 'active' && highlight.indices.length >= 1) {
      this.drawElement(context, highlight.indices[0], BUBBLEGUM, [3, 5], 0, 0, '');
    }
  }

  private drawElement(
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
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.setLineDash(dash);
    context.strokeRect(rect.x + offsetX, rect.y + offsetY, rect.w, rect.h);
    context.restore();
    if (label) this.drawLabel(context, label, rect.x + offsetX, rect.y + offsetY, color);
  }

  private drawSwap(context: CanvasRenderingContext2D, a: number, b: number): void {
    const first = this.displayRect(a);
    const second = this.displayRect(b);
    if (!first || !second) return;

    context.save();
    context.strokeStyle = LIME;
    context.lineWidth = 2;
    context.strokeRect(first.x, first.y, first.w, first.h);
    context.strokeStyle = PINK;
    context.strokeRect(second.x, second.y, second.w, second.h);

    const ax = first.x + first.w / 2;
    const ay = first.y + first.h / 2;
    const bx = second.x + second.w / 2;
    const by = second.y + second.h / 2;
    context.strokeStyle = PINK;
    context.lineWidth = 1.5;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.stroke();
    this.drawArrowHead(context, ax, ay, bx, by, PINK);
    this.drawArrowHead(context, bx, by, ax, ay, LIME);
    context.restore();

    this.drawLabel(context, 'SWAP', (ax + bx) / 2, (ay + by) / 2 - 14, PINK);
  }

  private drawArrowHead(
    context: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 7;
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

  private drawRead(context: CanvasRenderingContext2D, index: number): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    context.save();
    context.fillStyle = SOFT_LIME;
    context.beginPath();
    context.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private drawSorted(context: CanvasRenderingContext2D, index: number): void {
    const rect = this.displayRect(index);
    if (!rect) return;
    context.save();
    context.strokeStyle = LIME;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(rect.x + rect.w - 8, rect.y + rect.h - 2);
    context.lineTo(rect.x + rect.w - 2, rect.y + rect.h - 8);
    context.stroke();
    context.restore();
  }

  private drawRange(
    context: CanvasRenderingContext2D,
    range: [number, number],
    color: string,
  ): void {
    if (!this.grid) return;
    const start = Math.max(0, Math.min(range[0], this.grid.elementCount - 1));
    const end = Math.max(0, Math.min(range[1] - 1, this.grid.elementCount - 1));
    const first = this.displayRect(start);
    const last = this.displayRect(end);
    if (!first || !last) return;

    const x = Math.min(first.x, last.x);
    const y = Math.min(first.y, last.y);
    const right = Math.max(first.x + first.w, last.x + last.w);
    const bottom = Math.max(first.y + first.h, last.y + last.h);

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.setLineDash([6, 5]);
    context.strokeRect(x, y, right - x, bottom - y);
    context.restore();
    this.drawLabel(context, 'RANGE', x, y, color);
  }

  private drawLabel(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
  ): void {
    if (!text) return;
    context.save();
    context.font = '700 10px "JetBrains Mono Variable", monospace';
    const width = context.measureText(text).width + 8;
    const height = 15;
    const labelX = Math.max(0, Math.min(x, this.cssWidth - width));
    const labelY = Math.max(0, y - height - 2);
    context.fillStyle = INK;
    context.fillRect(labelX, labelY, width, height);
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.strokeRect(labelX + 0.5, labelY + 0.5, width - 1, height - 1);
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.fillText(text, labelX + 4, labelY + height / 2 + 0.5);
    context.restore();
  }
}
