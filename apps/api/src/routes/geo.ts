import type { FastifyInstance } from "fastify";
import { lookupIpLocation } from "../geo/service.js";

export function registerGeoRoutes(app: FastifyInstance): void {
  // Approximate location for centering the map (anonymous; not stored).
  app.get("/api/v1/geo", async (_req, reply) => {
    const loc = await lookupIpLocation();
    if (!loc) return reply.code(503).send({ error: "geo_unavailable" });
    return reply.code(200).send(loc);
  });
}
