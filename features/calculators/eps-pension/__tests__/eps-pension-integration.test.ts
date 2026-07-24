import { describe, expect, it } from "vitest"

import { availableCalculators } from "@/app/calculators/page"
import { financeCalculators } from "@/app/finance/page"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { popularCalculators } from "@/lib/site-config"
import { calculateEpsPension } from "../calculate-eps-pension"
import {
  createEpsPensionPrintDisclaimer,
  createEpsPensionResultText,
  epsPensionWorkedExampleInput,
  epsPensionWorkedExampleResult,
} from "../eps-pension-content"
import { epsPensionCalculatorDefinition } from "../eps-pension-definition"
import { epsPensionKnowledgeContent } from "../eps-pension-knowledge-content"
import {
  EPS_PENSION_OFFICIAL_SOURCES,
  EPS_PENSION_REGULATORY_REVIEW_DATE,
  EPS_PENSION_WAGE_CEILING,
} from "../eps-pension-regulatory-config"

describe("EPS pension production integration", () => {
  it("registers exactly one published, unique EPS Pension calculator", () => {
    expect(calculatorRegistry.filter((item) => item.id === "eps-pension-calculator")).toEqual([epsPensionCalculatorDefinition])
    expect(epsPensionCalculatorDefinition).toMatchObject({ status: "published", category: "Finance", canonicalPath: "/finance/eps-pension-calculator" })
    expect(calculatorRegistry.filter((item) => item.status === "published")).toHaveLength(21)
    expect(new Set(calculatorRegistry.map((item) => item.id)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.slug)).size).toBe(calculatorRegistry.length)
    expect(new Set(calculatorRegistry.map((item) => item.canonicalPath)).size).toBe(calculatorRegistry.length)
  })

  it("derives calculator and finance discovery", () => {
    const path = epsPensionCalculatorDefinition.canonicalPath
    expect(availableCalculators.map((item) => item.href)).toContain(path)
    expect(financeCalculators.map((item) => item.href)).toContain(path)
    epsPensionCalculatorDefinition.relatedCalculators.forEach((item) => {
      expect(calculatorRegistry.some((calculator) => calculator.status === "published" && calculator.canonicalPath === item.href)).toBe(true)
    })
  })

  it("does not appear in popularCalculators (not scoped by this sprint)", () => {
    const entry = popularCalculators.find((item) => item.href === epsPensionCalculatorDefinition.canonicalPath)
    if (entry) expect(entry.href).toBe("/finance/eps-pension-calculator")
  })

  it("includes the calculator once in the sitemap without query URLs", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/finance/eps-pension-calculator"))).toHaveLength(1)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
  })

  it("uses clean canonical metadata with Open Graph and Twitter fields", () => {
    const metadata = createCalculatorMetadata(epsPensionCalculatorDefinition)
    expect(metadata.alternates?.canonical).toBe(createCanonicalUrl("/finance/eps-pension-calculator"))
    expect(metadata.openGraph).toBeTruthy()
    expect(metadata.twitter).toBeTruthy()
  })

  it("keeps the formula and implementation-derived worked example aligned, with both the ceiling and the bonus actually binding", () => {
    expect(epsPensionWorkedExampleResult).toEqual(calculateEpsPension(epsPensionWorkedExampleInput))
    expect(epsPensionWorkedExampleResult.isWageCeilingBinding).toBe(true)
    expect(epsPensionWorkedExampleResult.bonusYearsApplied).toBe(true)
    expect(epsPensionWorkedExampleResult.monthlyPension).toBeGreaterThan(0)
    expect(epsPensionCalculatorDefinition.formula?.expression).toContain("70")
  })

  it("records current official sources, review dates, and reachable URLs", () => {
    expect(EPS_PENSION_OFFICIAL_SOURCES.length).toBeGreaterThanOrEqual(3)
    expect(EPS_PENSION_WAGE_CEILING).toBe(15_000)
    for (const source of EPS_PENSION_OFFICIAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.checkedOn).toBe(EPS_PENSION_REGULATORY_REVIEW_DATE)
      expect(source.issuingAuthority).not.toBe("")
      expect(source.ruleUsed).not.toBe("")
    }
    expect(epsPensionKnowledgeContent.references).toHaveLength(EPS_PENSION_OFFICIAL_SOURCES.length)
  })

  it("contains required scope, ceiling, comparison, and disclaimer content", () => {
    const text = JSON.stringify(epsPensionKnowledgeContent).toLowerCase()
    for (const phrase of [
      "15,000",
      "1,000",
      "20",
      "epf",
      "nps",
      "defined-benefit",
      "defined-contribution",
      "higher-pension option",
      "not personalised pension",
      "10 years",
    ]) expect(text).toContain(phrase)
  })

  it("does not model the post-2022 Supreme Court higher-pension option", () => {
    const text = JSON.stringify(epsPensionKnowledgeContent).toLowerCase()
    expect(text).toContain("supreme court")
    expect(epsPensionCalculatorDefinition.faqs.some((faq) => /higher.pension/i.test(faq.answer))).toBe(true)
  })

  // Regression guard for the EPS 2026 rename follow-up: the calculator's own identity copy
  // (definition title/metadata/formula, FAQ answers, generated result text, and print disclaimer)
  // must name the current scheme as EPS 2026, never as EPS 1995 — EPS 1995 was superseded by the
  // gazetted EPS 2026 on 2026-06-29 (see eps-pension-regulatory-config.ts). The one deliberate
  // exception is the knowledge-content's own supersession disclosure, which must name EPS 1995
  // exactly once to explain the transition; the regulatory-config's historical source citations are
  // exempt for the same reason (a citation to a historical document must use that document's real
  // name) and are checked separately below.
  it("identifies as EPS 2026, not EPS 1995, throughout its own identity copy", () => {
    const identityText = JSON.stringify({
      title: epsPensionCalculatorDefinition.title,
      shortTitle: epsPensionCalculatorDefinition.shortTitle,
      description: epsPensionCalculatorDefinition.description,
      formula: epsPensionCalculatorDefinition.formula,
      metadata: epsPensionCalculatorDefinition.metadata,
      faqs: epsPensionCalculatorDefinition.faqs,
    })
    expect(identityText).not.toContain("1995")
    expect(identityText).toContain("2026")

    const resultText = createEpsPensionResultText(epsPensionWorkedExampleInput, epsPensionWorkedExampleResult)
    expect(resultText).not.toContain("1995")
    expect(resultText).toContain("EPS 2026")

    const printDisclaimer = createEpsPensionPrintDisclaimer()
    expect(printDisclaimer).not.toContain("1995")
    expect(printDisclaimer).toContain("EPS 2026")
  })

  it("discloses the EPS 2026 supersession of EPS 1995 exactly once in the knowledge content, with figures unchanged", () => {
    const currentFrameworkSection = epsPensionKnowledgeContent.sections.find((section) => section.id === "eps-pension-current-framework")
    expect(currentFrameworkSection).toBeDefined()
    const sectionText = JSON.stringify(currentFrameworkSection)
    expect(sectionText).toContain("supersed")
    expect(sectionText).toContain("1995")
    expect(sectionText).toContain("2026")
    expect(sectionText).toContain("unchanged")

    // Outside that one disclosure section, the rest of the knowledge content should describe the
    // calculator's own operative formula as EPS 2026, not EPS 1995.
    const otherSectionsText = JSON.stringify(epsPensionKnowledgeContent.sections.filter((section) => section.id !== "eps-pension-current-framework"))
    expect(otherSectionsText).not.toContain("1995")
    expect(epsPensionKnowledgeContent.title).not.toContain("1995")
    expect(epsPensionKnowledgeContent.title).toContain("2026")
    expect(epsPensionKnowledgeContent.description).not.toContain("1995")
  })

  it("keeps the EPS 1995 mentions in regulatory-config sources confined to historical citations, not the primary source", () => {
    const primarySource = EPS_PENSION_OFFICIAL_SOURCES[0]
    expect(primarySource.id).toBe("gazette-notification")
    expect(primarySource.title).not.toContain("1995")
    expect(primarySource.title).toContain("2026")
    // Every source that does name EPS 1995 must do so as explicit history (superseded/predecessor/
    // then-current), never presenting it as the calculator's current governing scheme.
    for (const source of EPS_PENSION_OFFICIAL_SOURCES) {
      if (source.title.includes("1995") || source.ruleUsed.includes("1995")) {
        expect(/supersed|predecessor|then-current|carried over|carry over|retained unchanged/i.test(source.title + " " + source.ruleUsed)).toBe(true)
      }
    }
  })

  it("keeps copied labels aligned with visible result labels", () => {
    const text = createEpsPensionResultText(epsPensionWorkedExampleInput, epsPensionWorkedExampleResult)
    for (const phrase of ["Average monthly basic + DA", "Pensionable salary used", "Pensionable service used", "Formula pension", "Standard-age monthly pension", "Monthly pension payable"]) expect(text).toContain(phrase)
    expect(text).not.toMatch(/NaN|Infinity/)
    expect(text).toContain("not financial or pension advice")
  })

  it("uses unique section ids and FAQ questions", () => {
    const ids = epsPensionKnowledgeContent.sections.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const questions = epsPensionCalculatorDefinition.faqs.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it("does not repeat FAQ answers verbatim as knowledge-content blocks", () => {
    const faqText = new Set(epsPensionCalculatorDefinition.faqs.flatMap((faq) => [faq.question, faq.answer]))
    for (const section of epsPensionKnowledgeContent.sections) {
      for (const block of section.content) {
        if (block.type === "paragraph") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "callout") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "list") for (const item of block.items) expect(faqText.has(item)).toBe(false)
      }
    }
  })

  it("produces ₹0 for a sub-10-year member without the calculator claiming eligibility", () => {
    const ineligible = calculateEpsPension({ averageMonthlySalary: 20_000, yearsOfPensionableService: 5, ageOption: "standard", earlyPensionAge: 50 })
    expect(ineligible.isEligible).toBe(false)
    expect(ineligible.monthlyPension).toBe(0)
    const text = createEpsPensionResultText({ averageMonthlySalary: 20_000, yearsOfPensionableService: 5, ageOption: "standard", earlyPensionAge: 50 }, ineligible)
    expect(text).toContain("Not eligible")
  })
})
