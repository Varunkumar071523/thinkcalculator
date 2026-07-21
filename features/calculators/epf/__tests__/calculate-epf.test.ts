import { describe, expect, it } from "vitest"

import { calculateEPF } from "../calculate-epf"
import type { EPFInput } from "../epf-types"

const base: EPFInput = {
  monthlyBasicSalary: 40_000,
  employeeContributionPercent: 12,
  employerContributionPercent: 12,
  currentAge: 28,
  retirementAge: 58,
  expectedAnnualInterestRate: 8.25,
}

describe("calculateEPF", () => {
  it("computes monthly contributions from salary and rates", () => {
    const result = calculateEPF(base)
    expect(result.monthlyEmployeeContribution).toBeCloseTo(4_800, 6)
    expect(result.monthlyEmployerContribution).toBeCloseTo(4_800, 6)
  })

  it("produces one schedule row per year, ending at retirement age", () => {
    const result = calculateEPF(base)
    expect(result.schedule).toHaveLength(30)
    expect(result.schedule[0]).toMatchObject({ year: 1, age: 29 })
    expect(result.schedule[29]).toMatchObject({ year: 30, age: 58 })
  })

  it("reconciles: contributions + interest exactly equal the maturity value", () => {
    const result = calculateEPF(base)
    const reconciled = result.totalEmployeeContribution + result.totalEmployerContribution + result.totalInterest
    expect(result.maturityValue).toBeCloseTo(reconciled, 6)
    const scheduleTotal = result.schedule.reduce((sum, row) => sum + row.employeeContribution + row.employerContribution + row.interestEarned, 0)
    expect(result.maturityValue).toBeCloseTo(scheduleTotal, 6)
  })

  it("grows the corpus every year (each row's closing balance exceeds the previous)", () => {
    const result = calculateEPF(base)
    for (let index = 1; index < result.schedule.length; index++) {
      expect(result.schedule[index].closingBalance).toBeGreaterThan(result.schedule[index - 1].closingBalance)
    }
  })

  it("handles a single-year tenure (retirement age one year after current age)", () => {
    const result = calculateEPF({ ...base, currentAge: 57, retirementAge: 58 })
    expect(result.schedule).toHaveLength(1)
    expect(result.schedule[0].year).toBe(1)
    expect(result.schedule[0].age).toBe(58)
    expect(result.maturityValue).toBeGreaterThan(0)
  })

  it("produces an all-zero schedule when both contribution rates are zero", () => {
    const result = calculateEPF({ ...base, employeeContributionPercent: 0, employerContributionPercent: 0 })
    expect(result.maturityValue).toBe(0)
    expect(result.totalEmployeeContribution).toBe(0)
    expect(result.totalEmployerContribution).toBe(0)
    expect(result.totalInterest).toBe(0)
    expect(result.schedule.every((row) => row.closingBalance === 0)).toBe(true)
  })

  it("produces a zero corpus when the monthly basic salary is zero", () => {
    const result = calculateEPF({ ...base, monthlyBasicSalary: 0 })
    expect(result.maturityValue).toBe(0)
    expect(result.schedule.every((row) => row.employeeContribution === 0 && row.employerContribution === 0 && row.interestEarned === 0)).toBe(true)
  })

  it("earns no interest when the expected interest rate is zero", () => {
    const result = calculateEPF({ ...base, expectedAnnualInterestRate: 0 })
    expect(result.totalInterest).toBe(0)
    expect(result.maturityValue).toBeCloseTo(result.totalEmployeeContribution + result.totalEmployerContribution, 6)
  })

  it("stays finite at the salary, rate, and tenure extremes (defensive clamp coverage)", () => {
    const result = calculateEPF({
      monthlyBasicSalary: 10_000_000,
      employeeContributionPercent: 100,
      employerContributionPercent: 100,
      currentAge: 18,
      retirementAge: 60,
      expectedAnnualInterestRate: 15,
    })
    expect(Number.isFinite(result.maturityValue)).toBe(true)
    expect(result.schedule.every((row) => Number.isFinite(row.closingBalance))).toBe(true)
  })

  it("throws on invalid input", () => {
    expect(() => calculateEPF({ ...base, retirementAge: base.currentAge })).toThrow(RangeError)
    expect(() => calculateEPF({ ...base, currentAge: 15 })).toThrow(RangeError)
  })
})
