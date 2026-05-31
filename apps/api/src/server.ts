import Fastify, { type FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { Knex } from "knex";
import { registerAuthRoutes } from "./routes/auth.js";

export interface BuildServerOptions {
  knex: Knex;
  jwtSecret?: string;
}

/** Build the Fastify app. Knex is injected so tests can pass a test DB. */
export function buildServer({
  knex,
  jwtSecret,
}: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  app.register(fastifyJwt, {
    secret: jwtSecret ?? process.env.JWT_SECRET ?? "dev-secret-change-me",
  });

  app.register(async (instance) => {
    registerAuthRoutes(instance, knex);
  });

  return app;
}
