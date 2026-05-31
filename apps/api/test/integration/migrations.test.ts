import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Knex } from "knex";
import {
  createKnex,
  DEFAULT_TEST_DATABASE_URL,
} from "../../src/db/connection.js";
import { migrateLatest } from "../../src/db/migrate.js";

// Requires the dev Postgres+PostGIS container:  docker compose up -d
const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

describe("migrations (integration)", () => {
  let knex: Knex;

  beforeAll(async () => {
    knex = createKnex(url);
    // Clean slate so the suite is deterministic across runs.
    await knex.raw("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  });

  afterAll(async () => {
    await knex?.destroy();
  });

  it("applies all migrations in one batch", async () => {
    const [, applied] = await migrateLatest(knex);
    expect(applied).toEqual([
      "001_enable_postgis",
      "002_users",
      "003_boards_stickers",
      "004_map_pins",
      "005_board_share_token",
      "006_notes_ttl",
      "007_reactions",
      "008_note_category",
    ]);
  });

  it("is idempotent (second run applies nothing)", async () => {
    const [, applied] = await migrateLatest(knex);
    expect(applied).toEqual([]);
  });

  it("enables the postgis extension", async () => {
    const { rows } = await knex.raw(
      "SELECT 1 FROM pg_extension WHERE extname = 'postgis'",
    );
    expect(rows).toHaveLength(1);
  });

  it("creates a GIST index on map_pins.centroid", async () => {
    const { rows } = await knex.raw(
      "SELECT indexdef FROM pg_indexes WHERE tablename = 'map_pins' AND indexname = 'map_pins_centroid_gist'",
    );
    expect(rows).toHaveLength(1);
    expect(String(rows[0].indexdef).toLowerCase()).toContain("gist");
  });

  it("creates the core tables", async () => {
    const { rows } = await knex.raw(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const names = rows.map((r: { table_name: string }) => r.table_name);
    expect(names).toEqual(
      expect.arrayContaining(["users", "boards", "stickers", "map_pins"]),
    );
  });
});
