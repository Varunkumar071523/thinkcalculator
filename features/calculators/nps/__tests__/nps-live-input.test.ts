import { describe, expect, it } from "vitest"

import { calculateNPS } from "../calculate-nps"
import { toLiveInput } from "../nps-live-input"
import { validateNPSInput } from "../nps-schema"
import type { NPSFormValues } from "../nps-schema"
import { NPS_DEFAULT_INPUT } from "../nps-url-state"

const validText: NPSFormValues = {
  monthlyContribution: "10000",
  currentAge: "30",
  retirementAge: "60",
  equityAllocationPercent: "50",
  corporateDebtAllocationPercent: "30",
  equityExpectedReturn: "12",
  corporateDebtExpectedReturn: "8",
  govtSecuritiesExpectedReturn: "7",
}

function derivedGovtShare(equity: number, debt: number): number {
  return 100 - equity - debt
}

describe("NPS allocation-sum guarantee (equity + corporate debt + govt securities = 100%)", () => {
  it("sums to exactly 100% for a valid combination (50/30/20)", () => {
    const input = toLiveInput(validText)
    const govt = derivedGovtShare(input.equityAllocationPercent, input.corporateDebtAllocationPercent)
    expect(input.equityAllocationPercent + input.corporateDebtAllocationPercent + govt).toBe(100)
    expect(govt).toBe(20)
    expect(validateNPSInput(input).success).toBe(true)
  })

  it("clamps an attempted invalid combination (equity 90 + debt 50 = 140%) back to a valid 100% split", () => {
    // This is the "clamp" half of the paired-number-slider-input pattern (matching
    // retirement-calculator.tsx's age-ordering nudge): the field the user is actively editing
    // (equity, here left at 90) keeps their typed value; the other stored field (corporate debt)
    // is pulled down to whatever room is left, rather than proportionally rescaling both. See
    // nps-live-input.ts's doc comment for why this is a clamp, not a "rebalance three sliders"
    // operation — government securities is never a stored field to rebalance in the first place.
    const input = toLiveInput({ ...validText, equityAllocationPercent: "90", corporateDebtAllocationPercent: "50" })
    expect(input.equityAllocationPercent).toBe(90)
    expect(input.corporateDebtAllocationPercent).toBe(10)
    const govt = derivedGovtShare(input.equityAllocationPercent, input.corporateDebtAllocationPercent)
    expect(govt).toBe(0)
    expect(input.equityAllocationPercent + input.corporateDebtAllocationPercent + govt).toBe(100)
    expect(validateNPSInput(input).success).toBe(true)
  })

  it("demonstrates the clamp is order-sensitive by design: editing corporate debt past the remaining room clamps debt, not equity", () => {
    const input = toLiveInput({ ...validText, equityAllocationPercent: "70", corporateDebtAllocationPercent: "80" })
    expect(input.equityAllocationPercent).toBe(70)
    expect(input.corporateDebtAllocationPercent).toBe(30)
    expect(input.equityAllocationPercent + input.corporateDebtAllocationPercent).toBe(100)
  })

  it("still sums to 100% when equity alone is pushed past 100 in raw text (clamped to its own 0-100 range first)", () => {
    const input = toLiveInput({ ...validText, equityAllocationPercent: "150", corporateDebtAllocationPercent: "10" })
    expect(input.equityAllocationPercent).toBe(100)
    expect(input.corporateDebtAllocationPercent).toBe(0)
    expect(derivedGovtShare(input.equityAllocationPercent, input.corporateDebtAllocationPercent)).toBe(0)
  })

  it("never lets the donut/growth-line render an invalid, non-100% allocation: calculateNPS always sees a valid, 100%-summing input", () => {
    const attempts: readonly Partial<NPSFormValues>[] = [
      { equityAllocationPercent: "90", corporateDebtAllocationPercent: "50" },
      { equityAllocationPercent: "200", corporateDebtAllocationPercent: "200" },
      { equityAllocationPercent: "-10", corporateDebtAllocationPercent: "-10" },
      { equityAllocationPercent: "", corporateDebtAllocationPercent: "" },
    ]
    for (const overrides of attempts) {
      const input = toLiveInput({ ...validText, ...overrides })
      expect(validateNPSInput(input).success, `toLiveInput(${JSON.stringify(overrides)}) => ${JSON.stringify(input)} was not valid`).toBe(true)
      const result = calculateNPS(input)
      expect(result.equityAllocationPercent + result.corporateDebtAllocationPercent + result.govtSecuritiesAllocationPercent).toBe(100)
    }
  })
})

