import { knex as knexFactory, type Knex } from "knex";

/** Build a Knex instance for a Postgres connection string. */
export function createKnex(connectionString: string): Knex {
  return knexFactory({
    client: "pg",
    connection: connectionString,
    pool: { min: 0, max: 5 },
  });
}

export const DEFAULT_DATABASE_URL =
  "postgres://stickerboard:stickerboard@localhost:5432/stickerboard";

export const DEFAULT_TEST_DATABASE_URL =
  "postgres://stickerboard:stickerboard@localhost:5432/stickerboard_test";
