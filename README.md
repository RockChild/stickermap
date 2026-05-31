# StickerBoard Bootstrap

**Purpose**
This folder contains Claude-ready Markdown instructions to bootstrap StickerBoard вЂ” a map-first sticky-note board app with premium collaborative editing and crayon drawing tools.

**Specs & orchestration**
1. The numbered `*.md` files are the human-readable product/tech specs.
2. Feed `.claude/orchestrator.md` to your Claude orchestration pipeline to generate code scaffolds, tests, and CI artifacts.
3. Follow `05_tests_tdd_acceptance.md` to run TDD cycles.
4. Use `06_dev_tasks_backlog.md` to run sprints and track progress.

## Dev quickstart

Requirements: Node >= 22, Docker.

```bash
npm install                 # install workspace deps
cp .env.example .env        # then edit secrets
./scripts/bootstrap.sh      # docker compose up + run migrations (main + test DBs)
npm test                    # run all Vitest suites
```

Or step the stack up manually:

```bash
docker compose up -d                              # Postgres+PostGIS, Redis, MinIO
npm --workspace @stickerboard/api run migrate     # apply migrations to the main DB
```

**Testing strategy** — Vitest for unit + integration (fast, terse output), Playwright for E2E only.

| Command | Runs |
| --- | --- |
| `npm run test:unit` | fast, no external services |
| `npm run test:integration` | DB/Redis-backed (serial) |
| `npm run test:e2e` | Playwright browser flows |
| `npm run lint` / `npm run typecheck` | static checks |

## Real-device / LAN testing

Run the app on phones/tablets on the same Wi-Fi (great for collaboration tests —
every device shares the same live map).

1. Start the API: `npm --workspace @stickerboard/api run start` (listens on :3000).
2. Start the web dev server: `npm --workspace @stickerboard/web run dev`.
   Vite is exposed on the LAN and prints a **Network** URL, e.g.
   `http://192.168.1.2:5173/`.
3. On any device on the same Wi-Fi, open that Network URL.

Devices only talk to Vite (:5173); it **proxies `/api` to the local API**, so
there's no machine IP to hardcode and no CORS. If a device can't connect, allow
**Node.js** through the OS firewall for **Private** networks (Windows may prompt
the first time Vite binds).

## Layout (monorepo, npm workspaces)

```
packages/shared   shared TS types + privacy utilities
apps/api          Fastify API (auth, boards, stickers, map)
apps/web          Vite React PWA (map + board editor)
```

**Scope**
- Web + mobile responsive PWA
- Map with city/country-level pins
- Boards with stickers and optional crayon drawing
- Privacy-first map visibility
- Premium features: collaborative editing, crayon tools, paid access control
- Multi-agent Claude orchestration for planning, dev, QA, analytics, and continuous learning
