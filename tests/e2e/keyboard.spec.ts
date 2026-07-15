import { expect, test } from "@playwright/test"

// Sprint 31 keyboard/focus review. Covers one simple calculator (EMI), one with a schedule table
// (SWP), and one with a mode toggle (Inflation) in full, per the sprint brief, plus a spot-check of
// two more (Step-up SIP, Retirement Corpus) and the mobile navigation Sheet's focus trap.
const calculators = [
  { name: "EMI (simple)", path: "/finance/emi-calculator" },
  { name: "SWP (schedule table)", path: "/finance/swp-calculator" },
  { name: "Inflation (mode toggle)", path: "/finance/inflation-calculator" },
  { name: "Step-up SIP (spot check)", path: "/finance/step-up-sip-calculator" },
  { name: "Retirement Corpus (spot check)", path: "/finance/retirement-corpus-calculator" },
]

// Tailwind's focus-visible:ring utility pre-declares its box-shadow layers on every element
// (transparent at rest, opaque on focus), so a naive "boxShadow !== 'none'" string check is always
// true and proves nothing, and diffing computed styles across a manual blur()/focus() round trip
// risks breaking the browser's own "was this focus keyboard-triggered" heuristic. The reliable,
// engine-agnostic signal is the :focus-visible pseudo-class match itself, which every component
// here keys its visible ring styles off (see focus-visible:ring-* in components/ui/input.tsx,
// components/ui/button.tsx, calculator-select-input.tsx) — if it matches, the ring renders.
async function hasVisibleFocusIndicator(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return Boolean(el && el !== document.body && el.matches(":focus-visible"))
  })
}

test.describe("keyboard and focus", () => {
  for (const calculator of calculators) {
    test(`${calculator.name} — all form controls are keyboard-reachable with a visible focus indicator`, async ({ page }) => {
      await page.goto(calculator.path)
      const controls = page.locator("[data-calculator-form] :is(input, select, button)")
      const count = await controls.count()
      expect(count).toBeGreaterThan(2)

      // Enter the form via Tab from the top of the document (a freshly loaded page starts with no
      // element focused, so the first Tab press lands on the skip link), then walk every focusable
      // control in DOM order, asserting each one both receives focus (no dead/unreachable control,
      // no trap skipping an element) and renders a visible focus style once focused.
      await page.keyboard.press("Tab") // skip link
      let reached = 0
      let guard = 0
      while (reached < count && guard < count * 4) {
        await page.keyboard.press("Tab")
        guard++
        const withinForm = await page.evaluate(() => {
          const el = document.activeElement
          return Boolean(el && el.closest("[data-calculator-form]"))
        })
        if (withinForm) {
          reached++
          expect(await hasVisibleFocusIndicator(page), `control #${reached} in ${calculator.name} has no visible focus indicator`).toBe(true)
        }
      }
      expect(reached, `expected to reach all ${count} form controls in ${calculator.name} via Tab`).toBe(count)
    })
  }

  test("mobile navigation Sheet traps and returns focus correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "Open navigation" })
    await trigger.focus()
    await page.keyboard.press("Enter")

    // Focus must move inside the open panel, not remain on the trigger or fall back to <body>.
    const insidePanel = await page.evaluate(() => {
      const el = document.activeElement
      const panel = document.querySelector('[data-slot="sheet-content"]')
      return Boolean(panel && el && panel.contains(el))
    })
    expect(insidePanel, "focus should move into the open mobile navigation panel").toBe(true)

    await page.keyboard.press("Escape")
    await expect(trigger).toBeFocused()
  })
})
