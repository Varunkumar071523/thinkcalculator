import { describe, expect, it } from "vitest"

import { contentRegistry, filterBlogPostsByCategory, getBlogCategoryOptions, getContentByType, splitFeaturedPost } from "@/features/content"
import type { EditorialContentSummary } from "@/types/editorial-content"

const author = { id: "author", name: "Author", description: "" }
const loans = { slug: "loans", name: "Loans", description: "" }
const investing = { slug: "investing", name: "Investing", description: "" }

function post(overrides: Partial<EditorialContentSummary> & Pick<EditorialContentSummary, "id" | "slug" | "category">): EditorialContentSummary {
  return {
    type: "blog",
    title: overrides.slug,
    description: "",
    excerpt: "",
    author,
    canonicalPath: `/blog/${overrides.slug}`,
    publishedAt: "2026-01-01",
    estimatedReadingMinutes: 4,
    tags: [],
    ...overrides,
  }
}

const emi = post({ id: "1", slug: "emi", category: loans })
const sip = post({ id: "2", slug: "sip", category: investing })
const fd = post({ id: "3", slug: "fd", category: loans })

describe("getBlogCategoryOptions", () => {
  it("returns unique categories in first-seen order", () => {
    expect(getBlogCategoryOptions([emi, sip, fd])).toEqual([
      { slug: "loans", name: "Loans" },
      { slug: "investing", name: "Investing" },
    ])
  })

  it("returns an empty list for an empty catalogue", () => {
    expect(getBlogCategoryOptions([])).toEqual([])
  })

  it("returns a single category when only one exists, so callers can decide whether to hide the filter UI", () => {
    expect(getBlogCategoryOptions([emi, fd])).toEqual([{ slug: "loans", name: "Loans" }])
  })
})

describe("filterBlogPostsByCategory", () => {
  it("returns all posts unfiltered when the category is null", () => {
    expect(filterBlogPostsByCategory([emi, sip, fd], null)).toEqual([emi, sip, fd])
  })

  it("returns only posts matching the given category slug", () => {
    expect(filterBlogPostsByCategory([emi, sip, fd], "loans")).toEqual([emi, fd])
  })

  it("returns an empty list when no post matches the category", () => {
    expect(filterBlogPostsByCategory([emi, sip, fd], "savings")).toEqual([])
  })
})

describe("splitFeaturedPost", () => {
  it("never includes the featured post in the remaining grid, for any input size", () => {
    for (const items of [[], [emi], [emi, sip], [emi, sip, fd]]) {
      const { featured, rest } = splitFeaturedPost(items)
      if (featured) expect(rest.map((item) => item.id)).not.toContain(featured.id)
    }
  })

  it("returns featured undefined and an empty grid for an empty input", () => {
    expect(splitFeaturedPost([])).toEqual({ featured: undefined, rest: [] })
  })

  it("returns the only item as featured and an empty grid for a single-item input", () => {
    expect(splitFeaturedPost([emi])).toEqual({ featured: emi, rest: [] })
  })

  it("puts every item after the first into the grid, preserving order", () => {
    expect(splitFeaturedPost([emi, sip, fd])).toEqual({ featured: emi, rest: [sip, fd] })
  })
})

describe("pagination threshold counts only published posts", () => {
  it("getContentByType('blog') excludes the registry's draft fixture, so it never inflates the pagination-trigger count", () => {
    const publishedBlogPosts = getContentByType("blog")
    expect(publishedBlogPosts.map((item) => item.id)).not.toContain("draft-fd-vs-rd")
    expect(contentRegistry.some((item) => item.type === "blog" && item.status === "draft")).toBe(true) // the draft fixture still exists in the registry...
    expect(publishedBlogPosts.length).toBeLessThan(contentRegistry.filter((item) => item.type === "blog").length) // ...but is excluded from what the listing page counts
  })
})
