import { describe, expect, it } from "vitest"

import { buildFaqSearchIndex } from "@/features/faq-search/build-faq-search-index"
import {
  createFaqSearchEngine,
  FAQ_SEARCH_MIN_QUERY_LENGTH,
  FAQ_SEARCH_QUERY_MAX_LENGTH,
  getDefaultFaqSuggestions,
  getFaqSearchResults,
  isFaqSearchQueryTooShort,
  searchFaqDocuments,
} from "@/features/faq-search/faq-search-query"

const documents = buildFaqSearchIndex()
const engine = createFaqSearchEngine(documents)

describe("searchFaqDocuments", () => {
  it("ranks an exact FAQ question above a weaker body-text match for the same query", () => {
    const results = searchFaqDocuments(engine, "What is a SIP?")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.question).toBe("What is a SIP?")
  })

  it("finds the EMI calculator FAQ for a plain 'EMI' query", () => {
    const results = searchFaqDocuments(engine, "EMI")
    expect(results.some((document) => document.source === "EMI Calculator")).toBe(true)
  })

  it("finds the PPF worked example for a 'PPF projection example' query", () => {
    const results = searchFaqDocuments(engine, "PPF projection example")
    expect(results.some((document) => document.source === "PPF Calculator" && document.kind === "example")).toBe(true)
  })

  it("finds Loans guide section content for a guide-specific query", () => {
    const results = searchFaqDocuments(engine, "FD RD EMI comparison")
    expect(results.some((document) => document.kind === "guide")).toBe(true)
  })

  it("is tolerant of small typos", () => {
    const results = searchFaqDocuments(engine, "recurring deposit")
    expect(results.some((document) => document.source === "RD Calculator")).toBe(true)
  })

  it("returns nothing for a blank or whitespace-only query", () => {
    expect(searchFaqDocuments(engine, "")).toEqual([])
    expect(searchFaqDocuments(engine, "   ")).toEqual([])
  })

  it("returns no results for unrelated gibberish, matching the no-match fallback threshold", () => {
    const results = searchFaqDocuments(engine, "zzqxw nonexistent unrelated term 12345")
    expect(results).toEqual([])
  })

  it("caps results at the requested limit", () => {
    const results = searchFaqDocuments(engine, "calculator", 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it("truncates queries longer than the max length instead of throwing", () => {
    const longQuery = "a".repeat(FAQ_SEARCH_QUERY_MAX_LENGTH + 50)
    expect(() => searchFaqDocuments(engine, longQuery)).not.toThrow()
  })
})

describe("getFaqSearchResults", () => {
  it("returns the default/popular set for a 1-character query, not a Fuse.js match list", () => {
    // "a" and "e" are exactly the queries the adversarial review found returning arbitrary
    // acronym-heavy Fuse.js matches (EMI/EPF/NPS/CAGR) — confirm they now short-circuit instead.
    for (const shortQuery of ["a", "e"]) {
      expect(isFaqSearchQueryTooShort(shortQuery)).toBe(true)
      expect(getFaqSearchResults(documents, engine, shortQuery)).toEqual(getDefaultFaqSuggestions(documents))
    }
  })

  it("runs a real fuzzy search once the query reaches the minimum length", () => {
    expect(FAQ_SEARCH_MIN_QUERY_LENGTH).toBe(2)
    expect(isFaqSearchQueryTooShort("EM")).toBe(false)
    expect(getFaqSearchResults(documents, engine, "EMI")).toEqual(searchFaqDocuments(engine, "EMI"))
  })

  it("treats a query that trims to under the minimum length as too short", () => {
    expect(isFaqSearchQueryTooShort(" a ")).toBe(true)
    expect(isFaqSearchQueryTooShort("")).toBe(true)
  })
})

describe("getDefaultFaqSuggestions", () => {
  it("returns a non-empty, capped list of suggestions before any query is typed", () => {
    const suggestions = getDefaultFaqSuggestions(documents)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.length).toBeLessThanOrEqual(5)
  })

  it("surfaces popular-calculator documents ahead of non-popular ones", () => {
    const suggestions = getDefaultFaqSuggestions(documents)
    const firstNonPopularIndex = suggestions.findIndex((document) => !document.popular)
    if (firstNonPopularIndex === -1) return
    expect(suggestions.slice(0, firstNonPopularIndex).every((document) => document.popular)).toBe(true)
  })
})
