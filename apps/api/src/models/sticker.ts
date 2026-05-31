import type { Knex } from "knex";
import type { NoteCategory, StickerType } from "@stickerboard/shared";

export interface StickerStyle {
  color: string;
  rotation: number;
  size: "small" | "medium" | "large";
}

/** Raw `stickers` row as stored in Postgres (snake_case). */
export interface StickerRow {
  id: string;
  board_id: string;
  type: StickerType;
  content: string | null;
  position: { x: number; y: number };
  style: StickerStyle;
  created_by: string | null;
  category: NoteCategory | null;
  pinned: boolean;
  expires_at: Date | string | null;
  created_at: string;
}

export interface InsertSticker {
  board_id: string;
  type: StickerType;
  content: string;
  position: { x: number; y: number };
  style: StickerStyle;
  created_by: string;
  category?: NoteCategory | null;
  expires_at?: Date | string | null;
}

export async function insertSticker(
  knex: Knex,
  data: InsertSticker,
): Promise<StickerRow> {
  const [row] = await knex<StickerRow>("stickers")
    .insert({
      board_id: data.board_id,
      type: data.type,
      content: data.content,
      position: data.position,
      style: data.style,
      created_by: data.created_by,
      category: data.category ?? null,
      expires_at: data.expires_at ?? null,
    })
    .returning("*");
  return row!;
}
