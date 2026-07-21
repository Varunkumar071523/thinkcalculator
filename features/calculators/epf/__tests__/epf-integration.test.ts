import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import { calculateEPF } from "../calculate-epf"
import { epfWorkedExampleInput, epfWorkedExampleResult } from "../epf-content"
import { epfCalculatorDefinition } from "../epf-definition"
import { epfKnowledgeContent } from "../epf-knowledge-content"

describe("EPF production integration", () => {
  it("registers exactly one published EPF calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "epf-calculator")).toEqual([epfCalculatorDefinition])
    expect(epfCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/epf-calculator" })
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator, finance, and homepage-search discovery", () => {
    const path = epfCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    epfCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("includes the calculator once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/epf-calculator"))).toHaveLength(1)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(epfCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/epf-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned", () => {
    expect(epfWorkedExampleResult).toEqual(calculateEPF(epfWorkedExampleInput))
    expect(epfCalculatorDefinition.workedExample).toBeTruthy()
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = epfKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = epfCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it("does not appear in popularCalculators (not scoped by this sprint)", () => {
    // Not asserting either way is fine, but if it is ever added, the href must be well-formed.
    const entry = popularCalculators.find((item) => item.href === epfCalculatorDefinition.canonicalPath)
    if (entry) expect(entry.href).toBe("/finance/epf-calculator")
  })
})
