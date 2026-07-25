import { expect, test } from "@playwright/test"

// Sprint 41: site-wide FAQ search chat widget, wired into the root layout so it renders on every
// page type. Covers open/close, default suggestions before typing, a real search match, the
// no-match fallback, result expansion, and keyboard accessibility (Escape + focus trap/return),
// matching the mobile navigation Sheet focus-trap test in tests/e2e/keyboard.spec.ts.
const pageTypes = [
  { name: "calculator page", path: "/finance/emi-calculator" },
  { name: "Loans guide page", path: "/guides/understanding-emi-fd-and-rd" },
  { name: "home page", path: "/" },
]

test.describe("FAQ search widget", () => {
  for (const { name, path } of pageTypes) {
    test(`renders and opens with popular suggestions on the ${name}`, async ({ page }) => {
      await page.goto(path)
      const trigger = page.getByRole("button", { name: "Ask a question about ThinkCalculator" })
      await expect(trigger).toBeVisible()

      await trigger.click()
      const panel = page.locator('[data-slot="faq-search-panel"]')
      await expect(panel).toBeVisible()
      await expect(panel.getByText("Popular questions")).toBeVisible()
      const suggestionCount = await panel.getByRole("button", { expanded: false }).count()
      expect(suggestionCount).toBeGreaterThan(0)
    })
  }

  test("typing a known query returns a matching result", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Ask a question about ThinkCalculator" }).click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    await page.getByLabel("Search calculator FAQs, worked examples, and guides").fill("EMI")

    await expect(panel.getByText(/emi/i).first()).toBeVisible()
    const resultCount = await panel.getByRole("button", { expanded: false }).count()
    expect(resultCount).toBeGreaterThan(0)
  })

  test("announces the result count via a live region when a query returns matches", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Ask a question about ThinkCalculator" }).click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    const searchInput = page.getByLabel("Search calculator FAQs, worked examples, and guides")

    // Before typing (or below the minimum query length), no results-count live region exists yet —
    // only the "Popular questions" default state, matching the no-live-announcement-for-defaults
    // scope of this fix.
    const liveRegion = panel.locator('[role="status"][aria-live="polite"]')
    await expect(liveRegion).toHaveCount(0)

    await searchInput.fill("EMI")
    await expect(liveRegion).toBeVisible()
    await expect(liveRegion).toHaveText(/^\d+ results? found$/)
    const resultCount = await panel.getByRole("button", { expanded: false }).count()
    await expect(liveRegion).toHaveText(new RegExp(`^${resultCount} results? found$`))
  })

  test("a query below the minimum length falls back to the default popular-questions state, not a search", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Ask a question about ThinkCalculator" }).click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    await page.getByLabel("Search calculator FAQs, worked examples, and guides").fill("a")

    await expect(panel.getByText("Popular questions")).toBeVisible()
    await expect(panel.getByText("No matching answers yet.")).toHaveCount(0)
    await expect(panel.locator('[role="status"][aria-live="polite"]')).toHaveCount(0)
  })

  test("an unmatched query shows the no-match fallback pointing to the calculator list", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Ask a question about ThinkCalculator" }).click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    await page.getByLabel("Search calculator FAQs, worked examples, and guides").fill("zzqxw nonexistent unrelated gibberish")

    await expect(panel.getByText("No matching answers yet.")).toBeVisible()
    const browseLink = panel.getByRole("link", { name: /Browse all calculators/ })
    // next.config.ts only sets trailingSlash when STATIC_EXPORT=true (the Hostinger export build).
    // This suite always runs against a regular `next build`/`next start` (playwright.config.ts),
    // which renders without the trailing slash — match on either so the assertion holds regardless
    // of which build produced the .next directory this happens to run against.
    await expect(browseLink).toHaveAttribute("href", /^\/calculators\/?$/)
  })

  test("a result is collapsed by default and expands to reveal the full answer and a link", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Ask a question about ThinkCalculator" }).click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    await page.getByLabel("Search calculator FAQs, worked examples, and guides").fill("EMI")

    // Pin to a specific result by its stable aria-controls id rather than filtering on
    // expanded=false: that filter re-evaluates on every poll, so once the click flips this
    // button's state, "first expanded=false button" silently re-resolves to the next item.
    const firstResult = panel.locator("button[aria-controls]").first()
    const resultId = await firstResult.getAttribute("aria-controls")
    await expect(firstResult).toBeVisible()
    await firstResult.click()
    await expect(firstResult).toHaveAttribute("aria-expanded", "true")

    // Attribute selector, not a `#` id selector: result ids embed colons (e.g.
    // "faq-search-result-faq:emi-calculator:0"), which a CSS id selector would misparse.
    const expandedContainer = panel.locator(`[id="${resultId}"]`)
    await expect(expandedContainer).toBeVisible()
    await expect(expandedContainer.getByRole("link")).toBeVisible()
  })

  test("Escape closes the panel and returns focus to the trigger button", async ({ page }) => {
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "Ask a question about ThinkCalculator" })
    await trigger.click()
    const panel = page.locator('[data-slot="faq-search-panel"]')
    await expect(panel).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("focus moves into the panel on open and stays trapped within it while tabbing", async ({ page }) => {
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "Ask a question about ThinkCalculator" })
    await trigger.focus()
    await page.keyboard.press("Enter")

    const insidePanel = await page.evaluate(() => {
      const el = document.activeElement
      const panel = document.querySelector('[data-slot="faq-search-panel"]')
      return Boolean(panel && el && panel.contains(el))
    })
    expect(insidePanel, "focus should move into the open FAQ search panel").toBe(true)

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab")
      const stillInsidePanel = await page.evaluate(() => {
        const el = document.activeElement
        const panel = document.querySelector('[data-slot="faq-search-panel"]')
        return Boolean(panel && el && panel.contains(el))
      })
      expect(stillInsidePanel, `focus escaped the panel after ${i + 1} Tab press(es)`).toBe(true)
    }
  })

  test("does not interfere with the print-summary attribute or z-index of existing result cards", async ({ page }) => {
    await page.goto("/finance/emi-calculator")
    const trigger = page.getByRole("button", { name: "Ask a question about ThinkCalculator" })
    // React stringifies a valueless boolean JSX attribute to the literal string "true" on the DOM
    // node (not ""), matching how the existing calculator-actions.tsx data-print-hide usage renders.
    await expect(trigger).toHaveAttribute("data-print-hide", "true")
  })
})
