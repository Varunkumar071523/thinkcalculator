import { expect, test } from "@playwright/test"

// Sprint 31 print verification. Confirms the shared print stylesheet (app/globals.css `@media
// print`) actually does what it claims once a calculation exists: navigation/footer/the input form
// are hidden, the printable summary is the only visible content, and nothing renders with a dark
// background that would waste ink. Runs against 5 of the 10 schedule-bearing calculators — EMI,
// SWP, Inflation, Step-up SIP, Retirement Corpus — per the sprint brief's "3+ representative
// calculators" scope; the other 5 (SIP, Lumpsum, FD, RD, PPF) share the identical DataTable +
// data-calculation-experience pattern (verified manually) but are not independently covered by this
// runtime suite.
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
      }
    })
  }
})
