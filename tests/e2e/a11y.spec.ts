import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import type { AxeResults, Result } from "axe-core"
import { getAllAuditRoutes } from "./routes"

// Sprint 31 permanent accessibility gate. Runs the full WCAG 2.1 A/AA axe-core ruleset against
// every published, statically-generated route in the site (see routes.ts) across Chromium, Firefox,
// and Playwright's WebKit engine. This is what "npm run test" now runs in addition to the Vitest
// unit suite, so a future sprint that regresses labels, contrast, landmarks, or heading order fails
// CI immediately instead of silently shipping. See docs/PRODUCTION-CHECKLIST.md section 9-11 for
// what this DOES and does NOT cover (it cannot replace a real screen reader or a physical device).
async function runAxe(page: Page): Promise<AxeResults> {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
}

// page.goto() already waits for the "load" event, which is enough for hydration on these
// server-rendered pages. A follow-up wait for "networkidle" (0 in-flight requests for 500ms) is
// only a best-effort settle, not a correctness requirement — content-heavy pages like /topics/*
// keep Next.js's viewport Link-prefetch requests trickling in indefinitely under parallel-worker
// load, which made a strict, unbounded networkidle wait genuinely hang past the 30s test timeout
// (reproduced on webkit against /topics/investing). Bounding it and swallowing the timeout keeps
// the settle-if-possible behavior without turning ordinary prefetch traffic into a false failure.
async function waitForSettled(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {})
}

function formatViolations(violations: readonly Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `    - ${node.target.join(" ")}\n      ${node.failureSummary?.replace(/\n/g, "\n      ")}`).join("\n")
      return `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help} (${violation.helpUrl})\n${nodes}`
    })
    .join("\n\n")
}

const routes = getAllAuditRoutes()

test.describe("accessibility sweep", () => {
  for (const route of routes) {
    test(`${route.label} — ${route.path}`, async ({ page }) => {
      await page.goto(route.path)
      await waitForSettled(page)
      const results = await runAxe(page)
      expect(results.violations, formatViolations(results.violations)).toEqual([])
    })
  }

  test("not-found page — /this-route-does-not-exist", async ({ page }) => {
    await page.goto("/this-route-does-not-exist")
    await waitForSettled(page)
    const results = await runAxe(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
  })
})
