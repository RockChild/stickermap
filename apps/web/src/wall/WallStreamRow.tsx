import type { WallSticker } from "./contract.js";
import { timeAgo } from "./layout.js";

interface Props {
  sticker: WallSticker;
  isOwner: boolean;
  onReact: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onRemove: (id: string) => void;
}

export function WallStreamRow({
  sticker,
  isOwner,
  onReact,
  onPin,
  onRemove,
}: Props) {
  return (
    <div className={`row-sticker row-sticker--${sticker.category}`}>
      <div className="row-body">
        <div className="row-text">{sticker.text}</div>
        <div className="row-meta">
          {sticker.pinned && <span className="pill">📌 pinned</span>}
          <span>@{sticker.authorUsername}</span>
          <span>· {timeAgo(sticker.createdAt)}</span>
          <button
            className={`react-btn react-btn--mini row-react ${
              sticker.reacted ? "react-btn--on" : ""
            }`}
            onClick={() => onReact(sticker.id)}
          >
            👍 {sticker.reactions}
          </button>
          {isOwner && (
            <>
              <button
                className="row-ctrl"
                title={sticker.pinned ? "Unpin" : "Pin forever"}
                onClick={() => onPin(sticker.id, !sticker.pinned)}
              >
                {sticker.pinned ? "📌" : "📍"}
              </button>
              <button
                className="row-ctrl"
                title="Remove"
                onClick={() => onRemove(sticker.id)}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
