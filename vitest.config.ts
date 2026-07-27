import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // tests/e2e/ and tests/e2e-analytics/ hold Playwright specs (own test runner, own
    // "test"/"expect" API from @playwright/test) — excluded so Vitest's default *.spec.ts glob
    // doesn't also try to execute them. See playwright.config.ts / playwright.analytics.config.ts
    // for those suites.
    exclude: ["**/node_modules/**", "tests/e2e/**", "tests/e2e-analytics/**"],
  },
})
