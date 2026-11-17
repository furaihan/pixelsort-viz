import type { BlockSize, ElementRect, GridSpec } from './imageTypes';

/**
 * Ceiling division is intentional: the rightmost and bottommost tiles may be
 * smaller than the block size, but they are still valid sortable elements.
 */
export function computeGrid(width: number, height: number, blockSize: BlockSize): GridSpec {
  const columns = Math.ceil(width / blockSize);
  const rows = Math.ceil(height / blockSize);
  return {
    width,
    height,
    blockSize,
    columns,
    rows,
    elementCount: columns * rows,
  };
}

export function elementRect(index: number, grid: GridSpec): ElementRect {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  const x = column * grid.blockSize;
  const y = row * grid.blockSize;
  return {
    x,
    y,
    w: Math.min(grid.blockSize, grid.width - x),
    h: Math.min(grid.blockSize, grid.height - y),
  };
}

export function elementColumn(index: number, grid: GridSpec): number {
  return index % grid.columns;
}

export function elementRow(index: number, grid: GridSpec): number {
  return Math.floor(index / grid.columns);
}
