import { ID, EN, type TranslationKey } from './messages';
import type { AlgorithmCategory, AlgorithmId } from '../core/sorting/types';

export type Locale = 'en' | 'id';
export type MessageParams = Record<string, string | number | LocalizedText>;
export type LocalizedText = string | { key: TranslationKey; params?: MessageParams };

const STORAGE_KEY = 'pixel-sort-locale';

function supportedLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  return value.toLowerCase().startsWith('id')
    ? 'id'
    : value.toLowerCase().startsWith('en')
      ? 'en'
      : null;
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = supportedLocale(window.localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
  return (
    window.navigator.languages.map((language) => supportedLocale(language)).find(Boolean) ??
    supportedLocale(window.navigator.language) ??
    'en'
  );
}

function interpolate(template: string, locale: Locale, params?: MessageParams): string {
  if (!params) return template;
  const formatter = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US');
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    if (typeof value === 'number') return formatter.format(value);
    if (typeof value === 'object') {
      return interpolate((locale === 'id' ? ID : EN)[value.key], locale, value.params);
    }
    return value;
  });
}

class I18n {
  locale = $state<Locale>(detectLocale());

  setLocale(locale: Locale): void {
    if (locale !== 'en' && locale !== 'id') return;
    this.locale = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The UI still works when persistence is unavailable.
    }
  }

  t(key: TranslationKey, params?: MessageParams): string {
    const dictionary = this.locale === 'id' ? ID : EN;
    return interpolate(dictionary[key] ?? key, this.locale, params);
  }

  text(value: LocalizedText | null | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : this.t(value.key, value.params);
  }

  message(key: TranslationKey, params?: MessageParams): LocalizedText {
    return { key, params };
  }

  number(value: number): string {
    return new Intl.NumberFormat(this.locale === 'id' ? 'id-ID' : 'en-US').format(value);
  }

  decimal(value: number, digits: number): string {
    return new Intl.NumberFormat(this.locale === 'id' ? 'id-ID' : 'en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  statusLabel(status: string): string {
    const key: Record<string, TranslationKey> = {
      empty: 'status.empty',
      'image-loaded': 'status.imageLoaded',
      configured: 'status.configured',
      scrambled: 'status.scrambled',
      running: 'status.running',
      paused: 'status.paused',
      completed: 'status.completed',
      restored: 'status.restored',
      error: 'status.error',
    };
    return this.t(key[status] ?? 'status.empty');
  }

  /** Localized short type token for the recent-operations log (compare/swap/…). */
  logToken(type: string): string {
    const key: Record<string, TranslationKey> = {
      compare: 'logToken.compare',
      swap: 'logToken.swap',
      write: 'logToken.write',
      pivot: 'logToken.pivot',
      sorted: 'logToken.sorted',
      range: 'logToken.range',
      pass: 'logToken.pass',
      complete: 'logToken.complete',
    };
    return key[type] ? this.t(key[type]) : type;
  }

  categoryLabel(category: AlgorithmCategory): string {
    return this.t(`category.${category}` as TranslationKey);
  }

  algorithmName(id: AlgorithmId): string {
    return this.t(`algorithm.${id}.name` as TranslationKey);
  }

  algorithmDescription(id: AlgorithmId): string {
    return this.t(`algorithm.${id}.description` as TranslationKey);
  }

  algorithmNotes(id: AlgorithmId): string[] {
    return [1, 2]
      .map((index) => this.t(`algorithm.${id}.note${index}` as TranslationKey))
      .filter((note) => note !== `algorithm.${id}.note1` && note !== `algorithm.${id}.note2`);
  }

  propertyLabel(value: boolean | 'depends'): string {
    return this.t(value === 'depends' ? 'common.depends' : value ? 'common.yes' : 'common.no');
  }

  passMessage(key: string, params?: Record<string, number>): LocalizedText {
    // Pass events carry a translation key directly; unknown keys fall back to
    // the raw key so a missing catalog entry is visible instead of silent.
    if (Object.prototype.hasOwnProperty.call(EN, key)) {
      return msg(key as TranslationKey, params);
    }
    return key;
  }

  complexity(value: string): string {
    const keys: Record<string, TranslationKey> = {
      'Depends on gap sequence': 'algorithm.complexity.dependsGap',
      'O(n) with early exit': 'algorithm.complexity.nEarlyExit',
      'O(n + k) average under uniform distribution': 'algorithm.complexity.nkUniform',
      'O(n + k) under distribution assumptions': 'algorithm.complexity.nkAssumptions',
      'O(log n) average': 'algorithm.complexity.logAverage',
    };
    return keys[value] ? this.t(keys[value]) : value;
  }

  shortLabel(label: string): string {
    const key: Record<string, TranslationKey> = {
      KEY: 'canvas.key',
      AUX: 'canvas.aux',
      W: 'canvas.write',
    };
    return key[label] ? this.t(key[label]) : label;
  }

  errorMessage(message: string): LocalizedText {
    const exact: Record<string, TranslationKey> = {
      'Canvas is unavailable in this browser.': 'error.sampleCanvas',
      'The sample image could not be created.': 'error.sampleCreate',
      'The image could not be decoded. It may be corrupted or use an unsupported encoding.':
        'error.decode',
      'The image has no usable dimensions.': 'error.noDimensions',
      'This browser could not create a canvas for the image.': 'error.noCanvas',
      'The sorting worker failed.': 'error.workerFailed',
      'The sorting run started with an invalid permutation.': 'error.invalidPermutation',
    };
    if (exact[message]) return msg(exact[message]);
    if (message === 'That file is empty. Choose a PNG, JPEG, or WebP image.') {
      return msg('error.fileEmpty');
    }
    if (message === 'That file is not a PNG, JPEG, or WebP image. Try another file.') {
      return msg('error.fileType');
    }
    const fileSize = /^That file is ([\d.]+) MB\. The limit is 40 MB\.$/.exec(message);
    if (fileSize) return msg('error.fileTooLarge', { megabytes: Number(fileSize[1]) });
    const imageSize =
      /^That image is ([\d.]+) MP\. The limit is 20 MP\. Try a smaller image\.$/.exec(message);
    if (imageSize) return msg('error.imageTooLarge', { megapixels: Number(imageSize[1]) });
    return message;
  }
}

export const i18n = new I18n();

export function msg(key: TranslationKey, params?: MessageParams): LocalizedText {
  return i18n.message(key, params);
}

export function translationKeys(): TranslationKey[] {
  return Object.keys(EN) as TranslationKey[];
}
