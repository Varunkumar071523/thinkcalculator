import { describe, expect, it } from "vitest"
import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import { calculateRDYearlySchedule } from "@/features/calculators/rd/calculate-rd-yearly-schedule"
import type { RDInput } from "@/features/calculators/rd/rd-types"

const standard: RDInput = { monthlyDeposit: 5_000, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" }

describe("calculateRDYearlySchedule", () => {
  it("creates one row per year for a standard 5-year RD", () => {
    const rows = calculateRDYearlySchedule(standard)
    expect(rows).toHaveLength(5)
    expect(rows.map((row) => row.year)).toEqual([1, 2, 3, 4, 5])
    expect(rows.every((row) => row.monthsElapsed % 12 === 0)).toBe(true)
  })

  it("reconciles the final row's maturity amount and deposits with calculateRD", () => {
    const rows = calculateRDYearlySchedule(standard)
    const result = calculateRD(standard)
    expect(rows.at(-1)?.maturityAmount).toBeCloseTo(result.maturityAmount, 8)
    expect(rows.at(-1)?.totalDeposited).toBe(result.totalDeposited)
  })

  it("keeps a trailing partial year as its own row", () => {
    const rows = calculateRDYearlySchedule({ ...standard, duration: 18, durationUnit: "months" })
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.monthsElapsed)).toEqual([12, 18])
  })

  it("deposits and maturity value never decrease", () => {
    const rows = calculateRDYearlySchedule(standard)
    expect(rows.every((row, index) => index === 0 || row.totalDeposited >= rows[index - 1].totalDeposited)).toBe(true)
    expect(rows.every((row, index) => index === 0 || row.maturityAmount >= rows[index - 1].maturityAmount)).toBe(true)
  })

  it("handles zero interest", () => {
    const rows = calculateRDYearlySchedule({ ...standard, annualInterestRate: 0 })
    expect(rows.every((row) => row.interestEarned === 0 && row.maturityAmount === row.totalDeposited)).toBe(true)
  })

  it("handles a duration under a year", () => {
    const rows = calculateRDYearlySchedule({ ...standard, duration: 6, durationUnit: "months" })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ year: 1, monthsElapsed: 6 })
  })

  it("rejects invalid input", () => {
    expect(() => calculateRDYearlySchedule({ ...standard, monthlyDeposit: -1 })).toThrow(RangeError)
  })
})
