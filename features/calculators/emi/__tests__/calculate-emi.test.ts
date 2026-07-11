import { describe, expect, test } from "vitest"

import { calculateEMI } from "@/features/calculators/emi/calculate-emi"

function assertClose(actual: number, expected: number, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("calculateEMI", () => {
test("calculates the standard home-loan example", () => {
  const result = calculateEMI({ principalAmount: 2_500_000, annualInterestRate: 8.5, tenure: 20, tenureUnit: "years" })
  assertClose(result.monthlyEMI, 21695.58)
  assertClose(result.totalInterest, 2706939.4)
  expect(result.totalMonths).toBe(240)
})

test("handles a zero-interest loan", () => {
  const result = calculateEMI({ principalAmount: 120_000, annualInterestRate: 0, tenure: 12, tenureUnit: "months" })
  expect(result.monthlyEMI).toBe(10_000)
  expect(result.totalInterest).toBe(0)
  expect(result.totalPayment).toBe(120_000)
})

test("converts tenure supplied in years", () => {
  const result = calculateEMI({ principalAmount: 500_000, annualInterestRate: 10, tenure: 2, tenureUnit: "years" })
  expect(result.totalMonths).toBe(24)
})

test("uses tenure supplied in months", () => {
  const result = calculateEMI({ principalAmount: 500_000, annualInterestRate: 10, tenure: 24, tenureUnit: "months" })
  expect(result.totalMonths).toBe(24)
})

test("calculates a small valid loan", () => {
  const result = calculateEMI({ principalAmount: 10_000, annualInterestRate: 5, tenure: 1, tenureUnit: "years" })
  expect(result.monthlyEMI).toBeGreaterThan(0)
  expect(result.totalPayment).toBeGreaterThan(result.principalAmount)
})

test("calculates a high valid loan", () => {
  const result = calculateEMI({ principalAmount: 100_000_000, annualInterestRate: 30, tenure: 40, tenureUnit: "years" })
  expect(Number.isFinite(result.monthlyEMI)).toBe(true)
  expect(Number.isFinite(result.totalPayment)).toBe(true)
})

test("rejects a negative principal", () => {
  expect(() => calculateEMI({ principalAmount: -1, annualInterestRate: 8, tenure: 10, tenureUnit: "years" })).toThrow(RangeError)
})

test("rejects zero tenure", () => {
  expect(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: 8, tenure: 0, tenureUnit: "years" })).toThrow(RangeError)
})

test("rejects an invalid annual rate", () => {
  expect(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: 31, tenure: 10, tenureUnit: "years" })).toThrow(RangeError)
})

test("rejects non-finite inputs", () => {
  expect(() => calculateEMI({ principalAmount: Number.POSITIVE_INFINITY, annualInterestRate: 8, tenure: 10, tenureUnit: "years" })).toThrow(RangeError)
  expect(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: Number.NaN, tenure: 10, tenureUnit: "years" })).toThrow(RangeError)
})
})
