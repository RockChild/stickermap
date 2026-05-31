import type { BoardKind, Visibility } from "@stickerboard/shared";
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
  title: string;
  body: string | null;
  visibility: Visibility;
  expires_at: Date | string | null;
  lat: number;
  lng: number;
}

/**
 * Lists everything currently visible on the public map: published, public, and
 * not expired. Joins each pin to its board for title/body/kind/expiry, and
 * projects the centroid back to lat/lng.
 */
export async function listMapItems(knex: Knex): Promise<MapItemRow[]> {
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
      "b.title",
      "b.body",
      "b.visibility",
      "b.expires_at",
      knex.raw("ST_Y(p.centroid)::float8 as lat"),
      knex.raw("ST_X(p.centroid)::float8 as lng"),
    )
    .orderBy("b.created_at", "desc");
}
