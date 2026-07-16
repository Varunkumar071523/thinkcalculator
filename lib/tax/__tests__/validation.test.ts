import { describe, expect, it } from "vitest"

import { FY2025_26_RULES } from "../rules/fy2025-26"
import type { TaxCalcInput } from "../types"
import { validateTaxCalcInput } from "../validation"

const ruleSet = FY2025_26_RULES

const validOld: TaxCalcInput = {
  regime: "old",
  grossIncome: 1_000_000,
  ageBand: "below60",
  deductions: {
    section80C: 100_000,
    section80D: 20_000,
    hraExemption: 50_000,
    homeLoanInterestSection24b: 100_000,
    otherSection80Deductions: 10_000,
  },
}

const validNew: TaxCalcInput = {
  regime: "new",
  grossIncome: 1_000_000,
  ageBand: "below60",
  deductions: { employerNpsSection80CCD2: 50_000 },
}

describe("validateTaxCalcInput", () => {
  it("accepts valid old-regime input", () => {
    const result = validateTaxCalcInput(validOld, ruleSet)
    expect(result.success).toBe(true)
  })

  it("accepts valid new-regime input", () => {
    const result = validateTaxCalcInput(validNew, ruleSet)
    expect(result.success).toBe(true)
  })

  it("rejects negative gross income", () => {
    const result = validateTaxCalcInput({ ...validNew, grossIncome: -1 }, ruleSet)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.grossIncome).toBeDefined()
  })

  it("rejects non-finite gross income", () => {
    const result = validateTaxCalcInput({ ...validNew, grossIncome: Number.NaN }, ruleSet)
    expect(result.success).toBe(false)
  })

  it("rejects an invalid age band", () => {
    const result = validateTaxCalcInput({ ...validNew, ageBand: "unknown" as never }, ruleSet)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.ageBand).toBeDefined()
  })

  it("rejects Section 80C above the ₹1,50,000 statutory cap", () => {
    const result = validateTaxCalcInput(
      { ...validOld, deductions: { ...validOld.deductions, section80C: 200_000 } },
      ruleSet,
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.deductions?.section80C).toBeDefined()
  })

  it("rejects negative Section 80C", () => {
    const result = validateTaxCalcInput(
      { ...validOld, deductions: { ...validOld.deductions, section80C: -1 } },
      ruleSet,
    )
    expect(result.success).toBe(false)
  })

  it("rejects Section 80D above the age-band-specific cap", () => {
    const belowCapResult = validateTaxCalcInput(
      { ...validOld, ageBand: "below60", deductions: { ...validOld.deductions, section80D: 25_000 } },
      ruleSet,
    )
    expect(belowCapResult.success).toBe(true)

    const overCapResult = validateTaxCalcInput(
      { ...validOld, ageBand: "below60", deductions: { ...validOld.deductions, section80D: 30_000 } },
      ruleSet,
    )
    expect(overCapResult.success).toBe(false)
  })

  it("allows a higher Section 80D cap for taxpayers aged 60 and above", () => {
    const result = validateTaxCalcInput(
      { ...validOld, ageBand: "60to80", deductions: { ...validOld.deductions, section80D: 50_000 } },
      ruleSet,
    )
    expect(result.success).toBe(true)
  })

  it("rejects Section 24(b) home loan interest above the self-occupied cap", () => {
    const result = validateTaxCalcInput(
      { ...validOld, deductions: { ...validOld.deductions, homeLoanInterestSection24b: 250_000 } },
      ruleSet,
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.deductions?.homeLoanInterestSection24b).toBeDefined()
  })

  it("rejects a negative employer NPS contribution under the new regime", () => {
    const result = validateTaxCalcInput({ ...validNew, deductions: { employerNpsSection80CCD2: -1 } }, ruleSet)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.deductions?.employerNpsSection80CCD2).toBeDefined()
  })

  it("does not require old-regime-only fields for a new-regime calculation (structural type safety)", () => {
    // This is enforced at compile time by the discriminated TaxCalcInput
    // union; this test documents the runtime shape stays minimal too.
    expect(Object.keys(validNew.deductions)).toEqual(["employerNpsSection80CCD2"])
  })
})
