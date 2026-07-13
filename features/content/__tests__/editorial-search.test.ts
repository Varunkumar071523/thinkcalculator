import { describe, expect, it } from "vitest"

import sitemap from "@/app/sitemap"
import {
  EDITORIAL_SEARCH_QUERY_MAX_LENGTH,
  contentRegistry,
  createEditorialSearchHref,
  createEditorialSearchDocuments,
  getEditorialSearchQuery,
  getPublicTopics,
  getPublishedContent,
  getPublishedGlossaryTerms,
  glossaryRegistry,
  normalizeEditorialSearchQuery,
  searchEditorialDocuments,
  topicRegistry,
} from "@/features/content"
import { createCanonicalUrl, createRootStructuredData } from "@/lib/seo"
import type { EditorialSearchDocument } from "@/types/editorial-search"

const documents = createEditorialSearchDocuments()

function document(overrides: Partial<EditorialSearchDocument> & Pick<EditorialSearchDocument, "id" | "title">): EditorialSearchDocument {
  return {
    type: "guide",
    description: "A test description",
    canonicalPath: `/guides/${overrides.id}`,
    searchable: { title: overrides.title.toLocaleLowerCase("en-IN"), keywords: "", description: "a test description" },
    ...overrides,
  }
}

describe("editorial search", () => {
  it("derives documents from the canonical public registries", () => {
    const expectedIds = [
      ...getPublishedContent().map((item) => item.id),
      ...getPublishedGlossaryTerms().map((item) => item.id),
      ...getPublicTopics().map(({ definition }) => definition.id),
    ]
    expect(new Set(documents.map((item) => item.id))).toEqual(new Set(expectedIds))
    expect(documents).toHaveLength(expectedIds.length)
    expect(documents.some((item) => item.canonicalPath.startsWith("/finance/"))).toBe(false)
  })

  it("indexes only published blogs and guides", () => {
    const editorial = documents.filter((item) => item.type === "blog" || item.type === "guide")
    expect(new Set(editorial.map((item) => item.id))).toEqual(new Set(getPublishedContent().map((item) => item.id)))
    expect(editorial.map((item) => item.id)).not.toContain("draft-fd-vs-rd")
  })

  it("excludes glossary drafts and non-public topics", () => {
    expect(documents.map((item) => item.id)).not.toContain("glossary-maturity-value")
    expect(documents.map((item) => item.id)).not.toContain("topic-savings")
    expect(documents.map((item) => item.id)).not.toContain("topic-borrowing-basics")
    expect(glossaryRegistry.some((item) => item.status === "draft")).toBe(true)
    expect(topicRegistry.some((item) => item.status === "draft")).toBe(true)
  })

  it("links every document to a live canonical route", () => {
    const livePaths = new Set([
      ...getPublishedContent().map((item) => item.canonicalPath),
      ...getPublishedGlossaryTerms().map((item) => item.canonicalPath),
      ...getPublicTopics().map(({ definition }) => definition.canonicalPath),
    ])
    documents.forEach((item) => expect(livePaths.has(item.canonicalPath)).toBe(true))
  })

  it("uses unique stable IDs and canonical paths", () => {
    expect(new Set(documents.map((item) => item.id)).size).toBe(documents.length)
    expect(new Set(documents.map((item) => item.canonicalPath)).size).toBe(documents.length)
  })

  it("normalizes whitespace and case without treating blank input as a query", () => {
    expect(normalizeEditorialSearchQuery("  Loan   EMI \n Guide  ")).toBe("loan emi guide")
    expect(createEditorialSearchHref("  Loan   EMI \n Guide  ")).toBe("/search?q=loan+emi+guide")
    expect(createEditorialSearchHref(" \t ")).toBe("/search")
    expect(searchEditorialDocuments(documents, " \t ").query).toBe("")
    expect(searchEditorialDocuments(documents, " \t ").results).toEqual([])
  })

  it("matches case-insensitively", () => {
    expect(searchEditorialDocuments(documents, "cOmPoUnDiNg").results.map((item) => item.id)).toContain("glossary-compounding")
  })

  it("truncates excessive input safely", () => {
    const result = searchEditorialDocuments(documents, "a".repeat(EDITORIAL_SEARCH_QUERY_MAX_LENGTH + 50))
    expect(result.query).toHaveLength(EDITORIAL_SEARCH_QUERY_MAX_LENGTH)
    expect(result.truncated).toBe(true)
    const href = createEditorialSearchHref(`  ${"A".repeat(EDITORIAL_SEARCH_QUERY_MAX_LENGTH + 50)}  `)
    expect(new URL(href, "https://thinkcalculator.in").searchParams.get("q")).toBe(result.query)
  })

  it("treats punctuation and regular-expression characters as literal text", () => {
    const punctuation = `. * + ? [ ] ( ) { } \\ / & = # % < > " '`
    expect(() => searchEditorialDocuments(documents, punctuation)).not.toThrow()
    expect(searchEditorialDocuments(documents, punctuation).results).toEqual([])
    const href = createEditorialSearchHref(punctuation)
    expect(new URL(href, "https://thinkcalculator.in").searchParams.get("q")).toBe(punctuation)
    expect(href).not.toContain("#")
    expect(href).not.toContain("<")
  })

  it("ranks exact title matches above weaker matches", () => {
    const results = searchEditorialDocuments(documents, "SIP").results
    expect(results[0]?.id).toBe("glossary-sip")
    expect(results.some((item) => item.title !== "SIP")).toBe(true)
  })

  it("ranks title matches above description-only matches", () => {
    const prefix = document({ id: "prefix", title: "Loan basics" })
    const substring = document({ id: "substring", title: "Understanding loan choices" })
    const keyword = document({ id: "keyword", title: "Borrowing", searchable: { title: "borrowing", keywords: "loan", description: "" } })
    const description = document({ id: "description", title: "Repayment", searchable: { title: "repayment", keywords: "", description: "loan basics" } })
    expect(searchEditorialDocuments([description, keyword, substring, prefix], "loan").results.map((item) => item.id)).toEqual(["prefix", "substring", "keyword", "description"])
  })

  it("uses deterministic title tie-breaking independent of registry order", () => {
    const alpha = document({ id: "alpha", title: "Alpha guide", searchable: { title: "alpha guide", keywords: "shared", description: "" } })
    const beta = document({ id: "beta", title: "Beta guide", searchable: { title: "beta guide", keywords: "shared", description: "" } })
    expect(searchEditorialDocuments([beta, alpha], "shared").results.map((item) => item.id)).toEqual(["alpha", "beta"])
    expect(searchEditorialDocuments([alpha, beta], "shared").results.map((item) => item.id)).toEqual(["alpha", "beta"])
  })

  it("matches editorial categories, tags, glossary keywords, and topic metadata", () => {
    expect(searchEditorialDocuments(documents, "financial planning").results.length).toBeGreaterThan(0)
    expect(searchEditorialDocuments(documents, "systematic investment plan").results.map((item) => item.id)).toContain("glossary-sip")
    expect(searchEditorialDocuments(documents, "investment projections").results.map((item) => item.id)).toContain("topic-investing")
  })

  it("returns an empty set for unmatched input and never leaks draft metadata", () => {
    expect(searchEditorialDocuments(documents, "no-such-public-resource-xyz").results).toEqual([])
    for (const query of ["choosing between fd and rd", "maturity value", "borrowing basics", "future learning hub"]) {
      expect(searchEditorialDocuments(documents, query).results).toEqual([])
    }
    const serialized = JSON.stringify(documents)
    for (const item of [...contentRegistry, ...glossaryRegistry, ...topicRegistry].filter((item) => item.status === "draft")) expect(serialized).not.toContain(item.id)
  })

  it("includes only the clean indexable search route in the sitemap", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/search"))).toHaveLength(1)
    expect(urls.some((url) => url.includes("/search?"))).toBe(false)
  })

  it("publishes an accurate WebSite SearchAction for the q contract", () => {
    const structuredData = createRootStructuredData()
    const websites = structuredData["@graph"].filter((item) => item["@type"] === "WebSite")
    const website = websites[0]
    expect(websites).toHaveLength(1)
    expect(website).toMatchObject({
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://thinkcalculator.in/search?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    })
    const serialized = JSON.stringify(structuredData).replace(/</g, "\\u003c")
    expect(serialized).toContain("https://thinkcalculator.in/search?q={search_term_string}")
    expect(serialized).not.toContain("%7Bsearch_term_string%7D")
    expect(serialized).not.toContain("<")
  })

  it("uses the first repeated q value and drops unrelated parameters from generated URLs", () => {
    const input = new URLSearchParams("q=First+query&q=second&source=header")
    expect(getEditorialSearchQuery(input)).toBe("first query")
    expect(createEditorialSearchHref(getEditorialSearchQuery(input))).toBe("/search?q=first+query")
  })
})
