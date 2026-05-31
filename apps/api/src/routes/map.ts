import type { FastifyInstance, FastifyReply } from "fastify";
import type { Knex } from "knex";
import type { Visibility } from "@stickerboard/shared";
import {
  createNote,
  listMap,
  MapError,
  type CreateNoteInput,
} from "../map/service.js";

const VISIBILITIES: Visibility[] = ["public", "private", "unlisted"];
// Free single-note TTLs (seconds): 1h, 12h, 24h. Free hard cap = 1 day.
// Premium (up to 1 year) and permanent are gated until billing exists.
// See 10_reactions_lifetimes_clustering.md for the full tier policy.
const ALLOWED_TTLS = new Set([3600, 43200, 86400]);

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof MapError) {
    return reply.code(error.statusCode).send({ error: error.code });
  }
  reply.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

function parseNote(body: unknown): CreateNoteInput | null {
  if (typeof body !== "object" || body === null) return null;
  const {
    title,
    body: text,
    lat,
    lng,
    ttlSeconds,
    visibility,
  } = body as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0) return null;
  if (text !== undefined && typeof text !== "string") return null;
  if (typeof lat !== "number" || lat < -90 || lat > 90) return null;
  if (typeof lng !== "number" || lng < -180 || lng > 180) return null;

  // ttlSeconds: null (permanent) or one of the allowed presets.
  if (ttlSeconds !== null) {
    if (typeof ttlSeconds !== "number" || !ALLOWED_TTLS.has(ttlSeconds)) {
      return null;
    }
  }
  if (
    visibility !== undefined &&
    !VISIBILITIES.includes(visibility as Visibility)
  ) {
    return null;
  }

  const input: CreateNoteInput = {
    title: title.trim(),
    lat,
    lng,
    ttlSeconds: ttlSeconds as number | null,
  };
  if (typeof text === "string") input.body = text;
  if (visibility !== undefined) input.visibility = visibility as Visibility;
  return input;
}

export function registerMapRoutes(app: FastifyInstance, knex: Knex): void {
  // Create a single map note (authenticated).
  app.post(
    "/api/v1/notes",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const input = parseNote(req.body);
      if (!input) return reply.code(400).send({ error: "invalid_input" });
      try {
        // Premium gating placeholder: no premium users yet, so permanent
        // notes are rejected with 402 until billing exists.
        const item = await createNote(knex, req.user.sub, input, {
          isPremium: false,
        });
        return reply.code(201).send(item);
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Public map feed (anonymous allowed).
  app.get("/api/v1/map/pins", async (_req, reply) => {
    try {
      const items = await listMap(knex);
      return reply.code(200).send({ items });
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
