import assert from "node:assert/strict"
import test from "node:test"

import { calculateEMI } from "@/features/calculators/emi/calculate-emi"

function assertClose(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`)
}

test("calculates the standard home-loan example", () => {
  const result = calculateEMI({ principalAmount: 2_500_000, annualInterestRate: 8.5, tenure: 20, tenureUnit: "years" })
  assertClose(result.monthlyEMI, 21695.58)
  assertClose(result.totalInterest, 2706939.4)
  assert.equal(result.totalMonths, 240)
})

test("handles a zero-interest loan", () => {
  const result = calculateEMI({ principalAmount: 120_000, annualInterestRate: 0, tenure: 12, tenureUnit: "months" })
  assert.equal(result.monthlyEMI, 10_000)
  assert.equal(result.totalInterest, 0)
  assert.equal(result.totalPayment, 120_000)
})

test("converts tenure supplied in years", () => {
  const result = calculateEMI({ principalAmount: 500_000, annualInterestRate: 10, tenure: 2, tenureUnit: "years" })
  assert.equal(result.totalMonths, 24)
})

test("uses tenure supplied in months", () => {
  const result = calculateEMI({ principalAmount: 500_000, annualInterestRate: 10, tenure: 24, tenureUnit: "months" })
  assert.equal(result.totalMonths, 24)
})

test("calculates a small valid loan", () => {
  const result = calculateEMI({ principalAmount: 10_000, annualInterestRate: 5, tenure: 1, tenureUnit: "years" })
  assert.ok(result.monthlyEMI > 0)
  assert.ok(result.totalPayment > result.principalAmount)
})

test("calculates a high valid loan", () => {
  const result = calculateEMI({ principalAmount: 100_000_000, annualInterestRate: 30, tenure: 40, tenureUnit: "years" })
  assert.ok(Number.isFinite(result.monthlyEMI))
  assert.ok(Number.isFinite(result.totalPayment))
})

test("rejects a negative principal", () => {
  assert.throws(() => calculateEMI({ principalAmount: -1, annualInterestRate: 8, tenure: 10, tenureUnit: "years" }), RangeError)
})

test("rejects zero tenure", () => {
  assert.throws(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: 8, tenure: 0, tenureUnit: "years" }), RangeError)
})

test("rejects an invalid annual rate", () => {
  assert.throws(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: 31, tenure: 10, tenureUnit: "years" }), RangeError)
})

test("rejects non-finite inputs", () => {
  assert.throws(() => calculateEMI({ principalAmount: Number.POSITIVE_INFINITY, annualInterestRate: 8, tenure: 10, tenureUnit: "years" }), RangeError)
  assert.throws(() => calculateEMI({ principalAmount: 100_000, annualInterestRate: Number.NaN, tenure: 10, tenureUnit: "years" }), RangeError)
})
