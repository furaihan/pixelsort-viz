import type { GridSpec } from '../core/image/imageTypes';
import type { AlgorithmId } from '../core/sorting/types';

export type PlaybackMode = 'educational' | 'performance';

/** Tunable guardrails, not product claims. */
export const O_N2_WARN = 3_000;
export const O_N2_MAX = 25_000;
export const EDUCATIONAL_RECOMMENDED_MAX = 12_000;
export const EDUCATIONAL_HARD_MAX = 60_000;
export const MAX_ELEMENTS = 8_000_000;

const QUADRATIC_ALGORITHMS = new Set<AlgorithmId>(['bubble', 'selection', 'insertion']);

export interface WorkloadAssessment {
  elementCount: number;
  isQuadratic: boolean;
  recommendedMode: PlaybackMode;
  warnings: string[];
  blockers: string[];
  canStart: boolean;
}

export function assessWorkload(
  grid: GridSpec,
  algorithmId: AlgorithmId,
  mode: PlaybackMode,
): WorkloadAssessment {
  const elementCount = grid.elementCount;
  const isQuadratic = QUADRATIC_ALGORITHMS.has(algorithmId);
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (isQuadratic && elementCount > O_N2_WARN) {
    warnings.push(
      `${elementCount.toLocaleString('en-US')} elements is a quadratic workload for this algorithm. Expect a long run; a larger block size or a faster algorithm will finish sooner.`,
    );
  }
  if (mode === 'educational' && elementCount > EDUCATIONAL_RECOMMENDED_MAX) {
    warnings.push(
      'Educational mode is designed for smaller runs. Performance mode batches operations and keeps the interface responsive.',
    );
  }
  if (elementCount > 1_000_000) {
    warnings.push(
      'This is a large run. The canvas updates in batches, so the image may refresh a few times per second rather than once per operation.',
    );
  }

  if (elementCount > MAX_ELEMENTS) {
    blockers.push(
      `This run has ${elementCount.toLocaleString('en-US')} elements. The safe limit is ${MAX_ELEMENTS.toLocaleString('en-US')}. Choose a larger block size.`,
    );
  }
  if (isQuadratic && elementCount > O_N2_MAX) {
    blockers.push(
      `This algorithm is disabled above ${O_N2_MAX.toLocaleString('en-US')} elements. Choose a faster algorithm or a larger block size.`,
    );
  }
  if (mode === 'educational' && elementCount > EDUCATIONAL_HARD_MAX) {
    blockers.push(
      `Educational mode is limited to ${EDUCATIONAL_HARD_MAX.toLocaleString('en-US')} elements. Switch to performance mode to run this workload.`,
    );
  }

  return {
    elementCount,
    isQuadratic,
    recommendedMode: elementCount > EDUCATIONAL_RECOMMENDED_MAX ? 'performance' : 'educational',
    warnings,
    blockers,
    canStart: blockers.length === 0,
  };
}
