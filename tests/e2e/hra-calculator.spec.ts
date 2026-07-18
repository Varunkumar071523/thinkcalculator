import { expect, test } from "@playwright/test"

// Sprint 26: fills the HRA calculator for a metro and a non-metro case, each with a different
// binding constraint, and verifies the displayed exemption and binding-constraint explanation
// against the same hand-derived figures asserted in the lib/hra engine unit tests
// (lib/hra/__tests__/compute-hra-exemption.test.ts), so the UI is checked against the same
// ground truth as the calculation engine.
//
// Design-migration batch 4: the calculator now recalculates live on every keystroke/slider move
// (matching CAGR/Retirement Corpus's pattern) instead of gating the result behind a "Calculate"
// click, so every test below reads the result straight after filling rather than clicking first.
async function primaryValueFor(page: import("@playwright/test").Page, label: string): Promise<string | null> {
  return page
    .getByTestId("calculator-result-card")
    .getByText(label, { exact: true })
    .evaluate((el) => el.nextElementSibling?.textContent ?? null)
}

// Waits for React to have hydrated and attached its event listeners before the test's first
// `.fill()`. Root-caused a pre-existing, intermittent WebKit-only failure (flagged in Batches 2 and
// 3, scoped to this batch since HRA is now in scope): Playwright's automation can fill a field
// faster than hydration completes, especially under this suite's parallel-worker CPU contention.
// The fill lands as a native DOM mutation with no React listener yet attached to catch it, so the
// typed value is visible in the DOM but never reaches component state — reproduced directly via
// `npx playwright test tests/e2e/hra-calculator.spec.ts --project=webkit`, where the non-metro
// test's basic-salary fill was silently dropped (the calculation used the default ₹6,00,000
// instead of the typed ₹10,00,000) while every later fill in the same test worked normally. See
// the matching comment on the `hydrated` state in hra-calculator.tsx.
async function waitForHydration(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.locator("[data-calculator-form]")).toHaveAttribute("data-hydrated", "true")
}

test.describe("HRA exemption calculator", () => {
  test("metro city — rent-based limit is binding (default worked example)", async ({ page }) => {
    await page.goto("/finance/hra-calculator")

    // Uses the calculator's own defaults: ₹6,00,000 basic salary, ₹0 DA, ₹2,40,000 HRA received,
    // ₹1,80,000 rent paid, metro city. Rent minus 10% of salary (₹1,20,000) is smaller than both
    // actual HRA received (₹2,40,000) and 50% of salary (₹3,00,000), so it is binding. Live from
    // page load — no "Calculate" click required to see it.
    await expect(page.locator("#basic-salary")).toHaveValue("600000")
    expect(await primaryValueFor(page, "Exempt HRA")).toBe("₹1,20,000.00")
    expect(await primaryValueFor(page, "Taxable HRA")).toBe("₹1,20,000.00")
    // Scoped to the "Which limit is binding" card by testid — the same explanation text is also
    // echoed into the print-only CalculationSummary block below, and the page also has an
    // unrelated role="status" metro-city-list notice, so a page-wide or role-only lookup would
    // match more than once (strict-mode violation).
    await expect(page.getByTestId("hra-binding-constraint-card").getByText(/rent-based limit is your binding constraint/i)).toBeVisible()

    // The "Calculate" button still exists to snapshot the current inputs into a shareable URL.
    await page.getByRole("button", { name: /calculate hra exemption/i }).click()
    await expect(page).toHaveURL(/basic=600000/)
  })

  test("non-metro city — percentage-of-salary limit is binding, and updates live as fields are filled", async ({ page }) => {
    await page.goto("/finance/hra-calculator")
    await waitForHydration(page)

    await page.locator("#basic-salary").fill("1000000")
    await page.locator("#da").fill("0")
    await page.locator("#hra-received").fill("600000")
    await page.locator("#rent-paid").fill("800000")
    await page.locator("#city").selectOption("non-metro")

    // 40% of ₹10,00,000 salary = ₹4,00,000, smaller than actual HRA (₹6,00,000) and the rent-based
    // limit (₹8,00,000 − ₹1,00,000 = ₹7,00,000). No click needed — the result panel is live.
    await expect(page.getByTestId("calculator-result-card").getByText("Exempt HRA", { exact: true })).toBeVisible()
    expect(await primaryValueFor(page, "Exempt HRA")).toBe("₹4,00,000.00")
    expect(await primaryValueFor(page, "Taxable HRA")).toBe("₹2,00,000.00")
    await expect(page.getByTestId("hra-binding-constraint-card").getByText(/40% of salary limit.*is your binding constraint/i)).toBeVisible()
  })

  test("pass-through to the income tax calculator: Old Regime selected, HRA field pre-filled, arrival note shown", async ({ page }) => {
    await page.goto("/finance/hra-calculator")

    expect(await primaryValueFor(page, "Exempt HRA")).toBe("₹1,20,000.00")
    // The CTA is a Button rendered as an <a> (see components/ui/button.tsx's `render` prop
    // pattern, used the same way for every other Button+Link in this codebase, e.g.
    // components/layout/site-header.tsx) — it keeps role="button" for accessible semantics even
    // though it navigates, so it's queried by button role here, not link role.
    await page.getByRole("button", { name: /use this in the income tax calculator/i }).click()

    await expect(page).toHaveURL(/\/finance\/income-tax-calculator\?hraExemption=120000/)
    await expect(page.getByRole("radio", { name: "Old Regime" })).toBeChecked()
    await expect(page.locator("#hra-exemption")).toHaveValue("120000")
    await expect(page.getByTestId("hra-pass-through-note")).toContainText("₹1,20,000.00")
    await expect(page.getByTestId("hra-pass-through-note")).toContainText(/only affects the Old Regime calculation/i)

    // The note is dismissible and does not reappear on its own.
    await page.getByTestId("hra-pass-through-note").getByRole("button", { name: /dismiss/i }).click()
    await expect(page.getByTestId("hra-pass-through-note")).toHaveCount(0)
  })

  test("ignores a malformed hraExemption pass-through param and falls back to normal defaults", async ({ page }) => {
    await page.goto("/finance/income-tax-calculator?hraExemption=not-a-number")
    await expect(page.getByRole("radio", { name: "New Regime" })).toBeChecked()
    await expect(page.getByTestId("hra-pass-through-note")).toHaveCount(0)
  })

  // Sprint 26 follow-up: FY 2026-27 (the current financial year) expands the metro list to eight
  // cities, but this calculator is deliberately still pinned to FY 2025-26's four-city list. A
  // live user in one of the four newly-added cities needs this stated plainly on the page itself,
  // not buried in a FAQ — this test checks the notice is visible on arrival (not just after
  // calculating), names every added city plus the statutory source, and can be dismissed.
  test("shows a dismissible notice about the FY2025-26 vs FY2026-27 metro city list, citing the Income-tax Rules 2026", async ({ page }) => {
    await page.goto("/finance/hra-calculator")

    const notice = page.getByTestId("metro-city-list-notice")
    await expect(notice).toBeVisible()
    await expect(notice).toContainText(/FY 2025-26/)
    await expect(notice).toContainText(/FY 2026-27/)
    for (const city of ["Bengaluru", "Hyderabad", "Pune", "Ahmedabad"]) {
      await expect(notice).toContainText(city)
    }
    await expect(notice).toContainText(/Income-tax Rules, 2026/)

    await notice.getByRole("button", { name: /dismiss/i }).click()
    await expect(notice).toHaveCount(0)
  })
})
