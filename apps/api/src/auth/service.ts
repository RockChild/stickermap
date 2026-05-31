import type { Knex } from "knex";
import { hashPassword, verifyPassword } from "./password.js";
import {
  generateNickname,
  isValidUsername,
  normalizeUsername,
} from "./nickname.js";
import { findByEmail, findByUsername, insertUser } from "../models/user.js";

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

/** Find an unused generated handle (retries, then a timestamp fallback). */
async function uniqueNickname(knex: Knex): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = generateNickname();
    if (!(await findByUsername(knex, candidate))) return candidate;
  }
  return `${generateNickname()}${Date.now().toString().slice(-3)}`.slice(0, 20);
}

export async function signup(
  knex: Knex,
  email: string,
  password: string,
  username?: string,
): Promise<PublicUser> {
  const existing = await findByEmail(knex, email);
  if (existing) {
    throw new AuthError(409, "email_taken", "Email already registered");
  }

  let handle: string;
  if (username !== undefined) {
    handle = normalizeUsername(username);
    if (!isValidUsername(handle)) {
      throw new AuthError(
        400,
        "invalid_username",
        "Username must be 3–20 chars of a–z, 0–9, _",
      );
    }
    if (await findByUsername(knex, handle)) {
      throw new AuthError(409, "username_taken", "Username already taken");
    }
  } else {
    handle = await uniqueNickname(knex);
  }

  const passwordHash = await hashPassword(password);
  let row;
  try {
    row = await insertUser(knex, email, passwordHash, handle);
  } catch (err) {
    // Unique-violation race on username -> 409.
    if ((err as { code?: string }).code === "23505") {
      throw new AuthError(409, "username_taken", "Username already taken");
    }
    throw err;
  }
  return { id: row.id, email: row.email, username: row.username };
}

export async function login(
  knex: Knex,
  email: string,
  password: string,
): Promise<PublicUser> {
  const user = await findByEmail(knex, email);
  // Same error for unknown email and wrong password to avoid user enumeration.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AuthError(
      401,
      "invalid_credentials",
      "Invalid email or password",
    );
  }
  return { id: user.id, email: user.email, username: user.username };
}
