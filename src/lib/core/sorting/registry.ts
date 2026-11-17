import { bubbleSort } from './algorithms/bubbleSort';
import { selectionSort } from './algorithms/selectionSort';
import { insertionSort } from './algorithms/insertionSort';
import { mergeSort } from './algorithms/mergeSort';
import { quickSort } from './algorithms/quickSort';
import { shellSort } from './algorithms/shellSort';
import { heapSort } from './algorithms/heapSort';
import { countingSort } from './algorithms/countingSort';
import { radixSort } from './algorithms/radixSort';
import { bucketSort } from './algorithms/bucketSort';
import type { AlgorithmCategory, AlgorithmDefinition, AlgorithmId } from './types';

export const ALGORITHMS: Record<AlgorithmId, AlgorithmDefinition> = {
  bubble: {
    metadata: {
      id: 'bubble',
      name: 'Bubble Sort',
      category: 'beginner',
      description:
        'Repeatedly compares neighboring elements and swaps them when they are out of order. After each pass, the largest remaining element has bubbled to the end.',
      bestTime: 'O(n) with early exit',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      spaceComplexity: 'O(1)',
      stable: true,
      inPlace: true,
      quadratic: true,
      notes: [
        'Stops early when a pass makes no swaps.',
        'Each pass moves the largest remaining element to the end.',
      ],
    },
    run: bubbleSort,
  },
  selection: {
    metadata: {
      id: 'selection',
      name: 'Selection Sort',
      category: 'beginner',
      description:
        'Scans the unsorted region for the smallest target index, then swaps it into the next position. The number of swaps is linear even though the number of comparisons is quadratic.',
      bestTime: 'O(n²)',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      spaceComplexity: 'O(1)',
      stable: false,
      inPlace: true,
      quadratic: true,
      notes: [
        'Always performs n−1 swaps, even when the array is already sorted.',
        'The scan is quadratic even though the number of swaps is linear.',
      ],
    },
    run: selectionSort,
  },
  insertion: {
    metadata: {
      id: 'insertion',
      name: 'Insertion Sort',
      category: 'beginner',
      description:
        'Builds a sorted prefix one element at a time. Each new element is shifted left until it sits after every smaller target index.',
      bestTime: 'O(n)',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      spaceComplexity: 'O(1)',
      stable: true,
      inPlace: true,
      quadratic: true,
      notes: [
        'Fast on nearly sorted input.',
        'Shifts larger elements right instead of swapping neighbors.',
      ],
    },
    run: insertionSort,
  },
  merge: {
    metadata: {
      id: 'merge',
      name: 'Merge Sort',
      category: 'intermediate',
      description:
        'Splits the permutation in half, sorts each half, then merges the two sorted runs by target index. The merge uses an auxiliary buffer.',
      bestTime: 'O(n log n)',
      averageTime: 'O(n log n)',
      worstTime: 'O(n log n)',
      spaceComplexity: 'O(n)',
      stable: true,
      inPlace: false,
      quadratic: false,
      notes: [
        'Uses one auxiliary buffer.',
        'Auxiliary writes are counted separately in the statistics panel.',
      ],
    },
    run: mergeSort,
  },
  quick: {
    metadata: {
      id: 'quick',
      name: 'Quick Sort',
      category: 'intermediate',
      description:
        'Chooses a pivot, partitions the other elements around it, then sorts each side. This implementation uses Lomuto partitioning with the last element as pivot.',
      bestTime: 'O(n log n)',
      averageTime: 'O(n log n)',
      worstTime: 'O(n²)',
      spaceComplexity: 'O(log n) average',
      stable: false,
      inPlace: true,
      quadratic: false,
      notes: [
        'Lomuto partition with the last element as pivot.',
        'Worst case on already-sorted input; the initial shuffle avoids it in normal use.',
      ],
    },
    run: quickSort,
  },
  shell: {
    metadata: {
      id: 'shell',
      name: 'Shell Sort',
      category: 'intermediate',
      description:
        "Runs insertion sort over progressively smaller gaps. The gap sequence determines the complexity; this implementation uses Knuth's 1, 4, 13, 40, ... sequence.",
      bestTime: 'Depends on gap sequence',
      averageTime: 'Depends on gap sequence',
      worstTime: 'Depends on gap sequence',
      spaceComplexity: 'O(1)',
      stable: false,
      inPlace: true,
      quadratic: false,
      notes: [
        'Uses the Knuth sequence: 1, 4, 13, 40, ...',
        'No single universal complexity claim applies; typical behavior for this sequence is about O(n^1.5).',
      ],
    },
    run: shellSort,
  },
  heap: {
    metadata: {
      id: 'heap',
      name: 'Heap Sort',
      category: 'advanced',
      description:
        'Builds a max-heap by target index, then repeatedly swaps the root to the end and restores the heap. The heap lives inside the array.',
      bestTime: 'O(n log n)',
      averageTime: 'O(n log n)',
      worstTime: 'O(n log n)',
      spaceComplexity: 'O(1)',
      stable: false,
      inPlace: true,
      quadratic: false,
      notes: [
        'Builds a max-heap, then repeatedly moves the root to the end.',
        'The heap is implicit in the array; no extra buffer.',
      ],
    },
    run: heapSort,
  },
  counting: {
    metadata: {
      id: 'counting',
      name: 'Counting Sort',
      category: 'advanced',
      description:
        'Counts how many elements have each target index, turns the counts into starting positions, then places every element directly into its final slot. No comparisons are made.',
      bestTime: 'O(n + k)',
      averageTime: 'O(n + k)',
      worstTime: 'O(n + k)',
      spaceComplexity: 'O(n + k)',
      stable: true,
      inPlace: false,
      quadratic: false,
      notes: [
        'Non-comparison sort. Here k = n because the keys are exactly 0..n−1.',
        'Count-array operations are counted as auxiliary reads and writes.',
      ],
    },
    run: countingSort,
  },
  radix: {
    metadata: {
      id: 'radix',
      name: 'Radix Sort',
      category: 'advanced',
      description:
        'Sorts the target indices one byte at a time with a stable counting pass, least significant byte first. The number of passes depends on the largest index.',
      bestTime: 'O(d(n + b))',
      averageTime: 'O(d(n + b))',
      worstTime: 'O(d(n + b))',
      spaceComplexity: 'O(n + b)',
      stable: true,
      inPlace: false,
      quadratic: false,
      notes: [
        'LSD radix sort, base 256. d is the number of byte passes; b = 256.',
        'Each pass is copied back into the working array so the image updates after every digit.',
      ],
    },
    run: radixSort,
  },
  bucket: {
    metadata: {
      id: 'bucket',
      name: 'Bucket Sort',
      category: 'advanced',
      description:
        'Scatters elements into buckets by target-index range, insertion-sorts each bucket, then concatenates the buckets. Performance depends on the distribution.',
      bestTime: 'O(n + k) average under uniform distribution',
      averageTime: 'O(n + k) under distribution assumptions',
      worstTime: 'O(n²)',
      spaceComplexity: 'O(n + k)',
      stable: true,
      inPlace: false,
      quadratic: false,
      notes: [
        'Uses sqrt(n) buckets and insertion sort inside each bucket.',
        'Performance depends on how evenly the target indices are distributed; the initial shuffle makes the distribution uniform.',
      ],
    },
    run: bucketSort,
  },
};

export const ALGORITHM_LIST: AlgorithmDefinition[] = Object.values(ALGORITHMS);

export const ALGORITHM_GROUPS: { category: AlgorithmCategory; label: string; algorithms: AlgorithmDefinition[] }[] = [
  {
    category: 'beginner',
    label: 'Beginner',
    algorithms: ALGORITHM_LIST.filter((algorithm) => algorithm.metadata.category === 'beginner'),
  },
  {
    category: 'intermediate',
    label: 'Intermediate',
    algorithms: ALGORITHM_LIST.filter((algorithm) => algorithm.metadata.category === 'intermediate'),
  },
  {
    category: 'advanced',
    label: 'Advanced',
    algorithms: ALGORITHM_LIST.filter((algorithm) => algorithm.metadata.category === 'advanced'),
  },
];

export function getAlgorithm(id: AlgorithmId): AlgorithmDefinition {
  return ALGORITHMS[id];
}
