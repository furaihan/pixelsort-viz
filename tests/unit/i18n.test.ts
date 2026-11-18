import { describe, expect, it } from 'vitest';
import { EN, ID } from '../../src/lib/i18n/messages';

describe('localization dictionaries', () => {
  it('keep English and Indonesian keys in sync', () => {
    expect(Object.keys(ID).sort()).toEqual(Object.keys(EN).sort());
  });

  it('include the complete product surface', () => {
    expect(Object.keys(EN)).toEqual(
      expect.arrayContaining([
        'language.label',
        'guide.intro',
        'workload.quadraticWarning',
        'error.fileType',
        'event.swapDetail',
        'algorithm.radix.description',
      ]),
    );
  });
});
