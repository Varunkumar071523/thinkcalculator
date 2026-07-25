import { expect, test } from "@playwright/test"

// Sprint 31 print verification. Confirms the shared print stylesheet (app/globals.css `@media
// print`) actually does what it claims once a calculation exists: navigation/footer/the input form
// are hidden, the printable summary is the only visible content, and nothing renders with a dark
// background that would waste ink. Runs against 5 of the 17 CollapsibleSection-bearing calculators
// — EMI, SWP, Inflation, Step-up SIP, Retirement Corpus — per the sprint brief's "3+ representative
// calculators" scope; the other 12 (SIP, Lumpsum, FD, RD, PPF, NPS, EPF, Capital Gains, Leave
// Encashment, EPS Pension, Home Loan Eligibility, Income Tax) share the identical CollapsibleSection
// + data-calculation-experience pattern (verified manually, Sprint 44 audit) but are not
// independently covered by this runtime suite.
//
// Sprint 44: SWP, Step-up SIP, and Retirement Corpus default their schedule section to a chart view
// (zero `.calculator-table` elements in the DOM until the visitor clicks "View table"), so the old
// `tableCount > 0` guard silently skipped the one check — collapsed-content reveal — that actually
// exercises the CollapsibleSection print bug for them. The `[data-collapsible-content]` check below
// runs unconditionally for every calculator instead, table or chart, closing that blind spot.
//
// All ten calculators now compute live (no Calculate/submit button — see the Sprint XX calculators
// rollout): a result already exists from the default form values as soon as the page loads, so
// there is nothing to click before asserting on [data-print-summary].
const calculators = [
  { name: "EMI", path: "/finance/emi-calculator" },
  { name: "SWP", path: "/finance/swp-calculator" },
  { name: "Inflation", path: "/finance/inflation-calculator" },
  { name: "Step-up SIP", path: "/finance/step-up-sip-calculator" },
  { name: "Retirement Corpus", path: "/finance/retirement-corpus-calculator" },
]

test.describe("print output", () => {
  for (const calculator of calculators) {
    test(`${calculator.name} — clean print output after a calculation`, async ({ page }) => {
      await page.goto(calculator.path)
      await expect(page.locator("[data-print-summary]")).toBeAttached()

      await page.emulateMedia({ media: "print" })

      // Chrome/UI chrome hidden.
      await expect(page.locator("header").first()).toBeHidden()
      await expect(page.locator("footer").first()).toBeHidden()
      await expect(page.locator("nav").first()).toBeHidden()
      await expect(page.locator("[data-calculator-form]")).toBeHidden()
      await expect(page.locator("[data-print-hide]").first()).toBeHidden()

      // The printable summary is visible and not clipped to zero size.
      const summary = page.locator("[data-print-summary]")
      await expect(summary).toBeVisible()
      const summaryBox = await summary.boundingBox()
      expect(summaryBox?.width ?? 0).toBeGreaterThan(0)
      expect(summaryBox?.height ?? 0).toBeGreaterThan(0)

      // No dark backgrounds wasting ink: body and the summary itself must resolve to white/transparent.
      const backgrounds = await page.evaluate(() => {
        const parse = (color: string) => {
          const match = color.match(/rgba?\(([^)]+)\)/)
          if (!match) return null
          const [r, g, b, a] = match[1].split(",").map((part) => parseFloat(part.trim()))
          return { r, g, b, a: Number.isNaN(a) ? 1 : a }
        }
        const bodyColor = parse(getComputedStyle(document.body).backgroundColor)
        const summaryEl = document.querySelector("[data-print-summary]")
        const summaryColor = summaryEl ? parse(getComputedStyle(summaryEl).backgroundColor) : null
        return { bodyColor, summaryColor }
      })
      // A fully-transparent background-color (alpha 0) never paints, regardless of its r/g/b —
      // several result cards pair `bg-card` with a `bg-gradient-to-b` accent for on-screen use, and
      // Tailwind's conflict resolution drops the plain background-color utility in favor of the
      // gradient's background-image, leaving background-color transparent. That's the desired print
      // outcome (no ink spent on the accent), so alpha 0 must count as light, not as black.
      const isLight = (c: { r: number; g: number; b: number; a: number } | null) =>
        !c || c.a === 0 || (c.r >= 200 && c.g >= 200 && c.b >= 200)
      expect(isLight(backgrounds.bodyColor), "body has a dark print background").toBe(true)
      expect(isLight(backgrounds.summaryColor), "print summary has a dark background").toBe(true)

      // Every collapsed-by-default CollapsibleSection inside the printable summary must actually
      // reveal its content for print — table or chart, whichever it defaults to — not stay hidden
      // behind its closed <details>. This is the check that exercises the Sprint 44 print-reveal
      // bug; it runs unconditionally (not gated on any content type) so it catches calculators
      // whose default view has zero .calculator-table elements, like SWP/Step-up SIP/Retirement
      // Corpus's chart-default schedule sections.
      const collapsibleContents = page.locator("[data-calculation-experience] [data-collapsible-content]")
      const collapsibleCount = await collapsibleContents.count()
      for (let i = 0; i < collapsibleCount; i++) {
        await expect(collapsibleContents.nth(i), `collapsed section #${i} for ${calculator.name} is not visible in print`).toBeVisible()
        const box = await collapsibleContents.nth(i).boundingBox()
        expect(box?.width ?? 0, `collapsed section #${i} for ${calculator.name} has zero width in print`).toBeGreaterThan(0)
        expect(box?.height ?? 0, `collapsed section #${i} for ${calculator.name} has zero height in print`).toBeGreaterThan(0)
      }

      // Every schedule/detail table on the page (if any) must actually print, not silently vanish.
      // Each must be visible and non-overlapping with every other visible print block, since the
      // stylesheet absolutely-positions [data-print-summary]/[data-calculation-experience] blocks.
      const tableCount = await page.locator(".calculator-table").count()
      if (tableCount > 0) {
        const tables = page.locator(".calculator-table")
        for (let i = 0; i < tableCount; i++) {
          await expect(tables.nth(i), `schedule table #${i} for ${calculator.name} is not visible in print`).toBeVisible()
          const box = await tables.nth(i).boundingBox()
          expect(box?.width ?? 0, `schedule table #${i} for ${calculator.name} has zero width in print`).toBeGreaterThan(0)
        }
      }

      // The absolutely-positioned print blocks must not overlap each other, regardless of whether
      // this calculator has any schedule tables.
      const experienceSections = page.locator("[data-calculation-experience]")
      const experienceCount = await experienceSections.count()
      const boxes: { x: number; y: number; width: number; height: number }[] = []
      for (let i = 0; i < experienceCount; i++) {
        await expect(experienceSections.nth(i)).toBeVisible()
        const box = await experienceSections.nth(i).boundingBox()
        expect(box?.width ?? 0, `data-calculation-experience block #${i} has zero width in print`).toBeGreaterThan(0)
        expect(box?.height ?? 0, `data-calculation-experience block #${i} has zero height in print`).toBeGreaterThan(0)
        if (box) boxes.push(box)
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j]
          const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
          expect(overlaps, `print blocks #${i} and #${j} overlap for ${calculator.name}`).toBe(false)
        }
      }
    })
  }
})

