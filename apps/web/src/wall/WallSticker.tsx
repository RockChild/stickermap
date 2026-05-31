import type { CSSProperties } from "react";
import type { WallSticker } from "./contract.js";

/** Deterministic tilt from the id so a sticker doesn't jump on re-render. */
function rotation(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (Math.abs(h) % 9) - 4; // -4..4 deg
}

interface Props {
  sticker: WallSticker;
  isOwner: boolean;
  onReact: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onRemove: (id: string) => void;
}

export function WallStickerCard({
  sticker,
  isOwner,
  onReact,
  onPin,
  onRemove,
}: Props) {
  const style = {
    left: `${sticker.position.x * 100}%`,
    top: `${sticker.position.y * 100}%`,
    "--rot": `${rotation(sticker.id)}deg`,
  } as CSSProperties;

  return (
    <div
      className={`wall-sticker wall-sticker--${sticker.category} wall-sticker--drop`}
      style={style}
    >
      <span className="tape" />
      {sticker.pinned && (
        <span className="wall-pin-badge" title="Pinned forever">
          📌
        </span>
      )}
      <div className="wall-sticker__text">{sticker.text}</div>
      <div className="wall-sticker__foot">
        <span className="wall-sticker__author">@{sticker.authorUsername}</span>
        <button
          className={`react-btn react-btn--mini ${
            sticker.reacted ? "react-btn--on" : ""
          }`}
          onClick={() => onReact(sticker.id)}
        >
          👍 {sticker.reactions}
        </button>
      </div>
      {isOwner && (
        <div className="wall-sticker__ctrls">
          <button
            title={sticker.pinned ? "Unpin" : "Pin forever"}
            onClick={() => onPin(sticker.id, !sticker.pinned)}
          >
            {sticker.pinned ? "📌" : "📍"}
          </button>
          <button title="Remove" onClick={() => onRemove(sticker.id)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
