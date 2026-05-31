import Fastify, { type FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import type { Knex } from "knex";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBoardRoutes } from "./routes/boards.js";
import { registerMapRoutes } from "./routes/map.js";
import { registerGeoRoutes } from "./routes/geo.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerAuthDecorator } from "./auth/jwt.js";

export interface BuildServerOptions {
  knex: Knex;
  jwtSecret?: string;
  /** Allowed CORS origin(s); defaults to reflecting the request origin (dev). */
  corsOrigin?: boolean | string | string[];
}

/** Build the Fastify app. Knex is injected so tests can pass a test DB. */
export function buildServer({
  knex,
  jwtSecret,
  corsOrigin = true,
}: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  app.register(fastifyCors, { origin: corsOrigin });
  app.register(fastifyJwt, {
    secret: jwtSecret ?? process.env.JWT_SECRET ?? "dev-secret-change-me",
  });

  // `authenticate` depends on @fastify/jwt; register it once jwt is loaded so
  // child route plugins inherit the decorator.
  app.register(async (instance) => {
    registerAuthDecorator(instance);
    registerAuthRoutes(instance, knex);
    registerBoardRoutes(instance, knex);
    registerMapRoutes(instance, knex);
    registerGeoRoutes(instance);
    registerUserRoutes(instance, knex);
  });

  return app;
}
