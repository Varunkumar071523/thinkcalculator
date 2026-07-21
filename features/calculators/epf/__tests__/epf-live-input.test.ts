import { describe, expect, it } from "vitest"

import { calculateEPF } from "../calculate-epf"
import { toLiveInput } from "../epf-live-input"
import { validateEPFInput } from "../epf-schema"
import type { EPFFormValues } from "../epf-schema"
import { EPF_DEFAULT_INPUT } from "../epf-url-state"

const validText: EPFFormValues = {
  monthlyBasicSalary: "40000",
  employeeContributionPercent: "12",
  employerContributionPercent: "12",
  currentAge: "28",
  retirementAge: "58",
  expectedAnnualInterestRate: "8.25",
}

describe("EPF toLiveInput defensive clamping", () => {
  it("passes valid text through unchanged", () => {
    expect(toLiveInput(validText)).toEqual({
      monthlyBasicSalary: 40_000,
      employeeContributionPercent: 12,
      employerContributionPercent: 12,
      currentAge: 28,
      retirementAge: 58,
      expectedAnnualInterestRate: 8.25,
    })
  })

  it("falls back to the default for empty, NaN, or malformed text on every field", () => {
    for (const field of Object.keys(validText) as (keyof EPFFormValues)[]) {
      for (const malformed of ["", "abc", "NaN", "Infinity", "-1e10"]) {
        const input = toLiveInput({ ...validText, [field]: malformed })
        expect(Number.isFinite(input[field]), `${field}="${malformed}" produced a non-finite live value`).toBe(true)
      }
    }
  })

  it("clamps a below-minimum value up to the field's minimum", () => {
    const input = toLiveInput({ ...validText, monthlyBasicSalary: "-500", employeeContributionPercent: "-5" })
    expect(input.monthlyBasicSalary).toBe(0)
    expect(input.employeeContributionPercent).toBe(0)
  })

  it("clamps an above-maximum value down to the field's maximum", () => {
    const input = toLiveInput({ ...validText, monthlyBasicSalary: "999999999999", expectedAnnualInterestRate: "500" })
    expect(input.monthlyBasicSalary).toBe(10_000_000)
    expect(input.expectedAnnualInterestRate).toBe(15)
  })

  it("handles zero contribution at the slider minimum without producing NaN", () => {
    const input = toLiveInput({ ...validText, employeeContributionPercent: "0", employerContributionPercent: "0" })
    expect(input.employeeContributionPercent).toBe(0)
    expect(input.employerContributionPercent).toBe(0)
    expect(validateEPFInput(input).success).toBe(true)
    const result = calculateEPF(input)
    expect(result.maturityValue).toBe(0)
  })

  it("handles the minimum tenure by nudging retirement age to exactly one year after current age", () => {
    const equalAges = toLiveInput({ ...validText, currentAge: "59", retirementAge: "59" })
    expect(equalAges.currentAge).toBe(59)
    expect(equalAges.retirementAge).toBe(60)
    expect(validateEPFInput(equalAges).success).toBe(true)
    expect(calculateEPF(equalAges).schedule).toHaveLength(1)

    const invertedAges = toLiveInput({ ...validText, currentAge: "55", retirementAge: "40" })
    expect(invertedAges.retirementAge).toBe(56)
    expect(validateEPFInput(invertedAges).success).toBe(true)
  })

  it("handles the maximum tenure (age span) without overflowing the retirement-age ceiling", () => {
    const input = toLiveInput({ ...validText, currentAge: "18", retirementAge: "60" })
    expect(input).toMatchObject({ currentAge: 18, retirementAge: 60 })
    expect(validateEPFInput(input).success).toBe(true)
    const result = calculateEPF(input)
    expect(result.schedule).toHaveLength(42)
    expect(Number.isFinite(result.maturityValue)).toBe(true)
  })

  it("never nudges retirement age past its own maximum even when current age is already at the maximum", () => {
    const input = toLiveInput({ ...validText, currentAge: "59", retirementAge: "999" })
    expect(input.currentAge).toBe(59)
    expect(input.retirementAge).toBe(60)
  })

  it("always produces a fully valid, calculable input regardless of raw text extremes (the core defensive-clamp guarantee)", () => {
    const extremeCombinations: readonly Partial<EPFFormValues>[] = [
      { monthlyBasicSalary: "-1", employeeContributionPercent: "-1", employerContributionPercent: "-1", expectedAnnualInterestRate: "-1" },
      { monthlyBasicSalary: "1e20", employeeContributionPercent: "1000", employerContributionPercent: "1000", expectedAnnualInterestRate: "1000" },
      { currentAge: "0", retirementAge: "0" },
      { currentAge: "200", retirementAge: "1" },
      { monthlyBasicSalary: "", employeeContributionPercent: "", employerContributionPercent: "", currentAge: "", retirementAge: "", expectedAnnualInterestRate: "" },
    ]
    for (const overrides of extremeCombinations) {
      const input = toLiveInput({ ...validText, ...overrides })
      const validation = validateEPFInput(input)
      expect(validation.success, `toLiveInput(${JSON.stringify(overrides)}) => ${JSON.stringify(input)} failed validation`).toBe(true)
      expect(() => calculateEPF(input)).not.toThrow()
    }
  })

  it("falls back to EPF_DEFAULT_INPUT's values when every field is malformed", () => {
    const input = toLiveInput({ monthlyBasicSalary: "x", employeeContributionPercent: "x", employerContributionPercent: "x", currentAge: "x", retirementAge: "x", expectedAnnualInterestRate: "x" })
    expect(input).toEqual(EPF_DEFAULT_INPUT)
  })
})
