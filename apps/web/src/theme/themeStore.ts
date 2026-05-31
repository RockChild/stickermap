// Pure, framework-free theme logic so it can be unit-tested in Node without
// jsdom or a DOM. The React layer (ThemeProvider) is a thin wrapper over this.

export const THEME_IDS = ["atelier", "confetti", "midnight"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "atelier";
export const STORAGE_KEY = "stickerboard:theme";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as readonly string[]).includes(value)
  );
}

/** Cycle order for the toggle button; wraps back to the first theme. */
export function nextTheme(current: ThemeId): ThemeId {
  const i = THEME_IDS.indexOf(current);
  return THEME_IDS[(i + 1) % THEME_IDS.length]!;
}

/** Minimal storage shape — satisfied by window.localStorage and test fakes. */
export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadTheme(storage: ThemeStorage): ThemeId | null {
  const raw = storage.getItem(STORAGE_KEY);
  return isThemeId(raw) ? raw : null;
}

export function saveTheme(storage: ThemeStorage, id: ThemeId): void {
  storage.setItem(STORAGE_KEY, id);
}

/**
 * Resolve the theme to show on first load: a stored choice wins; otherwise we
 * call `assign()`. `assign` is the seam for future A/B experiment bucketing
 * (e.g. hash the user id into a theme). Defaults to DEFAULT_THEME.
 */
export function getInitialTheme(
  storage: ThemeStorage,
  assign: () => ThemeId = () => DEFAULT_THEME,
): ThemeId {
  return loadTheme(storage) ?? assign();
}