// Sprint 44 follow-up: the CollapsibleSection print-reveal fix is structural (fixed once in
// components/calculators/collapsible-section.tsx, see docs/DECISIONS.md #35/#36), so it should
// already protect the 12 CollapsibleSection calculators not in the `calculators` list above — but
// that was unverified per-calculator. This is a lightweight smoke check, not the full
// table/overlap/background suite the 5 calculators above get: it only confirms every collapsed
// section under [data-calculation-experience] actually reveals (visible, non-zero size) under print
// media emulation, which is the one thing that can break per-calculator despite the shared fix (e.g.
// a calculator whose default form values happen to produce empty/no result content).
const smokeCalculators = [
  { name: "SIP", path: "/finance/sip-calculator" },
  { name: "Lumpsum", path: "/finance/lumpsum-calculator" },
  { name: "FD", path: "/finance/fd-calculator" },
  { name: "RD", path: "/finance/rd-calculator" },
  { name: "PPF", path: "/finance/ppf-calculator" },
  { name: "NPS", path: "/finance/nps-calculator" },
  { name: "EPF", path: "/finance/epf-calculator" },
  { name: "Capital Gains", path: "/finance/capital-gains-calculator" },
  { name: "Leave Encashment", path: "/finance/leave-encashment-calculator" },
  { name: "EPS Pension", path: "/finance/eps-pension-calculator" },
  { name: "Home Loan Eligibility", path: "/finance/home-loan-eligibility-calculator" },
  { name: "Income Tax", path: "/finance/income-tax-calculator" },
]

test.describe("print output — collapsed-section smoke coverage", () => {
  for (const calculator of smokeCalculators) {
    test(`${calculator.name} — collapsed sections reveal under print media`, async ({ page }) => {
      await page.goto(calculator.path)
      await expect(page.locator("[data-print-summary]")).toBeAttached()

      await page.emulateMedia({ media: "print" })

      const collapsibleContents = page.locator("[data-calculation-experience] [data-collapsible-content]")
      const collapsibleCount = await collapsibleContents.count()
      // A zero count would make the loop below pass vacuously without checking anything — fail
      // loudly instead, since every one of these 12 calculators is known (Sprint 44 audit) to render
      // a CollapsibleSection inside data-calculation-experience under its default form values.
      expect(collapsibleCount, `${calculator.name}: no [data-collapsible-content] found under [data-calculation-experience] — expected at least one CollapsibleSection`).toBeGreaterThan(0)
      for (let i = 0; i < collapsibleCount; i++) {
        await expect(collapsibleContents.nth(i), `collapsed section #${i} for ${calculator.name} is not visible in print`).toBeVisible()
        const box = await collapsibleContents.nth(i).boundingBox()
        expect(box?.width ?? 0, `collapsed section #${i} for ${calculator.name} has zero width in print`).toBeGreaterThan(0)
        expect(box?.height ?? 0, `collapsed section #${i} for ${calculator.name} has zero height in print`).toBeGreaterThan(0)
      }
    })
  }
})
