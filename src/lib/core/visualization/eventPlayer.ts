import type { SortEvent } from '../sorting/types';

/**
 * Apply a permutation-changing event to a working permutation. Returns true
 * when the permutation changed. Compare, read, mark, pass, and auxiliary
 * writes do not change the visible arrangement.
 */
export function applyEventToPermutation(permutation: Uint32Array, event: SortEvent): boolean {
  const isIndex = (index: number): boolean =>
    Number.isInteger(index) && index >= 0 && index < permutation.length;
  switch (event.type) {
    case 'swap': {
      if (event.i === event.j || !isIndex(event.i) || !isIndex(event.j)) {
        return false;
      }
      const value = permutation[event.i];
      permutation[event.i] = permutation[event.j];
      permutation[event.j] = value;
      return true;
    }
    case 'write':
      if (event.aux || !isIndex(event.index)) return false;
      permutation[event.index] = event.value;
      return true;
    case 'delta': {
      if (event.indices.length === 0 || event.indices.length !== event.values.length) {
        return false;
      }
      for (let i = 0; i < event.indices.length; i += 1) {
        if (!isIndex(event.indices[i])) return false;
      }
      let changed = false;
      for (let i = 0; i < event.indices.length; i += 1) {
        const index = event.indices[i];
        if (permutation[index] !== event.values[i]) {
          permutation[index] = event.values[i];
          changed = true;
        }
      }
      return changed;
    }
    case 'snapshot': {
      if (event.data.length !== permutation.length) return false;
      permutation.set(event.data);
      return true;
    }
    default:
      return false;
  }
}
