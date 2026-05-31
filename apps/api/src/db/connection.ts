import knex, { type Knex } from "knex";

/** Build a Knex instance for a Postgres connection string. */
export function createKnex(connectionString: string): Knex {
  // Default import (not the named `knex` export): knex is CommonJS and the
  // named export isn't visible to Node's ESM loader, so `tsx`/`node` would
  // fail at runtime even though Vitest (via Vite) tolerates it.
  return knex({
    client: "pg",
    connection: connectionString,
    pool: { min: 0, max: 5 },
  });
}

export const DEFAULT_DATABASE_URL =
  "postgres://stickerboard:stickerboard@localhost:5432/stickerboard";

export const DEFAULT_TEST_DATABASE_URL =
  "postgres://stickerboard:stickerboard@localhost:5432/stickerboard_test";
