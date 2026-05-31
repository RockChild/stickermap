import type { MapItem, Visibility } from "@stickerboard/shared";
import type { Knex } from "knex";
import { insertBoard } from "../models/board.js";
import {
  insertMapPin,
  listMapItems,
  type MapItemRow,
} from "../models/mapPin.js";
import {
  countReactions,
  toggleReaction as toggleReactionRow,
} from "../models/reaction.js";
import { getBoardForReader } from "../boards/service.js";

/** Domain error for map/note operations (mirrors BoardError/AuthError). */
export class MapError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "MapError";
  }
}

export interface CreateNoteInput {
  title: string;
  body?: string;
  lat: number;
  lng: number;
  /** Seconds until expiry; null requests a permanent (premium) note. */
  ttlSeconds: number | null;
  visibility?: Visibility;
}

function toMapItem(row: MapItemRow): MapItem {
  const item: MapItem = {
    id: row.pin_id,
    boardId: row.board_id,
    kind: row.kind,
    title: row.title,
    lat: row.lat,
    lng: row.lng,
    visibility: row.visibility,
    expiresAt:
      row.expires_at === null ? null : new Date(row.expires_at).toISOString(),
    reactions: row.reactions,
    reacted: row.reacted,
  };
  if (row.body !== null) item.body = row.body;
  return item;
}

/**
 * Creates a single map note: a board (kind='note') published immediately with
 * a precise dropped pin. Free notes must have a TTL; permanent notes are
 * premium-only.
 */
export async function createNote(
  knex: Knex,
  ownerId: string,
  input: CreateNoteInput,
  ctx: { isPremium: boolean },
): Promise<MapItem> {
  const visibility: Visibility = input.visibility ?? "public";

  let expiresAt: string | null;
  if (input.ttlSeconds === null) {
    if (!ctx.isPremium) {
      throw new MapError(
        402,
        "premium_required",
        "Permanent notes are a premium feature.",
      );
    }
    expiresAt = null;
  } else {
    expiresAt = new Date(Date.now() + input.ttlSeconds * 1000).toISOString();
  }

  const board = await insertBoard(knex, {
    owner_id: ownerId,
    title: input.title,
    body: input.body ?? null,
    visibility,
    kind: "note",
    is_published: true,
    expires_at: expiresAt,
  });

  const pin = await insertMapPin(knex, {
    board_id: board.id,
    lat: input.lat,
    lng: input.lng,
    location_name: input.title,
  });

  return toMapItem({
    pin_id: pin.id,
    board_id: board.id,
    kind: "note",
    title: board.title,
    body: board.body,
    visibility,
    expires_at: expiresAt,
    lat: input.lat,
    lng: input.lng,
    reactions: 0,
    reacted: false,
  });
}

export async function listMap(
  knex: Knex,
  viewerId: string | null,
): Promise<MapItem[]> {
  const rows = await listMapItems(knex, viewerId);
  return rows.map(toMapItem);
}

export interface ReactionResult {
  reactions: number;
  reacted: boolean;
}

/** Toggles the viewer's +1 on a board they can see. */
export async function toggleReaction(
  knex: Knex,
  boardId: string,
  userId: string,
): Promise<ReactionResult> {
  // Must be able to see the board to react (404 otherwise — no leak).
  const board = await getBoardForReader(knex, boardId, {
    userId,
    shareToken: null,
  });
  if (!board) {
    throw new MapError(404, "board_not_found", "Board not found");
  }
  const reacted = await toggleReactionRow(knex, boardId, userId);
  const reactions = await countReactions(knex, boardId);
  return { reactions, reacted };
}
