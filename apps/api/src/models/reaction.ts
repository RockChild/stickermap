import type { Knex } from "knex";

/** Toggles a user's +1 on a board. Returns true if now reacted, false if removed. */
export async function toggleReaction(
  knex: Knex,
  boardId: string,
  userId: string,
): Promise<boolean> {
  const existing = await knex("reactions")
    .where({ board_id: boardId, user_id: userId })
    .first();
  if (existing) {
    await knex("reactions").where({ id: existing.id }).del();
    return false;
  }
  await knex("reactions").insert({ board_id: boardId, user_id: userId });
  return true;
}

export async function countReactions(
  knex: Knex,
  boardId: string,
): Promise<number> {
  const result = await knex("reactions")
    .where({ board_id: boardId })
    .count<{ count: string }[]>("* as count");
  return Number(result[0]?.count ?? 0);
}
