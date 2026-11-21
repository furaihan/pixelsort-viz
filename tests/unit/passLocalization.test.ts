import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from '../../src/lib/core/sorting/registry';
import { SortContext } from '../../src/lib/core/sorting/instrumentation';
import type { AlgorithmId, SortEvent } from '../../src/lib/core/sorting/types';
import { fisherYates } from '../../src/lib/core/image/shuffle';
import { i18n } from '../../src/lib/i18n/index.svelte';
import { EN, ID } from '../../src/lib/i18n/messages';

type PassEvent = Extract<SortEvent, { type: 'pass' }>;

function passEventsFor(id: AlgorithmId): PassEvent[] {
  const ctx = new SortContext(fisherYates(64, 1234), {
    mode: 'step',
    batchSize: 1_000_000,
    sampleIntervalMs: 1000,
    now: () => 0,
  });
  const generator = ALGORITHMS[id].run(ctx);
  let result = generator.next();
  while (!result.done) result = generator.next();
  return ctx.events.filter((event): event is PassEvent => event.type === 'pass');
}

describe('pass event localization', () => {
  for (const id of Object.keys(ALGORITHMS) as AlgorithmId[]) {
    it(`${id}: every emitted pass key maps to a real translation key`, () => {
      const events = passEventsFor(id);
      expect(events.length, `${id} emitted no pass events`).toBeGreaterThan(0);
      for (const event of events) {
        const localized = i18n.passMessage(event.key, event.params);
        // A raw string means the key fell through untranslated.
        expect(typeof localized, `untranslated pass key: "${event.key}"`).toBe('object');
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
    // These two phases previously had no mapping and leaked English in ID.
    expect(typeof i18n.passMessage('pass.countTargets')).toBe('object');
    expect(typeof i18n.passMessage('pass.writeBucketsBack')).toBe('object');
  });

  it('falls back to the raw key for unknown pass keys', () => {
    expect(i18n.passMessage('pass.notARealKey')).toBe('pass.notARealKey');
  });
});
