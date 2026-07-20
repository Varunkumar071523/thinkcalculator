import { expect, test } from "@playwright/test"

// Sprint 38: validates the build-time glossary auto-linker end to end on the three pages it is
// wired into (EMI/FD/RD calculator FAQs) plus the new Loans guide, and checks the reverse lookup
// rendered on glossary term pages ("Where this term is used") is consistent with the forward
// links a visitor can actually click through from those source pages.
// The FAQ container sits inside a collapsed-by-default <details> (CollapsibleSection /
// FAQSection), so its links exist in the DOM but are not visible until expanded — matching
// tests/e2e/card-links.spec.ts, hrefs are read directly via evaluateAll rather than asserting
// visibility first.
//
// RD is deliberately excluded here: its FAQ text has no exact glossary-term matches (verified in
// the "no glossary matches" test below), so asserting ">= 1 link" on it would be wrong, not a bug.
const sourcePages = [
  { path: "/finance/emi-calculator", label: "EMI calculator", faqSelector: "#faqs" },
  { path: "/finance/fd-calculator", label: "FD calculator", faqSelector: "#faqs" },
  { path: "/guides/understanding-emi-fd-and-rd", label: "Loans guide", faqSelector: 'section[aria-labelledby="editorial-faq"]' },
]

function glossaryHrefs(hrefs: readonly (string | null)[]): string[] {
  return [...new Set(hrefs.filter((href): href is string => typeof href === "string" && href.startsWith("/glossary/")))]
}

test.describe("glossary auto-linking", () => {
  for (const { path, label, faqSelector } of sourcePages) {
    test(`${label} FAQ glossary links resolve to real glossary pages`, async ({ page, request }) => {
      await page.goto(path)
      const faqSection = page.locator(faqSelector)
      const hrefs = glossaryHrefs(await faqSection.locator('a[href^="/glossary/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      expect(hrefs.length, `expected at least one glossary link on ${path}`).toBeGreaterThan(0)

      for (const href of hrefs) {
        const response = await request.get(href)
        expect(response.status(), `${href} (linked from ${path}) should not 404`).toBeLessThan(400)
      }
    })
  }

  test("RD calculator FAQ text has no glossary matches, so no glossary links render there", async ({ page }) => {
    await page.goto("/finance/rd-calculator")
    const links = page.locator('#faqs a[href^="/glossary/"]')
    await expect(links).toHaveCount(0)
  })

  test("each glossary term auto-linked from the EMI calculator shows a reverse link back to it", async ({ page }) => {
    await page.goto("/finance/emi-calculator")
    const hrefs = glossaryHrefs(await page.locator('#faqs a[href^="/glossary/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
    expect(hrefs.length).toBeGreaterThan(0)

    for (const href of hrefs) {
      await page.goto(href)
      const backlinkSection = page.locator('section[aria-labelledby="mentioned-in-calculators"]')
      const backlink = backlinkSection.getByRole("link", { name: "EMI Calculator" })
      await expect(backlink).toHaveAttribute("href", "/finance/emi-calculator")
    }
  })

  test("a glossary term only used on the Loans guide (not EMI/FD/RD) has no calculator backlink section", async ({ page }) => {
    // "SIP" is a published glossary term never mentioned in EMI/FD/RD FAQ text, so it must not
    // claim a calculator backlink it cannot actually resolve to.
    await page.goto("/glossary/sip")
    await expect(page.getByRole("heading", { name: "Where this term is used" })).toHaveCount(0)
  })
})
