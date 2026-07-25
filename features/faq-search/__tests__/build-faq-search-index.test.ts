import { describe, expect, it } from "vitest"

import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { contentRegistry, getPublishedContent } from "@/features/content/content-registry"
import { buildFaqSearchIndex, documentsForGuideSections } from "@/features/faq-search/build-faq-search-index"
import type { EditorialSection } from "@/types/editorial-content"

const publishedCalculators = calculatorRegistry.filter((calculator) => calculator.status === "published")
const publishedGuides = getPublishedContent().filter((item) => item.type === "guide")
const index = buildFaqSearchIndex()

describe("buildFaqSearchIndex", () => {
  it("indexes one document per published calculator FAQ", () => {
    const expectedCount = publishedCalculators.reduce((total, calculator) => total + calculator.faqs.length, 0)
    const faqDocuments = index.filter((document) => document.kind === "faq")
    expect(faqDocuments).toHaveLength(expectedCount)
  })

  it("links each FAQ document to its calculator's FAQ section anchor", () => {
    const emiCalculator = publishedCalculators.find((calculator) => calculator.slug === "emi-calculator")
    expect(emiCalculator).toBeDefined()
    const emiFaqDocuments = index.filter((document) => document.kind === "faq" && document.source === emiCalculator!.title)
    expect(emiFaqDocuments.length).toBe(emiCalculator!.faqs.length)
    for (const document of emiFaqDocuments) {
      expect(document.href).toBe(`${emiCalculator!.canonicalPath}#faqs`)
    }
  })

  it("indexes one document per published calculator with a worked example, linked to its anchor", () => {
    const withExample = publishedCalculators.filter((calculator) => calculator.workedExample)
    const exampleDocuments = index.filter((document) => document.kind === "example")
    expect(exampleDocuments).toHaveLength(withExample.length)
    for (const calculator of withExample) {
      const document = exampleDocuments.find((item) => item.source === calculator.title)
      expect(document).toBeDefined()
      expect(document!.href).toBe(`${calculator.canonicalPath}#worked-example`)
      expect(document!.body).toContain(calculator.workedExample!.description)
    }
  })

  it("excludes draft calculators from FAQ and worked example documents", () => {
    const draftCalculators = calculatorRegistry.filter((calculator) => calculator.status === "draft")
    expect(draftCalculators.length).toBeGreaterThan(0)
    const draftTitles = new Set(draftCalculators.map((calculator) => calculator.title))
    const calculatorDocuments = index.filter((document) => document.kind === "faq" || document.kind === "example")
    expect(calculatorDocuments.some((document) => draftTitles.has(document.source))).toBe(false)
  })

  it("indexes one document per section of every published guide, linked to its section anchor", () => {
    expect(publishedGuides.length).toBeGreaterThan(0)
    const expectedCount = publishedGuides.reduce((total, guide) => total + guide.sections.length, 0)
    const guideDocuments = index.filter((document) => document.kind === "guide")
    expect(guideDocuments).toHaveLength(expectedCount)

    const loansGuide = publishedGuides.find((guide) => guide.slug === "understanding-emi-fd-and-rd")
    expect(loansGuide).toBeDefined()
    const workedExampleSection = loansGuide!.sections.find((section) => section.id === "worked-example")
    expect(workedExampleSection).toBeDefined()
    const document = guideDocuments.find((item) => item.id === `guide:understanding-emi-fd-and-rd:worked-example`)
    expect(document).toBeDefined()
    expect(document!.href).toBe(`${loansGuide!.canonicalPath}#worked-example`)
    expect(document!.question).toBe(workedExampleSection!.title)
  })

  it("flattens guide section blocks (paragraphs, lists, callouts, tables) into searchable body text", () => {
    const compareSection = index.find((document) => document.id === "guide:understanding-emi-fd-and-rd:compare-results-correctly")
    expect(compareSection).toBeDefined()
    // This section is a table (headers + rows), so its flattened body must retain table cell text.
    expect(compareSection!.body).toContain("Monthly repayment and total interest on a loan")
    expect(compareSection!.body).toContain("Processing fees, insurance, and other lender charges")
  })

  it("excludes blog content from the index", () => {
    const blogPaths = new Set(contentRegistry.filter((item) => item.type === "blog").map((item) => item.canonicalPath))
    expect(index.some((document) => blogPaths.has(document.href.split("#")[0]))).toBe(false)
  })

  it("marks FAQ and worked example documents from popular-badged calculators as popular", () => {
    const popularCalculators = publishedCalculators.filter((calculator) => calculator.badge === "popular")
    expect(popularCalculators.length).toBeGreaterThan(0)
    for (const calculator of popularCalculators) {
      const documents = index.filter((document) => document.source === calculator.title && (document.kind === "faq" || document.kind === "example"))
      expect(documents.length).toBeGreaterThan(0)
      expect(documents.every((document) => document.popular === true)).toBe(true)
    }
    const nonPopular = index.filter((document) => (document.kind === "faq" || document.kind === "example") && !popularCalculators.some((calculator) => calculator.title === document.source))
    expect(nonPopular.every((document) => !document.popular)).toBe(true)
  })

  it("uses unique stable IDs across the whole index", () => {
    expect(new Set(index.map((document) => document.id)).size).toBe(index.length)
  })

  it("recurses into a guide section's subsections, at any nesting depth, so their content is indexed", () => {
    const fixtureGuide = { slug: "fixture-guide", title: "Fixture Guide", canonicalPath: "/guides/fixture-guide" }
    const fixtureSections: readonly EditorialSection[] = [
      {
        id: "top-level",
        title: "Top-level section",
        blocks: [{ type: "paragraph", text: "Top-level body text." }],
        subsections: [
          {
            id: "nested-once",
            title: "Nested once",
            blocks: [{ type: "paragraph", text: "Nested-once distinctive body text." }],
            subsections: [
              {
                id: "nested-twice",
                title: "Nested twice",
                blocks: [{ type: "paragraph", text: "Nested-twice distinctive body text." }],
              },
            ],
          },
        ],
      },
    ]

    const documents = documentsForGuideSections(fixtureGuide, fixtureSections)

    expect(documents).toHaveLength(3)
    const nestedOnce = documents.find((document) => document.id === "guide:fixture-guide:nested-once")
    expect(nestedOnce).toBeDefined()
    expect(nestedOnce!.question).toBe("Nested once")
    expect(nestedOnce!.body).toContain("Nested-once distinctive body text.")
    expect(nestedOnce!.href).toBe("/guides/fixture-guide#nested-once")

    const nestedTwice = documents.find((document) => document.id === "guide:fixture-guide:nested-twice")
    expect(nestedTwice).toBeDefined()
    expect(nestedTwice!.question).toBe("Nested twice")
    expect(nestedTwice!.body).toContain("Nested-twice distinctive body text.")
    expect(nestedTwice!.href).toBe("/guides/fixture-guide#nested-twice")
  })
})
