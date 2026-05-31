import type {
  BoardKind,
  NoteCategory,
  Place,
  Visibility,
} from "@stickerboard/shared";
import type { Knex } from "knex";

/** Raw `boards` row as stored in Postgres (snake_case). */
export interface BoardRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  // Reduced location (city/country centroid) — never precise coords.
  location: Place | null;
  is_published: boolean;
  version: number;
  premium_features: { crayonEnabled: boolean; collabEnabled: boolean };
  share_token: string | null;
  kind: BoardKind;
  category: NoteCategory | null;
  body: string | null;
  expires_at: Date | string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertBoard {
  owner_id: string;
  title: string;
  description?: string | null;
  visibility: Visibility;
  location?: Place | null;
  share_token?: string | null;
  kind?: BoardKind;
  category?: NoteCategory | null;
  body?: string | null;
  expires_at?: Date | string | null;
  is_published?: boolean;
}

export async function insertBoard(
  knex: Knex,
  data: InsertBoard,
): Promise<BoardRow> {
  const [row] = await knex<BoardRow>("boards")
    .insert({
      owner_id: data.owner_id,
      title: data.title,
      description: data.description ?? null,
      visibility: data.visibility,
      location: data.location ?? null,
      share_token: data.share_token ?? null,
      kind: data.kind ?? "board",
      category: data.category ?? null,
      body: data.body ?? null,
      expires_at: data.expires_at ?? null,
      is_published: data.is_published ?? false,
    })
    .returning("*");
  return row!;
}

export function findBoardById(
  knex: Knex,
  id: string,
): Promise<BoardRow | undefined> {
  return knex<BoardRow>("boards").where({ id }).first();
}

/** Marks a board published and bumps its version. */
export async function publishBoard(
  knex: Knex,
  id: string,
): Promise<BoardRow | undefined> {
  const [row] = await knex<BoardRow>("boards")
    .where({ id })
    .update({
      is_published: true,
      version: knex.raw("version + 1"),
      updated_at: knex.fn.now(),
    })
    .returning("*");
  return row;
}

export async function countStickers(
  knex: Knex,
  boardId: string,
): Promise<number> {
  const result = await knex("stickers")
    .where({ board_id: boardId })
    .count<{ count: string }[]>("* as count");
  return Number(result[0]?.count ?? 0);
}
