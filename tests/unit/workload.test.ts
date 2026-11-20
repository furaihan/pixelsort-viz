import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from '../../src/lib/core/sorting/registry';
import type { AlgorithmId } from '../../src/lib/core/sorting/types';
import { computeGrid } from '../../src/lib/core/image/grid';
import {
  assessWorkload,
  O_N2_WARN,
  O_N2_MAX,
  EDUCATIONAL_HARD_MAX,
  MAX_ELEMENTS,
} from '../../src/lib/utils/workload';

const QUADRATIC: AlgorithmId[] = ['bubble', 'selection', 'insertion'];

describe('registry quadratic flags', () => {
  it('marks exactly bubble/selection/insertion as quadratic', () => {
    // The workload guard derives isQuadratic from these flags; pin them so a
    // future metadata edit cannot silently change the guardrails.
    const flagged = (Object.keys(ALGORITHMS) as AlgorithmId[]).filter(
      (id) => ALGORITHMS[id].metadata.quadratic,
    );
    expect(flagged.sort()).toEqual([...QUADRATIC].sort());
  });
});

describe('assessWorkload', () => {
  const gridWith = (count: number) => computeGrid(count, 1, 1);

  it('allows small quadratic runs', () => {
    const assessment = assessWorkload(gridWith(100), 'bubble', 'educational');
    expect(assessment.isQuadratic).toBe(true);
    expect(assessment.canStart).toBe(true);
    expect(assessment.blockers).toHaveLength(0);
  });

  it('warns above the quadratic warning threshold but still allows the run', () => {
    const assessment = assessWorkload(gridWith(O_N2_WARN + 1), 'bubble', 'performance');
    expect(assessment.canStart).toBe(true);
    expect(assessment.warnings.length).toBeGreaterThan(0);
  });

  it('blocks quadratic runs above the quadratic max', () => {
    const assessment = assessWorkload(gridWith(O_N2_MAX + 1), 'bubble', 'performance');
    expect(assessment.canStart).toBe(false);
    expect(assessment.blockers.length).toBeGreaterThan(0);
  });

  it('does not apply the quadratic cap to non-quadratic algorithms', () => {
    const assessment = assessWorkload(gridWith(O_N2_MAX + 1), 'merge', 'performance');
    expect(assessment.isQuadratic).toBe(false);
    expect(assessment.canStart).toBe(true);
  });

  it('blocks educational mode above its hard max', () => {
    const assessment = assessWorkload(gridWith(EDUCATIONAL_HARD_MAX + 1), 'merge', 'educational');
    expect(assessment.canStart).toBe(false);
  });

  it('blocks any algorithm above the absolute element limit', () => {
    const assessment = assessWorkload(gridWith(MAX_ELEMENTS + 1), 'merge', 'performance');
    expect(assessment.canStart).toBe(false);
  });
});
