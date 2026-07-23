import { describe, expect, it } from "vitest"

import { calculateEpsPension } from "../calculate-eps-pension"
import {
  EPS_PENSION_MINIMUM_MONTHLY_PENSION,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_WAGE_CEILING,
} from "../eps-pension-regulatory-config"
import type { EpsPensionInput } from "../eps-pension-types"

const base: EpsPensionInput = {
  averageMonthlySalary: 24_000,
  yearsOfPensionableService: 26,
  ageOption: "standard",
  earlyPensionAge: 50,
}

describe("calculateEpsPension — core formula", () => {
  it("computes pension × service ÷ 70 with no ceiling and no bonus binding", () => {
    const input: EpsPensionInput = { ...base, averageMonthlySalary: 10_000, yearsOfPensionableService: 15 }
    const result = calculateEpsPension(input)
    expect(result.isEligible).toBe(true)
    expect(result.pensionableSalaryUsed).toBe(10_000)
    expect(result.isWageCeilingBinding).toBe(false)
    expect(result.bonusYearsApplied).toBe(false)
    expect(result.pensionableServiceUsed).toBe(15)
    expect(result.formulaPension).toBeCloseTo((10_000 * 15) / 70)
    expect(result.isFloorBinding).toBe(false)
    expect(result.standardMonthlyPension).toBeCloseTo((10_000 * 15) / 70)
    expect(result.monthlyPension).toBe(result.standardMonthlyPension)
  })
})

describe("calculateEpsPension — wage-ceiling cap", () => {
  it("caps pensionable salary at the wage ceiling when actual salary is higher", () => {
    const input: EpsPensionInput = { ...base, averageMonthlySalary: 30_000, yearsOfPensionableService: 12 }
    const result = calculateEpsPension(input)
    expect(result.pensionableSalaryUsed).toBe(EPS_PENSION_WAGE_CEILING)
    expect(result.isWageCeilingBinding).toBe(true)
    expect(result.formulaPension).toBeCloseTo((EPS_PENSION_WAGE_CEILING * 12) / 70)
  })

  it("does not bind when actual salary is at or below the ceiling", () => {
    const atCeiling = calculateEpsPension({ ...base, averageMonthlySalary: EPS_PENSION_WAGE_CEILING, yearsOfPensionableService: 12 })
    expect(atCeiling.isWageCeilingBinding).toBe(false)
    expect(atCeiling.pensionableSalaryUsed).toBe(EPS_PENSION_WAGE_CEILING)
  })
})

describe("calculateEpsPension — 20-year bonus", () => {
  it("does not apply the bonus just under 20 years", () => {
    const result = calculateEpsPension({ ...base, yearsOfPensionableService: 19 })
    expect(result.bonusYearsApplied).toBe(false)
    expect(result.pensionableServiceUsed).toBe(19)
  })

  it("applies the 2-year bonus at exactly 20 years and beyond", () => {
    const at20 = calculateEpsPension({ ...base, yearsOfPensionableService: 20 })
    expect(at20.bonusYearsApplied).toBe(true)
    expect(at20.pensionableServiceUsed).toBe(22)

    const at35 = calculateEpsPension({ ...base, yearsOfPensionableService: 35 })
    expect(at35.bonusYearsApplied).toBe(true)
    expect(at35.pensionableServiceUsed).toBe(37)
  })
})

describe("calculateEpsPension — minimum pension floor", () => {
  it("floors a low formula result up to the minimum pension for an eligible member", () => {
    const input: EpsPensionInput = { ...base, averageMonthlySalary: 2_000, yearsOfPensionableService: EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS }
    const result = calculateEpsPension(input)
    expect(result.formulaPension).toBeLessThan(EPS_PENSION_MINIMUM_MONTHLY_PENSION)
    expect(result.isFloorBinding).toBe(true)
    expect(result.standardMonthlyPension).toBe(EPS_PENSION_MINIMUM_MONTHLY_PENSION)
  })

  it("does not apply the floor when the formula already exceeds it", () => {
    const result = calculateEpsPension(base)
    expect(result.formulaPension).toBeGreaterThan(EPS_PENSION_MINIMUM_MONTHLY_PENSION)
    expect(result.isFloorBinding).toBe(false)
  })
})

describe("calculateEpsPension — sub-10-year ineligibility", () => {
  it("reports ineligibility and a zero pension just under the threshold", () => {
    const result = calculateEpsPension({ ...base, yearsOfPensionableService: EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS - 1 })
    expect(result.isEligible).toBe(false)
    expect(result.standardMonthlyPension).toBe(0)
    expect(result.earlyMonthlyPension).toBe(0)
    expect(result.monthlyPension).toBe(0)
  })

  it("reports ineligibility at zero years of service without a nonsensical figure", () => {
    const result = calculateEpsPension({ ...base, averageMonthlySalary: 50_000, yearsOfPensionableService: 0 })
    expect(result.isEligible).toBe(false)
    expect(result.monthlyPension).toBe(0)
    expect(Number.isFinite(result.formulaPension)).toBe(true)
  })

  it("becomes eligible exactly at the threshold", () => {
    const result = calculateEpsPension({ ...base, yearsOfPensionableService: EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS })
    expect(result.isEligible).toBe(true)
  })
})

