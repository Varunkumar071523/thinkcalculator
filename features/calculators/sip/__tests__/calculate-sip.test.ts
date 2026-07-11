import { describe, expect, test } from "vitest"

import { calculateSIP } from "@/features/calculators/sip/calculate-sip"

function expectClose(actual: number, expected: number, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("calculateSIP", () => {
  test("calculates ₹10,000 monthly at 12% for 10 years", () => {
    const result = calculateSIP({ monthlyInvestment: 10_000, annualReturnRate: 12, duration: 10, durationUnit: "years" })
    expectClose(result.futureValue, 2_323_390.76)
    expectClose(result.estimatedReturns, 1_123_390.76)
    expect(result.totalInvested).toBe(1_200_000)
  })

  test("handles a zero-return SIP", () => {
    const result = calculateSIP({ monthlyInvestment: 10_000, annualReturnRate: 0, duration: 12, durationUnit: "months" })
    expect(result.futureValue).toBe(120_000)
    expect(result.estimatedReturns).toBe(0)
  })

  test("converts duration supplied in years", () => {
    const result = calculateSIP({ monthlyInvestment: 1_000, annualReturnRate: 10, duration: 2, durationUnit: "years" })
    expect(result.totalMonths).toBe(24)
  })

  test("uses duration supplied in months", () => {
    const result = calculateSIP({ monthlyInvestment: 1_000, annualReturnRate: 10, duration: 24, durationUnit: "months" })
    expect(result.totalMonths).toBe(24)
  })

  test("calculates the minimum valid monthly contribution", () => {
    const result = calculateSIP({ monthlyInvestment: 500, annualReturnRate: 5, duration: 1, durationUnit: "years" })
    expect(result.monthlyInvestment).toBe(500)
    expect(result.futureValue).toBeGreaterThan(result.totalInvested)
  })

  test("calculates a high valid contribution and duration", () => {
    const result = calculateSIP({ monthlyInvestment: 10_000_000, annualReturnRate: 50, duration: 50, durationUnit: "years" })
    expect(Number.isFinite(result.futureValue)).toBe(true)
    expect(Number.isFinite(result.estimatedReturns)).toBe(true)
  })

  test("rejects a negative monthly contribution", () => {
    expect(() => calculateSIP({ monthlyInvestment: -500, annualReturnRate: 12, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects zero duration", () => {
    expect(() => calculateSIP({ monthlyInvestment: 10_000, annualReturnRate: 12, duration: 0, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects a return rate above the maximum", () => {
    expect(() => calculateSIP({ monthlyInvestment: 10_000, annualReturnRate: 51, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })

  test("rejects non-finite inputs", () => {
    expect(() => calculateSIP({ monthlyInvestment: Number.POSITIVE_INFINITY, annualReturnRate: 12, duration: 10, durationUnit: "years" })).toThrow(RangeError)
    expect(() => calculateSIP({ monthlyInvestment: 10_000, annualReturnRate: Number.NaN, duration: 10, durationUnit: "years" })).toThrow(RangeError)
  })
})
