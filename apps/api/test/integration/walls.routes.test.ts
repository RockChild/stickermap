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

const sticker = {
  category: "meet" as const,
  text: "Coffee Sat?",
  position: { x: 0.4, y: 0.5 },
  ttlSeconds: 86400,
};

describe("walls (integration)", () => {
  let knex: Knex;
  let app: FastifyInstance;

  async function signup(username: string): Promise<string> {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: {
        email: `${username}@example.com`,
        password: "s3cretpw!",
        username,
      },
    });
    return res.json().token as string;
  }

  function call(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    token: string | null,
    payload?: InjectOptions["payload"],
  ): Promise<LightMyRequestResponse> {
    return app.inject({
      method,
      url: path,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      ...(payload === undefined ? {} : { payload }),
    });
  }

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
    await knex.raw(
      "TRUNCATE sticker_reactions, reactions, map_pins, stickers, boards, users RESTART IDENTITY CASCADE",
    );
  });

  it("lazily creates a wall and reports owner/canPost", async () => {
    const owner = await signup("owner");
    const res = await call("GET", "/api/v1/walls/owner", owner);
    expect(res.statusCode).toBe(200);
    const wall = res.json();
    expect(wall.ownerUsername).toBe("owner");
    expect(wall.isOwner).toBe(true);
    expect(wall.canPost).toBe(true);
    expect(wall.stickers).toEqual([]);
  });

  it("404 for an unknown handle", async () => {
    const res = await call("GET", "/api/v1/walls/ghost", null);
    expect(res.statusCode).toBe(404);
  });

  it("CORE: a visitor can stick on an open wall and everyone sees it", async () => {
    const owner = await signup("owner");
    const visitor = await signup("visitor");
    // owner opens the wall
    await call("PUT", "/api/v1/walls/owner/policy", owner, {
      policy: "anyone",
    });

    const stuck = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      visitor,
      sticker,
    );
    expect(stuck.statusCode).toBe(201);
    const wall = stuck.json();
    expect(wall.stickers).toHaveLength(1);
    expect(wall.stickers[0]).toMatchObject({
      text: "Coffee Sat?",
      authorUsername: "visitor",
      category: "meet",
    });

    // anonymous viewer sees it too
    const anon = (await call("GET", "/api/v1/walls/owner", null)).json();
    expect(anon.stickers).toHaveLength(1);
  });

  it("blocks posting on an approved wall by a non-owner (403)", async () => {
    await signup("owner"); // creates the wall owner
    const visitor = await signup("visitor");
    // default policy is 'approved' → visitor can't post yet
    const res = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      visitor,
      sticker,
    );
    expect(res.statusCode).toBe(403);
  });

  it("owner pins (permanent) and enforces the free quota", async () => {
    const owner = await signup("owner");
    const created = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      owner,
      sticker,
    );
    const id = created.json().stickers[0].id;

    const pinned = await call(
      "PUT",
      `/api/v1/walls/owner/stickers/${id}/pin`,
      owner,
      { pinned: true },
    );
    expect(pinned.json().stickers[0].pinned).toBe(true);
    expect(pinned.json().stickers[0].expiresAt).toBeNull();
    expect(pinned.json().pinnedCount).toBe(1);
  });

  it("a non-owner cannot pin (403)", async () => {
    const owner = await signup("owner");
    const other = await signup("other");
    await call("PUT", "/api/v1/walls/owner/policy", owner, {
      policy: "anyone",
    });
    const created = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      other,
      sticker,
    );
    const id = created.json().stickers[0].id;
    const res = await call(
      "PUT",
      `/api/v1/walls/owner/stickers/${id}/pin`,
      other,
      { pinned: true },
    );
    expect(res.statusCode).toBe(403);
  });

  it("toggles a +1 on a sticker", async () => {
    const owner = await signup("owner");
    const fan = await signup("fan");
    await call("PUT", "/api/v1/walls/owner/policy", owner, {
      policy: "anyone",
    });
    const created = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      owner,
      sticker,
    );
    const id = created.json().stickers[0].id;

    const on = await call(
      "POST",
      `/api/v1/walls/owner/stickers/${id}/reactions`,
      fan,
    );
    expect(on.json().stickers[0]).toMatchObject({
      reactions: 1,
      reacted: true,
    });

    const off = await call(
      "POST",
      `/api/v1/walls/owner/stickers/${id}/reactions`,
      fan,
    );
    expect(off.json().stickers[0]).toMatchObject({
      reactions: 0,
      reacted: false,
    });
  });

  it("owner removes any sticker", async () => {
    const owner = await signup("owner");
    const visitor = await signup("visitor");
    await call("PUT", "/api/v1/walls/owner/policy", owner, {
      policy: "anyone",
    });
    const created = await call(
      "POST",
      "/api/v1/walls/owner/stickers",
      visitor,
      sticker,
    );
    const id = created.json().stickers[0].id;
    const res = await call(
      "DELETE",
      `/api/v1/walls/owner/stickers/${id}`,
      owner,
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().stickers).toHaveLength(0);
  });
});
