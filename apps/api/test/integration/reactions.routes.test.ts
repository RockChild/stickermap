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
const note = {
  title: "Coffee meet?",
  lat: 40.7589,
  lng: -73.9851,
  ttlSeconds: 86400,
  visibility: "public" as const,
};

describe("reactions (integration)", () => {
  let knex: Knex;
  let app: FastifyInstance;

  async function signupToken(email: string): Promise<string> {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email, password: "s3cretpw!" },
    });
    return res.json().token as string;
  }

  function authed(
    method: "POST" | "GET",
    url2: string,
    token: string | null,
    payload?: InjectOptions["payload"],
  ): Promise<LightMyRequestResponse> {
    return app.inject({
      method,
      url: url2,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      ...(payload === undefined ? {} : { payload }),
    });
  }

  async function createNote(token: string): Promise<string> {
    const res = await authed("POST", "/api/v1/notes", token, note);
    return res.json().boardId as string;
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
      "TRUNCATE reactions, map_pins, stickers, boards, users RESTART IDENTITY CASCADE",
    );
  });

  it("requires auth to react", async () => {
    const token = await signupToken("owner@example.com");
    const boardId = await createNote(token);
    const res = await authed(
      "POST",
      `/api/v1/boards/${boardId}/reactions`,
      null,
    );
    expect(res.statusCode).toBe(401);
  });

  it("toggles a +1 on and off (idempotent per user)", async () => {
    const owner = await signupToken("o@example.com");
    const fan = await signupToken("fan@example.com");
    const boardId = await createNote(owner);

    const on = await authed("POST", `/api/v1/boards/${boardId}/reactions`, fan);
    expect(on.json()).toEqual({ reactions: 1, reacted: true });

    const off = await authed(
      "POST",
      `/api/v1/boards/${boardId}/reactions`,
      fan,
    );
    expect(off.json()).toEqual({ reactions: 0, reacted: false });
  });

  it("surfaces counts and the viewer's own reaction in the map feed", async () => {
    const owner = await signupToken("o@example.com");
    const fan = await signupToken("fan@example.com");
    const boardId = await createNote(owner);
    await authed("POST", `/api/v1/boards/${boardId}/reactions`, fan);

    const asFan = (await authed("GET", "/api/v1/map/pins", fan)).json();
    expect(asFan.items[0]).toMatchObject({ reactions: 1, reacted: true });

    const asAnon = (await authed("GET", "/api/v1/map/pins", null)).json();
    expect(asAnon.items[0]).toMatchObject({ reactions: 1, reacted: false });
  });

  it("cannot react to a board it cannot see (404)", async () => {
    const owner = await signupToken("o@example.com");
    const other = await signupToken("other@example.com");
    const res = await authed("POST", "/api/v1/notes", owner, {
      ...note,
      visibility: "private",
    });
    const boardId = res.json().boardId as string;

    const react = await authed(
      "POST",
      `/api/v1/boards/${boardId}/reactions`,
      other,
    );
    expect(react.statusCode).toBe(404);
  });
});
