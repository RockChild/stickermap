import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("boards", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("owner_id").notNullable().references("id").inTable("users");
    t.text("title").notNullable();
    t.text("description");
    t.enum("visibility", ["public", "private", "unlisted"])
      .notNullable()
      .defaultTo("private");
    // Reduced location (city/country + centroid); null until published.
    t.jsonb("location");
    t.boolean("is_published").notNullable().defaultTo(false);
    t.integer("version").notNullable().defaultTo(1);
    t.jsonb("premium_features")
      .notNullable()
      .defaultTo(
        knex.raw(`'{"crayonEnabled":false,"collabEnabled":false}'::jsonb`),
      );
    t.timestamps(true, true);
  });

  await knex.schema.createTable("stickers", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("board_id")
      .notNullable()
      .references("id")
      .inTable("boards")
      .onDelete("CASCADE");
    t.enum("type", ["note", "image", "emoji", "shape"]).notNullable();
    t.text("content");
    t.jsonb("position").notNullable();
    t.jsonb("style").notNullable();
    t.uuid("created_by").references("id").inTable("users");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("stickers");
  await knex.schema.dropTableIfExists("boards");
}
