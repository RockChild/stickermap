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
docker compose up -d        # Postgres+PostGIS, Redis, MinIO  (added in step 2)
npm test                    # run all Vitest suites
```

**Testing strategy** — Vitest for unit + integration (fast, terse output), Playwright for E2E only.

| Command | Runs |
| --- | --- |
| `npm run test:unit` | fast, no external services |
| `npm run test:integration` | DB/Redis-backed (serial) |
| `npm run test:e2e` | Playwright browser flows |
| `npm run lint` / `npm run typecheck` | static checks |

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
