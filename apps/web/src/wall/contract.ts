import type { NoteCategory } from "@stickerboard/shared";

// ── The contract the UI assumes from the backend ──────────────────────────
// Build the UI against this; implement it as a mock now, real HTTP later.
// (Building UI-first lets us discover what we actually need from BE.)

export type WallPostPolicy = "owner_only" | "approved" | "anyone";

export interface WallSticker {
  id: string;
  category: NoteCategory;
  text: string;
  authorUsername: string;
  /** Position relative to the wall, 0..1 on each axis (responsive). */
  position: { x: number; y: number };
  pinned: boolean;
  /** ISO; null = permanent (pinned). */
  expiresAt: string | null;
  reactions: number;
  reacted: boolean;
  createdAt: string;
}

export interface Wall {
  ownerUsername: string;
  postPolicy: WallPostPolicy;
  /** Is the current viewer the owner? */
  isOwner: boolean;
  /** May the current viewer stick a sticker (policy + membership)? */
  canPost: boolean;
  pinnedCount: number;
  /** Free pins allowed before premium is required. */
  freePinQuota: number;
  stickers: WallSticker[];
}

export interface NewWallSticker {
  category: NoteCategory;
  text: string;
  position: { x: number; y: number };
  ttlSeconds: number;
}

/** Stable error codes the UI maps to friendly copy. */
export type WallErrorCode =
  | "not_allowed"
  | "pin_quota_reached"
  | "not_found"
  | "unauthenticated";

export class WallError extends Error {
  constructor(public code: WallErrorCode) {
    super(code);
    this.name = "WallError";
  }
}

/**
 * Mutations return the updated Wall so the UI re-renders from one source of
 * truth. (BE can return the wall or the UI can refetch — same effect.)
 */
export interface WallApi {
  getWall(handle: string): Promise<Wall>;
  stick(handle: string, input: NewWallSticker): Promise<Wall>;
  setPin(handle: string, stickerId: string, pinned: boolean): Promise<Wall>;
  remove(handle: string, stickerId: string): Promise<Wall>;
  setPolicy(handle: string, policy: WallPostPolicy): Promise<Wall>;
  react(handle: string, stickerId: string): Promise<Wall>;
}
