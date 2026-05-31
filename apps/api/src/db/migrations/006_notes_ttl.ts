import type { Knex } from "knex";

// Adds single map "notes" (vs multi-sticker boards) and time-to-live.
// A note is a board with kind='note' + body text, published directly to the
// map with a precise dropped point. expires_at drives ephemerality
// (NULL = permanent, a premium-only state).
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("boards", (t) => {
    t.text("kind").notNullable().defaultTo("board");
    t.text("body");
    t.timestamp("expires_at", { useTz: true });
  });
  await knex.raw(
    "ALTER TABLE boards ADD CONSTRAINT boards_kind_check CHECK (kind IN ('note','board'))",
  );

  // Allow precise pins (the user explicitly opts in by dropping a point).
  await knex.raw(
    "ALTER TABLE map_pins DROP CONSTRAINT IF EXISTS map_pins_location_type_check",
  );
  await knex.raw(
    "ALTER TABLE map_pins ADD CONSTRAINT map_pins_location_type_check CHECK (location_type IN ('city','country','precise'))",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE map_pins DROP CONSTRAINT IF EXISTS map_pins_location_type_check",
  );
  await knex.raw(
    "ALTER TABLE map_pins ADD CONSTRAINT map_pins_location_type_check CHECK (location_type IN ('city','country'))",
  );
  await knex.raw(
    "ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_kind_check",
  );
  await knex.schema.alterTable("boards", (t) => {
    t.dropColumn("kind");
    t.dropColumn("body");
    t.dropColumn("expires_at");
  });
}
