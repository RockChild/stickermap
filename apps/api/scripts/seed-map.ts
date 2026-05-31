import type { NoteCategory } from "@stickerboard/shared";
import { createKnex, DEFAULT_DATABASE_URL } from "../src/db/connection.js";
import { insertBoard } from "../src/models/board.js";
import { insertMapPin } from "../src/models/mapPin.js";

const CATEGORIES: NoteCategory[] = ["help", "meet", "whatif", "cry"];

// Seeds clustered demo notes around a few NYC hotspots so clustering is visible.
const knex = createKnex(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);

const HOTSPOTS = [
  { name: "Times Square", lat: 40.758, lng: -73.9855, count: 14 },
  { name: "Downtown", lat: 40.7128, lng: -74.006, count: 10 },
  { name: "Upper West Side", lat: 40.787, lng: -73.975, count: 8 },
];

try {
  const email = "seed@stickerboard.local";
  let user = await knex("users").where({ email }).first();
  if (!user) {
    [user] = await knex("users")
      .insert({ email, password_hash: "seed-not-loginable" })
      .returning("*");
  }

  let total = 0;
  for (const h of HOTSPOTS) {
    for (let i = 0; i < h.count; i++) {
      const lat = h.lat + (Math.random() - 0.5) * 0.012;
      const lng = h.lng + (Math.random() - 0.5) * 0.012;
      const category = CATEGORIES[i % CATEGORIES.length]!;
      const board = await insertBoard(knex, {
        owner_id: user.id,
        title: `${h.name} note ${i + 1}`,
        body: "seeded demo note",
        visibility: "public",
        kind: "note",
        category,
        is_published: true,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      });
      await insertMapPin(knex, {
        board_id: board.id,
        lat,
        lng,
        location_name: h.name,
      });
      total++;
    }
  }
  console.log(`Seeded ${total} notes across ${HOTSPOTS.length} hotspots.`);
} finally {
  await knex.destroy();
}
