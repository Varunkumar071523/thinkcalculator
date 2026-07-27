// Orchestrates the Sprint 45 GA4-consent/analytics Playwright suite (tests/e2e-analytics/), which
// needs a real STATIC_EXPORT=true build with GA4 actually enabled — something the main
// tests/e2e/ suite deliberately never does (see tests/e2e/analytics.spec.ts's own comment on why
// GA4 must stay off there). docs/DEPLOYMENT.md's "Running the existing Playwright suite against
// the static export" section flagged this exact gap as unaddressed follow-up work; this script
// and playwright.analytics.config.ts are that follow-up, kept as a separate opt-in suite rather
// than folded into scripts/run-e2e.mjs / playwright.config.ts so the default `npm test` path
// (which must never build with a live measurement ID) is untouched.
//
// Steps: build the static export with a test-only measurement ID, serve out/ with
// scripts/serve-static-export.mjs (a real static file server — no SPA fallback, matching
// Sprint 34's Apache-shaped verification method), then run Playwright against it with
// `webServer` disabled in playwright.analytics.config.ts (this script owns the server directly,
// the same "own it, don't let Playwright spawn it" structure as scripts/run-e2e.mjs, for the same
// Windows-teardown reasons documented there).
import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import process from "node:process"

import getPort from "get-port"

import { createStaticExportServer } from "./serve-static-export.mjs"

// Not a real Google Analytics property — this suite never lets a real network request reach
// googletagmanager.com/google-analytics.com (every test intercepts and stubs those routes). Only
// the shape (`G-` prefix) matters, since components/analytics/google-analytics.tsx and
// lib/analytics-config.ts key off "is a measurement ID present," not its validity.
const TEST_MEASUREMENT_ID = "G-TESTEXPORT01"

function quoteArg(arg) {
  if (/^[A-Za-z0-9_\-.:\\/=]+$/.test(arg)) return arg
  return `"${arg.replace(/"/g, '\\"')}"`
}

async function main() {
  console.log("[run-e2e-analytics] building static export with STATIC_EXPORT=true ...")
  const build = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, STATIC_EXPORT: "true", NEXT_PUBLIC_GA_MEASUREMENT_ID: TEST_MEASUREMENT_ID },
  })
  if (build.status !== 0) {
    process.exitCode = build.status ?? 1
    return
  }

  const port = await getPort()
  const server = createStaticExportServer(path.join(process.cwd(), "out"))
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve))
  console.log(`[run-e2e-analytics] serving out/ on http://127.0.0.1:${port}`)

  try {
    const commandLine = ["npx", "playwright", "test", "--config=playwright.analytics.config.ts", ...process.argv.slice(2)]
      .map(quoteArg)
      .join(" ")
    const testsProcess = spawn(commandLine, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, E2E_ANALYTICS_PORT: String(port) },
    })
    const code = await new Promise((resolve) => testsProcess.on("exit", (code) => resolve(code ?? 1)))
    process.exitCode = code
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
