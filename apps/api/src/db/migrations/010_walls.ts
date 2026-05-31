import type { Knex } from "knex";

// Personal sticker walls: a wall is a board (kind='wall') with a post policy;
// its stickers gain category/pinned/expires_at, and get sticker-level +1s.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_kind_check",
  );
  await knex.raw(
    "ALTER TABLE boards ADD CONSTRAINT boards_kind_check CHECK (kind IN ('note','board','wall'))",
  );

  await knex.schema.alterTable("boards", (t) => {
    t.text("post_policy").notNullable().defaultTo("approved");
  });
  await knex.raw(
    "ALTER TABLE boards ADD CONSTRAINT boards_post_policy_check CHECK (post_policy IN ('owner_only','approved','anyone'))",
  );

  await knex.schema.alterTable("stickers", (t) => {
    t.text("category");
    t.boolean("pinned").notNullable().defaultTo(false);
    t.timestamp("expires_at", { useTz: true });
  });
  await knex.raw(
    "ALTER TABLE stickers ADD CONSTRAINT stickers_category_check CHECK (category IN ('help','meet','whatif','cry') OR category IS NULL)",
  );

  await knex.schema.createTable("sticker_reactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("sticker_id")
      .notNullable()
      .references("id")
      .inTable("stickers")
      .onDelete("CASCADE");
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.unique(["sticker_id", "user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("sticker_reactions");
  await knex.raw(
    "ALTER TABLE stickers DROP CONSTRAINT IF EXISTS stickers_category_check",
  );
  await knex.schema.alterTable("stickers", (t) => {
    t.dropColumn("category");
    t.dropColumn("pinned");
    t.dropColumn("expires_at");
  });
  await knex.raw(
    "ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_post_policy_check",
  );
  await knex.schema.alterTable("boards", (t) => {
    t.dropColumn("post_policy");
  });
  await knex.raw(
    "ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_kind_check",
  );
  await knex.raw(
    "ALTER TABLE boards ADD CONSTRAINT boards_kind_check CHECK (kind IN ('note','board'))",
  );
}
