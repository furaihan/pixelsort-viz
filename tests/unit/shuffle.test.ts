import { describe, expect, it } from 'vitest';
import {
  fisherYates,
  identityPermutation,
  isPermutation,
  isSorted,
  mulberry32,
} from '../../src/lib/core/image/shuffle';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const first = mulberry32(123);
    const second = mulberry32(123);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('returns values in [0, 1)', () => {
    const random = mulberry32(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('fisherYates', () => {
  it('returns a permutation of every identity exactly once', () => {
    const permutation = fisherYates(1000, 42);
    expect(permutation).toHaveLength(1000);
    expect(isPermutation(permutation)).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    expect(Array.from(fisherYates(50, 99))).toEqual(Array.from(fisherYates(50, 99)));
  });

  it('produces a different arrangement for a different seed', () => {
    expect(Array.from(fisherYates(50, 1))).not.toEqual(Array.from(fisherYates(50, 2)));
  });

  it('handles empty and single-element inputs', () => {
    expect(Array.from(fisherYates(0, 1))).toEqual([]);
    expect(Array.from(fisherYates(1, 1))).toEqual([0]);
  });
});

describe('permutation helpers', () => {
  it('recognises the identity as sorted', () => {
    expect(isSorted(identityPermutation(10))).toBe(true);
  });

  it('recognises a shuffled arrangement as unsorted', () => {
    expect(isSorted(fisherYates(10, 1))).toBe(false);
  });

  it('rejects duplicates and out-of-range values', () => {
    expect(isPermutation(Uint32Array.from([0, 1, 1]))).toBe(false);
    expect(isPermutation(Uint32Array.from([0, 1, 3]))).toBe(false);
    expect(isPermutation(Uint32Array.from([0, 1, 2]))).toBe(true);
  });
});
