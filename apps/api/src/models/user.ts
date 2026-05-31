import type { Knex } from "knex";

export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export function findByEmail(
  knex: Knex,
  email: string,
): Promise<UserRow | undefined> {
  return knex<UserRow>("users").where({ email }).first();
}

export function findByUsername(
  knex: Knex,
  username: string,
): Promise<UserRow | undefined> {
  return knex<UserRow>("users")
    .whereRaw("lower(username) = lower(?)", [username])
    .first();
}

export async function insertUser(
  knex: Knex,
  email: string,
  passwordHash: string,
  username: string,
): Promise<UserRow> {
  const [row] = await knex<UserRow>("users")
    .insert({ email, password_hash: passwordHash, username })
    .returning("*");
  return row!;
}
