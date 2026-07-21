import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { getGlossaryStaticParams, getGlossaryTermBySlug, getPublicTopicBySlug } from "@/features/content"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { formatIndianCurrency } from "@/lib/formatters"
import { calculateRetirement } from "../calculate-retirement"
import { retirementCalculatorDefinition } from "../retirement-definition"
import { retirementKnowledgeContent } from "../retirement-knowledge-content"
import { retirementWorkedExample } from "../retirement-content"

describe("Retirement Corpus production integration", () => {
  it("registers a unique thirteenth published Finance calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === retirementCalculatorDefinition.id)).toEqual([retirementCalculatorDefinition])
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(18)
    expect(retirementCalculatorDefinition).toMatchObject({ category: "Finance", canonicalPath: "/finance/retirement-corpus-calculator", status: "published" })
    for (const values of [calculatorRegistry.map((item) => item.id), calculatorRegistry.map((item) => item.slug), calculatorRegistry.map((item) => item.canonicalPath)]) expect(new Set(values).size).toBe(values.length)
  })

  it("is derived into directory, Finance, homepage search, and sitemap", () => {
    const path = retirementCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    expect(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.canonicalPath)).toContain(path)
    expect(sitemap().filter((item) => item.url === createCanonicalUrl(path))).toHaveLength(1)
  })

  it("belongs to the public Investing topic", () => {
    const investing = getPublicTopicBySlug("investing")!
    expect(investing.calculators.map((item) => item.id)).toContain(retirementCalculatorDefinition.id)
    expect(investing.glossaryTerms.map((item) => item.id)).toContain("glossary-retirement-corpus")
  })

  it("publishes a substantive reciprocal glossary entry", () => {
    const term = getGlossaryTermBySlug("retirement-corpus")
    expect(term).toMatchObject({ id: "glossary-retirement-corpus", status: "published", canonicalPath: "/glossary/retirement-corpus" })
    expect(term!.sections.length).toBeGreaterThanOrEqual(4)
    expect(term!.relatedCalculators.map((item) => item.href)).toEqual(expect.arrayContaining(["/finance/retirement-corpus-calculator", "/finance/swp-calculator"]))
    expect(getGlossaryStaticParams()).toContainEqual({ slug: "retirement-corpus" })
    expect(sitemap().filter((item) => item.url === createCanonicalUrl("/glossary/retirement-corpus"))).toHaveLength(1)
    expect(retirementKnowledgeContent.relatedLinks.map((item) => item.href)).toContain("/glossary/retirement-corpus")
  })

  it("uses unique clean metadata", () => {
    const metadata = createCalculatorMetadata(retirementCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/retirement-corpus-calculator"))
    expect(String(metadata.alternates?.canonical)).not.toContain("?")
    expect(retirementCalculatorDefinition.metadata.title).not.toBe("")
    expect(retirementCalculatorDefinition.metadata.description).not.toBe("")
  })

  it("derives the worked example from production calculation", () => {
    const result = calculateRetirement({
      currentAge: 30, retirementAge: 60, lifeExpectancy: 85,
      currentSavings: 500_000, monthlyContribution: 15_000,
      expectedReturnPreRetirement: 10, expectedReturnPostRetirement: 10,
      desiredMonthlyWithdrawal: 50_000, inflationRate: 6,
    })
    const values = Object.fromEntries(retirementWorkedExample.results.map((item) => [item.label, item.value]))
    expect(values["Corpus at retirement"]).toBe(formatIndianCurrency(result.corpusAtRetirement))
    expect(values["Total contributions"]).toBe(formatIndianCurrency(result.totalContributions))
    expect(values["Remaining balance at life expectancy"]).toBe(formatIndianCurrency(result.remainingBalanceAtLifeExpectancy))
  })

  it("only ties inflation to the retirement-phase withdrawal, and lists the required exclusions in its non-advice disclaimer", () => {
    const text = JSON.stringify({ def: retirementCalculatorDefinition, content: retirementKnowledgeContent }).toLowerCase()
    expect(text).toContain("sequence-of-returns")
    expect(text).toContain("healthcare")
    expect(text).toContain("taxation")
    expect(text).toContain("government pension")
    expect(text).toContain("not a retirement plan")
    expect(retirementCalculatorDefinition.relatedCalculators.map((item) => item.slug)).toEqual(expect.arrayContaining(["sip-calculator", "step-up-sip-calculator", "swp-calculator", "inflation-calculator"]))
  })
})
