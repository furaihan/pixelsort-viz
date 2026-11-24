import type { TranslationKey } from '../../i18n/messages';

/** Ready-made specimens shipped in `public/presets`. The id doubles as the
 * filename stem so the registry, thumbnails, and error messages stay in sync. */
export interface PresetImage {
  readonly id: string;
  readonly file: string;
  readonly mimeType: 'image/png' | 'image/jpeg';
  readonly nameKey: TranslationKey;
  readonly url: string;
  readonly thumbUrl: string;
}

const PRESET_DATA = [
  { id: 'spectrum-ledger', file: 'spectrum-ledger.png', nameKey: 'presets.spectrumLedger' },
  { id: 'run-ledger-poster', file: 'run-ledger-poster.png', nameKey: 'presets.runLedgerPoster' },
  { id: 'citrus-spectrum', file: 'citrus-spectrum.png', nameKey: 'presets.citrusSpectrum' },
  { id: 'pencil-spectrum', file: 'pencil-spectrum.jpg', nameKey: 'presets.pencilSpectrum' },
  { id: 'library-gradient', file: 'library-gradient.jpg', nameKey: 'presets.libraryGradient' },
  { id: 'macaron-box', file: 'macaron-box.jpg', nameKey: 'presets.macaronBox' },
  { id: 'origami-crane-field', file: 'origami-crane-field.jpg', nameKey: 'presets.origamiCranes' },
  { id: 'dahlia-rosette', file: 'dahlia-rosette.jpg', nameKey: 'presets.dahliaRosette' },
  {
    id: 'impossible-staircase',
    file: 'impossible-staircase.png',
    nameKey: 'presets.impossibleStaircase',
  },
] as const satisfies readonly {
  readonly id: string;
  readonly file: string;
  readonly nameKey: TranslationKey;
}[];

const base = import.meta.env.BASE_URL || '/';

export const PRESET_IMAGES: readonly PresetImage[] = PRESET_DATA.map((preset) => ({
  ...preset,
  mimeType: preset.file.endsWith('.png') ? 'image/png' : 'image/jpeg',
  url: `${base}presets/${preset.file}`,
  thumbUrl: `${base}presets/thumbs/${preset.id}.jpg`,
}));

export type PresetId = (typeof PRESET_DATA)[number]['id'];

export function getPreset(id: string): PresetImage | undefined {
  return PRESET_IMAGES.find((preset) => preset.id === id);
}
