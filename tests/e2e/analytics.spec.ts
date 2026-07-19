import { expect, test } from "@playwright/test"

// Sprint 36: GA4 is gated on STATIC_EXPORT=true (see lib/analytics-config.ts) — the Playwright
// suite always runs against a plain `next build` + `next start` (package.json's "test" script),
// which never sets that flag, so GA4 must never be present here. This is a real assertion against
// the served page, not a manual check, so a future regression that accidentally loosens the gate
// would fail this test rather than silently shipping.
test.describe("analytics", () => {
  test("GA4 does not load in the e2e test environment", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0)
    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer?: unknown }).dataLayer)
    expect(dataLayer).toBeUndefined()
  })

  // This does not depend on GA4 actually being enabled in this environment (it never is here — see
  // above). It stubs a minimal gtag/dataLayer itself, as if GA4 were present, so the assertion
  // proves something stronger than "GA4 is off in tests": it proves no code path in the app ever
  // calls gtag/dataLayer.push with a calculator input value, which is the actual production
  // constraint regardless of whether analytics happens to be enabled.
  test("calculator input values are never pushed to gtag or dataLayer", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
    })

    // A distinctive, unlikely-to-appear-incidentally value standing in for a real user's PII.
    // Must stay within EMI_LIMITS.principalAmount (₹10,000-₹10,00,00,000, see emi-schema.ts) or
    // the calculator's own validation would reject it before it ever reaches the assertion.
    const sentinel = "78946135"

    await page.goto("/finance/emi-calculator")
    await page.locator("#loan-amount").fill(sentinel)
    await page.locator("#annual-interest-rate").fill("9.5")
    await page.locator("#loan-tenure").fill("5")
    // Live — no "Calculate" click needed; the result panel already reflects the typed values.
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer)
    const serialized = JSON.stringify(dataLayer)
    expect(serialized).not.toContain(sentinel)
  })

  test("opening a calculator via a share-style URL with query values does not push them to dataLayer either", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
    })

    const sentinel = "83214597"
    await page.goto(`/finance/emi-calculator?amount=${sentinel}&rate=9.5&tenure=5&unit=years`)
    await expect(page.locator("#loan-amount")).toHaveValue(sentinel)

    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer)
    const serialized = JSON.stringify(dataLayer)
    expect(serialized).not.toContain(sentinel)
    // The current page URL itself still contains it (that's the calculator's own restore feature,
    // unrelated to analytics) — what matters here is only that nothing was pushed to gtag/dataLayer.
    expect(page.url()).toContain(sentinel)
  })
})
