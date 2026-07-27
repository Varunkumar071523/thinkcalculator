import { defineConfig, devices } from "@playwright/test"

// Sprint 45 — a deliberately separate config from playwright.config.ts, not an extra project
// inside it: this suite needs a real STATIC_EXPORT=true build with GA4 actually enabled, which
// tests/e2e/analytics.spec.ts's own comment documents as something the main suite must *never*
// do (a plain `next build`/`next start` there could otherwise pollute production analytics data
// if the gate ever loosened). Keeping the config, test directory, and orchestration script
// (scripts/run-e2e-analytics.mjs) fully separate means running the default `npm test` can never
// accidentally pick this suite up.
const PORT = Number(process.env.E2E_ANALYTICS_PORT) || 3105
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "./tests/e2e-analytics",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  workers: 2,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  // Chromium only: this suite exists to prove one thing (the consent/Consent-Mode wiring against
  // a real static export), not to re-run full cross-browser coverage that tests/e2e/ already does
  // against the same rendered HTML/CSS.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // No `webServer` block: scripts/run-e2e-analytics.mjs starts and owns the static file server
  // itself, the same "don't let Playwright spawn/own it" structure playwright.config.ts uses for
  // `next start`, and for the same Windows-teardown reasons documented there.
})
