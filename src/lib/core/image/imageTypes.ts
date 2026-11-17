export const BLOCK_SIZES = [1, 8, 16, 32, 64, 128] as const;

export type BlockSize = (typeof BLOCK_SIZES)[number];

export interface ImageSource {
  width: number;
  height: number;
  /** Decoded RGBA pixels. This is the source of truth for every render. */
  data: Uint8ClampedArray;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface GridSpec {
  width: number;
  height: number;
  blockSize: BlockSize;
  columns: number;
  rows: number;
  elementCount: number;
}

export interface ElementRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function isBlockSize(value: number): value is BlockSize {
  return (BLOCK_SIZES as readonly number[]).includes(value);
}
