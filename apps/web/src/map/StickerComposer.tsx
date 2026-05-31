import { useState } from "react";
import type { NoteCategory } from "@stickerboard/shared";
import { createNote } from "../api/client.js";
import { categoryMeta } from "./categories.js";

// Free single-note ETAs, capped at 1 day (see lifetime tiers in docs).
const TTLS = [
  { label: "1 hour", seconds: 3600 },
  { label: "12 hours", seconds: 43200 },
  { label: "24 hours", seconds: 86400 },
];

interface Props {
  lat: number;
  lng: number;
  category: NoteCategory;
  onBack: () => void;
  onCreated: () => void;
}

export function StickerComposer({
  lat,
  lng,
  category,
  onBack,
  onCreated,
}: Props) {
  const meta = categoryMeta(category);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createNote({
        title: title.trim(),
        body: body.trim() || undefined,
        lat,
        lng,
        ttlSeconds: ttl,
        category,
      });
      onCreated();
    } catch (e) {
      const code = (e as Error).message;
      setErr(
        code === "unauthorized"
          ? "Sign in first (top-right) to drop a sticker."
          : code === "premium_required"
            ? "Permanent stickers are a premium feature."
            : `Could not save: ${code}`,
      );
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          autoFocus
        />
      </div>

      <input
        className="field"
        placeholder="Add a detail (optional) — e.g. Nero Cafe, 12th & 50th"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="composer__loc">
        📍 {lat.toFixed(4)}, {lng.toFixed(4)}
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

      {err && <div className="composer__err">{err}</div>}

      <div className="composer__actions">
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !title.trim()}
          onClick={save}
        >
          Drop sticker
        </button>
      </div>
    </div>
  );
}