describe("calculateEpsPension — worked example (ceiling and bonus both bind)", () => {
  it("caps salary and applies the bonus at once, landing on a clean formula result", () => {
    const result = calculateEpsPension(base)
    expect(result.isWageCeilingBinding).toBe(true)
    expect(result.bonusYearsApplied).toBe(true)
    expect(result.pensionableSalaryUsed).toBe(15_000)
    expect(result.pensionableServiceUsed).toBe(28)
    expect(result.formulaPension).toBe(6_000)
    expect(result.isFloorBinding).toBe(false)
    expect(result.standardMonthlyPension).toBe(6_000)
    expect(result.monthlyPension).toBe(6_000)
  })
})

describe("calculateEpsPension — early pension", () => {
  it("reduces the standard-age pension by 4% per year short of 58, kept separate from the standard figure", () => {
    const result = calculateEpsPension({ ...base, ageOption: "early", earlyPensionAge: 50 })
    expect(result.standardMonthlyPension).toBe(6_000)
    expect(result.earlyPensionReductionPercent).toBe(32)
    expect(result.earlyMonthlyPension).toBeCloseTo(4_080)
    expect(result.monthlyPension).toBeCloseTo(4_080)
    expect(result.monthlyPension).not.toBe(result.standardMonthlyPension)
  })

  it("applies a smaller reduction closer to the standard age", () => {
    const result = calculateEpsPension({ ...base, ageOption: "early", earlyPensionAge: 57 })
    expect(result.earlyPensionReductionPercent).toBe(4)
    expect(result.earlyMonthlyPension).toBe(5_760)
  })

  it("still computes the early-pension figure even when standard is selected, without using it as the headline", () => {
    const result = calculateEpsPension({ ...base, ageOption: "standard", earlyPensionAge: 50 })
    expect(result.earlyMonthlyPension).toBeCloseTo(4_080)
    expect(result.monthlyPension).toBe(result.standardMonthlyPension)
  })

  it("produces a zero early pension for an ineligible member regardless of age", () => {
    const result = calculateEpsPension({ ...base, ageOption: "early", earlyPensionAge: 50, yearsOfPensionableService: 5 })
    expect(result.earlyMonthlyPension).toBe(0)
    expect(result.monthlyPension).toBe(0)
  })
})

describe("calculateEpsPension — defensive clamping and extreme inputs", () => {
  it("handles zero salary without NaN, applying the floor for an eligible member", () => {
    const result = calculateEpsPension({ ...base, averageMonthlySalary: 0, yearsOfPensionableService: 10 })
    expect(result.formulaPension).toBe(0)
    expect(result.standardMonthlyPension).toBe(EPS_PENSION_MINIMUM_MONTHLY_PENSION)
    expect(Number.isFinite(result.monthlyPension)).toBe(true)
  })

  it("handles the maximum realistic service and salary without overflow", () => {
    const result = calculateEpsPension({ ...base, averageMonthlySalary: 10_000_000, yearsOfPensionableService: 60 })
    expect(result.pensionableSalaryUsed).toBe(EPS_PENSION_WAGE_CEILING)
    expect(result.pensionableServiceUsed).toBe(62)
    expect(Number.isFinite(result.formulaPension)).toBe(true)
    expect(Number.isFinite(result.monthlyPension)).toBe(true)
    expect(result.monthlyPension).toBeGreaterThan(0)
  })

  it("never produces a negative or non-finite pension across a range of inputs", () => {
    for (const years of [0, 1, 9, 10, 19, 20, 40, 60]) {
      for (const salary of [0, 1, 15_000, 15_001, 10_000_000]) {
        const result = calculateEpsPension({ ...base, averageMonthlySalary: salary, yearsOfPensionableService: years })
        expect(result.monthlyPension).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(result.monthlyPension)).toBe(true)
      }
    }
  })

  it("rejects invalid input", () => {
    expect(() => calculateEpsPension({ ...base, yearsOfPensionableService: -1 })).toThrow(RangeError)
    expect(() => calculateEpsPension({ ...base, averageMonthlySalary: Number.NaN })).toThrow(RangeError)
    expect(() => calculateEpsPension({ ...base, yearsOfPensionableService: 1.5 })).toThrow(RangeError)
    expect(() => calculateEpsPension({ ...base, earlyPensionAge: 49 })).toThrow(RangeError)
    expect(() => calculateEpsPension({ ...base, earlyPensionAge: 58 })).toThrow(RangeError)
    expect(() => calculateEpsPension({ ...base, ageOption: "later" as never })).toThrow(RangeError)
  })
})
