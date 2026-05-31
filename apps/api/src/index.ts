import { createKnex, DEFAULT_DATABASE_URL } from "./db/connection.js";
import { buildServer } from "./server.js";

const knex = createKnex(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
const app = buildServer({ knex });
const port = Number(process.env.API_PORT ?? 3000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => console.log(`API listening on http://localhost:${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
