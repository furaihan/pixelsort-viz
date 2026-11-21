import type { GridSpec } from '../core/image/imageTypes';
import type { AlgorithmId } from '../core/sorting/types';
import { getAlgorithm } from '../core/sorting/registry';
import type { LocalizedText } from '../i18n/index.svelte';
import { msg } from '../i18n/index.svelte';

export type PlaybackMode = 'educational' | 'performance';

/** Tunable guardrails, not product claims. */
export const O_N2_WARN = 3_000;
export const O_N2_MAX = 25_000;
export const SUPERLINEAR_WARN = 500_000;
export const EDUCATIONAL_RECOMMENDED_MAX = 12_000;
export const EDUCATIONAL_HARD_MAX = 60_000;
export const MAX_ELEMENTS = 8_000_000;

export interface WorkloadAssessment {
  elementCount: number;
  isQuadratic: boolean;
  recommendedMode: PlaybackMode;
  warnings: LocalizedText[];
  blockers: LocalizedText[];
  canStart: boolean;
}

export function assessWorkload(
  grid: GridSpec,
  algorithmId: AlgorithmId,
  mode: PlaybackMode,
): WorkloadAssessment {
  const elementCount = grid.elementCount;
  // Single source of truth: the registry's complexity flags (also used by the UI chip).
  const metadata = getAlgorithm(algorithmId).metadata;
  const isQuadratic = metadata.quadratic;
  const warnings: LocalizedText[] = [];
  const blockers: LocalizedText[] = [];

  if (isQuadratic && elementCount > O_N2_WARN) {
    warnings.push(msg('workload.quadraticWarning', { count: elementCount }));
  }
  if (metadata.superlinear && elementCount > SUPERLINEAR_WARN) {
    warnings.push(msg('workload.superlinearWarning', { count: elementCount }));
  }
  if (mode === 'educational' && elementCount > EDUCATIONAL_RECOMMENDED_MAX) {
    warnings.push(msg('workload.educationalWarning'));
  }
  if (elementCount > 1_000_000) {
    warnings.push(msg('workload.largeWarning'));
  }

  if (elementCount > MAX_ELEMENTS) {
    blockers.push(msg('workload.maxElementsBlocker', { count: elementCount, max: MAX_ELEMENTS }));
  }
  if (isQuadratic && elementCount > O_N2_MAX) {
    blockers.push(msg('workload.quadraticBlocker', { max: O_N2_MAX }));
  }
  if (mode === 'educational' && elementCount > EDUCATIONAL_HARD_MAX) {
    blockers.push(msg('workload.educationalBlocker', { max: EDUCATIONAL_HARD_MAX }));
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
