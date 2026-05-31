import type { ThemeId } from "./themeStore.js";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  emoji: string;
  tagline: string;
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  atelier: {
    id: "atelier",
    label: "Atelier",
    emoji: "📜",
    tagline: "Refined & minimal",
  },
  confetti: {
    id: "confetti",
    label: "Confetti",
    emoji: "🎉",
    tagline: "Cute & playful",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    emoji: "🌙",
    tagline: "Dark & premium",
  },
};
