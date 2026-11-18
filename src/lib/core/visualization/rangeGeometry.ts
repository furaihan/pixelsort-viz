import type { GridSpec } from '../image/imageTypes';

export interface Point2D {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RangeShape =
  | { kind: 'rects'; rects: Rect2D[]; anchor: Point2D }
  | { kind: 'polygon'; points: Point2D[]; anchor: Point2D };

/**
 * Compute exact 2D canvas geometry in CSS pixels for a half-open linear
 * subarray [rawStart, rawEnd) laid out row-major across a GridSpec.
 */
export function computeRangeShape(
  rawStart: number,
  rawEnd: number,
  grid: GridSpec,
  cssWidth: number,
  cssHeight: number,
): RangeShape | null {
  if (
    grid.elementCount <= 0 ||
    cssWidth <= 0 ||
    cssHeight <= 0 ||
    rawEnd <= rawStart ||
    rawStart >= grid.elementCount
  ) {
    return null;
  }

  const start = Math.max(0, Math.min(rawStart, grid.elementCount - 1));
  const endInclusive = Math.max(start, Math.min(rawEnd - 1, grid.elementCount - 1));

  const { columns, blockSize, width, height } = grid;
  const scaleX = cssWidth / width;
  const scaleY = cssHeight / height;

  const colLeft = (col: number): number => Math.min(width, col * blockSize) * scaleX;
  const colRight = (col: number): number => Math.min(width, (col + 1) * blockSize) * scaleX;
  const rowTop = (row: number): number => Math.min(height, row * blockSize) * scaleY;
  const rowBottom = (row: number): number => Math.min(height, (row + 1) * blockSize) * scaleY;

  const r0 = Math.floor(start / columns);
  const c0 = start % columns;
  const r1 = Math.floor(endInclusive / columns);
  const c1 = endInclusive % columns;

  if (r0 === r1) {
    const x = colLeft(c0);
    const y = rowTop(r0);
    const w = Math.max(2, colRight(c1) - x);
    const h = Math.max(2, rowBottom(r0) - y);
    return {
      kind: 'rects',
      rects: [{ x, y, w, h }],
      anchor: { x, y },
    };
  }

  if (r1 === r0 + 1 && c0 > c1) {
    const xA = colLeft(c0);
    const yA = rowTop(r0);
    const rectA: Rect2D = {
      x: xA,
      y: yA,
      w: Math.max(2, cssWidth - xA),
      h: Math.max(2, rowBottom(r0) - yA),
    };
    const yB = rowTop(r1);
    const rectB: Rect2D = {
      x: 0,
      y: yB,
      w: Math.max(2, colRight(c1)),
      h: Math.max(2, rowBottom(r1) - yB),
    };
    return {
      kind: 'rects',
      rects: [rectA, rectB],
      anchor: { x: xA, y: yA },
    };
  }

  if (c0 === 0 && c1 === columns - 1) {
    const y = rowTop(r0);
    const h = Math.max(2, rowBottom(r1) - y);
    return {
      kind: 'rects',
      rects: [{ x: 0, y, w: cssWidth, h }],
      anchor: { x: 0, y },
    };
  }

  const x0 = colLeft(c0);
  const y0 = rowTop(r0);
  const y0b = rowBottom(r0);
  const x1 = colRight(c1);
  const y1 = rowTop(r1);
  const y1b = rowBottom(r1);

  const points: Point2D[] = [
    { x: x0, y: y0 },
    { x: cssWidth, y: y0 },
  ];

  if (c1 < columns - 1) {
    points.push({ x: cssWidth, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y1b });
  } else {
    points.push({ x: cssWidth, y: y1b });
  }

  points.push({ x: 0, y: y1b });

  if (c0 > 0) {
    points.push({ x: 0, y: y0b }, { x: x0, y: y0b });
  }

  return {
    kind: 'polygon',
    points,
    anchor: { x: x0, y: y0 },
  };
}
