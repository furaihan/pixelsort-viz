/**
 * Theme registry — the single source of truth for color palettes.
 *
 * To add a theme, add one entry to `THEMES` below. The dropdown, persistence,
 * CSS custom properties, and the canvas overlay palette all derive from this
 * object, so no other file needs to change. `ThemeTokens` is the contract:
 * every required token must be present (the `satisfies` clause enforces it at
 * compile time), while the optional tokens fall back to a sensible default.
 */

export interface ThemeTokens {
  /** Primary background and structural foundation. */
  ink: string;
  /** Secondary background: panels, containers. */
  ink2: string;
  /** Inset/raised surfaces: metric cells, inputs. */
  ink3: string;
  /** Highest raised surface. */
  ink4: string;
  /** Subtle borders and dividers. */
  line: string;
  /** Secondary structure: line-strong, bubblegum, violet. */
  structural: string;
  /** Primary accent: lime, soft-lime, focus, links. */
  accent: string;
  /** Focal accent: pink, danger, warning, CTA offset. */
  highlight: string;
  /** Primary text and headings. */
  text: string;
  /** Secondary copy and labels. */
  muted: string;
  /** Tertiary copy and metadata. */
  muted2: string;

  /** Overrides `--color-line-strong`; defaults to `structural`. */
  lineStrong?: string;
  /** Overrides `--color-soft-lime`; defaults to `accent`. */
  accentSoft?: string;
  /** Overrides `--color-danger`; defaults to `highlight`. */
  danger?: string;
  /** Overrides `--color-warning`; defaults to `highlight`. */
  warning?: string;
}

export interface ThemeDefinition {
  id: string;
  /** Display name shown in the theme selector. */
  name: string;
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

export const THEMES = {
  'quantum-signal': {
    id: 'quantum-signal',
    name: 'Quantum Signal',
    scheme: 'dark',
    tokens: {
      ink: '#111116',
      ink2: '#171921',
      ink3: '#1d1f28',
      ink4: '#23252f',
      line: '#d8dce8',
      structural: '#6c75a5',
      accent: '#9accf0',
      highlight: '#f14b50',
      text: '#d8dce8',
      muted: '#b8bcc8',
      muted2: '#9ca0b0',
    },
  },
  'midnight-splash': {
    id: 'midnight-splash',
    name: 'Midnight Splash',
    scheme: 'dark',
    tokens: {
      ink: '#182644',
      ink2: '#1f2e52',
      ink3: '#263d60',
      ink4: '#2c476e',
      line: '#dcebf2',
      structural: '#6c9bd1',
      accent: '#7eefff',
      highlight: '#ff5076',
      text: '#dcebf2',
      muted: '#a9bacb',
      muted2: '#9aadc2',
    },
  },
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeId = keyof typeof THEMES;

export const THEME_LIST: readonly ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME: ThemeId = 'quantum-signal';

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
    '--color-ink': tokens.ink,
    '--color-ink-2': tokens.ink2,
    '--color-ink-3': tokens.ink3,
    '--color-ink-4': tokens.ink4,
    '--color-line': tokens.line,
    '--color-line-strong': tokens.lineStrong ?? tokens.structural,
    '--color-lime': tokens.accent,
    '--color-soft-lime': tokens.accentSoft ?? tokens.accent,
    '--color-pink': tokens.highlight,
    '--color-bubblegum': tokens.structural,
    '--color-violet': tokens.structural,
    '--color-text': tokens.text,
    '--color-muted': tokens.muted,
    '--color-muted-2': tokens.muted2,
    '--color-danger': tokens.danger ?? tokens.highlight,
    '--color-warning': tokens.warning ?? tokens.highlight,
  };
}

/** Derive the canvas overlay palette from a theme so it can never drift. */
export function getCanvasPalette(id: ThemeId): CanvasPalette {
  const tokens = THEMES[id].tokens;
  return {
    primary: tokens.accent,
    primarySoftStroke: withAlpha(tokens.accent, 0.8),
    primaryTint: withAlpha(tokens.accent, 0.08),
    highlight: tokens.highlight,
    secondary: tokens.structural,
    ink: tokens.ink,
    inkBacking: withAlpha(tokens.ink, 0.75),
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
