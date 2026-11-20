import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from '../../src/lib/core/sorting/registry';
import { SortContext } from '../../src/lib/core/sorting/instrumentation';
import type { AlgorithmId, SortEvent } from '../../src/lib/core/sorting/types';
import { fisherYates } from '../../src/lib/core/image/shuffle';
import { i18n } from '../../src/lib/i18n/index.svelte';
import { EN, ID } from '../../src/lib/i18n/messages';

type PassEvent = Extract<SortEvent, { type: 'pass' }>;

function passLabelsFor(id: AlgorithmId): string[] {
  const ctx = new SortContext(fisherYates(64, 1234), {
    mode: 'step',
    batchSize: 1_000_000,
    sampleIntervalMs: 1000,
    now: () => 0,
  });
  const generator = ALGORITHMS[id].run(ctx);
  let result = generator.next();
  while (!result.done) result = generator.next();
  return ctx.events
    .filter((event): event is PassEvent => event.type === 'pass')
    .map((event) => event.label);
}

describe('pass label localization', () => {
  for (const id of Object.keys(ALGORITHMS) as AlgorithmId[]) {
    it(`${id}: every emitted pass label maps to a real translation key`, () => {
      for (const label of passLabelsFor(id)) {
        const localized = i18n.passMessage(label);
        // A raw string means the label fell through to English untranslated.
        expect(typeof localized, `untranslated pass label: "${label}"`).toBe('object');
        if (typeof localized === 'object') {
          const { key, params } = localized;
          expect(Object.prototype.hasOwnProperty.call(EN, key), `missing EN key "${key}"`).toBe(
            true,
          );
          expect(Object.prototype.hasOwnProperty.call(ID, key), `missing ID key "${key}"`).toBe(
            true,
          );
          // Every interpolated parameter must survive as a {name} placeholder in both catalogs.
          for (const name of Object.keys(params ?? {})) {
            expect(EN[key], `EN "${key}" dropped {${name}}`).toContain(`{${name}}`);
            expect(ID[key], `ID "${key}" dropped {${name}}`).toContain(`{${name}}`);
          }
        }
      }
    });
  }

  it('localizes the counting and bucket write-back phases (regression)', () => {
    // These two static labels previously had no mapping and leaked English in ID.
    expect(typeof i18n.passMessage('Count target indices')).toBe('object');
    expect(typeof i18n.passMessage('Write buckets back to the image')).toBe('object');
  });
});
