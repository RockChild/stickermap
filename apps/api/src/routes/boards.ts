import type { FastifyInstance, FastifyReply } from "fastify";
import type { Knex } from "knex";
import type { Visibility } from "@stickerboard/shared";
import { optionalUserId } from "../auth/jwt.js";
import {
  addSticker,
  BoardError,
  createBoard,
  getBoardForReader,
  saveBoard,
  type CreateBoardInput,
  type NewStickerInput,
} from "../boards/service.js";

const VISIBILITIES: Visibility[] = ["public", "private", "unlisted"];
const STICKER_TYPES = ["note", "image", "emoji", "shape"];
const STICKER_SIZES = ["small", "medium", "large"];

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof BoardError) {
    return reply.code(error.statusCode).send({ error: error.code });
  }
  reply.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

function parseCreateBoard(body: unknown): CreateBoardInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { title, description, visibility } = body as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0) return null;
  if (description !== undefined && typeof description !== "string") return null;
  if (
    visibility !== undefined &&
    !VISIBILITIES.includes(visibility as Visibility)
  ) {
    return null;
  }

  const input: CreateBoardInput = { title };
  if (typeof description === "string") input.description = description;
  if (visibility !== undefined) input.visibility = visibility as Visibility;
  return input;
}

function parseSticker(body: unknown): NewStickerInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { type, content, position, style } = body as Record<string, unknown>;

  if (typeof type !== "string" || !STICKER_TYPES.includes(type)) return null;
  if (typeof content !== "string") return null;

  if (typeof position !== "object" || position === null) return null;
  const { x, y } = position as Record<string, unknown>;
  if (typeof x !== "number" || typeof y !== "number") return null;

  if (typeof style !== "object" || style === null) return null;
  const { color, rotation, size } = style as Record<string, unknown>;
  if (typeof color !== "string") return null;
  if (typeof rotation !== "number") return null;
  if (typeof size !== "string" || !STICKER_SIZES.includes(size)) return null;

  return {
    type: type as NewStickerInput["type"],
    content,
    position: { x, y },
    style: {
      color,
      rotation,
      size: size as NewStickerInput["style"]["size"],
    },
  };
}

interface BoardParams {
  id: string;
}

export function registerBoardRoutes(app: FastifyInstance, knex: Knex): void {
  // Create a board (authenticated).
  app.post(
    "/api/v1/boards",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const input = parseCreateBoard(req.body);
      if (!input) return reply.code(400).send({ error: "invalid_input" });
      try {
        const board = await createBoard(knex, req.user.sub, input);
        return reply.code(201).send(board);
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Read a board (auth OPTIONAL; ACL enforced in the service).
  app.get<{ Params: BoardParams; Querystring: { token?: string } }>(
    "/api/v1/boards/:id",
    async (req, reply) => {
      try {
        const userId = await optionalUserId(req);
        const board = await getBoardForReader(knex, req.params.id, {
          userId,
          shareToken: req.query.token ?? null,
        });
        if (!board) return reply.code(404).send({ error: "board_not_found" });
        return reply.code(200).send(board);
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Add a sticker (authenticated owner).
  app.post<{ Params: BoardParams }>(
    "/api/v1/boards/:id/stickers",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const input = parseSticker(req.body);
      if (!input) return reply.code(400).send({ error: "invalid_input" });
      try {
        const sticker = await addSticker(
          knex,
          req.params.id,
          req.user.sub,
          input,
        );
        return reply.code(201).send(sticker);
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  // Save/publish a board (authenticated owner; requires >=1 sticker).
  app.put<{ Params: BoardParams }>(
    "/api/v1/boards/:id/save",
    { preHandler: app.authenticate },
    async (req, reply) => {
      try {
        const board = await saveBoard(knex, req.params.id, req.user.sub);
        return reply.code(200).send(board);
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );
}
