import { expect, test } from "@playwright/test"

// Sprint 25: fills the income tax calculator for both regimes and verifies the displayed
// breakdown against the same two worked examples asserted in Sprint 24's engine regression
// suite (lib/tax/__tests__/calculate-income-tax.test.ts), so the UI is checked against the
// same ground truth as the calculation engine, not just its own numbers.
//
// Adversarial-review fix (should-fix #1): labels like "Total tax liability" and "Taxable
// income" also appear in the CalculationSummary print block and the static worked-example
// section below the fold, so a bare page-wide getByText().first() only resolves correctly by
// accident of current DOM order. Scoping to CalculatorResultCard's data-testid (unique within
// the card — each label appears at most once there, since the primary item and the secondary
// dt/dd list never repeat a label) makes the lookup correct regardless of what else is on the
// page or how it's ordered.
async function primaryValueFor(page: import("@playwright/test").Page, label: string): Promise<string | null> {
  return page
    .getByTestId("calculator-result-card")
    .getByText(label, { exact: true })
    .evaluate((el) => el.nextElementSibling?.textContent ?? null)
}

test.describe("income tax calculator", () => {
  test("new regime — ₹12.75L gross income produces zero total tax liability (Sprint 24 worked example)", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await expect(page.getByRole("radio", { name: "New Regime" })).toBeChecked()

    await page.locator("#gross-income").fill("1275000")
    await page.locator("#age-band").selectOption("below60")
    await page.getByRole("button", { name: /calculate tax/i }).click()

    expect(await primaryValueFor(page, "Total tax liability")).toBe("₹0.00")
    expect(await primaryValueFor(page, "Taxable income")).toBe("₹12,00,000.00")
    expect(await primaryValueFor(page, "Section 87A rebate")).toBe("₹60,000.00")

    await expect(page.getByRole("heading", { name: "Slab-by-slab breakdown" })).toBeVisible()
    await expect(page.getByRole("table", { name: /slab-by-slab/i })).toBeVisible()
  })

  test("old regime — ₹10,00,000 gross income, below 60, zero deductions produces ₹1,06,600 total tax liability (Sprint 24 worked example)", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await page.getByRole("radio", { name: "Old Regime" }).check()
    await expect(page.locator("#section-80c")).toBeVisible()
    await expect(page.locator("#employer-nps-80ccd2")).toHaveCount(0)

    await page.locator("#gross-income").fill("1000000")
    await page.locator("#age-band").selectOption("below60")
    await page.getByRole("button", { name: /calculate tax/i }).click()

    expect(await primaryValueFor(page, "Total tax liability")).toBe("₹1,06,600.00")
    expect(await primaryValueFor(page, "Taxable income")).toBe("₹9,50,000.00")

    await expect(page.getByRole("heading", { name: "Slab-by-slab breakdown" })).toBeVisible()
  })

  test("switching regimes hides the other regime's fields and does not submit stale deduction values", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")

    await page.getByRole("radio", { name: "Old Regime" }).check()
    await page.locator("#section-80c").fill("150000")
    await page.locator("#gross-income").fill("1000000")
    await page.getByRole("button", { name: /calculate tax/i }).click()
    expect(await primaryValueFor(page, "Total tax liability")).not.toBeNull()

    // Switching regimes clears the calculated result (consistent with every other calculator's
    // edit-invalidates-result behaviour) and swaps the visible field set entirely.
    await page.getByRole("radio", { name: "New Regime" }).check()
    await expect(page.locator("#section-80c")).toHaveCount(0)
    await expect(page.locator("#employer-nps-80ccd2")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Slab-by-slab breakdown" })).toHaveCount(0)

    // Calculating now, at the ₹15L Sprint 24 new-regime worked example (₹97,500 total tax with
    // zero deductions), must reflect only the new regime's default-zero NPS deduction — the old
    // regime's ₹1,50,000 Section 80C entered above must not leak into this submission.
    await page.locator("#gross-income").fill("1500000")
    await page.getByRole("button", { name: /calculate tax/i }).click()
    expect(await primaryValueFor(page, "Total tax liability")).toBe("₹97,500.00")
  })

  test("live regime-comparison callout appears next to the toggle once income is entered", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator")
    await page.locator("#gross-income").fill("1000000")
    await expect(page.getByText(/you'd pay|tax is the same under both regimes/i)).toBeVisible()
  })
})
