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
const creds = { email: "pasha@example.com", password: "s3cretpw!" };

function post(
  app: FastifyInstance,
  path: string,
  payload: InjectOptions["payload"],
): Promise<LightMyRequestResponse> {
  return app.inject({ method: "POST", url: path, payload });
}

describe("auth routes (integration)", () => {
  let knex: Knex;
  let app: FastifyInstance;

  beforeAll(async () => {
    knex = createKnex(url);
    await migrateLatest(knex); // idempotent; ensures schema exists
    app = buildServer({ knex, jwtSecret: "test-secret" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.raw("TRUNCATE users RESTART IDENTITY CASCADE");
  });

  it("signs up a new user: 201, token, and a hashed (not plaintext) password", async () => {
    const res = await post(app, "/api/v1/auth/signup", creds);
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe(creds.email);
    expect(body.user.id).toBeTruthy();
    expect(body.token).toBeTruthy();

    const row = await knex("users").where({ email: creds.email }).first();
    expect(row.password_hash).not.toBe(creds.password);
  });

  it("rejects a duplicate signup with 409", async () => {
    await post(app, "/api/v1/auth/signup", creds);
    const res = await post(app, "/api/v1/auth/signup", creds);
    expect(res.statusCode).toBe(409);
  });

  it("logs in with correct credentials: 200 + token", async () => {
    await post(app, "/api/v1/auth/signup", creds);
    const res = await post(app, "/api/v1/auth/login", creds);
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTruthy();
  });

  it("rejects a wrong password with 401", async () => {
    await post(app, "/api/v1/auth/signup", creds);
    const res = await post(app, "/api/v1/auth/login", {
      ...creds,
      password: "wrong-guess",
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects an unknown user with 401 (no enumeration)", async () => {
    const res = await post(app, "/api/v1/auth/login", creds);
    expect(res.statusCode).toBe(401);
  });

  it("rejects malformed input with 400", async () => {
    const res = await post(app, "/api/v1/auth/signup", {
      email: "not-an-email",
      password: "short",
    });
    expect(res.statusCode).toBe(400);
  });

  it("auto-generates a username when none is given", async () => {
    const res = await post(app, "/api/v1/auth/signup", creds);
    expect(res.json().user.username).toMatch(/^[a-z0-9_]{3,20}$/);
  });

  it("uses an explicit username and resolves it via /users/:username", async () => {
    const res = await post(app, "/api/v1/auth/signup", {
      ...creds,
      username: "Pasha_01",
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().user.username).toBe("pasha_01"); // normalized

    const lookup = await app.inject({
      method: "GET",
      url: "/api/v1/users/pasha_01",
    });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json().username).toBe("pasha_01");
  });

  it("rejects a duplicate username with 409 (case-insensitive)", async () => {
    await post(app, "/api/v1/auth/signup", { ...creds, username: "taken" });
    const res = await post(app, "/api/v1/auth/signup", {
      email: "other@example.com",
      password: "s3cretpw!",
      username: "TAKEN",
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects an invalid username with 400", async () => {
    const res = await post(app, "/api/v1/auth/signup", {
      ...creds,
      username: "no spaces!",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for an unknown handle", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users/nobody_here",
    });
    expect(res.statusCode).toBe(404);
  });
});
