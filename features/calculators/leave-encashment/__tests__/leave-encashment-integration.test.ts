import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import { calculateLeaveEncashment } from "../calculate-leave-encashment"
import {
  createLeaveEncashmentResultText,
  leaveEncashmentWorkedExampleInput,
  leaveEncashmentWorkedExampleResult,
} from "../leave-encashment-content"
import { leaveEncashmentCalculatorDefinition } from "../leave-encashment-definition"
import { leaveEncashmentKnowledgeContent } from "../leave-encashment-knowledge-content"
import {
  LEAVE_ENCASHMENT_OFFICIAL_SOURCES,
  LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE,
  LEAVE_ENCASHMENT_STATUTORY_LIMIT,
} from "../leave-encashment-regulatory-config"

describe("leave encashment production integration", () => {
  it("registers exactly one published, unique Leave Encashment calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "leave-encashment-calculator")).toEqual([leaveEncashmentCalculatorDefinition])
    expect(leaveEncashmentCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/leave-encashment-calculator" })
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(20)
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator and finance discovery", () => {
    const path = leaveEncashmentCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    leaveEncashmentCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("does not appear in popularCalculators (not scoped by this sprint)", () => {
    const entry = popularCalculators.find((item) => item.href === leaveEncashmentCalculatorDefinition.canonicalPath)
    if (entry) expect(entry.href).toBe("/finance/leave-encashment-calculator")
  })

  it("includes the calculator once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/leave-encashment-calculator"))).toHaveLength(1)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(leaveEncashmentCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/leave-encashment-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned, with the statutory cap actually binding", () => {
    expect(leaveEncashmentWorkedExampleResult).toEqual(calculateLeaveEncashment(leaveEncashmentWorkedExampleInput))
    expect(leaveEncashmentWorkedExampleInput.employeeType).toBe("non-government")
    expect(leaveEncashmentWorkedExampleResult.bindingConstraint).toBe("statutory-limit")
    expect(leaveEncashmentWorkedExampleResult.exemptAmount).toBeLessThan(leaveEncashmentWorkedExampleResult.leaveEncashmentAmountReceived)
    expect(leaveEncashmentWorkedExampleResult.taxableAmount).toBeGreaterThan(0)
    expect(leaveEncashmentCalculatorDefinition.formula?.expression).toContain("least(")
  })

  it("records current official sources, review dates, and HTTPS URLs", () => {
    expect(LEAVE_ENCASHMENT_OFFICIAL_SOURCES.length).toBeGreaterThanOrEqual(3)
    expect(LEAVE_ENCASHMENT_STATUTORY_LIMIT).toBe(2_500_000)
    for (const source of LEAVE_ENCASHMENT_OFFICIAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.checkedOn).toBe(LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE)
      expect(source.issuingAuthority).not.toBe("")
      expect(source.ruleUsed).not.toBe("")
    }
    expect(leaveEncashmentKnowledgeContent.references).toHaveLength(LEAVE_ENCASHMENT_OFFICIAL_SOURCES.length)
  })

  it("contains required scope, cap, comparison, and disclaimer content", () => {
    const text = JSON.stringify(leaveEncashmentKnowledgeContent).toLowerCase()
    for (const phrase of [
      "25,00,000",
      "30 days",
      "10(10aa)",
      "government",
      "non-government",
      "gratuity",
      "retirement corpus",
      "not personalised tax",
      "in service",
    ]) expect(text).toContain(phrase)
  })

  it("keeps copied labels aligned with visible result labels", () => {
    const text = createLeaveEncashmentResultText(leaveEncashmentWorkedExampleInput, leaveEncashmentWorkedExampleResult)
    for (const phrase of ["Employee type", "Exempt amount", "Taxable amount", "Estimated tax on taxable amount", "Estimated net amount after tax", "Binding constraint"]) expect(text).toContain(phrase)
    expect(text).not.toMatch(/NaN|Infinity/)
    expect(text).toContain("not tax advice")
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = leaveEncashmentKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = leaveEncashmentCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it("does not repeat FAQ answers verbatim as knowledge-content blocks", () => {
    const faqText = new Set(leaveEncashmentCalculatorDefinition.faqs.flatMap((faq) => [faq.question, faq.answer]))
    for (const section of leaveEncashmentKnowledgeContent.sections) {
      for (const block of section.content) {
        if (block.type === "paragraph") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "callout") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "list") for (const item of block.items) expect(faqText.has(item)).toBe(false)
      }
    }
  })
})
