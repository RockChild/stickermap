import type { FastifyInstance, FastifyReply } from "fastify";
import type { Knex } from "knex";
import { AuthError, login, signup, type PublicUser } from "../auth/service.js";

interface AuthBody {
  email?: unknown;
  password?: unknown;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseCredentials(
  body: AuthBody,
): { email: string; password: string } | null {
  const { email, password } = body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) return null;
  if (typeof password !== "string" || password.length < 8) return null;
  return { email, password };
}

async function issueToken(
  reply: FastifyReply,
  user: PublicUser,
): Promise<string> {
  return reply.jwtSign({ sub: user.id, email: user.email });
}

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AuthError) {
    return reply.code(error.statusCode).send({ error: error.code });
  }
  reply.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

export function registerAuthRoutes(app: FastifyInstance, knex: Knex): void {
  app.post("/api/v1/auth/signup", async (req, reply) => {
    const creds = parseCredentials(req.body as AuthBody);
    if (!creds) return reply.code(400).send({ error: "invalid_input" });
    try {
      const user = await signup(knex, creds.email, creds.password);
      const token = await issueToken(reply, user);
      return reply.code(201).send({ user, token });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  app.post("/api/v1/auth/login", async (req, reply) => {
    const creds = parseCredentials(req.body as AuthBody);
    if (!creds) return reply.code(400).send({ error: "invalid_input" });
    try {
      const user = await login(knex, creds.email, creds.password);
      const token = await issueToken(reply, user);
      return reply.code(200).send({ user, token });
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
