import type { FastifyInstance, FastifyReply } from "fastify";
import type { Knex } from "knex";
import type { NoteCategory, WallPostPolicy } from "@stickerboard/shared";
import { optionalUserId } from "../auth/jwt.js";
import {
  getWall,
  reactToSticker,
  removeSticker,
  setStickerPin,
  setWallPolicy,
  stickOnWall,
  WallError,
  type NewWallStickerInput,
} from "../walls/service.js";

const CATEGORIES: NoteCategory[] = ["help", "meet", "whatif", "cry"];
const POLICIES: WallPostPolicy[] = ["owner_only", "approved", "anyone"];
const ALLOWED_TTLS = new Set([3600, 43200, 86400]);

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof WallError) {
    return reply.code(error.statusCode).send({ error: error.code });
  }
  reply.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

function parseSticker(body: unknown): NewWallStickerInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { category, text, position, ttlSeconds } = body as Record<
    string,
    unknown
  >;
  if (typeof text !== "string" || text.trim().length === 0) return null;
  if (!CATEGORIES.includes(category as NoteCategory)) return null;
  if (typeof ttlSeconds !== "number" || !ALLOWED_TTLS.has(ttlSeconds))
    return null;
  if (typeof position !== "object" || position === null) return null;
  const { x, y } = position as Record<string, unknown>;
  if (typeof x !== "number" || x < 0 || x > 1) return null;
  if (typeof y !== "number" || y < 0 || y > 1) return null;
  return {
    category: category as NoteCategory,
    text: text.trim(),
    position: { x, y },
    ttlSeconds,
  };
}

interface HandleParams {
  handle: string;
}
interface StickerParams {
  handle: string;
  id: string;
}

export function registerWallRoutes(app: FastifyInstance, knex: Knex): void {
  // View a wall (auth optional; viewer context drives isOwner/canPost/reacted).
  app.get<{ Params: HandleParams }>(
    "/api/v1/walls/:handle",
    async (req, reply) => {
      try {
        const viewerId = await optionalUserId(req);
        return reply
          .code(200)
          .send(await getWall(knex, req.params.handle, viewerId));
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Stick a sticker (authenticated; ACL enforced in the service).
  app.post<{ Params: HandleParams }>(
    "/api/v1/walls/:handle/stickers",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const input = parseSticker(req.body);
      if (!input) return reply.code(400).send({ error: "invalid_input" });
      try {
        return reply
          .code(201)
          .send(
            await stickOnWall(knex, req.params.handle, req.user.sub, input),
          );
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Pin / unpin (owner only).
  app.put<{ Params: StickerParams; Body: { pinned?: unknown } }>(
    "/api/v1/walls/:handle/stickers/:id/pin",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const pinned = req.body?.pinned;
      if (typeof pinned !== "boolean")
        return reply.code(400).send({ error: "invalid_input" });
      try {
        return reply
          .code(200)
          .send(
            await setStickerPin(
              knex,
              req.params.handle,
              req.user.sub,
              req.params.id,
              pinned,
            ),
          );
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Remove a sticker (owner or author).
  app.delete<{ Params: StickerParams }>(
    "/api/v1/walls/:handle/stickers/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      try {
        return reply
          .code(200)
          .send(
            await removeSticker(
              knex,
              req.params.handle,
              req.user.sub,
              req.params.id,
            ),
          );
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Set post policy (owner only).
  app.put<{ Params: HandleParams; Body: { policy?: unknown } }>(
    "/api/v1/walls/:handle/policy",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const policy = req.body?.policy;
      if (!POLICIES.includes(policy as WallPostPolicy))
        return reply.code(400).send({ error: "invalid_input" });
      try {
        return reply
          .code(200)
          .send(
            await setWallPolicy(
              knex,
              req.params.handle,
              req.user.sub,
              policy as WallPostPolicy,
            ),
          );
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Toggle +1 on a sticker (authenticated).
  app.post<{ Params: StickerParams }>(
    "/api/v1/walls/:handle/stickers/:id/reactions",
    { preHandler: app.authenticate },
    async (req, reply) => {
      try {
        return reply
          .code(200)
          .send(
            await reactToSticker(
              knex,
              req.params.handle,
              req.user.sub,
              req.params.id,
            ),
          );
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );
}
