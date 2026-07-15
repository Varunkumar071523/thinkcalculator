import { expect, test } from "@playwright/test"

// Sprint 31 zoom/reflow review, per WCAG 2.1 SC 1.4.10 (Reflow): content must remain usable, with
// no loss of information or two-dimensional page-level scrolling, at a 320 CSS px viewport width
// (the standard equivalent of 400% zoom on a 1280px design) and at a halved desktop viewport (the
// standard equivalent of 200% zoom on a 1280px design). A contained, scrollable data table (see
// components/calculators/data-table.tsx's overflow-x-auto wrapper) is explicitly permitted by SC
// 1.4.10 and is not page-level horizontal scroll, so this only fails on scroll at the <html>/<body>
// level, not inside a table's own scroll container.
const pages = [
  "/",
  "/finance",
  "/calculators",
  "/finance/emi-calculator",
  "/finance/swp-calculator",
  "/finance/inflation-calculator",
  "/finance/retirement-corpus-calculator",
  "/glossary",
  "/glossary/emi",
  "/topics/investing",
  "/blog/understanding-loan-emi",
  "/search",
]

async function hasPageLevelHorizontalScroll(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
}

// page.goto() already waits for "load", which is enough for hydration on these server-rendered
// pages. A follow-up "networkidle" wait is only a best-effort settle: content-heavy pages (e.g.
// /topics/*) keep Next.js's viewport Link-prefetch requests trickling in under parallel-worker
// load, which can make an unbounded networkidle wait hang past the test timeout even though the
// page is already fully rendered and measurable. Bounding it and swallowing the timeout avoids
// treating ordinary prefetch traffic as a failure.
async function waitForSettled(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {})
}

test.describe("zoom and reflow", () => {
  for (const path of pages) {
    test(`320px viewport (WCAG reflow) — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 })
      await page.goto(path)
      await waitForSettled(page)
      expect(await hasPageLevelHorizontalScroll(page), `${path} has page-level horizontal scroll at 320px`).toBe(false)
    })

    test(`200%-zoom-equivalent viewport (640x800) — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 })
      await page.goto(path)
      await waitForSettled(page)
      expect(await hasPageLevelHorizontalScroll(page), `${path} has page-level horizontal scroll at 200% zoom equivalent`).toBe(false)
    })
  }

  test("form controls and primary actions remain visible and operable at 320px on a calculator page", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto("/finance/emi-calculator")
    await expect(page.locator("#loan-amount")).toBeVisible()
    await expect(page.getByRole("button", { name: /calculate/i })).toBeVisible()
  })
})
