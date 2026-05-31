import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("map_pins", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("board_id")
      .notNullable()
      .references("id")
      .inTable("boards")
      .onDelete("CASCADE");
    t.enum("location_type", ["city", "country"]).notNullable();
    t.text("location_name").notNullable();
    // Coarse admin centroid only — never a precise user coordinate.
    t.specificType("centroid", "geometry(Point,4326)").notNullable();
    t.timestamp("published_at").notNullable().defaultTo(knex.fn.now());
  });

  // Geospatial index for bbox/proximity queries on the map.
  await knex.raw(
    "CREATE INDEX map_pins_centroid_gist ON map_pins USING GIST (centroid)",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("map_pins");
}
