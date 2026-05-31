import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME,
  getInitialTheme,
  isThemeId,
  loadTheme,
  nextTheme,
  saveTheme,
  STORAGE_KEY,
  THEME_IDS,
  type ThemeId,
  type ThemeStorage,
} from "../../src/theme/themeStore.js";

function fakeStorage(initial: Record<string, string> = {}): ThemeStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("themeStore", () => {
  it("cycles through all themes in order and wraps", () => {
    let t: ThemeId = "atelier";
    const seen: ThemeId[] = [t];
    for (let i = 0; i < THEME_IDS.length; i++) {
      t = nextTheme(t);
      seen.push(t);
    }
    expect(seen).toEqual(["atelier", "confetti", "midnight", "atelier"]);
  });

  it("validates theme ids", () => {
    expect(isThemeId("confetti")).toBe(true);
    expect(isThemeId("nope")).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it("persists and loads a theme", () => {
    const s = fakeStorage();
    saveTheme(s, "midnight");
    expect(s.getItem(STORAGE_KEY)).toBe("midnight");
    expect(loadTheme(s)).toBe("midnight");
  });

  it("ignores a corrupt stored value", () => {
    const s = fakeStorage({ [STORAGE_KEY]: "bogus" });
    expect(loadTheme(s)).toBeNull();
  });

  it("getInitialTheme returns the stored choice when present", () => {
    const s = fakeStorage({ [STORAGE_KEY]: "confetti" });
    expect(getInitialTheme(s)).toBe("confetti");
  });

  it("getInitialTheme falls back to the assignment seam, then default", () => {
    const s = fakeStorage();
    expect(getInitialTheme(s)).toBe(DEFAULT_THEME);
    expect(getInitialTheme(s, () => "midnight")).toBe("midnight");
  });
});