describe("NPS toLiveInput defensive clamping at slider extremes", () => {
  it("falls back to the default for empty, NaN, or malformed text on every field", () => {
    for (const field of Object.keys(validText) as (keyof NPSFormValues)[]) {
      for (const malformed of ["", "abc", "NaN", "Infinity", "-1e10"]) {
        const input = toLiveInput({ ...validText, [field]: malformed })
        expect(Number.isFinite(input[field]), `${field}="${malformed}" produced a non-finite live value`).toBe(true)
      }
    }
  })

  it("handles zero contribution at the slider minimum without producing NaN", () => {
    const input = toLiveInput({ ...validText, monthlyContribution: "0" })
    expect(input.monthlyContribution).toBe(0)
    expect(validateNPSInput(input).success).toBe(true)
    const result = calculateNPS(input)
    expect(result.corpusAtRetirement).toBe(0)
    expect(result.totalContributions).toBe(0)
  })

  it("handles the minimum tenure by nudging retirement age to exactly one year after current age", () => {
    const equalAges = toLiveInput({ ...validText, currentAge: "65", retirementAge: "65" })
    expect(equalAges.currentAge).toBe(65)
    expect(equalAges.retirementAge).toBe(66)
    expect(validateNPSInput(equalAges).success).toBe(true)
    expect(calculateNPS(equalAges).schedule).toHaveLength(1)
  })

  it("handles the maximum tenure (age span) without overflowing the retirement-age ceiling", () => {
    const input = toLiveInput({ ...validText, currentAge: "18", retirementAge: "75" })
    expect(input).toMatchObject({ currentAge: 18, retirementAge: 75 })
    expect(validateNPSInput(input).success).toBe(true)
    const result = calculateNPS(input)
    expect(result.schedule).toHaveLength(57)
    expect(Number.isFinite(result.corpusAtRetirement)).toBe(true)
  })

  it("never nudges retirement age past its own maximum even when current age is already at the maximum", () => {
    const input = toLiveInput({ ...validText, currentAge: "65", retirementAge: "999" })
    expect(input.currentAge).toBe(65)
    expect(input.retirementAge).toBe(75)
  })

  it("handles 100% single-asset-class allocation (equity) reached via live clamping, not just a pre-validated input", () => {
    const input = toLiveInput({ ...validText, equityAllocationPercent: "100", corporateDebtAllocationPercent: "0" })
    expect(input.equityAllocationPercent).toBe(100)
    expect(input.corporateDebtAllocationPercent).toBe(0)
    const result = calculateNPS(input)
    expect(result.govtSecuritiesAllocationPercent).toBe(0)
    expect(result.blendedAnnualReturn).toBeCloseTo(input.equityExpectedReturn, 10)
    expect(Number.isFinite(result.corpusAtRetirement)).toBe(true)
  })

  it("handles 100% single-asset-class allocation (govt securities) reached via live clamping", () => {
    const input = toLiveInput({ ...validText, equityAllocationPercent: "0", corporateDebtAllocationPercent: "0" })
    const result = calculateNPS(input)
    expect(result.govtSecuritiesAllocationPercent).toBe(100)
    expect(result.blendedAnnualReturn).toBeCloseTo(input.govtSecuritiesExpectedReturn, 10)
  })

  it("always produces a fully valid, calculable input regardless of raw text extremes (the core defensive-clamp guarantee)", () => {
    const extremeCombinations: readonly Partial<NPSFormValues>[] = [
      { monthlyContribution: "-1", equityExpectedReturn: "-1", corporateDebtExpectedReturn: "-1", govtSecuritiesExpectedReturn: "-1" },
      { monthlyContribution: "1e20", equityExpectedReturn: "1000", corporateDebtExpectedReturn: "1000", govtSecuritiesExpectedReturn: "1000" },
      { currentAge: "0", retirementAge: "0" },
      { currentAge: "200", retirementAge: "1" },
      { equityAllocationPercent: "1000", corporateDebtAllocationPercent: "1000" },
      { monthlyContribution: "", currentAge: "", retirementAge: "", equityAllocationPercent: "", corporateDebtAllocationPercent: "", equityExpectedReturn: "", corporateDebtExpectedReturn: "", govtSecuritiesExpectedReturn: "" },
    ]
    for (const overrides of extremeCombinations) {
      const input = toLiveInput({ ...validText, ...overrides })
      const validation = validateNPSInput(input)
      expect(validation.success, `toLiveInput(${JSON.stringify(overrides)}) => ${JSON.stringify(input)} failed validation`).toBe(true)
      expect(() => calculateNPS(input)).not.toThrow()
    }
  })

  it("falls back to NPS_DEFAULT_INPUT's values when every field is malformed", () => {
    const input = toLiveInput({ monthlyContribution: "x", currentAge: "x", retirementAge: "x", equityAllocationPercent: "x", corporateDebtAllocationPercent: "x", equityExpectedReturn: "x", corporateDebtExpectedReturn: "x", govtSecuritiesExpectedReturn: "x" })
    expect(input).toEqual(NPS_DEFAULT_INPUT)
  })
})
