import type { FastifyInstance } from "fastify";
import type { Knex } from "knex";
import { findByUsername } from "../models/user.js";

export function registerUserRoutes(app: FastifyInstance, knex: Knex): void {
  // Resolve a public profile by handle (for @username wall addressing).
  app.get<{ Params: { username: string } }>(
    "/api/v1/users/:username",
    async (req, reply) => {
      const user = await findByUsername(knex, req.params.username);
      if (!user) return reply.code(404).send({ error: "user_not_found" });
      return reply.code(200).send({ id: user.id, username: user.username });
    },
  );
}
