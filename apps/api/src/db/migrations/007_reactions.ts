import type { Knex } from "knex";

// +1 reactions ("me too"). One row per (board, user) — positive-only, no
// dislikes. The unique constraint makes a user's +1 idempotent.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("board_id")
      .notNullable()
      .references("id")
      .inTable("boards")
      .onDelete("CASCADE");
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.unique(["board_id", "user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("reactions");
}
