import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Knex } from "knex";
import type {
  FastifyInstance,
  InjectOptions,
  LightMyRequestResponse,
} from "fastify";
import {
  createKnex,
  DEFAULT_TEST_DATABASE_URL,
} from "../../src/db/connection.js";
import { migrateLatest } from "../../src/db/migrate.js";
import { buildServer } from "../../src/server.js";

const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

const userA = { email: "alice@example.com", password: "s3cretpw!" };
const userB = { email: "bob@example.com", password: "s3cretpw!" };

function post(
  app: FastifyInstance,
  path: string,
  payload: InjectOptions["payload"],
  token?: string,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "POST",
    url: path,
    payload,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

function put(
  app: FastifyInstance,
  path: string,
  token?: string,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "PUT",
    url: path,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

function get(
  app: FastifyInstance,
  path: string,
  token?: string,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "GET",
    url: path,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

async function signup(
  app: FastifyInstance,
  creds: { email: string; password: string },
): Promise<string> {
  const res = await post(app, "/api/v1/auth/signup", creds);
  return res.json().token as string;
}

const sticker = {
  type: "note",
  content: "hello",
  position: { x: 0.5, y: 0.5 },
  style: { color: "#f0c", rotation: 0, size: "small" },
};

describe("board routes (integration)", () => {
  let knex: Knex;
  let app: FastifyInstance;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    knex = createKnex(url);
    await migrateLatest(knex);
    app = buildServer({ knex, jwtSecret: "test-secret" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.raw("TRUNCATE users RESTART IDENTITY CASCADE");
    tokenA = await signup(app, userA);
    tokenB = await signup(app, userB);
  });

  describe("POST /api/v1/boards", () => {
    it("creates a private board by default and returns it (201)", async () => {
      const res = await post(
        app,
        "/api/v1/boards",
        { title: "My board" },
        tokenA,
      );
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeTruthy();
      expect(body.title).toBe("My board");
      expect(body.visibility).toBe("private");
      expect(body.isPublished).toBe(false);
      // Private boards have no share token.
      expect(body.shareToken ?? null).toBeNull();
    });

    it("requires authentication (401 when anonymous)", async () => {
      const res = await post(app, "/api/v1/boards", { title: "Nope" });
      expect(res.statusCode).toBe(401);
    });

    it("rejects missing title with 400", async () => {
      const res = await post(app, "/api/v1/boards", {}, tokenA);
      expect(res.statusCode).toBe(400);
    });

    it("generates a share token for unlisted boards", async () => {
      const res = await post(
        app,
        "/api/v1/boards",
        { title: "Shared", visibility: "unlisted" },
        tokenA,
      );
      expect(res.statusCode).toBe(201);
      expect(res.json().shareToken).toBeTruthy();
    });
  });

  describe("GET /api/v1/boards/:id ACL", () => {
    function createBoard(
      token: string,
      visibility: "public" | "private" | "unlisted",
    ): Promise<LightMyRequestResponse> {
      return post(app, "/api/v1/boards", { title: "Board", visibility }, token);
    }

    // Core shareability scenario #1.
    it("public board: an anonymous client can read it with full detail", async () => {
      const created = await createBoard(tokenA, "public");
      const id = created.json().id;

      const res = await get(app, `/api/v1/boards/${id}`);
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(id);
      expect(body.title).toBe("Board");
    });

    // Core shareability scenario #2.
    it("private board: a different authenticated user gets 404 (no leak)", async () => {
      const created = await createBoard(tokenA, "private");
      const id = created.json().id;

      const res = await get(app, `/api/v1/boards/${id}`, tokenB);
      expect(res.statusCode).toBe(404);
    });

    it("private board: anonymous client gets 404", async () => {
      const created = await createBoard(tokenA, "private");
      const id = created.json().id;

      const res = await get(app, `/api/v1/boards/${id}`);
      expect(res.statusCode).toBe(404);
    });

    it("private board: the owner can read it", async () => {
      const created = await createBoard(tokenA, "private");
      const id = created.json().id;

      const res = await get(app, `/api/v1/boards/${id}`, tokenA);
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(id);
    });

    it("unlisted board: readable by anyone holding the id", async () => {
      const created = await createBoard(tokenA, "unlisted");
      const id = created.json().id;

      const res = await get(app, `/api/v1/boards/${id}`);
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(id);
    });

    it("unlisted board: readable via a valid share token", async () => {
      const created = await createBoard(tokenA, "unlisted");
      const { id, shareToken } = created.json();

      const res = await get(app, `/api/v1/boards/${id}?token=${shareToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(id);
    });

    it("unknown board id returns 404", async () => {
      const res = await get(
        app,
        "/api/v1/boards/00000000-0000-0000-0000-000000000000",
      );
      expect(res.statusCode).toBe(404);
    });
  });

  describe("PUT /api/v1/boards/:id/save", () => {
    it("publishes a board that has >=1 sticker (owner)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Publish me" },
        tokenA,
      );
      const id = created.json().id;
      await post(app, `/api/v1/boards/${id}/stickers`, sticker, tokenA);

      const res = await put(app, `/api/v1/boards/${id}/save`, tokenA);
      expect(res.statusCode).toBe(200);
      expect(res.json().isPublished).toBe(true);
    });

    it("refuses to publish a board with no stickers (400)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Empty" },
        tokenA,
      );
      const id = created.json().id;

      const res = await put(app, `/api/v1/boards/${id}/save`, tokenA);
      expect(res.statusCode).toBe(400);
    });

    it("non-owner cannot save (404, no leak)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Mine" },
        tokenA,
      );
      const id = created.json().id;
      await post(app, `/api/v1/boards/${id}/stickers`, sticker, tokenA);

      const res = await put(app, `/api/v1/boards/${id}/save`, tokenB);
      expect(res.statusCode).toBe(404);
    });

    it("requires authentication (401)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Mine" },
        tokenA,
      );
      const id = created.json().id;

      const res = await put(app, `/api/v1/boards/${id}/save`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/boards/:id/stickers", () => {
    it("adds a sticker to an owned board (201)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Board" },
        tokenA,
      );
      const id = created.json().id;

      const res = await post(
        app,
        `/api/v1/boards/${id}/stickers`,
        sticker,
        tokenA,
      );
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeTruthy();
      expect(body.boardId).toBe(id);
      expect(body.type).toBe("note");
    });

    it("non-owner cannot add a sticker (404, no leak)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Board" },
        tokenA,
      );
      const id = created.json().id;

      const res = await post(
        app,
        `/api/v1/boards/${id}/stickers`,
        sticker,
        tokenB,
      );
      expect(res.statusCode).toBe(404);
    });

    it("rejects an invalid sticker payload (400)", async () => {
      const created = await post(
        app,
        "/api/v1/boards",
        { title: "Board" },
        tokenA,
      );
      const id = created.json().id;

      const res = await post(
        app,
        `/api/v1/boards/${id}/stickers`,
        { type: "note" },
        tokenA,
      );
      expect(res.statusCode).toBe(400);
    });
  });
});
