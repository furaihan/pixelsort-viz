/**
 * Small, fast, deterministic PRNG. The seed is retained so a shuffle can be
 * reproduced, but the app also keeps the generated permutation itself.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function identityPermutation(length: number): Uint32Array {
  const permutation = new Uint32Array(length);
  for (let i = 0; i < length; i += 1) permutation[i] = i;
  return permutation;
}

/** Fisher-Yates. Returns a uniform permutation of 0..length-1. */
export function fisherYates(length: number, seed: number): Uint32Array {
  const permutation = identityPermutation(length);
  const random = mulberry32(seed);
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const value = permutation[i];
    permutation[i] = permutation[j];
    permutation[j] = value;
  }
  return permutation;
}

export function isSorted(permutation: Uint32Array): boolean {
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] !== i) return false;
  }
  return true;
}

/** O(n) validation that every source element appears exactly once. */
export function isPermutation(permutation: Uint32Array): boolean {
  const seen = new Uint8Array(permutation.length);
  for (let i = 0; i < permutation.length; i += 1) {
    const value = permutation[i];
    if (value >= permutation.length || seen[value] === 1) return false;
    seen[value] = 1;
  }
  return true;
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return (Math.random() * 0xffffffff) >>> 0;
}
