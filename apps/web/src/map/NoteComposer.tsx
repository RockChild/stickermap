import { useState } from "react";
import { createNote } from "../api/client.js";

const TTLS = [
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
];

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onCreated: () => void;
}

export function NoteComposer({ lat, lng, onClose, onCreated }: Props) {
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
      });
      onCreated();
    } catch (e) {
      const code = (e as Error).message;
      setErr(
        code === "unauthorized"
          ? "Sign in first (top-right) to drop a note."
          : code === "premium_required"
            ? "Permanent notes are a premium feature."
            : `Could not save: ${code}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="composer">
      <div className="composer__head">
        New note
        <button className="composer__x" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="composer__loc">
        📍 {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
      <input
        className="field"
        placeholder="Coffee meet?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="field composer__body"
        placeholder="Nero Cafe at the corner of 12 ave & 50 street"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
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
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !title.trim()}
          onClick={save}
        >
          Drop note
        </button>
      </div>
    </div>
  );
}
