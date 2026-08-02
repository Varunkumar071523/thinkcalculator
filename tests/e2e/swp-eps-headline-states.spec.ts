import { expect, test } from "@playwright/test"

// Sprint 58: SWP and EPS Pension both keep the label/value/subtitle 3-line result-panel structure
// established for conditional headlines by Retirement Corpus (Sprint 57, docs/DECISIONS.md #56/#58)
// rather than the folded 2-line label used by the 9 non-branching calculators (EMI etc.) — a single
// folded label can't carry a headline whose *label*, not just a modifier, changes with the result.
// This spec exercises every distinct headline state identified for each calculator via URL state
// (see swp-url-state.ts / eps-pension-url-state.ts for the query param contract) so each state is
// reached deterministically rather than by simulating form input.
test.describe("SWP headline states", () => {
  const resultCardLocator = (page: import("@playwright/test").Page) => page.getByTestId("calculator-result-card")

  test("normal: balance survives the fixed duration", async ({ page }) => {
    await page.goto("/finance/swp-calculator?initial=5000000&withdrawal=35000&return=8&mode=fixedDuration&years=20")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText("Remaining balance", { exact: true })).toBeVisible()
    await expect(resultCard.getByText("Balance exhausted after")).toHaveCount(0)
  })

  test("isExhausted: withdrawals deplete the corpus before the fixed duration ends", async ({ page }) => {
    await page.goto("/finance/swp-calculator?initial=100000&withdrawal=20000&return=1&mode=fixedDuration&years=10")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText("Balance exhausted after", { exact: true })).toBeVisible()
    await expect(resultCard.getByText(/^Remaining balance: /)).toBeVisible()
  })

  test("cappedAtMaxDuration: growth outpaces withdrawals in until-exhausted mode", async ({ page }) => {
    await page.goto("/finance/swp-calculator?initial=10000000&withdrawal=10000&return=10&mode=untilExhausted&years=20")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText("Remaining balance at the 100-year cap", { exact: true })).toBeVisible()
  })
})

test.describe("EPS Pension headline states", () => {
  const resultCardLocator = (page: import("@playwright/test").Page) => page.getByTestId("calculator-result-card")

  test("eligible, standard age: shows the monthly pension figure", async ({ page }) => {
    await page.goto("/finance/eps-pension-calculator?salary=24000&years=26&ageOption=standard&earlyAge=50")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText("Monthly pension", { exact: true })).toBeVisible()
    await expect(resultCard.getByText("Not eligible")).toHaveCount(0)
  })

  test("eligible, early pension: label folds in the early-pension start age", async ({ page }) => {
    await page.goto("/finance/eps-pension-calculator?salary=24000&years=26&ageOption=early&earlyAge=55")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText(/^Monthly pension from age 55$/)).toBeVisible()
    await expect(resultCard.getByText(/^Standard-age pension .* reduced/)).toBeVisible()
  })

  test("not eligible: service short of the 10-year minimum", async ({ page }) => {
    await page.goto("/finance/eps-pension-calculator?salary=24000&years=5&ageOption=standard&earlyAge=50")
    const resultCard = resultCardLocator(page)
    await expect(resultCard.getByText("Not eligible", { exact: true })).toBeVisible()
    await expect(resultCard.getByText(/short of the 10-year minimum/)).toBeVisible()
  })
})
