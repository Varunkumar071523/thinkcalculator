import { describe, expect, it } from "vitest"

import { calculateIncomeTax } from "@/lib/tax/engine"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import sitemap from "@/app/sitemap"
import { incomeTaxCalculatorDefinition } from "../income-tax-definition"
import { incomeTaxKnowledgeContent } from "../income-tax-knowledge-content"
import { createIncomeTaxResultItems } from "../income-tax-results"
import { INCOME_TAX_FINANCIAL_YEAR } from "../income-tax-regulatory-config"

describe("income tax production integration", () => {
  it("registers one unique published Finance calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "income-tax-calculator")).toEqual([incomeTaxCalculatorDefinition])
    expect(incomeTaxCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/income-tax-calculator" })
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(21)
  })

  it("points the popular-calculators entry at the real route, not a placeholder", () => {
    const entry = popularCalculators.find((item) => item.title === "Income Tax Calculator")
    expect(entry?.href).toBe("/finance/income-tax-calculator")
  })

  it("publishes exactly once in the sitemap with a clean canonical URL", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/income-tax-calculator"))).toHaveLength(1)
  })

  it("uses clean canonical metadata with OG and Twitter fields", () => {
    const metadata = createCalculatorMetadata(incomeTaxCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/income-tax-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("targets the required SEO keywords for FY 2025-26", () => {
    const keywords = (incomeTaxCalculatorDefinition.metadata.keywords ?? []).join(" ").toLowerCase()
    expect(keywords).toContain("income tax calculator")
    expect(keywords).toContain(`fy ${INCOME_TAX_FINANCIAL_YEAR}`)
  })

  it("contains official references and out-of-scope limitations", () => {
    expect(incomeTaxKnowledgeContent.references).toBeTruthy()
    expect((incomeTaxKnowledgeContent.references ?? []).length).toBeGreaterThanOrEqual(2)
    const text = JSON.stringify(incomeTaxKnowledgeContent).toLowerCase()
    for (const phrase of ["capital gains", "hra exemption", "80ccd(2)"]) expect(text).toContain(phrase)
  })

  it("uses unique section and FAQ identifiers", () => {
    const ids = incomeTaxKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = incomeTaxCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it("resolves all related calculators to published routes", () => {
    const paths = new Set(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.canonicalPath))
    incomeTaxCalculatorDefinition.relatedCalculators.forEach((item) => expect(paths.has(item.href)).toBe(true))
  })
})

describe("income tax result items", () => {
  it("marks total tax liability as the sole primary item, matching the engine output", () => {
    const result = calculateIncomeTax({ regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: { employerNpsSection80CCD2: 0 } }, INCOME_TAX_FINANCIAL_YEAR)
    const items = createIncomeTaxResultItems(result)
    const primaries = items.filter((item) => item.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0]).toMatchObject({ label: "Total tax liability", value: result.totalTaxLiability })
    expect(items.find((item) => item.id === "rebate-87a")?.value).toBe(result.rebate87A.rebateAmount)
    expect(items.find((item) => item.id === "surcharge")?.value).toBe(result.surcharge.surcharge)
    expect(items.find((item) => item.id === "cess")?.value).toBe(result.cess)
  })

  it("reflects zero tax liability for the ₹12.75L new-regime worked example", () => {
    const result = calculateIncomeTax({ regime: "new", grossIncome: 1_275_000, ageBand: "below60", deductions: { employerNpsSection80CCD2: 0 } }, INCOME_TAX_FINANCIAL_YEAR)
    const items = createIncomeTaxResultItems(result)
    expect(items.find((item) => item.id === "total-tax")?.value).toBe(0)
  })
})
