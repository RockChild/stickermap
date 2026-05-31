import type { Knex } from "knex";
import type { StickerType } from "@stickerboard/shared";

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
  created_at: string;
}

export interface InsertSticker {
  board_id: string;
  type: StickerType;
  content: string;
  position: { x: number; y: number };
  style: StickerStyle;
  created_by: string;
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
    })
    .returning("*");
  return row!;
}
