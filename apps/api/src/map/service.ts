import type { MapItem, Visibility } from "@stickerboard/shared";
import type { Knex } from "knex";
import { insertBoard } from "../models/board.js";
import {
  insertMapPin,
  listMapItems,
  type MapItemRow,
} from "../models/mapPin.js";

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
  });
}

export async function listMap(knex: Knex): Promise<MapItem[]> {
  const rows = await listMapItems(knex);
  return rows.map(toMapItem);
}
