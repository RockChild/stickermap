import type { Knex } from "knex";

export interface UserRow {
  id: string;
  email: string;
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

export async function insertUser(
  knex: Knex,
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const [row] = await knex<UserRow>("users")
    .insert({ email, password_hash: passwordHash })
    .returning("*");
  return row!;
}
