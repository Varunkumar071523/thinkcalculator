import { describe, expect, it } from "vitest"

import { contentRegistry, getRelatedBlogPosts } from "@/features/content"
import type { EditorialCategory } from "@/types/editorial-content"

const emiPost = contentRegistry.find((item) => item.slug === "understanding-loan-emi")!
const sipPost = contentRegistry.find((item) => item.slug === "sip-vs-lumpsum")!

// A category slug guaranteed to match no published post, so tests can force the "no
// same-category match" branch without depending on which categories the live catalogue has.
const unmatchedCategory: EditorialCategory = { slug: "test-unmatched-category", name: "Test", description: "" }

describe("getRelatedBlogPosts", () => {
  it("returns no results when the post shares neither category nor a linked calculator with any other published post", () => {
    // Today's live catalogue: Loans vs Investing categories, EMI vs SIP/Lumpsum calculators — no overlap either way.
    expect(getRelatedBlogPosts(emiPost)).toEqual([])
    expect(getRelatedBlogPosts(sipPost)).toEqual([])
  })

  it("excludes the item itself and draft posts from candidates", () => {
    const sameCategoryAsSelf = { ...emiPost, id: "test-self-exclusion", relatedCalculators: [] }
    const related = getRelatedBlogPosts(sameCategoryAsSelf)
    expect(related.map((item) => item.id)).not.toContain("test-self-exclusion")
    expect(related.map((item) => item.id)).not.toContain("draft-fd-vs-rd")
  })

  it("matches on category before falling back to a shared calculator", () => {
    const candidate = { ...emiPost, id: "test-same-category-probe", category: emiPost.category, relatedCalculators: [] }
    const related = getRelatedBlogPosts(candidate)
    expect(related.map((item) => item.slug)).toContain(emiPost.slug)
  })

  it("falls back to a shared linked calculator when no same-category post exists", () => {
    const candidate = { ...sipPost, id: "test-shared-calculator-probe", category: unmatchedCategory, relatedCalculators: sipPost.relatedCalculators }
    const related = getRelatedBlogPosts(candidate)
    expect(related.map((item) => item.slug)).toContain(sipPost.slug)
  })

  it("returns nothing when the category is unmatched and there are no linked calculators to fall back on", () => {
    const candidate = { ...emiPost, id: "test-no-fallback-probe", category: unmatchedCategory, relatedCalculators: [] }
    expect(getRelatedBlogPosts(candidate)).toEqual([])
  })

  it("returns at most the requested limit", () => {
    const candidate = { ...emiPost, id: "test-limit-probe", category: emiPost.category, relatedCalculators: [] }
    expect(getRelatedBlogPosts(candidate, 0).length).toBe(0)
  })
})
