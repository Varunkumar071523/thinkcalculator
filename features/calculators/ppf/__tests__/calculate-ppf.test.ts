import { describe, expect, it } from "vitest"
import { calculatePPF } from "../calculate-ppf"
import { PPF_RATE_CONFIG } from "../ppf-rate-config"
import type { PPFInput } from "../ppf-types"
import { formatIndianCurrency } from "@/lib/formatters"

const standard: PPFInput = { annualContribution: 100_000, assumedAnnualInterestRate: PPF_RATE_CONFIG.defaultRate, durationYears: 15 }
describe("calculatePPF", () => {
  it("matches an independently evaluated annuity-due example", () => {
    const result = calculatePPF(standard)
    const independent = standard.annualContribution * (1 + standard.assumedAnnualInterestRate / 100) * (((1 + standard.assumedAnnualInterestRate / 100) ** standard.durationYears - 1) / (standard.assumedAnnualInterestRate / 100))
    expect(result.maturityValue).toBeCloseTo(independent, 8)
    expect(result.maturityValue).toBeCloseTo(2_712_139.48, 2)
  })
  it.each([500, 150_000] as const)("accepts contribution boundary %s", (annualContribution) => expect(calculatePPF({ ...standard, annualContribution }).maturityValue).toBeGreaterThan(0))
  it.each([
    [{ annualContribution: 500, assumedAnnualInterestRate: 0.1, durationYears: 15 }, 7_560.28091219],
    [{ annualContribution: 150_000, assumedAnnualInterestRate: 15, durationYears: 40 }, 306_893_078.169908],
    [{ ...standard, durationYears: 20 }, 4_438_858.77976118],
  ] as const)("matches an independent boundary projection for %o", (input, expectedMaturity) => {
    expect(calculatePPF(input).maturityValue).toBeCloseTo(expectedMaturity, 5)
  })
  it.each([15, 20, 40] as const)("creates a %s year schedule", (durationYears) => expect(calculatePPF({ ...standard, durationYears }).schedule).toHaveLength(durationYears))
  it("reconciles every schedule row and headline total", () => {
    const result = calculatePPF(standard)
    expect(result.schedule[0].openingBalance).toBe(0)
    result.schedule.forEach((row, index) => { if (index) expect(row.openingBalance).toBe(result.schedule[index - 1].closingBalance); expect(row.closingBalance).toBe(row.openingBalance + row.contribution + row.interestEarned) })
    expect(result.totalContributions).toBe(1_500_000)
    expect(result.schedule.reduce((sum, row) => sum + row.interestEarned, 0)).toBeCloseTo(result.totalInterest, 10)
    expect(result.totalInterest).toBeCloseTo(result.maturityValue - result.totalContributions, 9)
    expect(result.schedule.at(-1)?.closingBalance).toBe(result.maturityValue)
  })
  it("does not mutate input or round intermediate balances", () => {
    const input = { ...standard }; const before = { ...input }; const result = calculatePPF(input)
    expect(input).toEqual(before); expect(result.schedule[0].interestEarned).toBeCloseTo(7_100, 10); expect(result.schedule[1].openingBalance).toBeCloseTo(107_100, 10); expect(result.schedule[1].interestEarned).toBeCloseTo(14_704.1, 10)
  })
  it.each([0.1, 15] as const)("keeps boundary rate %s finite for every duration", (assumedAnnualInterestRate) => {
    for (const durationYears of [15, 20, 25, 30, 35, 40] as const) {
      const result = calculatePPF({ ...standard, assumedAnnualInterestRate, durationYears })
      expect([result.totalContributions, result.totalInterest, result.maturityValue].every(Number.isFinite)).toBe(true)
      expect(result.schedule.every((row) => Object.values(row).every(Number.isFinite))).toBe(true)
      expect(formatIndianCurrency(result.maturityValue)).not.toMatch(/NaN|Infinity/)
    }
  })
  it("rejects invalid inputs", () => { expect(() => calculatePPF({ ...standard, annualContribution: 525 })).toThrow(RangeError); expect(() => calculatePPF({ ...standard, assumedAnnualInterestRate: Infinity })).toThrow(RangeError) })
})
