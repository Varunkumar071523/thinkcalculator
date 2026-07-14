import { describe, expect, it } from "vitest"

import { emiCalculatorDefinition, emiKnowledgeContent } from "@/features/calculators/emi"
import { fdCalculatorDefinition, fdKnowledgeContent } from "@/features/calculators/fd"
import { lumpsumCalculatorDefinition, lumpsumKnowledgeContent } from "@/features/calculators/lumpsum"
import { rdCalculatorDefinition, rdKnowledgeContent } from "@/features/calculators/rd"
import { sipCalculatorDefinition, sipKnowledgeContent } from "@/features/calculators/sip"
import { cagrCalculatorDefinition, cagrKnowledgeContent } from "@/features/calculators/cagr"
import { ppfCalculatorDefinition, ppfKnowledgeContent } from "@/features/calculators/ppf"
import { gstCalculatorDefinition, gstKnowledgeContent } from "@/features/calculators/gst"
import { gratuityCalculatorDefinition, gratuityKnowledgeContent } from "@/features/calculators/gratuity"
import { stepUpSIPCalculatorDefinition, stepUpSIPKnowledgeContent } from "@/features/calculators/step-up-sip"
import { swpCalculatorDefinition, swpKnowledgeContent } from "@/features/calculators/swp"

const productionRoutes = new Set(["/finance/emi-calculator", "/finance/sip-calculator", "/finance/step-up-sip-calculator", "/glossary/step-up-sip", "/finance/swp-calculator", "/glossary/swp", "/finance/lumpsum-calculator", "/finance/fd-calculator", "/finance/rd-calculator", "/finance/cagr-calculator", "/finance/ppf-calculator", "/business/gst-calculator", "/finance/gratuity-calculator", "/glossary/gratuity"])
const calculators = [
  { definition: emiCalculatorDefinition, content: emiKnowledgeContent },
  { definition: sipCalculatorDefinition, content: sipKnowledgeContent },
  { definition: lumpsumCalculatorDefinition, content: lumpsumKnowledgeContent },
  { definition: fdCalculatorDefinition, content: fdKnowledgeContent },
  { definition: rdCalculatorDefinition, content: rdKnowledgeContent },
  { definition: cagrCalculatorDefinition, content: cagrKnowledgeContent },
  { definition: ppfCalculatorDefinition, content: ppfKnowledgeContent },
  { definition: gstCalculatorDefinition, content: gstKnowledgeContent },
  { definition: gratuityCalculatorDefinition, content: gratuityKnowledgeContent },
  { definition: stepUpSIPCalculatorDefinition, content: stepUpSIPKnowledgeContent },
  { definition: swpCalculatorDefinition, content: swpKnowledgeContent },
]

describe("calculator knowledge content", () => {
  it("is present and structurally complete for every production calculator", () => {
    expect(calculators).toHaveLength(11)
    for (const { content } of calculators) {
      expect(content.title.trim()).not.toBe("")
      expect(content.description.trim()).not.toBe("")
      expect(content.sections.length).toBeGreaterThanOrEqual(9)
      const types = new Set(content.sections.map((section) => section.type))
      for (const required of ["input-guide", "how-it-works", "interpretation", "benefits", "limitations", "common-mistakes", "practical-tips", "comparison"]) expect(types.has(required as never)).toBe(true)
    }
  })

  it("has unique stable section ids and matching table-of-contents data", () => {
    for (const { content } of calculators) {
      const ids = content.sections.map((section) => section.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(content.sections.map(({ id, title }) => ({ id, title }))).toEqual(content.sections.map((section) => ({ id: section.id, title: section.title })))
      for (const section of content.sections) expect(section.title.trim()).not.toBe("")
    }
  })

  it("uses only populated blocks and valid comparison tables", () => {
    for (const { content } of calculators) for (const section of content.sections) for (const block of section.content) {
      if (block.type === "paragraph") expect(block.text.trim()).not.toBe("")
      if (block.type === "callout") { expect(block.title.trim()).not.toBe(""); expect(block.text.trim()).not.toBe("") }
      if (block.type === "list") { expect(block.items.length).toBeGreaterThan(0); for (const item of block.items) expect(item.trim()).not.toBe("") }
      if (block.type === "table") { expect(block.headers.length).toBeGreaterThan(1); expect(block.rows.length).toBeGreaterThan(0); for (const row of block.rows) expect(row).toHaveLength(block.headers.length) }
    }
  })

  it("links only to existing production calculator or learning routes", () => {
    for (const { content } of calculators) for (const link of content.relatedLinks) {
      expect(link.href).not.toBe("#")
      expect(productionRoutes.has(link.href)).toBe(true)
    }
  })

  it("does not repeat FAQ answers as knowledge blocks", () => {
    for (const { definition, content } of calculators) {
      const faqText = new Set(definition.faqs.flatMap((faq) => [faq.question, faq.answer]))
      for (const section of content.sections) for (const block of section.content) {
        if (block.type === "paragraph") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "callout") expect(faqText.has(block.text)).toBe(false)
        if (block.type === "list") for (const item of block.items) expect(faqText.has(item)).toBe(false)
      }
    }
  })
})
