import { expect, test } from "@playwright/test"

// Sprint 39: covers the Home Loan Eligibility calculator's FOIR-band-driven results and its
// worked example, mirroring the pattern in hra-calculator.spec.ts (read the primary result card
// value directly rather than relying on visibility of the collapsed worked-example/FAQ sections).
async function primaryValueFor(page: import("@playwright/test").Page, label: string): Promise<string | null> {
  return page
    .getByTestId("calculator-result-card")
    .getByText(label, { exact: true })
    .evaluate((el) => el.nextElementSibling?.textContent ?? null)
}

// Same webkit-only hydration race documented in hra-calculator.spec.ts: a fast automated `.fill()`
// right after `page.goto()` can land before React attaches its listeners, so the typed value never
// reaches component state. Waiting for this attribute before the first fill avoids the race.
async function waitForHydration(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.locator("[data-calculator-form]")).toHaveAttribute("data-hydrated", "true")
}

// CollapsibleSection renders a native <details>/<summary> pair, which does not reliably expose an
// accessible "button" role across engines, so these are opened by locating the <summary> element
// directly by its visible title text rather than via getByRole("button", ...).
function collapsibleSummary(page: import("@playwright/test").Page, title: string | RegExp) {
  return page.locator("summary", { hasText: title })
}

test.describe("Home Loan Eligibility calculator", () => {
  test("loads with defaults and computes the Standard (50%) FOIR band worked example live", async ({ page }) => {
    await page.goto("/finance/home-loan-eligibility-calculator")

    await expect(page.locator("#net-monthly-income")).toHaveValue("100000")
    await expect(page.locator("#existing-monthly-emi")).toHaveValue("10000")
    await expect(page.locator("#foir-band")).toHaveValue("standard")

    // ₹1,00,000 × 50% − ₹10,000 existing EMI = ₹40,000 eligible EMI, matching the codebase's own
    // worked example (home-loan-eligibility-content.ts) and unit test ground truth.
    expect(await primaryValueFor(page, "Max eligible EMI")).toBe("₹40,000.00")
    expect(await primaryValueFor(page, "Max eligible loan amount")).toContain("₹46,09,2")
    expect(await primaryValueFor(page, "Total property affordability")).toContain("₹56,09,2")
  })

  test("all three FOIR presets produce different eligible EMI and loan amounts for the same inputs", async ({ page }) => {
    await page.goto("/finance/home-loan-eligibility-calculator")
    await waitForHydration(page)

    await page.locator("#foir-band").selectOption("conservative")
    const conservativeEmi = await primaryValueFor(page, "Max eligible EMI")

    await page.locator("#foir-band").selectOption("standard")
    const standardEmi = await primaryValueFor(page, "Max eligible EMI")

    await page.locator("#foir-band").selectOption("aggressive")
    const aggressiveEmi = await primaryValueFor(page, "Max eligible EMI")

    expect(conservativeEmi).toBe("₹30,000.00")
    expect(standardEmi).toBe("₹40,000.00")
    expect(aggressiveEmi).toBe("₹50,000.00")
    expect(new Set([conservativeEmi, standardEmi, aggressiveEmi]).size).toBe(3)
  })

  test("shows a clear message when existing EMIs alone exceed the FOIR budget", async ({ page }) => {
    await page.goto("/finance/home-loan-eligibility-calculator")
    await waitForHydration(page)

    await page.locator("#existing-monthly-emi").fill("60000")

    expect(await primaryValueFor(page, "Max eligible EMI")).toBe("₹0.00")
    await expect(page.getByTestId("calculator-result-card").getByText(/existing monthly EMIs already exceed/i)).toBeVisible()
  })

  test("the FOIR band comparison table shows all three bands without needing re-entry", async ({ page }) => {
    await page.goto("/finance/home-loan-eligibility-calculator")

    await collapsibleSummary(page, /compare foir bands/i).click()
    const table = page.getByRole("table", { name: /max eligible emi, loan amount, and property affordability by foir band/i })
    await expect(table).toContainText("Conservative (40%)")
    await expect(table).toContainText("Standard (50%)")
    await expect(table).toContainText("Aggressive (60%)")
  })

  test("worked example section renders the documented inputs and results", async ({ page }) => {
    await page.goto("/finance/home-loan-eligibility-calculator")

    await collapsibleSummary(page, /formula and worked example/i).click()
    const section = page.locator("#worked-example")
    await expect(section).toContainText("₹1,00,000")
    await expect(section).toContainText("Standard (50%)")
    await expect(section).toContainText("₹40,000.00")
  })
})
