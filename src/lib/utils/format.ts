import { i18n } from '../i18n/index.svelte';

export function formatNumber(value: number): string {
  return i18n.number(value);
}

export function formatCompact(value: number): string {
  if (value < 1_000) return i18n.number(value);
  if (value < 1_000_000) return `${i18n.decimal(value / 1_000, value < 10_000 ? 1 : 0)}k`;
  if (value < 1_000_000_000)
    return `${i18n.decimal(value / 1_000_000, value < 10_000_000 ? 1 : 0)}m`;
  return `${i18n.decimal(value / 1_000_000_000, 1)}b`;
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0.00 s';
  if (ms < 1) return `${i18n.decimal(ms * 1000, 0)} µs`;
  if (ms < 1000) return `${i18n.decimal(ms, ms < 10 ? 2 : 1)} ms`;
  if (ms < 60_000) return `${i18n.decimal(ms / 1000, 2)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = (ms % 60_000) / 1000;
  return `${i18n.number(minutes)}m ${i18n.decimal(seconds, 1)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${i18n.decimal(bytes / 1024, 1)} KB`;
  return `${i18n.decimal(bytes / (1024 * 1024), 1)} MB`;
}

export function formatSeed(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0');
}

export function formatMegapixels(width: number, height: number): string {
  return `${i18n.decimal((width * height) / 1_000_000, 1)} MP`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
