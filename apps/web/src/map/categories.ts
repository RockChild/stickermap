import type { NoteCategory } from "@stickerboard/shared";

export interface CategoryMeta {
  id: NoteCategory;
  label: string;
  emoji: string;
}

// Order = display order in the picker. Color comes from CSS var --cat-<id>,
// which is themed (see styles/themes.css).
export const CATEGORIES: CategoryMeta[] = [
  { id: "help", label: "Need help", emoji: "🆘" },
  { id: "meet", label: "Wanna meet", emoji: "👋" },
  { id: "whatif", label: "What if", emoji: "💭" },
  { id: "cry", label: "CRY!", emoji: "😢" },
];

export function categoryMeta(id: NoteCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]!;
}
