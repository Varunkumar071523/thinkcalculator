import { describe, expect, test } from "vitest"
import { calculateRD } from "@/features/calculators/rd/calculate-rd"

function expectClose(actual: number, expected: number, tolerance = 0.01) { expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance) }
const base = { monthlyDeposit: 5_000, annualInterestRate: 7, duration: 5, durationUnit: "years" as const, compoundingFrequency: "quarterly" as const }

describe("calculateRD", () => {
  test("calculates ₹5,000 monthly at 7% for 5 years quarterly", () => { const result = calculateRD(base); expectClose(result.maturityAmount, 359_663.954418); expectClose(result.interestEarned, 59_663.954418); expect(result.compoundingPeriodsPerYear).toBe(4) })
  test("handles zero interest", () => { const result = calculateRD({ ...base, annualInterestRate: 0 }); expect(result.maturityAmount).toBe(300_000); expect(result.interestEarned).toBe(0) })
  test.each([["monthly", 12], ["quarterly", 4], ["half-yearly", 2], ["yearly", 1]] as const)("supports %s compounding", (compoundingFrequency, periods) => { const result = calculateRD({ ...base, compoundingFrequency }); expect(result.compoundingPeriodsPerYear).toBe(periods); expect(result.maturityAmount).toBeGreaterThan(result.totalDeposited) })
  test("supports duration in months", () => { const result = calculateRD({ ...base, duration: 18, durationUnit: "months" }); expect(result.totalMonths).toBe(18); expect(result.durationInYears).toBe(1.5) })
  test("accepts the minimum deposit", () => { expect(calculateRD({ ...base, monthlyDeposit: 100 }).monthlyDeposit).toBe(100) })
  test("accepts the highest deposit and duration", () => { const result = calculateRD({ ...base, monthlyDeposit: 1_000_000, duration: 20 }); expect(result.totalMonths).toBe(240); expect(Number.isFinite(result.maturityAmount)).toBe(true) })
  test("rejects a negative deposit", () => { expect(() => calculateRD({ ...base, monthlyDeposit: -100 })).toThrow(RangeError) })
  test("rejects zero duration", () => { expect(() => calculateRD({ ...base, duration: 0 })).toThrow(RangeError) })
  test("rejects a rate above the maximum", () => { expect(() => calculateRD({ ...base, annualInterestRate: 20.01 })).toThrow(RangeError) })
  test("rejects non-finite inputs", () => { expect(() => calculateRD({ ...base, monthlyDeposit: Number.POSITIVE_INFINITY })).toThrow(RangeError); expect(() => calculateRD({ ...base, annualInterestRate: Number.NaN })).toThrow(RangeError) })
  test("total deposited equals monthly deposit times total months", () => { const result = calculateRD(base); expect(result.totalDeposited).toBe(result.monthlyDeposit * result.totalMonths) })
  test("later contributions earn less than earlier contributions", () => {
    const rate = 0.12; const monthlyDeposit = 1_000; const periods = 12
    const first = monthlyDeposit * Math.pow(1 + rate / periods, periods * (2 / 12))
    const second = monthlyDeposit * Math.pow(1 + rate / periods, periods * (1 / 12))
    expect(first - monthlyDeposit).toBeGreaterThan(second - monthlyDeposit)
    const result = calculateRD({ monthlyDeposit, annualInterestRate: 12, duration: 2, durationUnit: "months", compoundingFrequency: "monthly" })
    expectClose(result.maturityAmount, first + second, 0.000001)
  })
})
