import { expect, test } from "@playwright/test"

import { calculatorRegistry } from "../../features/calculators/core/calculator-registry"

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
    await expect(page.getByRole("button", { name: /reset/i })).toBeVisible()
  })

  // Regression test for the mobile overflow bug (2026-07): the checks above only ever load each
  // page's initial, pre-calculation state. The bug only appeared once a calculation was submitted,
  // because CalculatorPageLayout's results grid had no explicit mobile column ("none"/implicit auto
  // sizing), so a wide amortization/schedule table rendered post-calculation could force the shared
  // grid track past the viewport even though the table itself was properly contained in its own
  // overflow-x-auto wrapper. Every published calculator now computes live (no submit button — see
  // the Sprint XX calculators rollout) and their schedule/breakdown tables live inside
  // collapsed-by-default accordions, so opening every accordion on the page is what now exercises
  // the part that must be checked on every published calculator page, not just the 4 pages the
  // original suite happened to list.
  const calculatorPaths = calculatorRegistry
    .filter((calculator) => calculator.status === "published")
    .map((calculator) => calculator.canonicalPath)

  for (const path of calculatorPaths) {
    test(`no page-level horizontal scroll after calculating at 375px — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(path)
      await waitForSettled(page)

      const accordionToggles = page.locator("details:not([open]) > summary")
      while (await accordionToggles.count()) {
        await accordionToggles.first().click()
      }
      await page.waitForTimeout(300)
      expect(await hasPageLevelHorizontalScroll(page), `${path} has page-level horizontal scroll after calculating at 375px`).toBe(false)

      // A page can render more than one schedule (e.g. the retirement calculator's accumulation and
      // withdrawal tables), each with its own "Show full schedule" toggle. Clicking one flips its own
      // label to "Show less", shrinking the live match set, so re-querying and always clicking the
      // first remaining match (rather than indexing into a fixed snapshot) expands all of them.
      const expandScheduleButtons = page.getByRole("button", { name: /show full schedule/i })
      let expandedAny = false
      while (await expandScheduleButtons.count()) {
        await expandScheduleButtons.first().click()
        expandedAny = true
      }
      if (expandedAny) {
        await page.waitForTimeout(300)
        expect(await hasPageLevelHorizontalScroll(page), `${path} has page-level horizontal scroll with the full schedule expanded at 375px`).toBe(false)
      }
    })
  }
})
