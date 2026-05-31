import { defineWorkspace } from "vitest/config";

// Two projects keep fast unit tests separate from slower DB-backed
// integration tests, so `npm run test:unit` stays snappy.
export default defineWorkspace([
  {
    test: {
      name: "unit",
      include: [
        "packages/**/test/**/*.test.ts",
        "apps/**/test/unit/**/*.test.ts",
      ],
    },
  },
  {
    test: {
      name: "integration",
      include: ["apps/**/test/integration/**/*.test.ts"],
      // Integration tests touch Postgres/Redis; run serially with headroom.
      // A single fork keeps schema-destructive setup (e.g. the migrations
      // suite's DROP SCHEMA) from racing another file's live connections.
      fileParallelism: false,
      pool: "forks",
      poolOptions: { forks: { singleFork: true } },
      testTimeout: 30_000,
    },
  },
]);
