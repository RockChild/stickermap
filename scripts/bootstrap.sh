#!/usr/bin/env bash
set -euo pipefail

# Brings up the local dev stack and applies DB migrations.
# Usage: ./scripts/bootstrap.sh

echo "==> Starting dev stack (Postgres+PostGIS, Redis, MinIO)..."
docker compose up -d

echo "==> Waiting for Postgres to be healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q postgres)" 2>/dev/null)" = "healthy" ]; do
  sleep 2
done

echo "==> Applying migrations (main + test databases)..."
npm --workspace @stickerboard/api run migrate
DATABASE_URL="postgres://stickerboard:stickerboard@localhost:5432/stickerboard_test" \
  npm --workspace @stickerboard/api run migrate

echo "==> Done. Run 'npm test' to verify."
