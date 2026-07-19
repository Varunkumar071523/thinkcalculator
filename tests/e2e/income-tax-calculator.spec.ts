import { expect, test } from "@playwright/test"

// Sprint 25: fills the income tax calculator for both regimes and verifies the displayed
// breakdown against the same two worked examples asserted in Sprint 24's engine regression
// suite (lib/tax/__tests__/calculate-income-tax.test.ts), so the UI is checked against the
// same ground truth as the calculation engine, not just its own numbers.
//
// Design-migration batch 4: the calculator now recalculates live on every keystroke/slider move
// (matching CAGR/Retirement Corpus's pattern) instead of gating the result behind a "Calculate"
// click, and the top result panel is a side-by-side Old-vs-New regime comparison rather than a
// single-regime summary — the exact figures for the currently selected regime moved to the
// "{Regime} breakdown" card below it (data-testid="income-tax-breakdown-card"), so lookups are
// scoped there instead of the old calculator-result-card.
async function breakdownValueFor(page: import("@playwright/test").Page, label: string): Promise<string | null> {
  return page
    .getByTestId("income-tax-breakdown-card")
    .getByText(label, { exact: true })
    .evaluate((el) => el.nextElementSibling?.textContent ?? null)
}

// See the matching comment/helper in hra-calculator.spec.ts: waits for React to have hydrated
// before the test's first `.fill()`, closing the same pre-existing WebKit hydration race that
// batch investigated and fixed for HRA. Income Tax shares the identical fill-immediately-after-
// navigation shape, so it carries the same latent risk even though it had not yet been observed
// flaking; applied here defensively.
async function waitForHydration(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.locator("[data-calculator-form]")).toHaveAttribute("data-hydrated", "true")
}

test.describe("income tax calculator", () => {
  test("new regime — ₹12.75L gross income produces zero total tax liability (Sprint 24 worked example)", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await waitForHydration(page)
    await expect(page.getByRole("radio", { name: "New Regime" })).toBeChecked()

    await page.locator("#gross-income").fill("1275000")
    await page.locator("#age-band").selectOption("below60")

    // Live — no "Calculate" click needed.
    expect(await breakdownValueFor(page, "Total tax liability")).toBe("₹0.00")
    expect(await breakdownValueFor(page, "Taxable income")).toBe("₹12,00,000.00")
    expect(await breakdownValueFor(page, "Section 87A rebate")).toBe("₹60,000.00")

    // The slab breakdown lives in a collapsed-by-default accordion — open it before checking its
    // heading and table. Located by the <summary> itself rather than role="button": Chromium does
    // not expose <summary> with an implicit button role, so a role-based lookup never resolves.
    await page.locator("summary", { hasText: "Slab-by-slab breakdown" }).click()
    await expect(page.getByRole("heading", { name: "Slab-by-slab breakdown" })).toBeVisible()
    await expect(page.getByRole("table", { name: /slab-by-slab/i })).toBeVisible()
  })

  test("old regime — ₹10,00,000 gross income, below 60, zero deductions produces ₹1,06,600 total tax liability (Sprint 24 worked example)", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await waitForHydration(page)
    await page.getByRole("radio", { name: "Old Regime" }).check()
    await expect(page.locator("#section-80c")).toBeVisible()
    await expect(page.locator("#employer-nps-80ccd2")).toHaveCount(0)

    await page.locator("#gross-income").fill("1000000")
    await page.locator("#age-band").selectOption("below60")

    expect(await breakdownValueFor(page, "Total tax liability")).toBe("₹1,06,600.00")
    expect(await breakdownValueFor(page, "Taxable income")).toBe("₹9,50,000.00")
    // The breakdown card's title is a styled div (CardTitle), not a semantic heading, so it's
    // looked up by text within the card rather than by heading role.
    await expect(page.getByTestId("income-tax-breakdown-card").getByText("Old Regime breakdown")).toBeVisible()
    // The slab breakdown lives in a collapsed-by-default accordion — open it before checking its heading.
    await page.locator("summary", { hasText: "Slab-by-slab breakdown" }).click()
    await expect(page.getByRole("heading", { name: "Slab-by-slab breakdown" })).toBeVisible()

    // The regime comparison panel shows this same figure in the Old Regime column specifically —
    // scoped there rather than to the whole panel, since the headline "savings" figure can
    // coincidentally equal the same amount (e.g. whenever the New Regime's tax is fully rebated
    // to zero, savings == the Old Regime's total exactly).
    await expect(page.getByTestId("old-regime-column").getByText("₹1,06,600.00")).toBeVisible()
  })

  test("switching regimes hides the other regime's fields and does not leak stale deduction values into the live breakdown", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await waitForHydration(page)

    await page.getByRole("radio", { name: "Old Regime" }).check()
    await page.locator("#section-80c").fill("150000")
    await page.locator("#gross-income").fill("1000000")
    expect(await breakdownValueFor(page, "Total tax liability")).not.toBeNull()

    // Switching regimes swaps the visible field set entirely and the live breakdown updates to the
    // new regime's own figures.
    await page.getByRole("radio", { name: "New Regime" }).check()
    await expect(page.locator("#section-80c")).toHaveCount(0)
    await expect(page.locator("#employer-nps-80ccd2")).toBeVisible()
    await expect(page.getByTestId("income-tax-breakdown-card").getByText("New Regime breakdown")).toBeVisible()

    // At the ₹15L Sprint 24 new-regime worked example (₹97,500 total tax with zero deductions),
    // the breakdown must reflect only the new regime's default-zero NPS deduction — the old
    // regime's ₹1,50,000 Section 80C entered above must not leak into it.
    await page.locator("#gross-income").fill("1500000")
    expect(await breakdownValueFor(page, "Total tax liability")).toBe("₹97,500.00")
  })

  test("regime comparison panel shows both regimes side by side with the cheaper one marked", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await waitForHydration(page)
    await page.locator("#gross-income").fill("1000000")

    // Scoped by testid rather than by text: "Old Regime"/"New Regime" each also appear in the
    // panel's own headline/subtitle prose (e.g. "New Regime saves you... versus the Old Regime"),
    // so a page- or panel-wide text lookup would match more than once (strict-mode violation).
    const panel = page.getByTestId("calculator-result-card")
    await expect(panel.getByTestId("old-regime-column")).toContainText("Old Regime")
    await expect(panel.getByTestId("new-regime-column")).toContainText("New Regime")
    await expect(panel.getByText("Lower tax")).toHaveCount(1)
  })
})
