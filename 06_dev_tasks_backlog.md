# Development Tasks and Sprint Plan

## Sprint 0 Setup (1 week)
- Task: Project scaffolding (P0, 3pts)
  - Create repo, CI, Dockerfile, basic README
  - Generate initial Claude prompts
- Task: Auth and user model (P0, 5pts)
- Task: Postgres + PostGIS setup (P0, 3pts)

## Sprint 1 Core Map and Board Flow (2 weeks)
- Task: Boards API (create, update, save) (P0, 8pts)
- Task: Stickers API (add, update, delete) (P0, 5pts)
- Task: Map pins generation on save (P0, 5pts)
- Task: Basic web UI: map view + create board modal (P0, 8pts)
- Tests: Unit + integration for above (P0)

## Sprint 2 Privacy, ACL, and Publish Rules (2 weeks)
- Task: Implement ACL and invite tokens (P0, 8pts)
- Task: Private pin behavior on map (P0, 5pts)
- Task: Geocoding service integration and precision reduction (P0, 5pts)
- Tests: Acceptance tests for privacy rules

## Sprint 3 Premium gating and Payments (2 weeks)
- Task: Payment integration (Stripe) and billing model (P0, 8pts)
- Task: Paid edit invites and gating (P0, 5pts)
- Tests: Payment flow E2E

## Sprint 4 Crayon MVP and Collaboration (2 weeks)
- Task: Crayon basic canvas (free pen) (P0, 8pts)
- Task: Real-time collaboration scaffolding (WebSocket/Redis) (P1, 8pts)
- Task: Premium crayon features prototype (P1, 8pts)
- Tests: Canvas unit tests and E2E

## Sprint 5 Analytics and Self-Learning (2 weeks)
- Task: Telemetry events and A/B framework (P1, 5pts)
- Task: Self-learning pipeline prototype (P1, 8pts)
- Tests: Data pipeline validation

## Ongoing
- Hardening, performance, accessibility, and polish
- Cute UI variant design and A/B experiments

## Roles and responsibilities
- PM: backlog, acceptance criteria, stakeholder sync
- Lead dev: architecture, code reviews
- QA: test automation and regression
- Designer: UI variants and assets
- Claude reviewer: single person to review all Claude-generated code and tests
