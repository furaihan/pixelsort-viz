import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRESET_IMAGES, getPreset } from '../../src/lib/core/image/presets';
import { EN, ID } from '../../src/lib/i18n/messages';

const root = path.resolve(process.cwd(), 'public/presets');

describe('preset image registry', () => {
  it('keeps unique ids, filenames and mime types in sync', () => {
    const ids = PRESET_IMAGES.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of PRESET_IMAGES) {
      expect(preset.file.startsWith(preset.id)).toBe(true);
      expect(preset.mimeType).toBe(preset.file.endsWith('.png') ? 'image/png' : 'image/jpeg');
    }
  });

  it('ships every full image and its thumbnail', () => {
    expect(PRESET_IMAGES).toHaveLength(9);
    for (const preset of PRESET_IMAGES) {
      expect(existsSync(path.join(root, preset.file)), preset.file).toBe(true);
      expect(existsSync(path.join(root, 'thumbs', `${preset.id}.jpg`)), preset.id).toBe(true);
    }
  });

  it('localizes every name in both catalogs', () => {
    for (const preset of PRESET_IMAGES) {
      expect(EN[preset.nameKey]).toBeTruthy();
      expect(ID[preset.nameKey]).toBeTruthy();
    }
    expect(getPreset(PRESET_IMAGES[0].id)).toEqual(PRESET_IMAGES[0]);
    expect(getPreset('does-not-exist')).toBeUndefined();
  });
});
