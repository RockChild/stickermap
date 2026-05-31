import type { NoteCategory } from "@stickerboard/shared";
import { CATEGORIES } from "./categories.js";

interface Props {
  active: Set<NoteCategory>;
  onToggle: (id: NoteCategory) => void;
}

/** Toggle which sticker categories are shown on the map (any subset). */
export function FilterBar({ active, onToggle }: Props) {
  return (
    <div
      className="filter-bar"
      role="group"
      aria-label="Filter sticker categories"
    >
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          className={`filter-chip filter-chip--${c.id} ${
            active.has(c.id) ? "is-on" : ""
          }`}
          onClick={() => onToggle(c.id)}
          aria-pressed={active.has(c.id)}
          title={`${active.has(c.id) ? "Hide" : "Show"} ${c.label}`}
        >
          <span aria-hidden="true">{c.emoji}</span>
        </button>
      ))}
    </div>
  );
}
