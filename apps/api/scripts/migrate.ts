import { createKnex, DEFAULT_DATABASE_URL } from "../src/db/connection.js";
import { migrateLatest } from "../src/db/migrate.js";

const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
const knex = createKnex(url);

try {
  const [batch, log] = await migrateLatest(knex);
  console.log(
    log.length
      ? `Applied batch ${batch}: ${log.join(", ")}`
      : "Database already up to date.",
  );
} finally {
  await knex.destroy();
}
