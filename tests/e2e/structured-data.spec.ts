import { expect, test } from "@playwright/test"

import { calculatorRegistry } from "../../features/calculators/core/calculator-registry"

// Sprint 37: verifies the schema Google actually sees in the static export's rendered HTML, not
// just that a script tag exists in source. Reads every application/ld+json block on the page and
// asserts on the parsed objects, matching the pattern the project already uses for route/content
// invariants (routes.ts) rather than re-deriving expectations by hand.
async function readJsonLdBlocks(page: import("@playwright/test").Page): Promise<unknown[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents()
  return raw.map((text) => JSON.parse(text))
}

function findNodesByType(blocks: readonly unknown[], type: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []
  for (const block of blocks) {
    const graph = (block as { "@graph"?: unknown[] })["@graph"]
    const candidates = Array.isArray(graph) ? graph : [block]
    for (const candidate of candidates) {
      const node = candidate as Record<string, unknown>
      if (node["@type"] === type) results.push(node)
    }
  }
  return results
}

test.describe("Organization structured data (site-wide)", () => {
  test("homepage renders an Organization node with name, url, and a real logo", async ({ page }) => {
    await page.goto("/")
    const blocks = await readJsonLdBlocks(page)
    const [organization] = findNodesByType(blocks, "Organization")
    expect(organization).toBeTruthy()
    expect(organization.name).toBe("ThinkCalculator")
    expect(organization.url).toBe("https://thinkcalculator.in")
    expect(organization.logo).toMatchObject({ "@type": "ImageObject", url: "https://thinkcalculator.in/icon" })
  })

  test("a non-homepage route still renders the site-wide Organization node (root layout)", async ({ page }) => {
    await page.goto("/finance/emi-calculator")
    const blocks = await readJsonLdBlocks(page)
    const [organization] = findNodesByType(blocks, "Organization")
    expect(organization).toBeTruthy()
    expect(organization.logo).toBeTruthy()
  })
})

test.describe("FAQPage structured data (calculator pages)", () => {
  const published = calculatorRegistry.filter((calculator) => calculator.status === "published" && calculator.faqs.length > 0)

  for (const calculator of published) {
    test(`${calculator.slug} renders FAQPage schema matching its FAQ content`, async ({ page }) => {
      await page.goto(calculator.canonicalPath)
      const blocks = await readJsonLdBlocks(page)
      const [faqPage] = findNodesByType(blocks, "FAQPage")
      expect(faqPage, `expected a FAQPage node on ${calculator.canonicalPath}`).toBeTruthy()

      const mainEntity = faqPage.mainEntity as { name: string; acceptedAnswer: { text: string } }[]
      expect(mainEntity).toHaveLength(calculator.faqs.length)
      for (const faq of calculator.faqs) {
        const match = mainEntity.find((entry) => entry.name === faq.question)
        expect(match, `expected FAQPage entry for "${faq.question}" on ${calculator.canonicalPath}`).toBeTruthy()
        expect(match?.acceptedAnswer.text).toBe(faq.answer)
      }
    })
  }
})
