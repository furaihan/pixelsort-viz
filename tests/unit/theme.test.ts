/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEMES,
  THEME_LIST,
  getCanvasPalette,
  resolveCssVars,
  withAlpha,
  type ThemeId,
} from '../../src/lib/theme/palettes';

const EXPECTED_VARS = [
  '--color-ink',
  '--color-ink-2',
  '--color-ink-3',
  '--color-ink-4',
  '--color-line',
  '--color-line-strong',
  '--color-lime',
  '--color-soft-lime',
  '--color-pink',
  '--color-bubblegum',
  '--color-violet',
  '--color-text',
  '--color-muted',
  '--color-muted-2',
  '--color-danger',
  '--color-warning',
];

describe('theme registry', () => {
  it('has a default theme', () => {
    expect(THEMES[DEFAULT_THEME]).toBeDefined();
  });

  it('uses unique theme ids', () => {
    const ids = THEME_LIST.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every CSS variable with a non-empty value for every theme', () => {
    for (const entry of THEME_LIST) {
      const vars = resolveCssVars(entry.tokens);
      for (const name of EXPECTED_VARS) {
        expect(vars[name], `${entry.id} is missing ${name}`).toBeTruthy();
      }
    }
  });

  it('derives a complete canvas palette for every theme', () => {
    for (const entry of THEME_LIST) {
      const palette = getCanvasPalette(entry.id as ThemeId);
      expect(palette.primary).toBe(entry.tokens.accent);
      expect(palette.highlight).toBe(entry.tokens.highlight);
      expect(palette.secondary).toBe(entry.tokens.structural);
      expect(palette.ink).toBe(entry.tokens.ink);
      expect(palette.primarySoftStroke).toBe(withAlpha(entry.tokens.accent, 0.8));
      expect(palette.primaryTint).toBe(withAlpha(entry.tokens.accent, 0.08));
      expect(palette.inkBacking).toBe(withAlpha(entry.tokens.ink, 0.75));
    }
  });

  it('converts hex colors to rgba strings', () => {
    expect(withAlpha('#7eefff', 0.5)).toBe('rgba(126, 239, 255, 0.5)');
    expect(withAlpha('#fff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('keeps the CSS @theme fallback in sync with the default theme', () => {
    const css = readFileSync(new URL('../../src/app.css', import.meta.url), 'utf8');
    for (const [name, value] of Object.entries(resolveCssVars(THEMES[DEFAULT_THEME].tokens))) {
      expect(css, `app.css is missing ${name}: ${value};`).toContain(`${name}: ${value};`);
    }
  });

  it('keeps the pre-paint background hint in sync with the theme registry', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    for (const entry of THEME_LIST) {
      const pattern = new RegExp(`['"]${entry.id}['"]\\s*:\\s*['"]${entry.tokens.ink}['"]`);
      expect(
        html,
        `index.html is missing the pre-paint hint for ${entry.id}: ${entry.tokens.ink}`,
      ).toMatch(pattern);
    }
  });
});
