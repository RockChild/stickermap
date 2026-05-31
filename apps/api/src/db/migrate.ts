import type { Knex } from "knex";
import { migrationSource } from "./migrations/index.js";

/** Apply all pending migrations. Returns [batchNo, appliedNames]. */
export function migrateLatest(knex: Knex): Promise<[number, string[]]> {
  return knex.migrate.latest({ migrationSource });
}

/** Roll everything back (used by tests / local resets). */
export function rollbackAll(knex: Knex): Promise<[number, string[]]> {
  return knex.migrate.rollback({ migrationSource }, true);
}
