# Personal Sticker Wall — Design

Status: **direction signed off** (decisions below); not yet implemented.

## Decisions (locked)

1. **Scope:** a wall is a **personal space only** — addressed by *who*, not on
   the geographic map. (map = public places; wall = personal/social.)
2. **Default post policy:** **`approved`** — owner approves who can post; owner
   can switch to `owner_only` or `anyone`.
3. **Pinning / premium:** the owner can pin **up to 10** stickers forever for
   **free**; **unlimited** with premium. Visitor stickers are temporary
   (free ≤ 1 day, per the tier rules).
4. **Addressing:** add **`@handles`** now — accounts get a unique `username`, so
   a wall lives at `/@username` (a secret share link via `share_token` also
   works). This means **sign-up now collects a username** (unique, validated);
   existing accounts will need one assigned.

## Concept

Every signed-in user gets a **wall**: a personal 2D sticker canvas (think
fridge door / profile guestbook). Visitors can **stick a sticker** on your wall
**if you allow it**. Visitor stickers are **temporary** (they expire); the
**wall owner** can **pin** any sticker to keep it **forever**, and can remove
anything. Walls are addressed by *who* (a person), unlike the map which is
addressed by *where*.

## User stories

- As a signed-in user, I have a wall others can visit.
- As a visitor, I can leave a (temporary) sticker on someone's wall, if allowed.
- As a wall owner, I can **pin** a sticker to keep it forever, **remove** any
  sticker, and **control who may post**.

## Architecture — reuse what already exists

A wall = a **board** we already have, specialized:

- a `boards` row with **`kind='wall'`** and `owner_id` = the user (one per user,
  created lazily on first visit/sign-up).
- stickers reuse the existing **`stickers`** table (board_id, position {x,y},
  style, content, `created_by`, `category`) **+ two new columns**: `expires_at`
  and `pinned`.
- access control reuses the existing **roles** (owner/editor/viewer) + invite
  tokens, plus one wall-level **post policy** setting.
- **reactions (+1)** already attach to boards/stickers → walls get them free.

So most plumbing exists. The new parts are: a **post policy**, **per-sticker
TTL + pin**, lazy wall creation, and the **wall UI**.

## Data model (additions only)

- `boards.kind`: add `'wall'` to the existing check.
- `boards.post_policy`: `'owner_only' | 'approved' | 'anyone'` (walls only).
- `stickers.expires_at timestamptz null` (null = permanent).
- `stickers.pinned boolean default false`.
- For the `approved` policy: a `wall_grants(wall_id, user_id)` table (or reuse
  the ACL/invite mechanism).

## Lifetime rules (extends the tiers in `10_reactions_lifetimes_clustering.md`)

- A visitor's sticker is **temporary** — default 24h, poster may choose up to
  their tier cap (free ≤ 1 day).
- The **owner** can **pin** any sticker on their wall → `pinned=true`,
  `expires_at=null` (permanent), up to **10 free** (unlimited with premium).
- Expired, unpinned stickers vanish (swept later, like map notes).

## Access control — the "if allowed"

Per-wall `post_policy`:

- **owner_only** — private wall; only the owner sticks.
- **approved** — owner approves people; approved users post freely; others can
  "knock" (request) — optional later.
- **anyone** — any signed-in user can post; owner still moderates/removes.

The owner can always **remove** any sticker and **block** a user. A poster can
remove their own sticker.

## Addressing & discovery

- Accounts get a unique **`username`** → wall at **`/@username`**.
- A secret **share link** (reuse `share_token`) → `/w/{token}` also works.
- Sign-up collects a username (3–20 chars, `[a-z0-9_]`, unique,
  case-insensitive); existing accounts get one assigned/prompted.
- (Walls are intentionally **not** on the map — see decision 1.)

## API (proposed)

- `GET  /api/v1/walls/me` — get/create my wall (auth).
- `GET  /api/v1/walls/:id` (or `?token=`) — view a wall (ACL).
- `PUT  /api/v1/walls/:id/policy` — set post policy (owner).
- `POST /api/v1/walls/:id/stickers` — stick a sticker if allowed
  `{category, content, position, ttlSeconds}`.
- `PUT  /api/v1/walls/:id/stickers/:sid/pin` — owner pin/unpin (permanence).
- `DELETE /api/v1/walls/:id/stickers/:sid` — owner removes / poster removes own.
- `POST /api/v1/walls/:id/grants` — approve a poster (for `approved`).

## UI / UX

- **Your wall:** a themed canvas (paper/cork grid) of stickers; "Share my wall",
  a **policy toggle**, and on each sticker (on hover) **📌 pin** / **✕ remove**.
- **Visiting a wall:** see the stickers; if allowed, **＋ Stick a sticker** opens
  the **same category → sticker composer we built**, placed at an (x,y) on the
  wall (not a map lat/lng), with a temporary TTL.
- **Sticker:** same visual language (category color × theme, tape, handwriting).
  Pinned stickers show a 📌 marker.

## Phased plan

1. **Model + API:** wall-as-board (`kind='wall'`), `post_policy`, per-sticker
   `expires_at`/`pinned`, lazy wall creation, stick/pin/remove endpoints, ACL —
   TDD.
2. **Wall UI:** view + stick (reuse composer) + owner pin/remove/policy.
3. **Addressing:** share link now; handles later.
4. **Niceties:** knock-to-post, blocking, reactions display, notifications.

## Build order (revised for the locked decisions)

1. **Usernames:** add `users.username` (unique, validated); collect at sign-up;
   `GET /@username` resolution. (Prereq for addressing.)
2. **Wall model + API:** wall-as-board (`kind='wall'`), `post_policy`,
   per-sticker `expires_at`/`pinned`, lazy wall creation, stick/pin/remove,
   the 10-free-pins rule, ACL — TDD.
3. **Wall UI:** **visual prototype first** (per design principle #4), then build
   — view + stick (reuse the category→sticker composer) + owner pin/remove/policy.
4. **Niceties:** knock-to-post, blocking, reactions display, notifications.
