import type { Knex } from "knex";
import * as m001 from "./001_enable_postgis.js";
import * as m002 from "./002_users.js";
import * as m003 from "./003_boards_stickers.js";
import * as m004 from "./004_map_pins.js";
import * as m005 from "./005_board_share_token.js";
import * as m006 from "./006_notes_ttl.js";

interface MigrationModule {
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

interface NamedMigration {
  name: string;
  mod: MigrationModule;
}

// Ordered list. Names double as the knex_migrations identifiers.
const migrations: NamedMigration[] = [
  { name: "001_enable_postgis", mod: m001 },
  { name: "002_users", mod: m002 },
  { name: "003_boards_stickers", mod: m003 },
  { name: "004_map_pins", mod: m004 },
  { name: "005_board_share_token", mod: m005 },
  { name: "006_notes_ttl", mod: m006 },
];

/**
 * In-code migration source. Keeps migrations as static ESM imports so the
 * same code runs from the CLI and inside Vitest, avoiding knex's filesystem
 * loader (which struggles with TS/ESM on Windows).
 */
export const migrationSource: Knex.MigrationSource<NamedMigration> = {
  getMigrations: async () => migrations,
  getMigrationName: (migration) => migration.name,
  getMigration: async (migration) => ({
    up: migration.mod.up,
    down: migration.mod.down,
  }),
};
