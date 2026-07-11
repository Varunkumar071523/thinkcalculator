import { describe, expect, it } from "vitest"
import { calculateAmortizationSchedule } from "@/features/calculators/emi/calculate-amortization"
import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import type { EMIInput } from "@/features/calculators/emi/emi-types"

const standard: EMIInput = { principalAmount: 2_500_000, annualInterestRate: 8.5, tenure: 20, tenureUnit: "years" }

describe("calculateAmortizationSchedule", () => {
  it("creates a standard 25 lakh, 8.5%, 20-year schedule", () => {
    const rows = calculateAmortizationSchedule(standard)
    expect(rows).toHaveLength(240)
    expect(rows[0].openingBalance).toBe(2_500_000)
    expect(rows.at(-1)?.closingBalance).toBe(0)
  })

  it("reconciles principal and interest with the EMI result", () => {
    const result = calculateEMI(standard)
    const rows = calculateAmortizationSchedule(standard, result)
    expect(rows.reduce((sum, row) => sum + row.principalPaid, 0)).toBeCloseTo(standard.principalAmount, 5)
    expect(rows.reduce((sum, row) => sum + row.interestPaid, 0)).toBeCloseTo(result.totalInterest, 5)
  })

  it("handles a zero-interest loan", () => {
    const input: EMIInput = { principalAmount: 120_000, annualInterestRate: 0, tenure: 12, tenureUnit: "months" }
    const rows = calculateAmortizationSchedule(input)
    expect(rows).toHaveLength(12)
    expect(rows.every((row) => row.interestPaid === 0 && row.emi === 10_000)).toBe(true)
    expect(rows.at(-1)?.closingBalance).toBe(0)
  })

  it("handles a twelve-month loan", () => {
    expect(calculateAmortizationSchedule({ ...standard, tenure: 12, tenureUnit: "months" })).toHaveLength(12)
  })

  it("handles the highest valid loan and tenure without negative balances", () => {
    const rows = calculateAmortizationSchedule({ principalAmount: 100_000_000, annualInterestRate: 30, tenure: 480, tenureUnit: "months" })
    expect(rows).toHaveLength(480)
    expect(rows.every((row) => row.openingBalance >= 0 && row.closingBalance >= 0)).toBe(true)
  })

  it("rejects invalid input", () => {
    expect(() => calculateAmortizationSchedule({ ...standard, principalAmount: -1 })).toThrow(RangeError)
  })

  it("keeps cumulative totals non-decreasing", () => {
    const rows = calculateAmortizationSchedule(standard)
    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index].cumulativePrincipal).toBeGreaterThanOrEqual(rows[index - 1].cumulativePrincipal)
      expect(rows[index].cumulativeInterest).toBeGreaterThanOrEqual(rows[index - 1].cumulativeInterest)
    }
  })
})
