import type { NoteCategory, WallPostPolicy } from "@stickerboard/shared";
import type { Knex } from "knex";
import type { BoardRow } from "../models/board.js";
import { findByUsername } from "../models/user.js";
import { insertSticker } from "../models/sticker.js";
import {
  countPinned,
  deleteSticker,
  findStickerInWall,
  getOrCreateWall,
  listWallStickers,
  setStickerPinned,
  toggleStickerReaction,
  updateWallPolicy,
  type WallStickerRow,
} from "../models/wall.js";

const FREE_PIN_QUOTA = 10;
const DEFAULT_TTL_MS = 86_400_000;

export class WallError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "WallError";
  }
}

// Response shape == the frontend WallApi contract.
export interface WallStickerDto {
  id: string;
  category: NoteCategory;
  text: string;
  authorUsername: string;
  position: { x: number; y: number };
  pinned: boolean;
  expiresAt: string | null;
  reactions: number;
  reacted: boolean;
  createdAt: string;
}

export interface WallDto {
  ownerUsername: string;
  postPolicy: WallPostPolicy;
  isOwner: boolean;
  canPost: boolean;
  pinnedCount: number;
  freePinQuota: number;
  stickers: WallStickerDto[];
}

export interface NewWallStickerInput {
  category: NoteCategory;
  text: string;
  position: { x: number; y: number };
  ttlSeconds: number;
}

function canPost(
  policy: WallPostPolicy,
  ownerId: string,
  viewerId: string | null,
): boolean {
  if (viewerId !== null && viewerId === ownerId) return true;
  if (viewerId === null) return false;
  // 'approved' requires a grant flow (not built yet) → only the owner for now.
  return policy === "anyone";
}

function toStickerDto(row: WallStickerRow): WallStickerDto {
  return {
    id: row.id,
    category: (row.category ?? "meet") as NoteCategory,
    text: row.content ?? "",
    authorUsername: row.author_username,
    position: row.position,
    pinned: row.pinned,
    expiresAt:
      row.expires_at === null ? null : new Date(row.expires_at).toISOString(),
    reactions: row.reactions,
    reacted: row.reacted,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function buildWall(
  knex: Knex,
  wall: BoardRow,
  ownerUsername: string,
  viewerId: string | null,
): Promise<WallDto> {
  const rows = await listWallStickers(knex, wall.id, viewerId);
  return {
    ownerUsername,
    postPolicy: wall.post_policy,
    isOwner: viewerId !== null && viewerId === wall.owner_id,
    canPost: canPost(wall.post_policy, wall.owner_id, viewerId),
    pinnedCount: rows.filter((r) => r.pinned).length,
    freePinQuota: FREE_PIN_QUOTA,
    stickers: rows.map(toStickerDto),
  };
}

/** Resolve a handle to its (lazily created) wall board. */
async function resolveWall(
  knex: Knex,
  handle: string,
): Promise<{ wall: BoardRow; username: string }> {
  const user = await findByUsername(knex, handle);
  if (!user) throw new WallError(404, "not_found", "Wall not found");
  const wall = await getOrCreateWall(knex, user.id, user.username);
  return { wall, username: user.username };
}

export async function getWall(
  knex: Knex,
  handle: string,
  viewerId: string | null,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  return buildWall(knex, wall, username, viewerId);
}

export async function stickOnWall(
  knex: Knex,
  handle: string,
  viewerId: string,
  input: NewWallStickerInput,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  if (!canPost(wall.post_policy, wall.owner_id, viewerId)) {
    throw new WallError(403, "not_allowed", "You can't post on this wall");
  }
  await insertSticker(knex, {
    board_id: wall.id,
    type: "note",
    content: input.text,
    position: input.position,
    style: { color: "#ffffff", rotation: 0, size: "medium" },
    created_by: viewerId,
    category: input.category,
    expires_at: new Date(Date.now() + input.ttlSeconds * 1000).toISOString(),
  });
  return buildWall(knex, wall, username, viewerId);
}

export async function setStickerPin(
  knex: Knex,
  handle: string,
  viewerId: string,
  stickerId: string,
  pinned: boolean,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  if (viewerId !== wall.owner_id) {
    throw new WallError(403, "not_allowed", "Only the owner can pin");
  }
  const sticker = await findStickerInWall(knex, wall.id, stickerId);
  if (!sticker) throw new WallError(404, "not_found", "Sticker not found");

  if (pinned && !sticker.pinned) {
    const pinnedCount = await countPinned(knex, wall.id);
    if (pinnedCount >= FREE_PIN_QUOTA) {
      throw new WallError(402, "pin_quota_reached", "Free pin limit reached");
    }
  }
  const expiresAt = pinned
    ? null
    : new Date(Date.now() + DEFAULT_TTL_MS).toISOString();
  await setStickerPinned(knex, stickerId, pinned, expiresAt);
  return buildWall(knex, wall, username, viewerId);
}

export async function removeSticker(
  knex: Knex,
  handle: string,
  viewerId: string,
  stickerId: string,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  const sticker = await findStickerInWall(knex, wall.id, stickerId);
  if (!sticker) throw new WallError(404, "not_found", "Sticker not found");
  // Owner removes anything; an author removes their own.
  if (viewerId !== wall.owner_id && sticker.created_by !== viewerId) {
    throw new WallError(403, "not_allowed", "You can't remove this sticker");
  }
  await deleteSticker(knex, stickerId);
  return buildWall(knex, wall, username, viewerId);
}

export async function setWallPolicy(
  knex: Knex,
  handle: string,
  viewerId: string,
  policy: WallPostPolicy,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  if (viewerId !== wall.owner_id) {
    throw new WallError(403, "not_allowed", "Only the owner can change this");
  }
  await updateWallPolicy(knex, wall.id, policy);
  const updated: BoardRow = { ...wall, post_policy: policy };
  return buildWall(knex, updated, username, viewerId);
}

export async function reactToSticker(
  knex: Knex,
  handle: string,
  viewerId: string,
  stickerId: string,
): Promise<WallDto> {
  const { wall, username } = await resolveWall(knex, handle);
  const sticker = await findStickerInWall(knex, wall.id, stickerId);
  if (!sticker) throw new WallError(404, "not_found", "Sticker not found");
  await toggleStickerReaction(knex, stickerId, viewerId);
  return buildWall(knex, wall, username, viewerId);
}
