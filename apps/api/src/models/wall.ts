import type { NoteCategory, WallPostPolicy } from "@stickerboard/shared";
import type { Knex } from "knex";
import { insertBoard, type BoardRow } from "./board.js";

export function findWallByOwner(
  knex: Knex,
  ownerId: string,
): Promise<BoardRow | undefined> {
  return knex<BoardRow>("boards")
    .where({ owner_id: ownerId, kind: "wall" })
    .first();
}

/** One wall per user, created lazily on first access. */
export async function getOrCreateWall(
  knex: Knex,
  ownerId: string,
  username: string,
): Promise<BoardRow> {
  const existing = await findWallByOwner(knex, ownerId);
  if (existing) return existing;
  return insertBoard(knex, {
    owner_id: ownerId,
    title: `@${username}'s wall`,
    visibility: "unlisted",
    kind: "wall",
    is_published: false,
    post_policy: "approved",
  });
}

export async function updateWallPolicy(
  knex: Knex,
  wallId: string,
  policy: WallPostPolicy,
): Promise<void> {
  await knex("boards")
    .where({ id: wallId })
    .update({ post_policy: policy, updated_at: knex.fn.now() });
}

export interface WallStickerRow {
  id: string;
  category: NoteCategory | null;
  content: string | null;
  position: { x: number; y: number };
  pinned: boolean;
  expires_at: Date | string | null;
  created_at: string;
  created_by: string | null;
  author_username: string;
  reactions: number;
  reacted: boolean;
}

/** Non-expired stickers on a wall, with author handle + reaction state. */
export function listWallStickers(
  knex: Knex,
  wallId: string,
  viewerId: string | null,
): Promise<WallStickerRow[]> {
  return knex("stickers as s")
    .join("users as u", "u.id", "s.created_by")
    .where("s.board_id", wallId)
    .andWhere((q) =>
      q.whereNull("s.expires_at").orWhere("s.expires_at", ">", knex.fn.now()),
    )
    .select(
      "s.id",
      "s.category",
      "s.content",
      "s.position",
      "s.pinned",
      "s.expires_at",
      "s.created_at",
      "s.created_by",
      "u.username as author_username",
      knex.raw(
        "(SELECT count(*)::int FROM sticker_reactions r WHERE r.sticker_id = s.id) as reactions",
      ),
      knex.raw(
        "EXISTS(SELECT 1 FROM sticker_reactions r WHERE r.sticker_id = s.id AND r.user_id = ?) as reacted",
        [viewerId],
      ),
    )
    .orderBy("s.created_at", "asc");
}

export async function countPinned(knex: Knex, wallId: string): Promise<number> {
  const result = await knex("stickers")
    .where({ board_id: wallId, pinned: true })
    .count<{ count: string }[]>("* as count");
  return Number(result[0]?.count ?? 0);
}

export interface WallStickerOwnership {
  id: string;
  created_by: string | null;
  pinned: boolean;
}

export function findStickerInWall(
  knex: Knex,
  wallId: string,
  stickerId: string,
): Promise<WallStickerOwnership | undefined> {
  return knex<WallStickerOwnership>("stickers")
    .where({ id: stickerId, board_id: wallId })
    .select("id", "created_by", "pinned")
    .first();
}

export async function setStickerPinned(
  knex: Knex,
  stickerId: string,
  pinned: boolean,
  expiresAt: string | null,
): Promise<void> {
  await knex("stickers")
    .where({ id: stickerId })
    .update({ pinned, expires_at: expiresAt });
}

export async function deleteSticker(
  knex: Knex,
  stickerId: string,
): Promise<void> {
  await knex("stickers").where({ id: stickerId }).del();
}

/** Toggle a +1 on a sticker; returns whether it is now reacted. */
export async function toggleStickerReaction(
  knex: Knex,
  stickerId: string,
  userId: string,
): Promise<boolean> {
  const existing = await knex("sticker_reactions")
    .where({ sticker_id: stickerId, user_id: userId })
    .first();
  if (existing) {
    await knex("sticker_reactions").where({ id: existing.id }).del();
    return false;
  }
  await knex("sticker_reactions").insert({
    sticker_id: stickerId,
    user_id: userId,
  });
  return true;
}
