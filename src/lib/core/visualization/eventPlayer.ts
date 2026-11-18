import type { SortEvent } from '../sorting/types';

/**
 * Apply a permutation-changing event to a working permutation. Returns true
 * when the permutation changed. Compare, read, mark, pass, and auxiliary
 * writes do not change the visible arrangement.
 */
export function applyEventToPermutation(permutation: Uint32Array, event: SortEvent): boolean {
  switch (event.type) {
    case 'swap': {
      if (
        event.i === event.j ||
        event.i < 0 ||
        event.j < 0 ||
        event.i >= permutation.length ||
        event.j >= permutation.length
      ) {
        return false;
      }
      const value = permutation[event.i];
      permutation[event.i] = permutation[event.j];
      permutation[event.j] = value;
      return true;
    }
    case 'write':
      if (event.aux || event.index < 0 || event.index >= permutation.length) return false;
      permutation[event.index] = event.value;
      return true;
    case 'delta': {
      if (event.indices.length === 0) return false;
      let changed = false;
      for (let i = 0; i < event.indices.length; i += 1) {
        const index = event.indices[i];
        if (index < permutation.length) {
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
