import { DEFAULT_THEME, THEMES, isThemeId, resolveCssVars, type ThemeId } from './palettes';

const STORAGE_KEY = 'pixel-sort-theme';

function detectTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeId(saved)) return saved;
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
  return DEFAULT_THEME;
}

class ThemeStore {
  current = $state<ThemeId>(detectTheme());

  constructor() {
    // Apply before the app mounts so the UI never paints with stale tokens.
    if (typeof document !== 'undefined') this.apply();
  }

  setTheme(id: ThemeId): void {
    if (!isThemeId(id) || id === this.current) return;
    this.current = id;
    this.apply();
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // The UI still works when persistence is unavailable.
    }
  }

  /** Svelte {$effect} sync: called whenever `current` changes, including via `bind:value`. */
  syncCurrent(): void {
    this.apply();
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, this.current);
    } catch {
      // The UI still works when persistence is unavailable.
    }
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    const definition = THEMES[this.current];
    const root = document.documentElement;
    root.dataset.theme = definition.id;
    root.style.colorScheme = definition.scheme ?? 'dark';

    const vars = resolveCssVars(definition.tokens);
    for (const name in vars) {
      root.style.setProperty(name, vars[name]);
    }

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', definition.tokens.ground);
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', definition.scheme ?? 'dark');
  }
}

export const theme = new ThemeStore();
