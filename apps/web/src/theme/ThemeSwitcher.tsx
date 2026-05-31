import { useTheme } from "./ThemeProvider.js";
import { nextTheme } from "./themeStore.js";
import { THEME_META } from "./themes.js";

/**
 * Cycle button: shows the current theme; one tap advances to the next.
 * Works identically on desktop and mobile (it's just a button).
 */
export function ThemeSwitcher() {
  const { theme, cycleTheme } = useTheme();
  const current = THEME_META[theme];
  const upcoming = THEME_META[nextTheme(theme)];

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={cycleTheme}
      aria-label={`Theme: ${current.label}. Tap to switch to ${upcoming.label}.`}
      title={`Theme: ${current.label} — tap for ${upcoming.label}`}
    >
      <span className="theme-switcher__emoji" aria-hidden="true">
        {current.emoji}
      </span>
      <span className="theme-switcher__label">{current.label}</span>
    </button>
  );
}
