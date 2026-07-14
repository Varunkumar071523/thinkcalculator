import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import {
  createEditorialSearchDocuments,
  getGlossaryStaticParams,
  getGlossaryTermBySlug,
} from "@/features/content"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import { calculateGratuity } from "../calculate-gratuity"
import {
  createGratuityResultText,
  gratuityWorkedExampleInput,
  gratuityWorkedExampleResult,
} from "../gratuity-content"
import { gratuityCalculatorDefinition } from "../gratuity-definition"
import { gratuityKnowledgeContent } from "../gratuity-knowledge-content"
import {
  GRATUITY_OFFICIAL_SOURCES,
  GRATUITY_REGULATORY_REVIEW_DATE,
  GRATUITY_STATUTORY_CEILING,
} from "../gratuity-regulatory-config"

describe("gratuity production integration", () => {
  it("registers one unique ninth published Finance calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "gratuity-calculator")).toEqual([gratuityCalculatorDefinition])
    expect(gratuityCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/gratuity-calculator" })
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(12)
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator, finance, homepage-search, and related discovery", () => {
    const path = gratuityCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    expect(popularCalculators.map((item) => item.href)).toContain(path)
    expect(createEditorialSearchDocuments().map((item) => item.canonicalPath)).not.toContain(path)
    gratuityCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("publishes a substantive glossary term with a calculator relationship", () => {
    const term = getGlossaryTermBySlug("gratuity")
    expect(term).toMatchObject({ id: "glossary-gratuity", status: "published", canonicalPath: "/glossary/gratuity" })
    expect(term!.sections.length).toBeGreaterThanOrEqual(6)
    expect(term!.relatedCalculators.map((item) => item.href)).toContain("/finance/gratuity-calculator")
    expect(getGlossaryStaticParams()).toContainEqual({ slug: "gratuity" })
  })

  it("includes calculator and glossary once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    for (const path of ["/finance/gratuity-calculator", "/glossary/gratuity"]) {
      expect(urls.filter((url) => url === createCanonicalUrl(path))).toHaveLength(1)
    }
    expect(urls.some((url) => url.includes("?"))).toBe(false)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(gratuityCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/gratuity-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned", () => {
    expect(gratuityWorkedExampleResult).toEqual(calculateGratuity(gratuityWorkedExampleInput))
    expect(gratuityWorkedExampleResult.countedServiceYears).toBe(8)
    expect(gratuityWorkedExampleResult.gratuityBeforeCeiling).toBeCloseTo(230_769.23076923078, 10)
    expect(gratuityCalculatorDefinition.formula?.expression).toContain("15 ÷ 26")
  })

  it("records current official sources, review dates, and HTTPS URLs", () => {
    expect(GRATUITY_OFFICIAL_SOURCES).toHaveLength(6)
    expect(GRATUITY_REGULATORY_REVIEW_DATE).toBe("2026-07-13")
    expect(GRATUITY_STATUTORY_CEILING).toBe(2_000_000)
    for (const source of GRATUITY_OFFICIAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.checkedOn).toBe(GRATUITY_REGULATORY_REVIEW_DATE)
      expect(source.issuingAuthority).not.toBe("")
      expect(source.ruleUsed).not.toBe("")
    }
    expect(gratuityKnowledgeContent.references).toHaveLength(GRATUITY_OFFICIAL_SOURCES.length)
  })

  it("contains required scope, boundary, ceiling, eligibility, and disclaimer content", () => {
    const text = JSON.stringify(gratuityKnowledgeContent).toLowerCase()
    for (const phrase of [
      "21 november 2025",
      "social security (central) rules, 2026",
      "section 2(88)",
      "section 164(2)(a)",
      "exactly six",
      "₹20,00,000",
      "fixed-term",
      "piece-rated",
      "seasonal",
      "not legal advice",
      "/glossary/gratuity",
    ]) expect(text).toContain(phrase)
  })

  it("keeps copied labels aligned with visible result labels and limitations", () => {
    const text = createGratuityResultText(gratuityWorkedExampleInput, gratuityWorkedExampleResult)
    for (const phrase of ["Eligible monthly wages entered", "Counted service for standard formula", "Daily wage basis", "Gratuity before statutory ceiling", "Statutory ceiling used", "Estimated gratuity after ceiling", "Ceiling status", "Ordinary service threshold"]) expect(text).toContain(phrase)
    expect(text).not.toMatch(/NaN|Infinity/)
    expect(text).toContain("not a legal eligibility")
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = gratuityKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = gratuityCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })
})
