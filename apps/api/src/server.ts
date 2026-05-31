import Fastify, { type FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { Knex } from "knex";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBoardRoutes } from "./routes/boards.js";
import { registerAuthDecorator } from "./auth/jwt.js";

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

  // `authenticate` depends on @fastify/jwt; register it once jwt is loaded so
  // child route plugins inherit the decorator.
  app.register(async (instance) => {
    registerAuthDecorator(instance);
    registerAuthRoutes(instance, knex);
    registerBoardRoutes(instance, knex);
  });

  return app;
}
