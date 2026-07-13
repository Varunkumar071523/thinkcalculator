import { describe, expect, it } from "vitest"

import { calculateGratuity } from "../calculate-gratuity"
import { createGratuityOrdinaryServiceText, hasOrdinaryGratuityService } from "../gratuity-content"
import { GRATUITY_STATUTORY_CEILING } from "../gratuity-regulatory-config"
import type { GratuityInput } from "../gratuity-types"

const standard: GratuityInput = {
  eligibleMonthlyWages: 50_000,
  completedYears: 7,
  additionalMonths: 7,
}

describe("calculateGratuity", () => {
  it("calculates the known standard monthly rated example", () => {
    const result = calculateGratuity(standard)
    expect(result.countedServiceYears).toBe(8)
    expect(result.dailyWageBasis).toBeCloseTo(50_000 / 26, 10)
    expect(result.gratuityBeforeCeiling).toBeCloseTo(230_769.23076923078, 10)
    expect(result.estimatedGratuity).toBeCloseTo(230_769.23076923078, 10)
  })

  it.each([
    [0, 7],
    [6, 7],
    [7, 8],
    [11, 8],
  ])("counts %i additional months as %i service years", (additionalMonths, countedServiceYears) => {
    expect(calculateGratuity({ ...standard, additionalMonths }).countedServiceYears).toBe(countedServiceYears)
  })

  it("returns an amount below the ceiling without an adjustment", () => {
    const result = calculateGratuity(standard)
    expect(result.ceilingApplied).toBe(false)
    expect(result.ceilingAdjustment).toBe(0)
    expect(result.estimatedGratuity).toBe(result.gratuityBeforeCeiling)
  })

  it("handles a formula amount at the ceiling", () => {
    const eligibleMonthlyWages = GRATUITY_STATUTORY_CEILING * 26 / (15 * 10)
    const result = calculateGratuity({ eligibleMonthlyWages, completedYears: 10, additionalMonths: 0 })
    expect(result.gratuityBeforeCeiling).toBeCloseTo(GRATUITY_STATUTORY_CEILING, 8)
    expect(result.estimatedGratuity).toBeCloseTo(GRATUITY_STATUTORY_CEILING, 8)
    expect(result.ceilingAdjustment).toBeCloseTo(0, 8)
    expect(result.ceilingApplied).toBe(false)
  })

  it("caps an amount above the ceiling and reports the adjustment", () => {
    const result = calculateGratuity({ eligibleMonthlyWages: 1_000_000, completedYears: 20, additionalMonths: 0 })
    expect(result.gratuityBeforeCeiling).toBeGreaterThan(GRATUITY_STATUTORY_CEILING)
    expect(result.estimatedGratuity).toBe(GRATUITY_STATUTORY_CEILING)
    expect(result.ceilingAdjustment).toBeCloseTo(result.gratuityBeforeCeiling - GRATUITY_STATUTORY_CEILING, 10)
    expect(result.ceilingApplied).toBe(true)
  })

  it("retains fractional numeric precision without calculation-level rounding", () => {
    const result = calculateGratuity({ eligibleMonthlyWages: 50_000.55, completedYears: 7, additionalMonths: 7 })
    expect(result.gratuityBeforeCeiling).toBeCloseTo(50_000.55 * 15 / 26 * 8, 10)
    expect(result.gratuityBeforeCeiling).not.toBe(Math.round(result.gratuityBeforeCeiling * 100) / 100)
  })

  it("does not mutate its input", () => {
    const input = { ...standard }
    const before = { ...input }
    calculateGratuity(input)
    expect(input).toEqual(before)
  })

  it("rejects invalid input before calculating", () => {
    expect(() => calculateGratuity({ ...standard, eligibleMonthlyWages: Number.NaN })).toThrow(RangeError)
  })

  it("flags the ordinary five-completed-year threshold without overriding legal exceptions", () => {
    expect(hasOrdinaryGratuityService({ ...standard, completedYears: 4, additionalMonths: 11 })).toBe(false)
    expect(hasOrdinaryGratuityService({ ...standard, completedYears: 5, additionalMonths: 0 })).toBe(true)
    expect(createGratuityOrdinaryServiceText({ ...standard, completedYears: 4, additionalMonths: 11 })).toContain("Below five")
    expect(createGratuityOrdinaryServiceText({ ...standard, completedYears: 5, additionalMonths: 0 })).toContain("eligibility still requires separate review")
  })

  it("keeps a zero-year, seven-month result numerical while warning that the ordinary threshold is not met", () => {
    const input = { ...standard, completedYears: 0, additionalMonths: 7 }
    expect(calculateGratuity(input).countedServiceYears).toBe(1)
    expect(hasOrdinaryGratuityService(input)).toBe(false)
  })
})
