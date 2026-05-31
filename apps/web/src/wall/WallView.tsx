import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { NoteCategory } from "@stickerboard/shared";
import {
  WallError,
  type Wall,
  type WallApi,
  type WallPostPolicy,
} from "./contract.js";
import { WallStickerCard } from "./WallSticker.js";
import { WallComposer } from "./WallComposer.js";
import { CategoryPicker } from "../map/CategoryPicker.js";
import { burstConfetti } from "../ui/confetti.js";

const POLICIES: { id: WallPostPolicy; label: string }[] = [
  { id: "owner_only", label: "Only me" },
  { id: "approved", label: "Approved" },
  { id: "anyone", label: "Anyone" },
];

function errMessage(e: unknown): string {
  const code = e instanceof WallError ? e.code : "";
  if (code === "pin_quota_reached")
    return "Free pin limit reached (10). Premium unlocks unlimited pins.";
  if (code === "unauthenticated") return "Sign in to stick a sticker.";
  if (code === "not_allowed") return "You can't do that on this wall.";
  return "Something went wrong.";
}

interface Props {
  api: WallApi;
  handle: string;
  myHandle: string | null;
  onExit: () => void;
  onVisit: (handle: string) => void;
}

export function WallView({ api, handle, myHandle, onExit, onVisit }: Props) {
  const [wall, setWall] = useState<Wall | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;
    setWall(null);
    setMsg(null);
    void api.getWall(handle).then((w) => {
      if (live) setWall(w);
    });
    return () => {
      live = false;
    };
  }, [api, handle]);

  async function act(fn: () => Promise<Wall>) {
    try {
      setMsg(null);
      setWall(await fn());
    } catch (e) {
      setMsg(errMessage(e));
    }
  }

  function onCanvasClick(e: MouseEvent<HTMLDivElement>) {
    if (!wall?.canPost || pending) return;
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setCategory(null);
    setPending({ x, y });
  }

  if (!wall) {
    return (
      <div className="wall">
        <div className="wall__loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const policyText =
    wall.postPolicy === "anyone"
      ? "anyone can post"
      : wall.postPolicy === "approved"
        ? "approved people can post"
        : "only the owner posts";

  return (
    <div className="wall">
      <div className="wall__bar">
        <button className="btn btn-ghost btn-sm" onClick={onExit}>
          ← Map
        </button>
        <div className="wall__title">@{wall.ownerUsername}</div>

        {wall.isOwner ? (
          <>
            <div className="seg" role="group" aria-label="Who can post">
              {POLICIES.map((p) => (
                <button
                  key={p.id}
                  aria-pressed={wall.postPolicy === p.id}
                  onClick={() => act(() => api.setPolicy(handle, p.id))}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="wall__quota" title="Pins used (free quota)">
              📌 {wall.pinnedCount}/{wall.freePinQuota}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  `${location.origin}/@${wall.ownerUsername}`,
                );
                setMsg("Wall link copied to clipboard.");
              }}
            >
              Share
            </button>
          </>
        ) : (
          <span className="wall__policy">{policyText}</span>
        )}

        <span className="wall__spacer" />
        {myHandle && handle !== myHandle && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onVisit(myHandle)}
          >
            My wall
          </button>
        )}
        {handle !== "demo_friend" && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onVisit("demo_friend")}
          >
            @demo_friend
          </button>
        )}
      </div>

      {msg && <div className="wall__msg">{msg}</div>}

      <div className="wall__canvas" ref={canvasRef} onClick={onCanvasClick}>
        {wall.stickers.map((s) => (
          <WallStickerCard
            key={s.id}
            sticker={s}
            isOwner={wall.isOwner}
            onReact={(id) => act(() => api.react(handle, id))}
            onPin={(id, pinned) => act(() => api.setPin(handle, id, pinned))}
            onRemove={(id) => act(() => api.remove(handle, id))}
          />
        ))}
        {!pending && (
          <div className="wall__hint">
            {wall.canPost
              ? "Tap the wall to stick a sticker."
              : "You can't post here — ask the owner for access."}
          </div>
        )}
      </div>

      {pending && !category && (
        <CategoryPicker
          onPick={setCategory}
          onClose={() => {
            setPending(null);
            setCategory(null);
          }}
        />
      )}

      {pending && category && (
        <WallComposer
          category={category}
          onBack={() => setCategory(null)}
          onStick={async (text, ttl) => {
            try {
              const w = await api.stick(handle, {
                category,
                text,
                position: pending,
                ttlSeconds: ttl,
              });
              setWall(w);
              setPending(null);
              setCategory(null);
              burstConfetti(window.innerWidth / 2, window.innerHeight * 0.62);
            } catch (e) {
              setMsg(errMessage(e));
            }
          }}
        />
      )}
    </div>
  );
}
