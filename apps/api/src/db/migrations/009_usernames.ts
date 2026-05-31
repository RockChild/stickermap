import type { Knex } from "knex";
import { generateNickname } from "../../auth/nickname.js";

// Adds users.username for @handles. Existing accounts are backfilled with a
// generated unique nickname so nothing has a null handle.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.text("username");
  });

  // Backfill existing users with unique generated handles.
  const rows = await knex<{ id: string }>("users").select("id");
  const used = new Set<string>();
  for (const row of rows) {
    let name = generateNickname();
    while (used.has(name)) name = generateNickname();
    used.add(name);
    await knex("users").where({ id: row.id }).update({ username: name });
  }

  await knex.raw(
    "CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username))",
  );
  await knex.raw("ALTER TABLE users ALTER COLUMN username SET NOT NULL");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP INDEX IF EXISTS users_username_lower_idx");
  await knex.schema.alterTable("users", (t) => {
    t.dropColumn("username");
  });
}
