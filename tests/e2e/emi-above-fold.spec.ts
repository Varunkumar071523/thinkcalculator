import { expect, test } from "@playwright/test"

// Sprint 46: EMI above-the-fold template. The audit driving this sprint found thinkcalculator.in's
// EMI calculator needed more scrolling than a competitor to see the result, traced to (1) always-
// visible full-sentence helper text under every field, (2) the donut chart's legend rendered as a
// separate block instead of inline percentage labels, (3) loose breadcrumb/title/subtitle spacing,
// and (4) the quick-select amount chips as their own row. This sprint fixes all four for EMI only,
// via opt-in props on the shared field (CalculatorField's `helperTextVariant="tooltip"`) and donut
// (SimpleDonutChart's `showInlineLabels`) components — see docs/DECISIONS.md #38 for the chosen
// opt-in strategy and components/calculators/field-info-tip.tsx for the tooltip's accessibility
// notes. The other 14 calculators must render unchanged (verified in the "unaffected calculators"
// block below), since the opt-in props default to today's behavior for every caller that doesn't
// pass them — this sprint deliberately does not roll the compact variant out beyond EMI.
test.describe("EMI above-the-fold template", () => {
  test("the core result (Monthly EMI, totals, and the donut chart's own heading) is visible within one ordinary viewport, no scrolling required", async ({ page }) => {
    // 900px is a common laptop viewport height (see the sprint's own 720/768/800/900 sweep); 1280
    // width puts the calculator in its two-column desktop layout, matching how the competitor audit
    // that motivated this sprint was framed (comparing a full, unscrolled page view).
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("/finance/emi-calculator")

    // Scoped to the result card by testid: "Monthly EMI" and "Total interest payable" are also
    // echoed in the page's worked-example section further down, which would otherwise make these
    // locators match twice (strict-mode violation) — see hra-calculator.spec.ts's identical
    // testid-scoping pattern. Sprint 47 folded the "for N months at R% p.a." subtitle into this same
    // label line (see docs/DECISIONS.md), so the label is no longer the exact string "Monthly EMI" —
    // matched by prefix instead.
    const resultCard = page.getByTestId("calculator-result-card")
    const monthlyEmi = resultCard.getByText(/^Monthly EMI for/)
    const totalInterest = resultCard.getByText("Total interest payable", { exact: true })
    const donutHeading = page.locator("#donut-title")

    await expect(monthlyEmi).toBeVisible()
    await expect(totalInterest).toBeVisible()
    await expect(donutHeading).toBeVisible()

    const viewportHeight = 900
    for (const locator of [monthlyEmi, totalInterest, donutHeading]) {
      const box = await locator.boundingBox()
      expect(box, "expected the element to have a bounding box").not.toBeNull()
      expect(box!.y + box!.height, "expected element to be within the viewport, not below the fold").toBeLessThanOrEqual(viewportHeight)
    }
  })

  test("field info icon reveals its helper text on hover, and via real keyboard Tab focus, with aria-describedby wired to the same node the input already uses", async ({ page }) => {
    await page.goto("/finance/emi-calculator")

    const input = page.locator("#loan-amount")
    const icon = page.getByRole("button", { name: "More info: Loan amount" })

    // The description text is not visibly duplicated as a paragraph (that's the whole point of the
    // tooltip variant), but stays screen-reader-accessible via the same id the input's own
    // aria-describedby already points at.
    const inputDescribedBy = await input.getAttribute("aria-describedby")
    const iconDescribedBy = await icon.getAttribute("aria-describedby")
    expect(inputDescribedBy).toBe(iconDescribedBy)
    expect(inputDescribedBy).toBeTruthy()
    const describedText = page.locator(`#${inputDescribedBy}`)
    await expect(describedText).toHaveText("Enter the principal amount you plan to borrow.")

    // Hover reveals it visually for sighted mouse users.
    await icon.hover()
    const popup = page.getByRole("dialog").filter({ hasText: "Enter the principal amount you plan to borrow." })
    await expect(popup).toBeVisible()
    await page.mouse.move(0, 0)
    await expect(popup).toBeHidden()
    await popup.waitFor({ state: "detached" }).catch(() => {})

    // A real keyboard Tab (not a synthetic .focus() call, which does not reliably satisfy
    // :focus-visible) also reveals it. Reaching the icon via Shift+Tab from the input right after it
    // in DOM order is deterministic — a forward Tab-count loop from the top of the page is not: Base
    // UI moves DOM focus into the popup itself the instant it opens while the trigger is focused, so
    // by the time a check after each keypress runs, `document.activeElement` has often already moved
    // on to the popup, making "did we land on the icon" racy to observe from outside.
    await input.focus()
    await page.keyboard.press("Shift+Tab")
    await expect(popup).toBeVisible()
  })

  test("the donut chart shows inline percentage labels on its segments", async ({ page }) => {
    await page.goto("/finance/emi-calculator")
    const donutSection = page.locator("#donut-title").locator("..")
    // The two inline percentage labels (e.g. "48%"/"52%") sit directly over the ring, distinct from
    // the compact legend's own Principal/Interest rows.
    await expect(donutSection.getByText(/^\d{1,3}%$/)).toHaveCount(2)
  })

  // Chosen to cover every CalculatorField wrapper type used by a real (non-demo) calculator, not
  // arbitrarily: PPF and Retirement Corpus both only exercise CalculatorSelectInput +
  // PairedNumberSliderInput, so an earlier version of this test that used only those two never
  // actually covered CalculatorDateInput. Capital Gains is the only calculator using
  // CalculatorDateInput at all (grep-verified: `grep -l CalculatorDateInput features/calculators/*/*.tsx`
  // returns exactly one file), so it's included here specifically for that. Home Loan Eligibility is
  // added as a second SimpleDonutChart caller beyond PPF/Retirement Corpus (FD moved to the new
  // template in Sprint 48 batch 1, so it no longer belongs in this "unaffected" list — see
  // docs/DECISIONS.md #40). NPS was tried as the replacement first but rejected: its donut items'
  // `formattedValue`s are themselves percentage strings (asset-allocation shares, not currency), so
  // its default/untouched legend already contains bare `NN%` text and false-positives the "no inline
  // percentage labels" check below even with `showInlineLabels` never set. Home Loan Eligibility's
  // donut items are both currency-formatted, so it doesn't share that false-positive risk.
  // `/calculators/demo` (the only caller of a bare, non-paired CalculatorNumberInput) is intentionally
  // excluded — it's a design-preview route, not one of the published calculators this sprint's
  // compatibility promise covers.
  test("unaffected calculators: PPF, Retirement Corpus, Home Loan Eligibility, and Capital Gains keep the old always-visible helper text and stacked donut legend, with no info icons", async ({ page }) => {
    for (const path of ["/finance/ppf-calculator", "/finance/retirement-corpus-calculator", "/finance/home-loan-eligibility-calculator", "/finance/capital-gains-calculator"]) {
      await page.goto(path)
      const infoIconCount = await page.locator('button[aria-label^="More info:"]').count()
      expect(infoIconCount, `${path} should have no tooltip info icons (opt-in not set)`).toBe(0)

      // The donut's legend is still the original stacked list, not the compact horizontal row.
      const legend = page.locator("#donut-title").locator("..").locator("ul")
      await expect(legend).toHaveClass("w-full space-y-3")

      // No inline percentage labels floating over the ring.
      const donutSection = page.locator("#donut-title").locator("..")
      await expect(donutSection.getByText(/^\d{1,3}%$/)).toHaveCount(0)
    }

    // Capital Gains-specific: its CalculatorDateInput fields also still render the old inline
    // paragraph description, not a tooltip icon, confirming the wrapper type this sprint didn't
    // touch on any real calculator is provably unaffected too.
    await page.goto("/finance/capital-gains-calculator")
    const dateInputCount = await page.locator('input[type="date"]').count()
    expect(dateInputCount, "expected Capital Gains to still have its date inputs").toBeGreaterThan(0)
    const dateFieldDescriptions = await page.locator('input[type="date"]').evaluateAll((inputs) =>
      inputs.map((input) => {
        const describedBy = input.getAttribute("aria-describedby")?.split(" ")[0]
        const node = describedBy ? document.getElementById(describedBy) : null
        return node ? getComputedStyle(node).position : null
      }),
    )
    for (const position of dateFieldDescriptions) {
      // "static" (the default) means it's a normal visible paragraph, not "absolute" (the sr-only
      // tooltip-variant class this sprint introduced).
      expect(position === "static" || position === null).toBe(true)
    }
  })
})
