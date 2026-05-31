# Reactions, Lifetimes & Clustering

Product rules added after the first cross-user map-notes milestone.

## Reactions: +1 only

- Any map object — a **single note/sticker** OR a **board** — can receive **+1**
  ("me too" / kudos) from other people.
- The count is **public and visible to everyone**.
- **No downvotes / dislikes.** Positive-only by design.
- One +1 per user per object (toggle off allowed) — idempotent per user.
- Open question: require login to +1 (prevents abuse) vs allow anonymous.
  Leaning **login required**; revisit with analytics.

## Lifetimes (ephemerality tiers)

Everything on the map is **temporary**. Premium extends the lifetime.

| Object                  | Free tier                                  | Premium                                              |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------- |
| Single sticker / note   | up to **1 day** (hard max)                 | up to **1 year** (creator may pick less; cap 1 year) |
| Board (multi-sticker)   | **1 month** (the "free month" for newcomers) | **unlimited** (never expires)                      |

- Free single notes: creator picks an ETA, capped at 24h.
- Premium single notes: creator picks any ETA up to 365 days.
- Free boards: 1-month lifetime. Premium boards: permanent.
- Expired objects vanish from the map. (Currently hidden by query; a sweeper
  job will hard-delete them later.)

## Clustering at scale (dozens → thousands)

The map must stay usable when many objects sit close together.

- **Rule:** when **more than 5 objects fall within ~100px×100px**, collapse them
  into a **cluster badge showing the count** (e.g. "(5)").
- **Clicking a cluster** opens a **list** of the contained objects (and/or zooms
  in); the user picks one from the list.
- **Implementation:** MapLibre GeoJSON source clustering (`cluster: true`,
  `clusterRadius` ~50–60px, `clusterMaxZoom` tuned). Cluster click →
  `getClusterLeaves` → list popup.
- **Performance:** move from per-object DOM markers to a **single clustered
  GeoJSON source + GPU layers**, so thousands of points don't become thousands
  of DOM nodes. (The current DOM-marker approach is fine for dozens, not
  thousands — clustering is the fix.)

## "Need help" threads (idea — not yet built)

A lightweight request/response flow on a note:

- Author drops a note tagged e.g. **"need help"** + a role tag like **"driver"**
  ("Need a driver, 5pm, 12th & 50th").
- Others browsing with filters (tag = "need help", role = "driver") see it and
  can **reply in a thread** attached to the note (comments).
- When author and a responder agree, the note is marked **resolved** (likely
  stops accepting replies / fades out).
- Needs: tags + filters on objects, a comments/thread model, a `resolved` state
  recording who resolved with whom.
- Status: captured for backlog; design + data model TBD.
