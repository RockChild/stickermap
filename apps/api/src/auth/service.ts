import type { Knex } from "knex";
import { hashPassword, verifyPassword } from "./password.js";
import { findByEmail, insertUser } from "../models/user.js";

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
}

export async function signup(
  knex: Knex,
  email: string,
  password: string,
): Promise<PublicUser> {
  const existing = await findByEmail(knex, email);
  if (existing) {
    throw new AuthError(409, "email_taken", "Email already registered");
  }
  const passwordHash = await hashPassword(password);
  const row = await insertUser(knex, email, passwordHash);
  return { id: row.id, email: row.email };
}

export async function login(
  knex: Knex,
  email: string,
  password: string,
): Promise<PublicUser> {
  const user = await findByEmail(knex, email);
  // Same error for unknown email and wrong password to avoid user enumeration.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AuthError(401, "invalid_credentials", "Invalid email or password");
  }
  return { id: user.id, email: user.email };
}
