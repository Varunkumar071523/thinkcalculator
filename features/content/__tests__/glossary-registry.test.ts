import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { getGlossaryStaticParams, getGlossaryTermBySlug, getPublishedGlossaryTerms, glossaryRegistry } from "@/features/content"

describe("glossary registry", () => {
  const published = getPublishedGlossaryTerms()
  it("publishes substantive terms and excludes drafts", () => { expect(published).toHaveLength(15); expect(published.map((item) => item.slug)).not.toContain("maturity-value"); published.forEach((item) => expect(item.sections.length).toBeGreaterThanOrEqual(4)) })
  it("uses unique identities, slugs, paths, and metadata", () => { for (const values of [glossaryRegistry.map((item) => item.id), glossaryRegistry.map((item) => item.slug), glossaryRegistry.map((item) => item.canonicalPath), glossaryRegistry.map((item) => item.metadata.title)]) expect(new Set(values).size).toBe(values.length) })
  it("generates only published routes", () => { expect(getGlossaryStaticParams()).toEqual(published.map((item) => ({ slug: item.slug }))); expect(getGlossaryTermBySlug("maturity-value")?.status).toBe("draft") })
  it("has valid live internal relations", () => { published.forEach((item) => [...item.relatedCalculators, ...item.relatedContent].forEach((link) => expect(link.href).toMatch(/^\/(finance|business|blog|guides)\//))) })
  it("includes the index and published terms in the sitemap", () => { const urls = sitemap().map((item) => item.url); expect(urls).toContain("https://thinkcalculator.in/glossary"); published.forEach((item) => expect(urls).toContain(`https://thinkcalculator.in${item.canonicalPath}`)); expect(urls).not.toContain("https://thinkcalculator.in/glossary/maturity-value") })
})
