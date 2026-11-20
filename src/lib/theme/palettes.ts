/**
 * Theme registry — the single source of truth for color palettes.
 *
 * The Run Ledger world: a lab notebook on graph paper. Every theme is a
 * sibling palette inside that one world — same roles, same form language,
 * different light. `ThemeTokens` is the contract: every required token must
 * be present (the `satisfies` clause enforces it at compile time), while the
 * optional tokens fall back to a sensible default.
 *
 * To add a theme, add one entry to `THEMES` below. The dropdown, persistence,
 * CSS custom properties, and the canvas overlay palette all derive from this
 * object, so no other file needs to change.
 */

export interface ThemeTokens {
  /** Page ground — the notebook sheet. */
  ground: string;
  /** Panel surface — conditions, data table, margin notes. */
  panel: string;
  /** Inset surface — inputs, metric cells, the plate backing. */
  inset: string;
  /** Highest raised surface — chips, stamps, active cells. */
  raised: string;
  /** Subtle borders and dividers — the pencil rule. */
  rule: string;
  /** Secondary structure — icons, frames, legend marks. */
  structure: string;
  /** Primary accent — selection, links, focus, interactive structure. */
  accent: string;
  /** Focal accent — active operations, primary action, alerts of progress. */
  focal: string;
  /** Primary text and headings — the ink. */
  text: string;
  /** Secondary copy and labels. */
  muted: string;
  /** Tertiary copy and metadata. */
  muted2: string;

  /** Overrides `--color-rule-strong`; defaults to `structure`. */
  ruleStrong?: string;
  /** Overrides `--color-accent-soft`; defaults to `accent`. */
  accentSoft?: string;
  /** Overrides `--color-danger`; defaults to the shared semantic red. */
  danger?: string;
  /** Overrides `--color-warning`; defaults to the shared semantic amber. */
  warning?: string;
}

export interface ThemeDefinition {
  id: string;
  /** Display name shown in the theme selector (English fallback). */
  name: string;
  /** i18n key for the localized display name. */
  nameKey: string;
  /** Native control color scheme; defaults to `dark`. */
  scheme?: 'dark' | 'light';
  tokens: ThemeTokens;
}

export interface CanvasPalette {
  primary: string;
  primarySoftStroke: string;
  primaryTint: string;
  highlight: string;
  secondary: string;
  ink: string;
  inkBacking: string;
}

/** Semantic state colors shared across the family — they carry meaning, not mood. */
const SEMANTIC = { danger: '#E27262', warning: '#D9A05B' } as const;

export const THEMES = {
  'warm-graphite': {
    id: 'warm-graphite',
    name: 'Warm Graphite',
    nameKey: 'theme.warmGraphite',
    scheme: 'dark',
    tokens: {
      // Midnight Graphite: the sheet. Cloud Cream: the ink.
      ground: '#252729',
      panel: '#2B2E30',
      // Dark Slate: inset surfaces.
      inset: '#343A3D',
      raised: '#3D4447',
      rule: '#3A3F42',
      structure: '#6E8891',
      // Misty Blue: selection and interactive structure.
      accent: '#9CBBC5',
      // Soft Coral: the active operation and the primary action.
      focal: '#E99588',
      text: '#EAE2D8',
      muted: '#B9C4C6',
      muted2: '#9AA8AC',
      ruleStrong: '#6E8891',
    },
  },
  'misty-blue': {
    id: 'misty-blue',
    name: 'Misty Blue',
    nameKey: 'theme.mistyBlue',
    scheme: 'dark',
    tokens: {
      // A cooler night at the same desk: blue-slate sheet, mist still primary.
      ground: '#1F262B',
      panel: '#263036',
      inset: '#2E3A41',
      raised: '#37454D',
      rule: '#35424A',
      structure: '#64808C',
      accent: '#8FB6C4',
      focal: '#E99588',
      text: '#E6EAEA',
      muted: '#B4C2C7',
      muted2: '#97A7AD',
      ruleStrong: '#6C8894',
    },
  },
  'coral-dusk': {
    id: 'coral-dusk',
    name: 'Coral Dusk',
    nameKey: 'theme.coralDusk',
    scheme: 'dark',
    tokens: {
      // A warmer evening: coral takes the interactive role, mist marks the work.
      ground: '#2B2523',
      panel: '#322B28',
      inset: '#3B322E',
      raised: '#453B36',
      rule: '#443B36',
      structure: '#9A8274',
      accent: '#E99588',
      focal: '#9CBBC5',
      text: '#EAE2D8',
      muted: '#C8BAB2',
      muted2: '#A99A91',
      ruleStrong: '#8A7568',
    },
  },
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeId = keyof typeof THEMES;

export const THEME_LIST: readonly ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME: ThemeId = 'warm-graphite';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES, value);
}

/**
 * Expand a theme's canonical tokens into the `--color-*` custom properties
 * consumed by Tailwind utilities and the app's CSS. Optional tokens inherit
 * from their canonical counterpart so a theme only specifies what differs.
 */
export function resolveCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    '--color-ground': tokens.ground,
    '--color-panel': tokens.panel,
    '--color-inset': tokens.inset,
    '--color-raised': tokens.raised,
    '--color-rule': tokens.rule,
    '--color-rule-strong': tokens.ruleStrong ?? tokens.structure,
    '--color-accent': tokens.accent,
    '--color-accent-soft': tokens.accentSoft ?? tokens.accent,
    '--color-focal': tokens.focal,
    '--color-structure': tokens.structure,
    '--color-text': tokens.text,
    '--color-muted': tokens.muted,
    '--color-muted-2': tokens.muted2,
    '--color-danger': tokens.danger ?? SEMANTIC.danger,
    '--color-warning': tokens.warning ?? SEMANTIC.warning,
  };
}

/** Derive the canvas overlay palette from a theme so it can never drift. */
export function getCanvasPalette(id: ThemeId): CanvasPalette {
  const tokens = THEMES[id].tokens;
  return {
    primary: tokens.accent,
    primarySoftStroke: withAlpha(tokens.accent, 0.8),
    primaryTint: withAlpha(tokens.accent, 0.08),
    highlight: tokens.focal,
    secondary: tokens.structure,
    ink: tokens.ground,
    inkBacking: withAlpha(tokens.ground, 0.75),
  };
}

/** Convert a `#RRGGBB` (or `#RGB`) hex color to an `rgba()` string. */
export function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((character) => character + character)
          .join('')
      : raw;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
