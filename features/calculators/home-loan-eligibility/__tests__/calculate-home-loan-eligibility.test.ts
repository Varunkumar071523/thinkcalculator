import { describe, expect, test } from "vitest"

import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import { calculateFOIRBandComparison, calculateHomeLoanEligibility } from "@/features/calculators/home-loan-eligibility/calculate-home-loan-eligibility"
import type { HomeLoanEligibilityInput } from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-types"

function assertClose(actual: number, expected: number, tolerance = 1) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

const baseInput: HomeLoanEligibilityInput = {
  netMonthlyIncome: 100_000,
  existingMonthlyEMI: 10_000,
  annualInterestRate: 8.5,
  tenureYears: 20,
  ownContribution: 1_000_000,
  foirBand: "standard",
}

describe("calculateHomeLoanEligibility", () => {
  test("computes the standard (50%) FOIR band for a realistic salary", () => {
    const result = calculateHomeLoanEligibility(baseInput)
    expect(result.foirPercentage).toBe(50)
    expect(result.foirBudget).toBe(50_000)
    expect(result.maxEligibleEMI).toBe(40_000)
    assertClose(result.maxEligibleLoanAmount, 4_609_233.59)
    assertClose(result.totalPropertyAffordability, 5_609_233.59)
    expect(result.existingEMIExceedsBudget).toBe(false)
    expect(result.totalMonths).toBe(240)
  })

  test("reverse-EMI matches calculateEMI's own worked example when run forward", () => {
    // ₹25,00,000 / 8.5% / 240mo is the codebase's own verified EMI worked example
    // (calculate-emi.test.ts: monthlyEMI 21695.58). Feeding that EMI back in as the
    // eligible-EMI budget should recover ~₹25,00,000 of eligible principal.
    const forward = calculateEMI({ principalAmount: 2_500_000, annualInterestRate: 8.5, tenure: 20, tenureUnit: "years" })
    const input: HomeLoanEligibilityInput = {
      netMonthlyIncome: forward.monthlyEMI / 0.5,
      existingMonthlyEMI: 0,
      annualInterestRate: 8.5,
      tenureYears: 20,
      ownContribution: 0,
      foirBand: "standard",
    }
    const result = calculateHomeLoanEligibility(input)
    assertClose(result.maxEligibleEMI, forward.monthlyEMI, 0.01)
    assertClose(result.maxEligibleLoanAmount, 2_500_000, 1)
  })

  test("higher FOIR bands yield a higher eligible EMI and loan amount", () => {
    const conservative = calculateHomeLoanEligibility({ ...baseInput, foirBand: "conservative" })
    const standard = calculateHomeLoanEligibility({ ...baseInput, foirBand: "standard" })
    const aggressive = calculateHomeLoanEligibility({ ...baseInput, foirBand: "aggressive" })

    expect(conservative.foirPercentage).toBe(40)
    expect(standard.foirPercentage).toBe(50)
    expect(aggressive.foirPercentage).toBe(60)

    expect(conservative.maxEligibleEMI).toBeLessThan(standard.maxEligibleEMI)
    expect(standard.maxEligibleEMI).toBeLessThan(aggressive.maxEligibleEMI)
    expect(conservative.maxEligibleLoanAmount).toBeLessThan(standard.maxEligibleLoanAmount)
    expect(standard.maxEligibleLoanAmount).toBeLessThan(aggressive.maxEligibleLoanAmount)
  })

  test("total property affordability always includes the own contribution", () => {
    const withContribution = calculateHomeLoanEligibility(baseInput)
    const withoutContribution = calculateHomeLoanEligibility({ ...baseInput, ownContribution: 0 })
    assertClose(withContribution.totalPropertyAffordability - withoutContribution.totalPropertyAffordability, 1_000_000, 0.01)
  })

  test("floors eligible EMI at 0 and flags the message when existing EMIs alone exceed the FOIR budget", () => {
    const result = calculateHomeLoanEligibility({ ...baseInput, existingMonthlyEMI: 60_000 })
    expect(result.existingEMIExceedsBudget).toBe(true)
    expect(result.maxEligibleEMI).toBe(0)
    expect(result.maxEligibleLoanAmount).toBe(0)
    expect(result.totalPropertyAffordability).toBe(result.ownContribution)
  })

  test("existing EMI exactly equal to the FOIR budget leaves zero eligible EMI without flagging exceedance", () => {
    const result = calculateHomeLoanEligibility({ ...baseInput, existingMonthlyEMI: 50_000 })
    expect(result.maxEligibleEMI).toBe(0)
    expect(result.existingEMIExceedsBudget).toBe(false)
  })

  test("handles the minimum allowed net monthly income", () => {
    const result = calculateHomeLoanEligibility({ ...baseInput, netMonthlyIncome: 10_000, existingMonthlyEMI: 0 })
    expect(result.foirBudget).toBe(5_000)
    expect(Number.isFinite(result.maxEligibleLoanAmount)).toBe(true)
    expect(result.maxEligibleLoanAmount).toBeGreaterThan(0)
  })

  test("handles a very short (1-year) tenure without overflow", () => {
    const result = calculateHomeLoanEligibility({ ...baseInput, tenureYears: 1 })
    expect(result.totalMonths).toBe(12)
    expect(Number.isFinite(result.maxEligibleLoanAmount)).toBe(true)
    // A 1-year tenure amortizes far less EMI per rupee of principal than a 20-year one.
    const longTenure = calculateHomeLoanEligibility(baseInput)
    expect(result.maxEligibleLoanAmount).toBeLessThan(longTenure.maxEligibleLoanAmount)
  })

  test("handles the maximum allowed tenure and income without producing a non-finite result", () => {
    const result = calculateHomeLoanEligibility({ ...baseInput, netMonthlyIncome: 10_000_000, existingMonthlyEMI: 0, tenureYears: 30, ownContribution: 100_000_000 })
    expect(Number.isFinite(result.maxEligibleLoanAmount)).toBe(true)
    expect(Number.isFinite(result.totalPropertyAffordability)).toBe(true)
  })

  test("rejects an out-of-range net monthly income", () => {
    expect(() => calculateHomeLoanEligibility({ ...baseInput, netMonthlyIncome: 5_000 })).toThrow(RangeError)
  })

  test("rejects a non-integer tenure", () => {
    expect(() => calculateHomeLoanEligibility({ ...baseInput, tenureYears: 5.5 })).toThrow(RangeError)
  })

  test("rejects non-finite inputs", () => {
    expect(() => calculateHomeLoanEligibility({ ...baseInput, netMonthlyIncome: Number.NaN })).toThrow(RangeError)
    expect(() => calculateHomeLoanEligibility({ ...baseInput, existingMonthlyEMI: Number.POSITIVE_INFINITY })).toThrow(RangeError)
  })
})

describe("calculateFOIRBandComparison", () => {
  test("returns all three bands in a stable order for the same inputs", () => {
    const rows = calculateFOIRBandComparison(baseInput)
    expect(rows.map((row) => row.foirBand)).toEqual(["conservative", "standard", "aggressive"])
    expect(rows.map((row) => row.foirPercentage)).toEqual([40, 50, 60])
  })

  test("each row matches calculateHomeLoanEligibility run individually for that band", () => {
    const rows = calculateFOIRBandComparison(baseInput)
    for (const row of rows) {
      const individual = calculateHomeLoanEligibility({ ...baseInput, foirBand: row.foirBand })
      expect(row.maxEligibleEMI).toBe(individual.maxEligibleEMI)
      assertClose(row.maxEligibleLoanAmount, individual.maxEligibleLoanAmount, 0.01)
    }
  })

  test("rejects invalid shared input the same way calculateHomeLoanEligibility does", () => {
    expect(() => calculateFOIRBandComparison({ ...baseInput, tenureYears: 0 })).toThrow(RangeError)
  })
})
