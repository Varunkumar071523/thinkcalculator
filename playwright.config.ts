import { defineConfig, devices } from "@playwright/test"

const PORT = 3104
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // A single retry unconditionally (not just in CI): the full sweep hits one shared `next start`
  // dev server from many parallel browser contexts, and running >4 workers against it produced
  // occasional transient failures (page not fully settled when axe ran) that were not reproducible
  // in isolation — resource contention, not a real accessibility regression. Capping workers below
  // plus one retry made a full multi-browser run 0-flake across repeated local runs.
  retries: 1,
  workers: 4,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // Playwright's WebKit engine gives cross-engine signal only. It is NOT Safari and is NOT iOS —
    // real Safari (macOS) and iOS Safari behaviour must still be verified on physical/hosted devices
    // before launch (see the Sprint 31 report).
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  // Deliberately does NOT run `next build` here. Chaining "next build && next start" as one
  // webServer command left an orphaned, unkillable next-start process behind on Windows when a
  // run was interrupted (the shell-chain hides the real server PID from teardown). The build is a
  // separate, explicit step in the npm scripts (see package.json "test"/"test:e2e"), so this
  // config only ever has to start and stop one directly-managed process.
  //
  // `reuseExistingServer` is unconditionally true (not just outside CI): scripts/run-e2e.mjs -
  // the only sanctioned way to run these tests, see docs/CONTRIBUTING.md - always starts and owns
  // the server itself before invoking `playwright test`, and polls it until it responds. With the
  // server already up, Playwright's webServer plugin takes its "already available" fast path and
  // returns without spawning or owning any process of its own (see
  // node_modules/playwright/lib/runner/index.js, WebServerPlugin._startProcess). That means its
  // teardown has nothing to wait on and can't hang - the Windows issue above is sidestepped
  // structurally rather than detected-and-killed after the fact. `command` below is kept only as
  // a fallback for direct `npx playwright test` invocations that skip the wrapper; on Windows
  // that path is still exposed to the hang this comment describes.
  webServer: {
    command: `next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
