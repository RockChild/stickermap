import type { NoteCategory } from "@stickerboard/shared";
import { CATEGORIES } from "./categories.js";

interface Props {
  onPick: (category: NoteCategory) => void;
  onClose: () => void;
}

/**
 * Step 1 of creating a sticker: pick a category. Renders as a full-width
 * bottom bar on mobile and a centered modal of square buttons on desktop
 * (layout handled in CSS).
 */
export function CategoryPicker({ onPick, onClose }: Props) {
  return (
    <div className="cat-picker" onClick={onClose}>
      <div className="cat-picker__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cat-picker__head">
          What kind of sticker?
          <button className="composer__x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="cat-picker__grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`cat-btn cat-btn--${c.id}`}
              onClick={() => onPick(c.id)}
            >
              <span className="cat-btn__emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <span className="cat-btn__label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
