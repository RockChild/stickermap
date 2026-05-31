# CI CD and Release Instructions

## CI pipeline stages
1. Lint: ESLint / flake8
2. Unit tests: run fast unit suites
3. Integration tests: run API integration tests (use test DB)
4. E2E tests: run Playwright/Cypress in headless mode
5. Security scan: Snyk or similar
6. Build: create Docker images
7. Deploy to staging: automatic on main branch
8. Smoke tests: run quick smoke checks on staging
9. Deploy to production: manual approval

## Example GitHub Actions snippet (concept)
- ci.yml:
  - jobs: lint, test, build, deploy-staging
- Use matrix to run Node and Python tests in parallel

## Test harness
- Local dev: docker-compose up with Postgres + Redis + MinIO
- Run tests:
  - npm run test:unit
  - npm run test:integration
  - npx playwright test

## Release checklist
- All tests green
- Security scan passed
- Privacy review completed
- Performance baseline met
- Claude reviewer sign-off on generated code

## Rollback plan
- Keep last 3 images
- Feature flags for risky features (crayon, paid invites)
