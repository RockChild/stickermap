import type { WallSticker } from "./contract.js";

export type WallMode = "board" | "stream";

/** Below this width the corkboard is impractical, so we use the stream. */
export const WALL_NARROW_PX = 720;

export function defaultWallMode(width: number): WallMode {
  return width < WALL_NARROW_PX ? "stream" : "board";
}

/** Compact "time ago" label for the stream. */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Stream order: pinned first, then newest first. */
export function sortForStream(stickers: WallSticker[]): WallSticker[] {
  return [...stickers].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
