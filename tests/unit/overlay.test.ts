import { describe, expect, it } from 'vitest';
import { computeGrid } from '../../src/lib/core/image/grid';
import type { SortEvent } from '../../src/lib/core/sorting/types';
import { OverlayTracker } from '../../src/lib/core/visualization/overlayState';
import { computeRangeShape } from '../../src/lib/core/visualization/rangeGeometry';

const ops = { c: 0, r: 0, w: 0, s: 0, aw: 0, p: 0 };

describe('OverlayTracker', () => {
  it('coalesces forward, backward, and scattered sorted marks without eviction', () => {
    const tracker = new OverlayTracker();

    // Backward suffix (Bubble / Heap)
    tracker.applyEvent({ type: 'mark', indices: [9], role: 'sorted', ops }, 0, 140, false);
    tracker.applyEvent({ type: 'mark', indices: [8], role: 'sorted', ops }, 10, 140, false);
    tracker.applyEvent({ type: 'mark', indices: [7], role: 'sorted', ops }, 20, 140, false);

    // Forward prefix (Selection / Insertion)
    tracker.applyEvent({ type: 'mark', indices: [0], role: 'sorted', ops }, 30, 140, false);
    tracker.applyEvent(
      { type: 'mark', indices: [1], role: 'sorted', range: [0, 2], ops },
      40,
      140,
      false,
    );

    // Scattered pivot in the middle, later bridged
    tracker.applyEvent({ type: 'mark', indices: [4], role: 'sorted', ops }, 50, 140, false);
    tracker.applyEvent({ type: 'mark', indices: [3], role: 'sorted', ops }, 60, 140, false);
    tracker.applyEvent({ type: 'mark', indices: [5], role: 'sorted', ops }, 70, 140, false);

    // Flood with transient compares so ring buffer wraps multiple times
    for (let i = 0; i < 30; i += 1) {
      tracker.applyEvent({ type: 'compare', i: 0, j: 1, a: 0, b: 1, ops }, 100 + i, 140, false);
    }

    const snap = tracker.snapshot();
    expect(snap.transients.length).toBeLessThanOrEqual(8);
    expect(snap.sortedRanges).toEqual([
      [0, 2],
      [3, 6],
      [7, 10],
    ]);
  });

  it('tracks pivot swaps and preserves persistent state across pause, step, and resume', () => {
    const tracker = new OverlayTracker();
    tracker.applyEvent(
      { type: 'mark', indices: [0], role: 'active', range: [0, 8], ops },
      0,
      140,
      false,
    );
    tracker.applyEvent({ type: 'mark', indices: [7], role: 'pivot', ops }, 5, 140, false);
    tracker.applyEvent(
      { type: 'compare-value', index: 2, value: 1, against: 5, ops },
      10,
      140,
      false,
    );
    tracker.applyEvent({ type: 'swap', i: 4, j: 7, ops }, 15, 140, false);

    expect(tracker.snapshot().pivotIndex).toBe(4);
    expect(tracker.snapshot().activeRange).toEqual([0, 8]);

    // Pause pins current transients, Step clears stale transients before the next event
    tracker.onPause();
    expect(
      tracker.snapshot().transients.every((item) => item.ttl === Number.POSITIVE_INFINITY),
    ).toBe(true);

    tracker.prepareForStep();
    expect(tracker.snapshot().transients).toHaveLength(0);
    expect(tracker.snapshot().pivotIndex).toBe(4);

    // Marking the pivot sorted clears pivotIndex and adds sorted range
    tracker.applyEvent({ type: 'mark', indices: [4], role: 'sorted', ops }, 20, 140, true);
    expect(tracker.snapshot().pivotIndex).toBeNull();
    expect(tracker.snapshot().sortedRanges).toEqual([[4, 5]]);

    // Resume clears transient highlights while preserving sorted and active range
    tracker.applyEvent({ type: 'read', index: 1, value: 2, ops }, 25, 140, true);
    tracker.onResume();
    expect(tracker.snapshot().transients).toHaveLength(0);
    expect(tracker.snapshot().sortedRanges).toEqual([[4, 5]]);
    expect(tracker.snapshot().activeRange).toEqual([0, 8]);
  });

  it('ignores count-table auxiliary events for canvas highlights', () => {
    const tracker = new OverlayTracker();
    const events: SortEvent[] = [
      { type: 'read', index: 250, value: 3, aux: true, auxKind: 'counts', ops },
      { type: 'write', index: 250, value: 4, aux: true, auxKind: 'counts', ops },
    ];
    for (const event of events) {
      expect(tracker.applyEvent(event, 10, 140, true)).toBe(false);
    }
    expect(tracker.snapshot().transients).toHaveLength(0);

    // Buffer-backed aux writes DO create an AUX highlight
    expect(
      tracker.applyEvent(
        { type: 'write', index: 3, value: 1, aux: true, auxKind: 'buffer', ops },
        20,
        140,
        true,
      ),
    ).toBe(true);
    expect(tracker.snapshot().transients[0]).toMatchObject({
      kind: 'write',
      aux: true,
      label: 'AUX',
      indices: [3],
    });
  });
});

describe('computeRangeShape', () => {
  const grid = computeGrid(80, 48, 16); // 5 cols x 3 rows = 15 elements

  it('computes a single-row slice accurately', () => {
    const shape = computeRangeShape(1, 4, grid, 500, 300);
    expect(shape).toEqual({
      kind: 'rects',
      rects: [{ x: 100, y: 0, w: 300, h: 100 }],
      anchor: { x: 100, y: 0 },
    });
  });

  it('computes a full-row-aligned multi-row block as one rectangle', () => {
    const shape = computeRangeShape(5, 15, grid, 500, 300);
    expect(shape).toEqual({
      kind: 'rects',
      rects: [{ x: 0, y: 100, w: 500, h: 200 }],
      anchor: { x: 0, y: 100 },
    });
  });

  it('separates two disconnected partial rows when row1 = row0 + 1 and col0 > col1', () => {
    // indices 3..6 => row 0 cols 3..4, row 1 cols 0..1
    const shape = computeRangeShape(3, 7, grid, 500, 300);
    expect(shape).toEqual({
      kind: 'rects',
      rects: [
        { x: 300, y: 0, w: 200, h: 100 },
        { x: 0, y: 100, w: 200, h: 100 },
      ],
      anchor: { x: 300, y: 0 },
    });
  });

  it('builds a non-self-intersecting rectilinear polygon for connected multi-row ranges', () => {
    // indices 2..12 => row 0 col 2..4, row 1 full, row 2 col 0..1
    const shape = computeRangeShape(2, 12, grid, 500, 300);
    expect(shape?.kind).toBe('polygon');
    if (shape?.kind === 'polygon') {
      expect(shape.anchor).toEqual({ x: 200, y: 0 });
      expect(shape.points).toEqual([
        { x: 200, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 200 },
        { x: 200, y: 200 },
        { x: 200, y: 300 },
        { x: 0, y: 300 },
        { x: 0, y: 100 },
        { x: 200, y: 100 },
      ]);
    }
  });
});
