import { useState } from "react";
import type { NoteCategory } from "@stickerboard/shared";
import { categoryMeta } from "../map/categories.js";

// Same free ETAs as map notes (≤ 1 day free).
const TTLS = [
  { label: "1 hour", seconds: 3600 },
  { label: "12 hours", seconds: 43200 },
  { label: "24 hours", seconds: 86400 },
];

interface Props {
  category: NoteCategory;
  onBack: () => void;
  onStick: (text: string, ttlSeconds: number) => Promise<void>;
}

export function WallComposer({ category, onBack, onStick }: Props) {
  const meta = categoryMeta(category);
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onStick(text.trim(), ttl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="composer">
      <div className="composer__head">
        {meta.emoji} {meta.label}
        <button className="composer__x" onClick={onBack} aria-label="Back">
          ✕
        </button>
      </div>
      <div className={`sticker-edit sticker-edit--${category}`}>
        <span className="tape" />
        <textarea
          className="sticker-edit__text"
          placeholder="Write your sticker…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          autoFocus
        />
      </div>
      <div className="composer__ttl">
        <span className="composer__ttl-label">Expires in</span>
        {TTLS.map((o) => (
          <button
            key={o.seconds}
            className={`chip ${ttl === o.seconds ? "chip--on" : ""}`}
            onClick={() => setTtl(o.seconds)}
          >
            {o.label}
          </button>
        ))}
        <button className="chip chip--lock" disabled title="Premium feature">
          Never 🔒
        </button>
      </div>
      <div className="composer__actions">
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !text.trim()}
          onClick={save}
        >
          Stick it
        </button>
      </div>
    </div>
  );
}
