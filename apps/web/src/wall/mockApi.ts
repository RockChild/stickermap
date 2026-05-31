import type { NoteCategory } from "@stickerboard/shared";
import {
  WallError,
  type NewWallSticker,
  type Wall,
  type WallApi,
  type WallPostPolicy,
  type WallSticker,
} from "./contract.js";

const FREE_PIN_QUOTA = 10;

interface InternalWall {
  ownerUsername: string;
  postPolicy: WallPostPolicy;
  approved: Set<string>;
  stickers: WallSticker[];
}

function uid(): string {
  return crypto.randomUUID();
}

function seedSticker(
  category: NoteCategory,
  text: string,
  author: string,
  x: number,
  y: number,
  pinned = false,
): WallSticker {
  return {
    id: uid(),
    category,
    text,
    authorUsername: author,
    position: { x, y },
    pinned,
    expiresAt: pinned ? null : new Date(Date.now() + 86_400_000).toISOString(),
    reactions: Math.floor(Math.random() * 4),
    reacted: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * In-memory WallApi. `currentUsername` is the signed-in viewer (or null).
 * Seeds a demo friend wall so the visitor experience is explorable.
 */
export function createMockWallApi(currentUsername: string | null): WallApi {
  const walls = new Map<string, InternalWall>();

  // Demo friend wall (open policy so a signed-in visitor can post).
  walls.set("demo_friend", {
    ownerUsername: "demo_friend",
    postPolicy: "anyone",
    approved: new Set(),
    stickers: [
      seedSticker(
        "meet",
        "Coffee Sat 10am? ☕",
        "demo_friend",
        0.28,
        0.32,
        true,
      ),
      seedSticker(
        "whatif",
        "what if we did a picnic",
        "sunny_otter",
        0.62,
        0.4,
      ),
      seedSticker(
        "help",
        "need a ride to the airport",
        "brave_maple",
        0.45,
        0.66,
      ),
    ],
  });

  function lazyWall(handle: string): InternalWall {
    let w = walls.get(handle);
    if (!w) {
      w = {
        ownerUsername: handle,
        postPolicy: "approved",
        approved: new Set(),
        stickers: [],
      };
      walls.set(handle, w);
    }
    return w;
  }

  function isOwner(w: InternalWall): boolean {
    return currentUsername !== null && currentUsername === w.ownerUsername;
  }

  function canPost(w: InternalWall): boolean {
    if (isOwner(w)) return true;
    if (currentUsername === null) return false;
    if (w.postPolicy === "anyone") return true;
    if (w.postPolicy === "approved") return w.approved.has(currentUsername);
    return false;
  }

  function view(w: InternalWall): Wall {
    return {
      ownerUsername: w.ownerUsername,
      postPolicy: w.postPolicy,
      isOwner: isOwner(w),
      canPost: canPost(w),
      pinnedCount: w.stickers.filter((s) => s.pinned).length,
      freePinQuota: FREE_PIN_QUOTA,
      stickers: [...w.stickers],
    };
  }

  function requireOwner(w: InternalWall): void {
    if (!isOwner(w)) throw new WallError("not_allowed");
  }

  return {
    async getWall(handle) {
      return view(lazyWall(handle));
    },

    async stick(handle, input: NewWallSticker) {
      const w = lazyWall(handle);
      if (!canPost(w)) {
        throw new WallError(
          currentUsername === null ? "unauthenticated" : "not_allowed",
        );
      }
      w.stickers.push({
        id: uid(),
        category: input.category,
        text: input.text,
        authorUsername: currentUsername ?? "guest",
        position: input.position,
        pinned: false,
        expiresAt: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
        reactions: 0,
        reacted: false,
        createdAt: new Date().toISOString(),
      });
      return view(w);
    },

    async setPin(handle, stickerId, pinned) {
      const w = lazyWall(handle);
      requireOwner(w);
      const s = w.stickers.find((x) => x.id === stickerId);
      if (!s) throw new WallError("not_found");
      if (pinned && !s.pinned) {
        const pinnedCount = w.stickers.filter((x) => x.pinned).length;
        if (pinnedCount >= FREE_PIN_QUOTA) {
          throw new WallError("pin_quota_reached");
        }
      }
      s.pinned = pinned;
      s.expiresAt = pinned
        ? null
        : new Date(Date.now() + 86_400_000).toISOString();
      return view(w);
    },

    async remove(handle, stickerId) {
      const w = lazyWall(handle);
      const s = w.stickers.find((x) => x.id === stickerId);
      if (!s) throw new WallError("not_found");
      // Owner removes anything; an author removes their own.
      if (!isOwner(w) && s.authorUsername !== currentUsername) {
        throw new WallError("not_allowed");
      }
      w.stickers = w.stickers.filter((x) => x.id !== stickerId);
      return view(w);
    },

    async setPolicy(handle, policy) {
      const w = lazyWall(handle);
      requireOwner(w);
      w.postPolicy = policy;
      return view(w);
    },

    async react(handle, stickerId) {
      const w = lazyWall(handle);
      const s = w.stickers.find((x) => x.id === stickerId);
      if (!s) throw new WallError("not_found");
      s.reacted = !s.reacted;
      s.reactions += s.reacted ? 1 : -1;
      return view(w);
    },
  };
}
