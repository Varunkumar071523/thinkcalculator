import { expect, test } from "@playwright/test"

// Sprint 31 follow-up review: the codebase has no JS-driven animation library (no framer-motion,
// no GSAP — verified by grepping package.json and every animate-/transition- usage under app/,
// components/, features/), so every animation in the app is a plain CSS transition, and the global
// `@media (prefers-reduced-motion: reduce)` rule in app/globals.css (which forces
// transition-duration/animation-duration to 0.01ms on every element) is the single mechanism that
// has to work. Playwright's page.emulateMedia({ reducedMotion }) genuinely emulates the
// prefers-reduced-motion media feature end-to-end (verified against real Chromium/Firefox/WebKit
// computed styles, not just asserting the CSS rule exists), so this was verifiable with the tooling
// already installed this sprint rather than a real screen-reader/device-only gap.
test.describe("reduced motion", () => {
  test("mobile navigation Sheet respects prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "Open navigation" })
    await trigger.focus()
    await page.keyboard.press("Enter")

    const panel = page.locator('[data-slot="sheet-content"]')
    await expect(panel).toBeVisible()
    const duration = await panel.evaluate((el) => {
      const style = getComputedStyle(el)
      return { transition: parseFloat(style.transitionDuration), animation: parseFloat(style.animationDuration) }
    })
    expect(duration.transition, "sheet transition-duration should collapse under reduced motion").toBeLessThanOrEqual(0.01)
    expect(duration.animation, "sheet animation-duration should collapse under reduced motion").toBeLessThanOrEqual(0.01)
  })

  test("homepage respects prefers-reduced-motion: reduce for interactive card transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const duration = await page.evaluate(() => {
      const el = document.querySelector('a[href^="/finance"], a[href^="/calculators"]')
      if (!el) return null
      const style = getComputedStyle(el)
      return { transition: parseFloat(style.transitionDuration), animation: parseFloat(style.animationDuration) }
    })
    expect(duration, "expected at least one transitionable link on the homepage").not.toBeNull()
    expect(duration?.transition, "link transition-duration should collapse under reduced motion").toBeLessThanOrEqual(0.01)
    expect(duration?.animation, "link animation-duration should collapse under reduced motion").toBeLessThanOrEqual(0.01)
  })
})
