import { describe, expect, it } from "vitest"

import { calculateCAGR } from "@/features/calculators/cagr/calculate-cagr"
import { createCAGRResultItems, createCAGRResultText, formatCAGRPercentageForDisplay, normaliseCAGRDisplayZero } from "@/features/calculators/cagr/cagr-calculator"

function expectClose(actual: number, expected: number, tolerance = 0.000_001) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("calculateCAGR", () => {
  it("calculates the classic 10% five-year example", () => {
    const result = calculateCAGR({ beginningValue: 100_000, endingValue: 161_051, investmentPeriodYears: 5 })
    expectClose(result.cagrPercentage, 10)
    expectClose(result.absoluteGainLoss, 61_051)
    expectClose(result.totalReturnPercentage, 61.051)
    expectClose(result.growthMultiple, 1.61051)
  })

  it("returns zero growth for equal values", () => {
    const result = calculateCAGR({ beginningValue: 100_000, endingValue: 100_000, investmentPeriodYears: 5 })
    expect(result.cagrPercentage).toBe(0)
    expect(Object.is(result.cagrPercentage, -0)).toBe(false)
    expect(result.absoluteGainLoss).toBe(0)
    expect(result.totalReturnPercentage).toBe(0)
    expect(result.growthMultiple).toBe(1)
  })

  it("calculates a negative CAGR for a decline", () => {
    const result = calculateCAGR({ beginningValue: 100_000, endingValue: 80_000, investmentPeriodYears: 2 })
    expectClose(result.cagrPercentage, -10.557_280_900_008_415)
    expect(result.absoluteGainLoss).toBe(-20_000)
    expectClose(result.totalReturnPercentage, -20)
    expect(result.growthMultiple).toBe(0.8)
  })

  it("treats a zero ending value as a complete loss", () => {
    const result = calculateCAGR({ beginningValue: 100_000, endingValue: 0, investmentPeriodYears: 5 })
    expect(result.cagrPercentage).toBe(-100)
    expect(result.totalReturnPercentage).toBe(-100)
    expect(result.growthMultiple).toBe(0)
    expect(result.absoluteGainLoss).toBe(-100_000)
  })

  it("supports a short fractional period", () => {
    const result = calculateCAGR({ beginningValue: 100, endingValue: 101, investmentPeriodYears: 0.5 })
    expectClose(result.cagrPercentage, 2.01)
  })

  it("supports the 100-year maximum period", () => {
    const result = calculateCAGR({ beginningValue: 100, endingValue: 200, investmentPeriodYears: 100 })
    expect(Number.isFinite(result.cagrPercentage)).toBe(true)
    expectClose(result.totalReturnPercentage, 100)
  })

  it("does not mutate its input or round stored results", () => {
    const input = { beginningValue: 123_456.78, endingValue: 234_567.89, investmentPeriodYears: 7.25 } as const
    const before = { ...input }
    const result = calculateCAGR(input)
    expect(input).toEqual(before)
    expect(result.cagrPercentage).not.toBe(Number(result.cagrPercentage.toFixed(2)))
    expect(result.absoluteGainLoss).toBeCloseTo(111_111.11, 8)
  })

  it("produces only finite numbers for representative valid boundaries", () => {
    for (const input of [
      { beginningValue: 0.01, endingValue: 0, investmentPeriodYears: 0.01 },
      { beginningValue: 1_000_000_000_000_000, endingValue: 1_000_000_000_000_000, investmentPeriodYears: 100 },
    ]) {
      expect(Object.values(calculateCAGR(input)).every(Number.isFinite)).toBe(true)
    }
  })

  it("produces finite structured output for every accepted combination in a boundary grid", () => {
    let accepted = 0
    for (const beginningValue of [0.01, 1, 1_000_000, 1_000_000_000_000_000]) {
      for (const endingValue of [0, 0.01, 1, 1_000_000, 1_000_000_000_000_000]) {
        for (const investmentPeriodYears of [0.01, 0.02, 0.1, 1, 100]) {
          const input = { beginningValue, endingValue, investmentPeriodYears }
          try {
            const result = calculateCAGR(input)
            accepted += 1
            expect(Object.values(result).every(Number.isFinite)).toBe(true)
          } catch (error) {
            expect(error).toBeInstanceOf(RangeError)
          }
        }
      }
    }
    expect(accepted).toBeGreaterThan(0)
  })

  it("rejects rather than clamping a mathematically overflowing valid-field combination", () => {
    expect(() => calculateCAGR({ beginningValue: 1, endingValue: 1_180, investmentPeriodYears: 0.01 })).toThrow(RangeError)
  })

  it("maps negative and complete-loss results to accurate visible and copied labels", () => {
    const input = { beginningValue: 100_000, endingValue: 0, investmentPeriodYears: 5 }
    const result = calculateCAGR(input)
    expect(createCAGRResultItems(result).map(({ label, value }) => [label, value])).toEqual([
      ["Compound annual growth rate", "-100%"],
      ["Absolute loss", -100_000],
      ["Total return", -100],
      ["Growth multiple", "0×"],
    ])
    const copied = createCAGRResultText(input, result)
    expect(copied).toContain("Absolute loss: -₹1,00,000.00")
    expect(copied).toContain("Growth multiple: 0×")
  })

  it("normalises only visual negative zero", () => {
    expect(normaliseCAGRDisplayZero(-0)).toBe(0)
    expect(Object.is(normaliseCAGRDisplayZero(-0), -0)).toBe(false)
    expect(normaliseCAGRDisplayZero(-0.0001)).toBe(-0.0001)
  })

  it("formats an accepted extreme CAGR compactly without losing the stored result", () => {
    const result = calculateCAGR({ beginningValue: 1, endingValue: 1_000, investmentPeriodYears: 0.01 })
    expect(Number.isFinite(result.cagrPercentage)).toBe(true)
    expect(formatCAGRPercentageForDisplay(result.cagrPercentage)).toMatch(/E\d+%$/)
    expect(formatCAGRPercentageForDisplay(result.cagrPercentage).length).toBeLessThan(20)
  })

  it.each([
    { beginningValue: 0, endingValue: 100, investmentPeriodYears: 5 },
    { beginningValue: -1, endingValue: 100, investmentPeriodYears: 5 },
    { beginningValue: 100, endingValue: -1, investmentPeriodYears: 5 },
    { beginningValue: 100, endingValue: 110, investmentPeriodYears: 0 },
    { beginningValue: 100, endingValue: 110, investmentPeriodYears: 100.01 },
    { beginningValue: 100, endingValue: 110, investmentPeriodYears: 1.001 },
    { beginningValue: 1_000_000_000_000_001, endingValue: 110, investmentPeriodYears: 1 },
    { beginningValue: 100, endingValue: 1_000_000_000_000_001, investmentPeriodYears: 1 },
  ])("rejects invalid domain input %#", (input) => {
    expect(() => calculateCAGR(input)).toThrow(RangeError)
  })

  it.each([
    { beginningValue: Number.NaN, endingValue: 100, investmentPeriodYears: 5 },
    { beginningValue: 100, endingValue: Number.POSITIVE_INFINITY, investmentPeriodYears: 5 },
    { beginningValue: 100, endingValue: 110, investmentPeriodYears: Number.NEGATIVE_INFINITY },
  ])("rejects non-finite input %#", (input) => {
    expect(() => calculateCAGR(input)).toThrow(RangeError)
  })
})
