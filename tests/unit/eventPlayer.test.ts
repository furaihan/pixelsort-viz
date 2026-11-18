import { describe, expect, it } from 'vitest';
import { applyEventToPermutation } from '../../src/lib/core/visualization/eventPlayer';
import type { SortEvent } from '../../src/lib/core/sorting/types';

const ops = { c: 0, r: 0, w: 0, s: 0, aw: 0, p: 0 };

describe('applyEventToPermutation', () => {
  it('applies a swap', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = { type: 'swap', i: 0, j: 2, a: 0, b: 2, ops };
    expect(applyEventToPermutation(permutation, event)).toBe(true);
    expect(Array.from(permutation)).toEqual([2, 1, 0]);
  });

  it('applies a main-array write', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = { type: 'write', index: 1, value: 7, ops };
    expect(applyEventToPermutation(permutation, event)).toBe(true);
    expect(Array.from(permutation)).toEqual([0, 7, 2]);
  });

  it('ignores an auxiliary write', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = { type: 'write', index: 1, value: 7, aux: true, ops };
    expect(applyEventToPermutation(permutation, event)).toBe(false);
    expect(Array.from(permutation)).toEqual([0, 1, 2]);
  });

  it('applies a delta', () => {
    const permutation = Uint32Array.from([0, 1, 2, 3]);
    const event: SortEvent = {
      type: 'delta',
      indices: Uint32Array.from([0, 3]),
      values: Uint32Array.from([3, 0]),
    };
    expect(applyEventToPermutation(permutation, event)).toBe(true);
    expect(Array.from(permutation)).toEqual([3, 1, 2, 0]);
  });

  it('applies a snapshot', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = { type: 'snapshot', data: Uint32Array.from([2, 1, 0]) };
    expect(applyEventToPermutation(permutation, event)).toBe(true);
    expect(Array.from(permutation)).toEqual([2, 1, 0]);
  });

  it('ignores non-mutating events', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const events: SortEvent[] = [
      { type: 'compare', i: 0, j: 1, a: 0, b: 1, ops },
      { type: 'compare-value', index: 0, value: 0, against: 1, ops },
      { type: 'read', index: 0, value: 0, ops },
      { type: 'mark', indices: [0], role: 'sorted', ops },
      { type: 'pass', label: 'Pass', ops },
    ];
    for (const event of events) {
      expect(applyEventToPermutation(permutation, event)).toBe(false);
    }
    expect(Array.from(permutation)).toEqual([0, 1, 2]);
  });

  it('ignores out-of-bounds swaps and writes safely', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    expect(
      applyEventToPermutation(permutation, { type: 'swap', i: -1, j: 2, a: 2, b: 0, ops }),
    ).toBe(false);
    expect(
      applyEventToPermutation(permutation, { type: 'swap', i: 0, j: 9, a: 0, b: 2, ops }),
    ).toBe(false);
    expect(applyEventToPermutation(permutation, { type: 'write', index: 5, value: 1, ops })).toBe(
      false,
    );
    expect(Array.from(permutation)).toEqual([0, 1, 2]);
  });

  it('rejects a delta whose index and value arrays disagree', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = {
      type: 'delta',
      indices: Uint32Array.from([0, 1]),
      values: Uint32Array.from([2]),
    };
    expect(applyEventToPermutation(permutation, event)).toBe(false);
    expect(Array.from(permutation)).toEqual([0, 1, 2]);
  });

  it('rejects a delta with an invalid index without partial mutation', () => {
    const permutation = Uint32Array.from([0, 1, 2]);
    const event: SortEvent = {
      type: 'delta',
      indices: Uint32Array.from([0, 3]),
      values: Uint32Array.from([2, 1]),
    };
    expect(applyEventToPermutation(permutation, event)).toBe(false);
    expect(Array.from(permutation)).toEqual([0, 1, 2]);
  });
});
