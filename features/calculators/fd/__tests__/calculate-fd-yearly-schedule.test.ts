import { describe, expect, it } from "vitest"
import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import { calculateFDYearlySchedule } from "@/features/calculators/fd/calculate-fd-yearly-schedule"
import type { FDInput } from "@/features/calculators/fd/fd-types"

const standard: FDInput = { principalAmount: 100_000, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" }

describe("calculateFDYearlySchedule", () => {
  it("creates one row per year for a standard 5-year FD", () => {
    const rows = calculateFDYearlySchedule(standard)
    expect(rows).toHaveLength(5)
    expect(rows.map((row) => row.year)).toEqual([1, 2, 3, 4, 5])
    expect(rows.every((row) => row.monthsElapsed % 12 === 0)).toBe(true)
  })

  it("reconciles the final row's maturity amount with calculateFD", () => {
    const rows = calculateFDYearlySchedule(standard)
    expect(rows.at(-1)?.maturityAmount).toBeCloseTo(calculateFD(standard).maturityAmount, 8)
  })

  it("keeps a trailing partial year as its own row", () => {
    const rows = calculateFDYearlySchedule({ ...standard, duration: 30, durationUnit: "months" })
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.monthsElapsed)).toEqual([12, 24, 30])
  })

  it("grows monotonically and yearly growth sums to total interest earned", () => {
    const rows = calculateFDYearlySchedule(standard)
    expect(rows.every((row, index) => index === 0 || row.maturityAmount >= rows[index - 1].maturityAmount)).toBe(true)
    const totalGrowth = rows.reduce((sum, row) => sum + row.yearlyGrowth, 0)
    expect(totalGrowth).toBeCloseTo(rows.at(-1)!.interestEarned, 8)
  })

  it("handles zero interest", () => {
    const rows = calculateFDYearlySchedule({ ...standard, annualInterestRate: 0 })
    expect(rows.every((row) => row.interestEarned === 0 && row.yearlyGrowth === 0)).toBe(true)
  })

  it("handles a duration under a year", () => {
    const rows = calculateFDYearlySchedule({ ...standard, duration: 6, durationUnit: "months" })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ year: 1, monthsElapsed: 6 })
  })

  it("rejects invalid input", () => {
    expect(() => calculateFDYearlySchedule({ ...standard, principalAmount: -1 })).toThrow(RangeError)
  })
})
