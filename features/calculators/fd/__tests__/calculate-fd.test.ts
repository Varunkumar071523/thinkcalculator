import { describe, expect, test } from "vitest"

import { calculateFD } from "@/features/calculators/fd/calculate-fd"

function expectClose(actual: number, expected: number, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("calculateFD", () => {
  test("calculates ₹1,00,000 at 7% for 5 years with quarterly compounding", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })
    expectClose(result.maturityAmount, 141_477.82)
    expectClose(result.interestEarned, 41_477.82)
    expect(result.compoundingPeriodsPerYear).toBe(4)
  })

  test("handles a zero-interest FD", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 0, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })
    expect(result.maturityAmount).toBe(100_000)
    expect(result.interestEarned).toBe(0)
  })

  test("supports monthly compounding", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 1, durationUnit: "years", compoundingFrequency: "monthly" })
    expect(result.compoundingPeriodsPerYear).toBe(12)
    expect(result.maturityAmount).toBeGreaterThan(100_000)
  })

  test("supports quarterly compounding", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 1, durationUnit: "years", compoundingFrequency: "quarterly" })
    expect(result.compoundingPeriodsPerYear).toBe(4)
  })

  test("supports half-yearly compounding", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 1, durationUnit: "years", compoundingFrequency: "half-yearly" })
    expect(result.compoundingPeriodsPerYear).toBe(2)
  })

  test("supports yearly compounding", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 1, durationUnit: "years", compoundingFrequency: "yearly" })
    expect(result.compoundingPeriodsPerYear).toBe(1)
    expectClose(result.maturityAmount, 107_000)
  })

  test("converts duration supplied in months", () => {
    const result = calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 18, durationUnit: "months", compoundingFrequency: "quarterly" })
    expect(result.durationInYears).toBe(1.5)
    expect(result.totalMonths).toBe(18)
  })

  test("calculates the minimum valid deposit", () => {
    const result = calculateFD({ principalAmount: 1_000, annualInterestRate: 5, duration: 1, durationUnit: "years", compoundingFrequency: "yearly" })
    expect(result.principalAmount).toBe(1_000)
    expect(result.maturityAmount).toBeGreaterThan(result.principalAmount)
  })

  test("rejects a negative deposit", () => {
    expect(() => calculateFD({ principalAmount: -1_000, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })).toThrow(RangeError)
  })

  test("rejects zero duration", () => {
    expect(() => calculateFD({ principalAmount: 100_000, annualInterestRate: 7, duration: 0, durationUnit: "years", compoundingFrequency: "quarterly" })).toThrow(RangeError)
  })

  test("rejects a rate above the maximum", () => {
    expect(() => calculateFD({ principalAmount: 100_000, annualInterestRate: 21, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })).toThrow(RangeError)
  })

  test("rejects non-finite inputs", () => {
    expect(() => calculateFD({ principalAmount: Number.POSITIVE_INFINITY, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })).toThrow(RangeError)
    expect(() => calculateFD({ principalAmount: 100_000, annualInterestRate: Number.NaN, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })).toThrow(RangeError)
  })
})
