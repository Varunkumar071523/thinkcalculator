import { describe, expect, it } from "vitest"

import { calculateIncomeTax } from "../engine"
import { getTaxRuleSet } from "../rules"
import type { TaxCalcInput } from "../types"
import { validateTaxCalcInput } from "../validation"

const ruleSet = getTaxRuleSet("2025-26")

describe("adversarial review regression — FIX 1: regime discriminant is enforced at runtime", () => {
  it("rejects the reviewer's exact POC input (regime: \"NEW\") with a validation error instead of silently succeeding", () => {
    // Reproduces the reviewer's POC verbatim: a regime string that is not
    // exactly \"old\" or \"new\", as would arrive from an `as TaxCalcInput`
    // cast past an untyped boundary (URL/form/JSON).
    const malformed = {
      regime: "NEW",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: { employerNpsSection80CCD2: 50_000 },
    } as unknown as TaxCalcInput

    const validation = validateTaxCalcInput(malformed, ruleSet)
    expect(validation.success).toBe(false)
    if (!validation.success) {
      expect(validation.errors.regime).toBeDefined()
    }
  })

  it("calculateIncomeTax throws RangeError for the same malformed regime instead of returning NaN", () => {
    const malformed = {
      regime: "NEW",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: { employerNpsSection80CCD2: 50_000 },
    } as unknown as TaxCalcInput

    expect(() => calculateIncomeTax(malformed, "2025-26")).toThrow(RangeError)
  })

  it.each(["old ", "New", "OLD", "", "both", null, undefined, 42])(
    "rejects other malformed regime values too: %j",
    (regime) => {
      const malformed = {
        regime,
        grossIncome: 1_000_000,
        ageBand: "below60",
        deductions: { employerNpsSection80CCD2: 50_000 },
      } as unknown as TaxCalcInput

      const validation = validateTaxCalcInput(malformed, ruleSet)
      expect(validation.success).toBe(false)
    },
  )

  it("still accepts the two literal valid regime values", () => {
    const old = validateTaxCalcInput(
      {
        regime: "old",
        grossIncome: 1_000_000,
        ageBand: "below60",
        deductions: { section80C: 0, section80D: 0, hraExemption: 0, homeLoanInterestSection24b: 0, otherSection80Deductions: 0 },
      },
      ruleSet,
    )
    const newRegime = validateTaxCalcInput(
      { regime: "new", grossIncome: 1_000_000, ageBand: "below60", deductions: { employerNpsSection80CCD2: 0 } },
      ruleSet,
    )
    expect(old.success).toBe(true)
    expect(newRegime.success).toBe(true)
  })
})

describe("adversarial review regression — FIX 2: previously-unbounded deduction fields now have a sanity ceiling", () => {
  it("rejects an absurd HRA exemption that dwarfs gross income (the reviewer's ₹50 crore on ₹10L POC)", () => {
    const input: TaxCalcInput = {
      regime: "old",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: {
        section80C: 0,
        section80D: 0,
        hraExemption: 500_000_000,
        homeLoanInterestSection24b: 0,
        otherSection80Deductions: 0,
      },
    }
    const validation = validateTaxCalcInput(input, ruleSet)
    expect(validation.success).toBe(false)
    if (!validation.success) expect(validation.errors.deductions?.hraExemption).toBeDefined()
  })

  it("accepts hraExemption exactly equal to gross income, rejects one rupee above", () => {
    const grossIncome = 1_000_000
    const base = { section80C: 0, section80D: 0, homeLoanInterestSection24b: 0, otherSection80Deductions: 0 }

    const atCap = validateTaxCalcInput(
      { regime: "old", grossIncome, ageBand: "below60", deductions: { ...base, hraExemption: grossIncome } },
      ruleSet,
    )
    expect(atCap.success).toBe(true)

    const overCap = validateTaxCalcInput(
      { regime: "old", grossIncome, ageBand: "below60", deductions: { ...base, hraExemption: grossIncome + 1 } },
      ruleSet,
    )
    expect(overCap.success).toBe(false)
  })

  it("accepts otherSection80Deductions exactly equal to gross income, rejects one rupee above", () => {
    const grossIncome = 500_000
    const base = { section80C: 0, section80D: 0, hraExemption: 0, homeLoanInterestSection24b: 0 }

    const atCap = validateTaxCalcInput(
      { regime: "old", grossIncome, ageBand: "below60", deductions: { ...base, otherSection80Deductions: grossIncome } },
      ruleSet,
    )
    expect(atCap.success).toBe(true)

    const overCap = validateTaxCalcInput(
      { regime: "old", grossIncome, ageBand: "below60", deductions: { ...base, otherSection80Deductions: grossIncome + 1 } },
      ruleSet,
    )
    expect(overCap.success).toBe(false)
  })

  it("accepts employerNpsSection80CCD2 exactly equal to gross income, rejects one rupee above (new regime)", () => {
    const grossIncome = 1_200_000

    const atCap = validateTaxCalcInput(
      { regime: "new", grossIncome, ageBand: "below60", deductions: { employerNpsSection80CCD2: grossIncome } },
      ruleSet,
    )
    expect(atCap.success).toBe(true)

    const overCap = validateTaxCalcInput(
      { regime: "new", grossIncome, ageBand: "below60", deductions: { employerNpsSection80CCD2: grossIncome + 1 } },
      ruleSet,
    )
    expect(overCap.success).toBe(false)
    if (!overCap.success) expect(overCap.errors.deductions?.employerNpsSection80CCD2).toBeDefined()
  })

  it("rejects an absurd employer NPS contribution that dwarfs gross income", () => {
    const input: TaxCalcInput = {
      regime: "new",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: { employerNpsSection80CCD2: 500_000_000 },
    }
    const validation = validateTaxCalcInput(input, ruleSet)
    expect(validation.success).toBe(false)
  })
})
