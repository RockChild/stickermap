import type { BoardKind, NoteCategory, Visibility } from "@stickerboard/shared";
import type { Knex } from "knex";

export interface InsertMapPin {
  board_id: string;
  lat: number;
  lng: number;
  location_name: string;
}

/** Inserts a precise map pin (centroid = the exact dropped point). */
export async function insertMapPin(
  knex: Knex,
  data: InsertMapPin,
): Promise<{ id: string }> {
  const [row] = await knex("map_pins")
    .insert({
      board_id: data.board_id,
      location_type: "precise",
      location_name: data.location_name,
      // PostGIS point: X = lng, Y = lat, SRID 4326.
      centroid: knex.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)", [
        data.lng,
        data.lat,
      ]),
    })
    .returning<{ id: string }[]>(["id"]);
  return row!;
}

export interface MapItemRow {
  pin_id: string;
  board_id: string;
  kind: BoardKind;
  category: NoteCategory | null;
  title: string;
  body: string | null;
  visibility: Visibility;
  expires_at: Date | string | null;
  lat: number;
  lng: number;
  reactions: number;
  reacted: boolean;
}

/**
 * Lists everything currently visible on the public map: published, public, and
 * not expired. Joins each pin to its board for title/body/kind/expiry, projects
 * the centroid back to lat/lng, and includes the +1 count (and whether the
 * given viewer has reacted).
 */
export async function listMapItems(
  knex: Knex,
  viewerId: string | null,
): Promise<MapItemRow[]> {
  return knex("map_pins as p")
    .join("boards as b", "b.id", "p.board_id")
    .where("b.is_published", true)
    .andWhere("b.visibility", "public")
    .andWhere((q) =>
      q.whereNull("b.expires_at").orWhere("b.expires_at", ">", knex.fn.now()),
    )
    .select(
      "p.id as pin_id",
      "b.id as board_id",
      "b.kind",
      "b.category",
      "b.title",
      "b.body",
      "b.visibility",
      "b.expires_at",
      knex.raw("ST_Y(p.centroid)::float8 as lat"),
      knex.raw("ST_X(p.centroid)::float8 as lng"),
      knex.raw(
        "(SELECT count(*)::int FROM reactions r WHERE r.board_id = b.id) as reactions",
      ),
      knex.raw(
        "EXISTS(SELECT 1 FROM reactions r WHERE r.board_id = b.id AND r.user_id = ?) as reacted",
        [viewerId],
      ),
    )
    .orderBy("b.created_at", "desc");
}
