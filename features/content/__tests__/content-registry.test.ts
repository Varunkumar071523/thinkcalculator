import { describe, expect, it } from "vitest"
import { contentRegistry, editorialCategories, editorialTags, getContentByCategory, getContentByType, getPublishedContent } from "@/features/content"
import sitemap from "@/app/sitemap"

const published = getPublishedContent()
describe("editorial content registry", () => {
  it("contains exactly four published items and excludes the draft", () => { expect(published).toHaveLength(4); expect(published.map((item) => item.slug)).not.toContain("choosing-between-fd-and-rd") })
  it("has unique slugs by route type and unique canonical paths", () => { for (const type of ["blog", "guide"] as const) { const slugs = getContentByType(type).map((item) => item.slug); expect(new Set(slugs).size).toBe(slugs.length) } const paths = contentRegistry.map((item) => item.canonicalPath); expect(new Set(paths).size).toBe(paths.length) })
  it("has complete required published content", () => { published.forEach((item) => { expect(item.title).toBeTruthy(); expect(item.description).toBeTruthy(); expect(item.category).toBeTruthy(); expect(item.author).toBeTruthy(); expect(item.sections.length).toBeGreaterThanOrEqual(4); expect(item.sections.length).toBeLessThanOrEqual(7); expect(item.estimatedReadingMinutes).toBeGreaterThan(0); expect(/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt)).toBe(true); expect(Number.isNaN(Date.parse(item.publishedAt))).toBe(false) }) })
  it("has unique section IDs and FAQ questions per item", () => { published.forEach((item) => { const ids = item.sections.flatMap((section) => [section.id, ...(section.subsections ?? []).map((child) => child.id)]); expect(new Set(ids).size).toBe(ids.length); const questions = item.faqs.map((faq) => faq.question); expect(new Set(questions).size).toBe(questions.length) }) })
  it("has unique taxonomy slugs", () => { const categories = Object.values(editorialCategories).map((item) => item.slug); const tags = Object.values(editorialTags).map((item) => item.slug); expect(new Set(categories).size).toBe(categories.length); expect(new Set(tags).size).toBe(tags.length) })
  it("only exposes non-empty categories represented by published content", () => { const publicCategories = new Set(published.map((item) => item.category.slug)); publicCategories.forEach((slug) => expect(getContentByCategory(slug).length).toBeGreaterThan(0)) })
  it("excludes drafts from sitemap input", () => { const urls = sitemap().map((entry) => entry.url); expect(urls).not.toContain("https://thinkcalculator.in/blog/choosing-between-fd-and-rd"); published.forEach((item) => expect(urls).toContain(`https://thinkcalculator.in${item.canonicalPath}`)) })
  it("uses only published content for route generation", () => { expect(getContentByType("blog")).toHaveLength(2); expect(getContentByType("guide")).toHaveLength(2); expect(getContentByType("blog").every((item) => item.status === "published")).toBe(true) })
  it("has unique metadata titles", () => { const titles = published.map((item) => item.metadata.title); expect(new Set(titles).size).toBe(titles.length) })
})
