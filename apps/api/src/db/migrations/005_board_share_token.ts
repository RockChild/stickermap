import type { Knex } from "knex";

/**
 * Adds a nullable, unique share token to boards. The token is the "share
 * link" secret for `unlisted` boards: anyone presenting it may read the
 * board even though it is not publicly discoverable. Public/private boards
 * leave it null. Unique so a token resolves to at most one board.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("boards", (t) => {
    t.uuid("share_token").unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("boards", (t) => {
    t.dropColumn("share_token");
  });
}
