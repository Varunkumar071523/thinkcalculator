import { describe, expect, it } from "vitest"
import { calculateReadingTime, getPublishedContent } from "@/features/content"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"

const published = getPublishedContent()
const productionRoutes = new Set(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.canonicalPath))
describe("editorial content quality", () => {
  it("contains no empty paragraphs, lists, or placeholder links", () => { published.forEach((item) => item.sections.forEach((section) => section.blocks.forEach((block) => { if (block.type === "paragraph") { expect(block.text.trim()).not.toBe(""); block.links?.forEach((link) => expect(link.href).not.toBe("#")) } if (block.type === "list") { expect(block.items.length).toBeGreaterThan(0); block.items.forEach((entry) => expect(entry.trim()).not.toBe("")) } }))) })
  it("links only to production calculators", () => { published.flatMap((item) => item.relatedCalculators).forEach((link) => expect(productionRoutes.has(link.href)).toBe(true)) })
  it("links related editorial items only to published content", () => { const paths = new Set(published.map((item) => item.canonicalPath)); published.flatMap((item) => item.relatedContent).forEach((link) => expect(paths.has(link.href)).toBe(true)) })
  it("calculates positive reading time from structured text", () => { published.forEach((item) => expect(calculateReadingTime(item)).toBeGreaterThan(0)) })
  it("includes the required calculator mappings", () => { const mappings: Record<string, string[]> = { "understanding-loan-emi": ["/finance/emi-calculator"], "sip-vs-lumpsum": ["/finance/sip-calculator", "/finance/lumpsum-calculator"], "understanding-cagr": ["/finance/cagr-calculator"], "understanding-swp": ["/finance/swp-calculator"], "understanding-foir-loan-eligibility": ["/finance/home-loan-eligibility-calculator"], "how-to-use-emi-calculator": ["/finance/emi-calculator"], "how-to-estimate-sip-growth": ["/finance/sip-calculator", "/finance/lumpsum-calculator"], "understanding-emi-fd-and-rd": ["/finance/emi-calculator", "/finance/fd-calculator", "/finance/rd-calculator"] }; published.forEach((item) => expect(item.relatedCalculators.map((link) => link.href)).toEqual(mappings[item.slug])) })
})
