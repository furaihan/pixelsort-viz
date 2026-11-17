import { describe, expect, it } from 'vitest';
import { computeGrid, elementRect } from '../../src/lib/core/image/grid';

describe('computeGrid', () => {
  it('matches the PRD examples for a 1920x1080 image', () => {
    expect(computeGrid(1920, 1080, 1)).toMatchObject({
      columns: 1920,
      rows: 1080,
      elementCount: 2_073_600,
    });
    expect(computeGrid(1920, 1080, 8)).toMatchObject({
      columns: 240,
      rows: 135,
      elementCount: 32_400,
    });
    expect(computeGrid(1920, 1080, 16)).toMatchObject({
      columns: 120,
      rows: 68,
      elementCount: 8_160,
    });
    expect(computeGrid(1920, 1080, 32)).toMatchObject({
      columns: 60,
      rows: 34,
      elementCount: 2_040,
    });
    expect(computeGrid(1920, 1080, 64)).toMatchObject({
      columns: 30,
      rows: 17,
      elementCount: 510,
    });
    expect(computeGrid(1920, 1080, 128)).toMatchObject({
      columns: 15,
      rows: 9,
      elementCount: 135,
    });
  });

  it('uses ceiling division for partial edge tiles', () => {
    const grid = computeGrid(100, 50, 32);
    expect(grid.columns).toBe(4);
    expect(grid.rows).toBe(2);
    expect(grid.elementCount).toBe(8);
  });

  it('handles exact divisions without adding an extra row or column', () => {
    const grid = computeGrid(64, 64, 32);
    expect(grid.columns).toBe(2);
    expect(grid.rows).toBe(2);
    expect(grid.elementCount).toBe(4);
  });
});

describe('elementRect', () => {
  it('returns full interior tiles', () => {
    const grid = computeGrid(100, 50, 32);
    expect(elementRect(0, grid)).toEqual({ x: 0, y: 0, w: 32, h: 32 });
    expect(elementRect(5, grid)).toEqual({ x: 32, y: 32, w: 32, h: 18 });
  });

  it('returns smaller right and bottom edge tiles', () => {
    const grid = computeGrid(100, 50, 32);
    expect(elementRect(3, grid)).toEqual({ x: 96, y: 0, w: 4, h: 32 });
    expect(elementRect(7, grid)).toEqual({ x: 96, y: 32, w: 4, h: 18 });
  });

  it('treats every pixel as a 1x1 tile in individual mode', () => {
    const grid = computeGrid(3, 2, 1);
    expect(elementRect(0, grid)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(elementRect(5, grid)).toEqual({ x: 2, y: 1, w: 1, h: 1 });
  });
});
