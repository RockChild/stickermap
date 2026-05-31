import type { Knex } from "knex";

// Sticker category: drives the sticker color and (later) map filters.
const CATEGORIES = "('help','meet','whatif','cry')";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("boards", (t) => {
    t.text("category");
  });
  await knex.raw(
    `ALTER TABLE boards ADD CONSTRAINT boards_category_check CHECK (category IN ${CATEGORIES} OR category IS NULL)`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_category_check",
  );
  await knex.schema.alterTable("boards", (t) => {
    t.dropColumn("category");
  });
}
