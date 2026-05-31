import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import type { Board, Sticker, Visibility } from "@stickerboard/shared";
import {
  countStickers,
  findBoardById,
  insertBoard,
  publishBoard,
  type BoardRow,
} from "../models/board.js";
import {
  insertSticker,
  type StickerRow,
  type StickerStyle,
} from "../models/sticker.js";

/**
 * Domain error for board operations. Mirrors AuthError so routes can map
 * `statusCode`/`code` uniformly. ACL failures deliberately surface as 404 to
 * avoid leaking the existence of boards the caller may not see.
 */
export class BoardError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "BoardError";
  }
}

/** The created-board view returned to the owner (includes the share token). */
export interface OwnerBoardView extends Board {
  /** Present only for unlisted boards; the secret behind the share link. */
  shareToken?: string;
}

export interface CreateBoardInput {
  title: string;
  description?: string;
  visibility?: Visibility;
}

export interface NewStickerInput {
  type: Sticker["type"];
  content: string;
  position: { x: number; y: number };
  style: StickerStyle;
}

/** Maps a DB row to the shared Board shape (camelCase, no secrets). */
function toBoard(row: BoardRow): Board {
  const board: Board = {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    visibility: row.visibility,
    isPublished: row.is_published,
    version: row.version,
    premiumFeatures: row.premium_features,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
  if (row.description !== null) board.description = row.description;
  // location is already reduced (city/country centroid) before storage.
  if (row.location !== null) board.location = row.location;
  return board;
}

function toOwnerBoardView(row: BoardRow): OwnerBoardView {
  const view: OwnerBoardView = toBoard(row);
  if (row.share_token !== null) view.shareToken = row.share_token;
  return view;
}

function toSticker(row: StickerRow): Sticker {
  return {
    id: row.id,
    boardId: row.board_id,
    type: row.type,
    content: row.content ?? "",
    position: row.position,
    style: row.style,
    createdBy: row.created_by ?? "",
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createBoard(
  knex: Knex,
  ownerId: string,
  input: CreateBoardInput,
): Promise<OwnerBoardView> {
  const visibility: Visibility = input.visibility ?? "private";
  // The share token is the unlisted "share link" secret; only unlisted
  // boards get one. Public boards are discoverable; private boards are not
  // shareable by link.
  const shareToken = visibility === "unlisted" ? randomUUID() : null;

  const row = await insertBoard(knex, {
    owner_id: ownerId,
    title: input.title,
    description: input.description ?? null,
    visibility,
    share_token: shareToken,
  });
  return toOwnerBoardView(row);
}

/**
 * Fetches a board enforcing ACL. Returns null only for "not found OR not
 * allowed" so callers reply 404 without leaking existence.
 *
 * - public: anyone may read.
 * - unlisted: readable with the id, or with a matching share token.
 * - private: only the owner.
 */
export async function getBoardForReader(
  knex: Knex,
  id: string,
  reader: { userId: string | null; shareToken?: string | null },
): Promise<Board | null> {
  const row = await findBoardById(knex, id);
  if (!row) return null;

  const isOwner = reader.userId !== null && reader.userId === row.owner_id;
  if (isOwner) return toBoard(row);

  switch (row.visibility) {
    case "public":
      return toBoard(row);
    case "unlisted":
      // Holding the id is enough; a matching token is also accepted (and is
      // the intended flow for shared links).
      if (
        !reader.shareToken ||
        (row.share_token !== null && reader.shareToken === row.share_token)
      ) {
        return toBoard(row);
      }
      // A token was supplied but did not match — treat as not found.
      return null;
    case "private":
    default:
      return null;
  }
}

/** Loads a board the caller must OWN; otherwise throws 404 (no leak). */
async function loadOwnedBoard(
  knex: Knex,
  id: string,
  userId: string,
): Promise<BoardRow> {
  const row = await findBoardById(knex, id);
  if (!row || row.owner_id !== userId) {
    throw new BoardError(404, "board_not_found", "Board not found");
  }
  return row;
}

export async function addSticker(
  knex: Knex,
  boardId: string,
  userId: string,
  input: NewStickerInput,
): Promise<Sticker> {
  await loadOwnedBoard(knex, boardId, userId);
  const row = await insertSticker(knex, {
    board_id: boardId,
    type: input.type,
    content: input.content,
    position: input.position,
    style: input.style,
    created_by: userId,
  });
  return toSticker(row);
}

export async function saveBoard(
  knex: Knex,
  boardId: string,
  userId: string,
): Promise<Board> {
  await loadOwnedBoard(knex, boardId, userId);

  const stickerCount = await countStickers(knex, boardId);
  if (stickerCount < 1) {
    throw new BoardError(
      400,
      "no_stickers",
      "A board needs at least one sticker before it can be saved.",
    );
  }

  const updated = await publishBoard(knex, boardId);
  if (!updated) {
    throw new BoardError(404, "board_not_found", "Board not found");
  }
  return toBoard(updated);
}
