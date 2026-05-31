import { defineConfig } from "vitest/config";

// Root Vitest config. Project definitions live in vitest.workspace.ts.
// Default reporter is intentionally terse in CI to keep output (and the
// tokens spent reading it back) small.
export default defineConfig({
  test: {
    reporters: process.env.CI ? ["dot"] : ["default"],
  },
});
