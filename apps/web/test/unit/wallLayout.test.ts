import { describe, it, expect } from "vitest";
import type { WallSticker } from "../../src/wall/contract.js";
import {
  defaultWallMode,
  sortForStream,
  timeAgo,
} from "../../src/wall/layout.js";

function sticker(id: string, createdAt: string, pinned = false): WallSticker {
  return {
    id,
    category: "meet",
    text: id,
    authorUsername: "x",
    position: { x: 0.5, y: 0.5 },
    pinned,
    expiresAt: null,
    reactions: 0,
    reacted: false,
    createdAt,
  };
}

describe("wall layout helpers", () => {
  it("uses stream on narrow screens, board on wide", () => {
    expect(defaultWallMode(390)).toBe("stream");
    expect(defaultWallMode(1200)).toBe("board");
  });

  it("formats time ago", () => {
    const now = Date.parse("2026-06-01T12:00:00Z");
    expect(timeAgo("2026-06-01T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-06-01T11:30:00Z", now)).toBe("30m");
    expect(timeAgo("2026-06-01T09:00:00Z", now)).toBe("3h");
    expect(timeAgo("2026-05-30T12:00:00Z", now)).toBe("2d");
  });

  it("orders the stream: pinned first, then newest", () => {
    const out = sortForStream([
      sticker("old", "2026-06-01T08:00:00Z"),
      sticker("new", "2026-06-01T11:00:00Z"),
      sticker("pinned-old", "2026-06-01T07:00:00Z", true),
    ]);
    expect(out.map((s) => s.id)).toEqual(["pinned-old", "new", "old"]);
  });
});
