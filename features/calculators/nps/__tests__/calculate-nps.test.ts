import { describe, expect, it } from "vitest"

import { calculateNPS, computeBlendedAnnualReturn } from "../calculate-nps"
import type { NPSInput } from "../nps-types"

const base: NPSInput = {
  monthlyContribution: 10_000,
  currentAge: 30,
  retirementAge: 60,
  equityAllocationPercent: 50,
  corporateDebtAllocationPercent: 30,
  equityExpectedReturn: 12,
  corporateDebtExpectedReturn: 8,
  govtSecuritiesExpectedReturn: 7,
}

describe("computeBlendedAnnualReturn", () => {
  it("weights each asset class's return by its allocation share, with govt securities as the remainder", () => {
    // 0.5*12 + 0.3*8 + 0.2*7 = 6 + 2.4 + 1.4 = 9.8
    expect(computeBlendedAnnualReturn(base)).toBeCloseTo(9.8, 10)
  })

  it("equals the equity return exactly when 100% is allocated to equity", () => {
    const input = { ...base, equityAllocationPercent: 100, corporateDebtAllocationPercent: 0 }
    expect(computeBlendedAnnualReturn(input)).toBeCloseTo(input.equityExpectedReturn, 10)
  })

  it("equals the govt securities return exactly when equity and debt are both 0%", () => {
    const input = { ...base, equityAllocationPercent: 0, corporateDebtAllocationPercent: 0 }
    expect(computeBlendedAnnualReturn(input)).toBeCloseTo(input.govtSecuritiesExpectedReturn, 10)
  })
})

describe("calculateNPS", () => {
  it("derives government securities allocation as the remainder of the 100% split", () => {
    const result = calculateNPS(base)
    expect(result.govtSecuritiesAllocationPercent).toBeCloseTo(20, 10)
    expect(result.equityAllocationPercent + result.corporateDebtAllocationPercent + result.govtSecuritiesAllocationPercent).toBeCloseTo(100, 10)
  })

  it("produces one schedule row per year, ending at retirement age", () => {
    const result = calculateNPS(base)
    expect(result.schedule).toHaveLength(30)
    expect(result.schedule[0]).toMatchObject({ year: 1, age: 31 })
    expect(result.schedule[29]).toMatchObject({ year: 30, age: 60 })
  })

  it("reconciles: contributions + growth exactly equal the corpus at retirement", () => {
    const result = calculateNPS(base)
    expect(result.corpusAtRetirement).toBeCloseTo(result.totalContributions + result.totalGrowth, 6)
    expect(result.totalContributions).toBeCloseTo(base.monthlyContribution * 30 * 12, 6)
  })

  it("handles a single-year tenure (retirement age one year after current age)", () => {
    const result = calculateNPS({ ...base, currentAge: 59, retirementAge: 60 })
    expect(result.schedule).toHaveLength(1)
    expect(result.schedule[0].year).toBe(1)
    expect(result.schedule[0].age).toBe(60)
    expect(result.corpusAtRetirement).toBeGreaterThan(0)
  })

  it("produces a zero corpus when the monthly contribution is zero", () => {
    const result = calculateNPS({ ...base, monthlyContribution: 0 })
    expect(result.corpusAtRetirement).toBe(0)
    expect(result.totalContributions).toBe(0)
    expect(result.totalGrowth).toBe(0)
  })

  it("handles 100% allocation to one asset class (equity) without dropping the other two", () => {
    const result = calculateNPS({ ...base, equityAllocationPercent: 100, corporateDebtAllocationPercent: 0 })
    expect(result.equityAllocationPercent).toBe(100)
    expect(result.corporateDebtAllocationPercent).toBe(0)
    expect(result.govtSecuritiesAllocationPercent).toBe(0)
    expect(result.blendedAnnualReturn).toBeCloseTo(base.equityExpectedReturn, 10)
    expect(Number.isFinite(result.corpusAtRetirement)).toBe(true)
  })

  it("handles 100% allocation to government securities without dropping the other two", () => {
    const result = calculateNPS({ ...base, equityAllocationPercent: 0, corporateDebtAllocationPercent: 0 })
    expect(result.govtSecuritiesAllocationPercent).toBe(100)
    expect(result.blendedAnnualReturn).toBeCloseTo(base.govtSecuritiesExpectedReturn, 10)
  })

  it("earns no growth when every expected return is zero", () => {
    const result = calculateNPS({ ...base, equityExpectedReturn: 0, corporateDebtExpectedReturn: 0, govtSecuritiesExpectedReturn: 0 })
    expect(result.totalGrowth).toBe(0)
    expect(result.corpusAtRetirement).toBeCloseTo(result.totalContributions, 6)
  })

  it("stays finite at the contribution, return, and tenure extremes (defensive clamp coverage)", () => {
    const result = calculateNPS({
      monthlyContribution: 1_000_000,
      currentAge: 18,
      retirementAge: 75,
      equityAllocationPercent: 100,
      corporateDebtAllocationPercent: 0,
      equityExpectedReturn: 20,
      corporateDebtExpectedReturn: 12,
      govtSecuritiesExpectedReturn: 10,
    })
    expect(Number.isFinite(result.corpusAtRetirement)).toBe(true)
    expect(result.schedule.every((row) => Number.isFinite(row.yearEndBalance))).toBe(true)
  })

  it("throws on invalid input", () => {
    expect(() => calculateNPS({ ...base, retirementAge: base.currentAge })).toThrow(RangeError)
    expect(() => calculateNPS({ ...base, equityAllocationPercent: 80, corporateDebtAllocationPercent: 40 })).toThrow(RangeError)
  })
})
