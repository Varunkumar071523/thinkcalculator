import { describe, expect, test } from "vitest"

import { calculateEMI, calculateMaxLoanAmount } from "@/features/calculators/emi/calculate-emi"

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

describe("calculateMaxLoanAmount", () => {
test("round-trips against calculateEMI's own worked example (₹25,00,000 / 8.5% / 240mo)", () => {
  const forward = calculateEMI({ principalAmount: 2_500_000, annualInterestRate: 8.5, tenure: 20, tenureUnit: "years" })
  const principal = calculateMaxLoanAmount(forward.monthlyEMI, 8.5, 240)
  assertClose(principal, 2_500_000, 1)
})

test("round-trips a zero-interest schedule", () => {
  const forward = calculateEMI({ principalAmount: 120_000, annualInterestRate: 0, tenure: 12, tenureUnit: "months" })
  expect(calculateMaxLoanAmount(forward.monthlyEMI, 0, 12)).toBeCloseTo(120_000, 6)
})

test("round-trips across a range of rates and tenures", () => {
  for (const { principalAmount, annualInterestRate, tenure, tenureUnit } of [
    { principalAmount: 500_000, annualInterestRate: 10, tenure: 2, tenureUnit: "years" as const },
    { principalAmount: 5_000_000, annualInterestRate: 9.25, tenure: 30, tenureUnit: "years" as const },
    { principalAmount: 1_000_000, annualInterestRate: 12, tenure: 60, tenureUnit: "months" as const },
  ]) {
    const forward = calculateEMI({ principalAmount, annualInterestRate, tenure, tenureUnit })
    const principal = calculateMaxLoanAmount(forward.monthlyEMI, annualInterestRate, forward.totalMonths)
    assertClose(principal, principalAmount, 1)
  }
})

test("returns 0 for a non-positive EMI, tenure, or negative rate", () => {
  expect(calculateMaxLoanAmount(0, 8.5, 240)).toBe(0)
  expect(calculateMaxLoanAmount(-100, 8.5, 240)).toBe(0)
  expect(calculateMaxLoanAmount(20_000, 8.5, 0)).toBe(0)
  expect(calculateMaxLoanAmount(20_000, -1, 240)).toBe(0)
})

test("returns 0 rather than NaN/Infinity for non-finite inputs", () => {
  expect(calculateMaxLoanAmount(Number.NaN, 8.5, 240)).toBe(0)
  expect(calculateMaxLoanAmount(20_000, 8.5, Number.POSITIVE_INFINITY)).toBe(0)
})
})
