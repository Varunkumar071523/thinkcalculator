import { describe, expect, it } from "vitest"
import { getGlossaryCalculatorBacklinks } from "@/features/content/glossary-backlinks"

describe("getGlossaryCalculatorBacklinks", () => {
  it("derives the reverse lookup from the same FAQ text the forward auto-linker matches, for the three wired calculators", () => {
    expect(getGlossaryCalculatorBacklinks("emi").map((link) => link.href)).toEqual(["/finance/emi-calculator"])
    expect(getGlossaryCalculatorBacklinks("principal").map((link) => link.href)).toEqual(["/finance/emi-calculator", "/finance/fd-calculator"])
    expect(getGlossaryCalculatorBacklinks("interest-rate").map((link) => link.href)).toEqual(["/finance/emi-calculator", "/finance/fd-calculator"])
    expect(getGlossaryCalculatorBacklinks("tenure").map((link) => link.href)).toEqual(["/finance/emi-calculator"])
    expect(getGlossaryCalculatorBacklinks("compounding").map((link) => link.href)).toEqual(["/finance/fd-calculator"])
  })

  it("returns nothing for a term never auto-linked on a wired calculator's FAQ page", () => {
    expect(getGlossaryCalculatorBacklinks("gratuity")).toEqual([])
    expect(getGlossaryCalculatorBacklinks("not-a-real-slug")).toEqual([])
  })

  it("does not attribute a backlink to RD, since no glossary term is matched in the RD FAQ text", () => {
    for (const slug of ["emi", "principal", "interest-rate", "tenure", "compounding", "sip", "cagr"]) {
      expect(getGlossaryCalculatorBacklinks(slug).map((link) => link.href)).not.toContain("/finance/rd-calculator")
    }
  })
})
