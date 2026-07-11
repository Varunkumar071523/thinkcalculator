import { describe, expect, test } from "vitest"

import { calculateLumpsum } from "@/features/calculators/lumpsum/calculate-lumpsum"

function expectClose(actual: number, expected: number, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("calculateLumpsum", () => {
  test("calculates ₹1,00,000 at 12% for 10 years", () => {
    const result = calculateLumpsum({ initialInvestment: 100_000, annualReturnRate: 12, duration: 10, durationUnit: "years" })
    expectClose(result.futureValue, 310_584.82)
    expectClose(result.estimatedReturns, 210_584.82)
    expect(result.totalMonths).toBe(120)
  })

  test("handles a zero-return investment", () => {
    const result = calculateLumpsum({ initialInvestment: 100_000, annualReturnRate: 0, duration: 10, durationUnit: "years" })
    expect(result.futureValue).toBe(100_000)
    expect(result.estimatedReturns).toBe(0)
  })

  test("uses duration supplied in years", () => {
    const result = calculateLumpsum({ initialInvestment: 10_000, annualReturnRate: 10, duration: 2, durationUnit: "years" })
    expect(result.durationInYears).toBe(2)
    expect(result.totalMonths).toBe(24)
  })

  test("converts duration supplied in months into fractional years", () => {
    const result = calculateLumpsum({ initialInvestment: 10_000, annualReturnRate: 10, duration: 18, durationUnit: "months" })
    expect(result.durationInYears).toBe(1.5)
    expect(result.totalMonths).toBe(18)
  })

  test("calculates the minimum valid investment", () => {
    const result = calculateLumpsum({ initialInvestment: 1_000, annualReturnRate: 5, duration: 1, durationUnit: "years" })
    expect(result.initialInvestment).toBe(1_000)
    expect(result.futureValue).toBeGreaterThan(result.initialInvestment)
  })

  test("calculates a high valid investment and duration", () => {
    const result = calculateLumpsum({ initialInvestment: 100_000_000, annualReturnRate: 50, duration: 50, durationUnit: "years" })
    expect(Number.isFinite(result.futureValue)).toBe(true)
    expect(Number.isFinite(result.estimatedReturns)).toBe(true)
  })

  test("rejects a negative investment", () => {
    expect(() => calculateLumpsum({ initialInvestment: -1_000, annualReturnRate: 12, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects zero duration", () => {
    expect(() => calculateLumpsum({ initialInvestment: 100_000, annualReturnRate: 12, duration: 0, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects a return rate above the maximum", () => {
    expect(() => calculateLumpsum({ initialInvestment: 100_000, annualReturnRate: 51, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects non-finite inputs", () => {
    expect(() => calculateLumpsum({ initialInvestment: Number.POSITIVE_INFINITY, annualReturnRate: 12, duration: 10, durationUnit: "years" })).toThrow(RangeError)
    expect(() => calculateLumpsum({ initialInvestment: 100_000, annualReturnRate: Number.NaN, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })
})
