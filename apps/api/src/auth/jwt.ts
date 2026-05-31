import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/** Shape of the JWT payload we sign in the auth routes. */
export interface JwtUser {
  sub: string;
  email: string;
}

// Tell @fastify/jwt the concrete payload/user shape so `request.user` is typed.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /** preHandler that requires a valid JWT; replies 401 otherwise. */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Registers the `authenticate` preHandler. On failure it returns 401 with a
 * stable error code, matching the auth routes' `{ error }` body shape.
 */
export function registerAuthDecorator(app: FastifyInstance): void {
  app.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await req.jwtVerify();
      } catch {
        await reply.code(401).send({ error: "unauthorized" });
      }
    },
  );
}

/**
 * Best-effort identity extraction for routes where auth is OPTIONAL (public /
 * unlisted reads). Returns the user id when a valid token is present, or null
 * for anonymous / invalid tokens — never throws.
 */
export async function optionalUserId(
  req: FastifyRequest,
): Promise<string | null> {
  try {
    const payload = await req.jwtVerify<JwtUser>();
    return payload.sub;
  } catch {
    return null;
  }
}
