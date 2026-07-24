import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import { calculateCapitalGains } from "../calculate-capital-gains"
import {
  capitalGainsWorkedExampleInput,
  capitalGainsWorkedExampleResult,
  createCapitalGainsResultText,
} from "../capital-gains-content"
import { capitalGainsCalculatorDefinition } from "../capital-gains-definition"
import { capitalGainsKnowledgeContent } from "../capital-gains-knowledge-content"
import {
  CAPITAL_GAINS_OFFICIAL_SOURCES,
  CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
  CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION,
  CAPITAL_GAINS_LTCG_TAX_RATE,
  CAPITAL_GAINS_STCG_TAX_RATE,
} from "../capital-gains-regulatory-config"

describe("capital gains production integration", () => {
  it("registers exactly one published, unique Capital Gains calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "capital-gains-calculator")).toEqual([capitalGainsCalculatorDefinition])
    expect(capitalGainsCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/capital-gains-calculator" })
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(21)
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator and finance discovery", () => {
    const path = capitalGainsCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    capitalGainsCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("does not appear in popularCalculators (not scoped by this sprint)", () => {
    const entry = popularCalculators.find((item) => item.href === capitalGainsCalculatorDefinition.canonicalPath)
    if (entry) expect(entry.href).toBe("/finance/capital-gains-calculator")
  })

  it("includes the calculator once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/capital-gains-calculator"))).toHaveLength(1)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(capitalGainsCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/capital-gains-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned, exercising FIFO, grandfathering, and the pooled exemption at once", () => {
    expect(capitalGainsWorkedExampleResult).toEqual(calculateCapitalGains(capitalGainsWorkedExampleInput))
    expect(capitalGainsWorkedExampleInput.lots.length).toBeGreaterThanOrEqual(2)
    expect(capitalGainsWorkedExampleResult.matchedLots.some((lot) => lot.isGrandfathered)).toBe(true)
    expect(capitalGainsWorkedExampleResult.matchedLots.some((lot) => lot.classification === "stcg")).toBe(true)
    expect(capitalGainsWorkedExampleResult.matchedLots.some((lot) => lot.classification === "ltcg")).toBe(true)
    expect(capitalGainsWorkedExampleResult.totalLTCG).toBeGreaterThan(CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION)
    expect(capitalGainsWorkedExampleResult.ltcgTaxableAfterExemption).toBeGreaterThan(0)
    expect(capitalGainsWorkedExampleResult.ltcgExemptionUsed).toBe(CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION)
    expect(capitalGainsWorkedExampleResult.totalTax).toBeGreaterThan(0)
  })

  it("records current official sources, review dates, and HTTPS URLs", () => {
    expect(CAPITAL_GAINS_OFFICIAL_SOURCES.length).toBeGreaterThanOrEqual(3)
    expect(CAPITAL_GAINS_STCG_TAX_RATE).toBe(0.20)
    expect(CAPITAL_GAINS_LTCG_TAX_RATE).toBe(0.125)
    expect(CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION).toBe(125_000)
    for (const source of CAPITAL_GAINS_OFFICIAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.checkedOn).toBe(CAPITAL_GAINS_REGULATORY_REVIEW_DATE)
      expect(source.issuingAuthority).not.toBe("")
      expect(source.ruleUsed).not.toBe("")
    }
    expect(capitalGainsKnowledgeContent.references).toHaveLength(CAPITAL_GAINS_OFFICIAL_SOURCES.length)
  })

  it("contains required scope, rate, exemption, grandfathering, and disclaimer content", () => {
    const text = JSON.stringify(capitalGainsKnowledgeContent).toLowerCase()
    for (const phrase of [
      "1,25,000",
      "20%",
      "12.5%",
      "111a",
      "112a",
      "grandfathering",
      "31 january 2018",
      "fifo",
      "not tax advice",
      "surcharge",
    ]) expect(text).toContain(phrase)
  })

  it("keeps copied labels aligned with visible result labels", () => {
    const text = createCapitalGainsResultText(capitalGainsWorkedExampleInput, capitalGainsWorkedExampleResult)
    for (const phrase of ["Asset type", "Total STCG", "Total LTCG", "LTCG exemption used", "Total tax", "Net proceeds after tax"]) expect(text).toContain(phrase)
    expect(text).not.toMatch(/NaN|Infinity/)
    expect(text).toContain("not tax advice")
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = capitalGainsKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = capitalGainsCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it("does not repeat FAQ answers verbatim as knowledge-content blocks", () => {
    const faqText = new Set(capitalGainsCalculatorDefinition.faqs.flatMap((faq) => [faq.question, faq.answer]))
    for (const section of capitalGainsKnowledgeContent.sections) {
      for (const block of section.content) {
        if (block.type === "paragraph") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "callout") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "list") for (const item of block.items) expect(faqText.has(item)).toBe(false)
      }
    }
  })
})
