import { expect, test } from "@playwright/test"

import { calculatorRegistry } from "../../features/calculators/core/calculator-registry"
import { getRecentChangelogEntries } from "../../lib/changelog"

// Sprint 37: trust-stats strip, changelog block, and popular/new badges — all additive homepage
// sections, tested against the real static-export-rendered HTML.
test.describe("trust-stats strip", () => {
  test("renders the calculator count, no-login, and ₹/tax-rules facts as a distinct band", async ({ page }) => {
    await page.goto("/")
    const publishedCount = calculatorRegistry.filter((calculator) => calculator.status === "published").length
    const strip = page.getByTestId("trust-stats-strip")
    await expect(strip).toBeVisible()
    await expect(strip.getByText(`${publishedCount}`)).toBeVisible()
    await expect(strip.getByText("No login")).toBeVisible()
    await expect(strip.getByText("Built for ₹ and Indian tax rules")).toBeVisible()
  })
})

test.describe("changelog block", () => {
  test("renders the seeded entries, most-recent-first, capped at 4", async ({ page }) => {
    await page.goto("/")
    const expected = getRecentChangelogEntries(4)
    expect(expected.length).toBeGreaterThan(0)

    for (const entry of expected) {
      await expect(page.getByRole("heading", { name: entry.title, exact: true })).toBeVisible()
    }

    const headings = await page.locator("li time + h3").allTextContents()
    expect(headings).toEqual(expected.map((entry) => entry.title))
  })
})

test.describe("popular/new badges", () => {
  test("EMI and SIP cards show a Popular badge on the homepage grid", async ({ page }) => {
    await page.goto("/")
    const emiCard = page.getByRole("link", { name: /EMI Calculator/ })
    const sipCard = page.getByRole("link", { name: /SIP Calculator/ })
    await expect(emiCard.getByText("Popular")).toBeVisible()
    await expect(sipCard.getByText("Popular")).toBeVisible()
  })

  test("a calculator with no badge does not show Popular or New", async ({ page }) => {
    await page.goto("/")
    const fdCard = page.getByRole("link", { name: /FD Calculator/ })
    await expect(fdCard.getByText("Popular")).toHaveCount(0)
    await expect(fdCard.getByText("New")).toHaveCount(0)
  })
})
