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
const HOUR = 3600;
const DAY = 86400;

const nero = {
  title: "Coffee meet?",
  body: "Nero Cafe at the corner of 12 ave & 50 street",
  lat: 40.7589,
  lng: -73.9851,
  ttlSeconds: DAY,
  visibility: "public" as const,
};

describe("map notes (integration)", () => {
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

  function postNote(
    token: string | null,
    payload: InjectOptions["payload"],
  ): Promise<LightMyRequestResponse> {
    return app.inject({
      method: "POST",
      url: "/api/v1/notes",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      payload,
    });
  }

  const getPins = () => app.inject({ method: "GET", url: "/api/v1/map/pins" });

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
      "TRUNCATE map_pins, stickers, boards, users RESTART IDENTITY CASCADE",
    );
  });

  it("requires auth to post a note", async () => {
    const res = await postNote(null, nero);
    expect(res.statusCode).toBe(401);
  });

  it("creates a note at the precise dropped point", async () => {
    const token = await signupToken("a@example.com");
    const res = await postNote(token, nero);
    expect(res.statusCode).toBe(201);
    const item = res.json();
    expect(item).toMatchObject({
      kind: "note",
      title: "Coffee meet?",
      lat: nero.lat,
      lng: nero.lng,
      visibility: "public",
    });
    expect(item.expiresAt).not.toBeNull();
  });

  it("CORE: a note one user creates is visible to anyone on the map", async () => {
    const token = await signupToken("creator@example.com");
    await postNote(token, nero);

    // Anonymous reader (e.g. an incognito window) hits the public feed.
    const res = await getPins();
    expect(res.statusCode).toBe(200);
    const { items } = res.json();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Coffee meet?",
      lat: nero.lat,
      lng: nero.lng,
    });
  });

  it("rejects permanent notes without premium (402)", async () => {
    const token = await signupToken("b@example.com");
    const res = await postNote(token, { ...nero, ttlSeconds: null });
    expect(res.statusCode).toBe(402);
  });

  it("rejects an unsupported TTL (400)", async () => {
    const token = await signupToken("c@example.com");
    const res = await postNote(token, { ...nero, ttlSeconds: 12345 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects an out-of-range coordinate (400)", async () => {
    const token = await signupToken("d@example.com");
    const res = await postNote(token, { ...nero, lat: 999 });
    expect(res.statusCode).toBe(400);
  });

  it("excludes expired notes from the map", async () => {
    const token = await signupToken("e@example.com");
    const created = await postNote(token, { ...nero, ttlSeconds: HOUR });
    const { boardId } = created.json();

    // Force expiry into the past.
    await knex("boards")
      .where({ id: boardId })
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() });

    const { items } = (await getPins()).json();
    expect(items).toHaveLength(0);
  });

  it("excludes private notes from the public map", async () => {
    const token = await signupToken("f@example.com");
    await postNote(token, { ...nero, visibility: "private" });
    const { items } = (await getPins()).json();
    expect(items).toHaveLength(0);
  });
});
