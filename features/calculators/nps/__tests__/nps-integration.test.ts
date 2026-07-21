import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { calculateNPS } from "../calculate-nps"
import { npsWorkedExampleInput, npsWorkedExampleResult } from "../nps-content"
import { npsCalculatorDefinition } from "../nps-definition"
import { npsKnowledgeContent } from "../nps-knowledge-content"

describe("NPS production integration", () => {
  it("registers exactly one published NPS calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "nps-calculator")).toEqual([npsCalculatorDefinition])
    expect(npsCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/nps-calculator" })
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator, finance, and homepage-search discovery", () => {
    const path = npsCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    npsCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("includes the calculator once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/nps-calculator"))).toHaveLength(1)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(npsCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/nps-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned", () => {
    expect(npsWorkedExampleResult).toEqual(calculateNPS(npsWorkedExampleInput))
    expect(npsCalculatorDefinition.workedExample).toBeTruthy()
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = npsKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = npsCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })
})
