import { describe, expect, it } from "vitest"

import sitemap from "@/app/sitemap"
import { cagrCalculatorDefinition } from "@/features/calculators/cagr/cagr-definition"
import { cagrKnowledgeContent } from "@/features/calculators/cagr/cagr-knowledge-content"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import {
  createEditorialSearchDocuments,
  getGlossaryTermBySlug,
  getPublicClusterMemberships,
  getPublicTopicBySlug,
  getPublishedGlossaryTerms,
  getTopicLearningPath,
  resolveClusterNavigation,
} from "@/features/content"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { formatIndianCurrency } from "@/lib/formatters"

describe("CAGR production integration", () => {
  it("registers a unique published calculator with unique metadata", () => {
    expect(calculatorRegistry.filter((item) => item.id === "cagr-calculator")).toEqual([cagrCalculatorDefinition])
    expect(cagrCalculatorDefinition).toMatchObject({ slug: "cagr-calculator", status: "published", canonicalPath: "/finance/cagr-calculator" })
    const paths = calculatorRegistry.map((item) => item.canonicalPath)
    const titles = calculatorRegistry.map((item) => item.metadata.title)
    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(titles).size).toBe(titles.length)
    expect(createCalculatorMetadata(cagrCalculatorDefinition).alternates?.canonical).toBe(createCanonicalUrl("/finance/cagr-calculator"))
  })

  it("uses only resolvable live related calculators", () => {
    const publishedPaths = new Set(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.canonicalPath))
    expect(cagrCalculatorDefinition.relatedCalculators.map((item) => item.slug)).toEqual(["lumpsum-calculator", "sip-calculator", "fd-calculator"])
    cagrCalculatorDefinition.relatedCalculators.forEach((item) => expect(publishedPaths.has(item.href)).toBe(true))
  })

  it("is available to registry-derived calculator discovery but excluded from editorial search", () => {
    const calculatorSearchProjection = calculatorRegistry.filter((item) => item.status === "published").map((item) => item.id)
    const editorial = createEditorialSearchDocuments()
    expect(calculatorSearchProjection).toContain("cagr-calculator")
    expect(`${cagrCalculatorDefinition.title} ${cagrCalculatorDefinition.description}`.toLowerCase()).toContain("compound annual growth rate")
    expect(editorial.some((item) => item.id === "cagr-calculator" || item.canonicalPath === "/finance/cagr-calculator")).toBe(false)
    expect(editorial.some((item) => item.id === "glossary-cagr" && item.canonicalPath === "/glossary/cagr")).toBe(true)
    expect(new Set(editorial.map((item) => item.id)).size).toBe(editorial.length)
  })

  it("belongs only to the eligible Investing cluster and respects relationship limits", () => {
    expect(getPublicClusterMemberships("cagr-calculator").map(({ definition }) => definition.id)).toEqual(["topic-investing"])
    const navigation = resolveClusterNavigation("cagr-calculator")!
    expect(navigation.topics.map((item) => item.id)).toEqual(["topic-investing"])
    expect(navigation.related.length).toBeLessThanOrEqual(6)
    expect(navigation.related.some((item) => item.canonicalPath === "/finance/cagr-calculator")).toBe(false)
    expect(getPublicClusterMemberships("cagr-calculator").some(({ definition }) => definition.id === "topic-loans" || definition.id === "topic-savings")).toBe(false)
  })

  it("resolves intentional calculator relationships without hiding the matching CAGR term", () => {
    expect(resolveClusterNavigation("cagr-calculator")!.related.map((item) => item.id)).toEqual([
      "blog-sip-vs-lumpsum", "guide-estimate-sip", "glossary-cagr", "glossary-compounding",
    ])
    expect(resolveClusterNavigation("sip-calculator")!.related.map((item) => item.id)).toEqual([
      "blog-sip-vs-lumpsum", "guide-estimate-sip", "glossary-sip", "glossary-compounding",
    ])
    expect(resolveClusterNavigation("lumpsum-calculator")!.related.map((item) => item.id)).toEqual([
      "blog-sip-vs-lumpsum", "guide-estimate-sip", "glossary-compounding", "glossary-sip",
    ])
  })

  it("preserves authored CAGR glossary links and the Investing learning path", () => {
    const glossary = getGlossaryTermBySlug("cagr")!
    const glossaryNavigation = resolveClusterNavigation("glossary-cagr", [...glossary.relatedCalculators, ...glossary.relatedContent])!
    expect(glossaryNavigation.related.map((item) => [item.id, item.source])).toEqual([
      ["cagr-calculator", "authored"],
      ["lumpsum-calculator", "authored"],
      ["blog-sip-vs-lumpsum", "authored"],
      ["guide-estimate-sip", "authored"],
    ])

    const investing = getPublicTopicBySlug("investing")!
    expect(investing.calculators.map((item) => item.id)).toEqual(["sip-calculator", "lumpsum-calculator", "cagr-calculator"])
    expect(investing.glossaryTerms.map((item) => item.id)).toEqual(["glossary-sip", "glossary-compounding", "glossary-cagr", "glossary-principal", "glossary-tenure"])
    expect(getTopicLearningPath(investing).map((step) => step.destination.id)).toEqual([
      "blog-sip-vs-lumpsum", "glossary-sip", "guide-estimate-sip", "sip-calculator",
    ])
  })

  it("publishes a substantive, unique CAGR glossary term with live relations", () => {
    const terms = getPublishedGlossaryTerms()
    const cagr = terms.find((item) => item.id === "glossary-cagr")
    expect(cagr).toBeDefined()
    expect(cagr?.sections.length).toBeGreaterThanOrEqual(4)
    expect(cagr?.relatedCalculators.some((item) => item.href === "/finance/cagr-calculator")).toBe(true)
    expect(new Set(terms.map((item) => item.canonicalPath)).size).toBe(terms.length)
    expect(new Set(terms.map((item) => item.metadata.title)).size).toBe(terms.length)
    expect(getPublicClusterMemberships("glossary-cagr").map(({ definition }) => definition.id)).toEqual(["topic-investing"])
  })

  it("includes each clean public route once and excludes query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/cagr-calculator"))).toHaveLength(1)
    expect(urls.filter((url) => url === createCanonicalUrl("/glossary/cagr"))).toHaveLength(1)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
  })

  it("keeps knowledge content substantive with unique sections, limits, and live links", () => {
    const sectionIds = cagrKnowledgeContent.sections.map((section) => section.id)
    const sectionTypes = new Set(cagrKnowledgeContent.sections.map((section) => section.type))
    expect(cagrKnowledgeContent.sections.length).toBeGreaterThanOrEqual(9)
    expect(new Set(sectionIds).size).toBe(sectionIds.length)
    expect(cagrCalculatorDefinition.workedExample?.results).toEqual(expect.arrayContaining([
      { label: "CAGR", value: "10%" },
      { label: "Absolute gain", value: formatIndianCurrency(61_051) },
    ]))
    expect(sectionTypes.has("limitations")).toBe(true)
    expect(sectionTypes.has("common-mistakes")).toBe(true)
    const livePaths = new Set(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.canonicalPath))
    cagrKnowledgeContent.relatedLinks.forEach((link) => expect(livePaths.has(link.href)).toBe(true))
    expect(new Set(cagrCalculatorDefinition.faqs.map((faq) => faq.question)).size).toBe(cagrCalculatorDefinition.faqs.length)
  })
})
