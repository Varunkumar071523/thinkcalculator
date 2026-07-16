import { describe, expect, it } from "vitest"

import { calculateIncomeTax } from "../engine"
import type { NewRegimeDeductionInput, OldRegimeDeductionInput, TaxCalcInput } from "../types"

const zeroOldDeductions: OldRegimeDeductionInput = {
  section80C: 0,
  section80D: 0,
  hraExemption: 0,
  homeLoanInterestSection24b: 0,
  otherSection80Deductions: 0,
}

const zeroNewDeductions: NewRegimeDeductionInput = { employerNpsSection80CCD2: 0 }

describe("calculateIncomeTax — FY 2025-26 worked-example regressions", () => {
  it("₹12.75L salaried, new regime: zero tax after standard deduction + Section 87A rebate", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: 1_275_000, ageBand: "below60", deductions: zeroNewDeductions }
    const result = calculateIncomeTax(input, "2025-26")
    expect(result.taxableIncome).toBe(1_200_000)
    expect(result.taxBeforeRebate).toBe(60_000)
    expect(result.rebate87A.rebateAmount).toBe(60_000)
    expect(result.totalTaxLiability).toBe(0)
  })

  it("₹15L salaried, new regime: ₹97,500 total tax liability", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: zeroNewDeductions }
    const result = calculateIncomeTax(input, "2025-26")
    expect(result.taxableIncome).toBe(1_425_000)
    expect(result.taxBeforeRebate).toBeCloseTo(93_750, 6)
    expect(result.rebate87A.rebateAmount).toBe(0)
    expect(result.cess).toBeCloseTo(3_750, 6)
    expect(result.totalTaxLiability).toBeCloseTo(97_500, 6)
  })

  it("₹10,50,000 salaried, old regime, below 60: ₹1,06,600 total tax liability", () => {
    const input: TaxCalcInput = { regime: "old", grossIncome: 1_000_000, ageBand: "below60", deductions: zeroOldDeductions }
    const result = calculateIncomeTax(input, "2025-26")
    expect(result.taxableIncome).toBe(950_000)
    expect(result.taxBeforeRebate).toBeCloseTo(102_500, 6)
    expect(result.totalTaxLiability).toBeCloseTo(106_600, 6)
  })

  it("very high income (₹6Cr taxable), new vs old regime surcharge diverge as expected", () => {
    const newResult = calculateIncomeTax(
      { regime: "new", grossIncome: 60_075_000, ageBand: "below60", deductions: zeroNewDeductions },
      "2025-26",
    )
    const oldResult = calculateIncomeTax(
      { regime: "old", grossIncome: 60_050_000, ageBand: "below60", deductions: zeroOldDeductions },
      "2025-26",
    )
    expect(newResult.taxableIncome).toBe(60_000_000)
    expect(oldResult.taxableIncome).toBe(60_000_000)
    expect(newResult.surcharge.rate).toBeCloseTo(0.25, 6)
    expect(oldResult.surcharge.rate).toBeCloseTo(0.37, 6)
    expect(newResult.totalTaxLiability).toBeCloseTo(22_854_000, 0)
    expect(oldResult.totalTaxLiability).toBeCloseTo(25_379_250, 0)
    expect(newResult.totalTaxLiability).toBeLessThan(oldResult.totalTaxLiability)
  })
})

describe("calculateIncomeTax — edge cases", () => {
  it("zero income produces zero tax liability in both regimes", () => {
    const newResult = calculateIncomeTax({ regime: "new", grossIncome: 0, ageBand: "below60", deductions: zeroNewDeductions }, "2025-26")
    const oldResult = calculateIncomeTax({ regime: "old", grossIncome: 0, ageBand: "below60", deductions: zeroOldDeductions }, "2025-26")
    expect(newResult.totalTaxLiability).toBe(0)
    expect(oldResult.totalTaxLiability).toBe(0)
    expect(newResult.taxableIncome).toBe(0)
    expect(oldResult.taxableIncome).toBe(0)
  })

  it("deductions exceeding gross income floor taxable income at zero instead of going negative", () => {
    const input: TaxCalcInput = {
      regime: "old",
      grossIncome: 200_000,
      ageBand: "below60",
      // otherSection80Deductions is capped at grossIncome (see FIX 2 in the
      // adversarial-review-regressions suite), so the combined total here
      // (standard deduction + 80C + other) still exceeds gross income
      // without any single field exceeding its own bound.
      deductions: { ...zeroOldDeductions, section80C: 150_000, otherSection80Deductions: 200_000 },
    }
    const result = calculateIncomeTax(input, "2025-26")
    expect(result.taxableIncome).toBe(0)
    expect(result.totalTaxLiability).toBe(0)
  })

  it("income exactly at every old-regime slab boundary produces a finite, non-negative result for each age band", () => {
    const boundaries = [250_000, 300_000, 500_000, 1_000_000]
    for (const ageBand of ["below60", "60to80", "80plus"] as const) {
      for (const boundary of boundaries) {
        const result = calculateIncomeTax(
          { regime: "old", grossIncome: boundary + 50_000, ageBand, deductions: zeroOldDeductions },
          "2025-26",
        )
        expect(Number.isFinite(result.totalTaxLiability)).toBe(true)
        expect(result.totalTaxLiability).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("does not mutate its input", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: zeroNewDeductions }
    const before = JSON.parse(JSON.stringify(input))
    calculateIncomeTax(input, "2025-26")
    expect(input).toEqual(before)
  })

  it("throws for an invalid financial year", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: 1_000_000, ageBand: "below60", deductions: zeroNewDeductions }
    expect(() => calculateIncomeTax(input, "1999-00")).toThrow(RangeError)
  })

  it("throws for invalid input (negative income)", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: -100, ageBand: "below60", deductions: zeroNewDeductions }
    expect(() => calculateIncomeTax(input, "2025-26")).toThrow(RangeError)
  })

  it("throws when old-regime deductions exceed their statutory caps", () => {
    const input: TaxCalcInput = {
      regime: "old",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: { ...zeroOldDeductions, section80C: 200_000 },
    }
    expect(() => calculateIncomeTax(input, "2025-26")).toThrow(RangeError)
  })
})

describe("calculateIncomeTax — slab breakdown", () => {
  it("reports one row per slab actually reached, summing to the pre-rebate tax", () => {
    const input: TaxCalcInput = { regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: zeroNewDeductions }
    const result = calculateIncomeTax(input, "2025-26")
    const summedTax = result.slabBreakdown.reduce((sum, row) => sum + row.taxAtThisSlab, 0)
    expect(summedTax).toBeCloseTo(result.taxBeforeRebate, 6)
    expect(result.slabBreakdown.every((row) => row.taxableAmountInSlab >= 0)).toBe(true)
  })
})
