import { describe, expect, it } from "vitest"

import {
  EPF_LIMITS,
  parseAndValidateEPFForm,
  parseEPFNumericText,
  validateEPFInput,
} from "../epf-schema"
import type { EPFInput } from "../epf-types"

const valid: EPFInput = {
  monthlyBasicSalary: 40_000,
  employeeContributionPercent: 12,
  employerContributionPercent: 12,
  currentAge: 28,
  retirementAge: 58,
  expectedAnnualInterestRate: 8.25,
}

describe("EPF validation", () => {
  it("accepts valid inputs and boundary values", () => {
    expect(validateEPFInput(valid)).toEqual({ success: true, data: valid })
    expect(validateEPFInput({ ...valid, monthlyBasicSalary: EPF_LIMITS.monthlyBasicSalary.min }).success).toBe(true)
    expect(validateEPFInput({ ...valid, monthlyBasicSalary: EPF_LIMITS.monthlyBasicSalary.max }).success).toBe(true)
    expect(validateEPFInput({ ...valid, employeeContributionPercent: 0, employerContributionPercent: 0 }).success).toBe(true)
    expect(validateEPFInput({ ...valid, employeeContributionPercent: 100, employerContributionPercent: 100 }).success).toBe(true)
    expect(validateEPFInput({ ...valid, currentAge: EPF_LIMITS.currentAge.min, retirementAge: EPF_LIMITS.currentAge.min + 1 }).success).toBe(true)
    expect(validateEPFInput({ ...valid, currentAge: EPF_LIMITS.retirementAge.max - 1, retirementAge: EPF_LIMITS.retirementAge.max }).success).toBe(true)
  })

  it("rejects negative, non-finite, and excessive monthly basic salary", () => {
    for (const monthlyBasicSalary of [-1, Number.NaN, Number.POSITIVE_INFINITY, EPF_LIMITS.monthlyBasicSalary.max + 1]) {
      expect(validateEPFInput({ ...valid, monthlyBasicSalary }).success).toBe(false)
    }
  })

  it("rejects out-of-range contribution rates", () => {
    for (const employeeContributionPercent of [-1, 101, Number.NaN]) {
      expect(validateEPFInput({ ...valid, employeeContributionPercent }).success).toBe(false)
    }
    for (const employerContributionPercent of [-1, 101, Number.NaN]) {
      expect(validateEPFInput({ ...valid, employerContributionPercent }).success).toBe(false)
    }
  })

  it("rejects fractional or out-of-range ages", () => {
    for (const currentAge of [17, 60, 28.5, Number.NaN]) expect(validateEPFInput({ ...valid, currentAge }).success).toBe(false)
    for (const retirementAge of [18, 61, 58.5, Number.NaN]) expect(validateEPFInput({ ...valid, retirementAge }).success).toBe(false)
  })

  it("rejects a retirement age that is not after the current age", () => {
    expect(validateEPFInput({ ...valid, currentAge: 40, retirementAge: 40 }).success).toBe(false)
    expect(validateEPFInput({ ...valid, currentAge: 40, retirementAge: 39 }).success).toBe(false)
  })

  it("rejects out-of-range interest rates", () => {
    for (const expectedAnnualInterestRate of [-0.1, 15.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateEPFInput({ ...valid, expectedAnnualInterestRate }).success).toBe(false)
    }
  })

  it("strictly parses plain decimal numeric text", () => {
    for (const value of ["0", "0.01", ".5", "12", "40000.55"]) expect(parseEPFNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 12", "12 ", "40,000", "₹40000", "+12", "-1", "1e3", "1.", ".", "NaN", "Infinity"]) expect(parseEPFNumericText(value)).toBeNull()
  })

  it("rejects empty and malformed form values without dropping entered fields", () => {
    const empty = parseAndValidateEPFForm({ monthlyBasicSalary: "", employeeContributionPercent: "", employerContributionPercent: "", currentAge: "", retirementAge: "", expectedAnnualInterestRate: "" })
    expect(empty.success).toBe(false)
    if (!empty.success) expect(Object.keys(empty.errors).sort()).toEqual(["currentAge", "employeeContributionPercent", "employerContributionPercent", "expectedAnnualInterestRate", "monthlyBasicSalary", "retirementAge"])
    expect(parseAndValidateEPFForm({ monthlyBasicSalary: "40,000", employeeContributionPercent: "12", employerContributionPercent: "12", currentAge: "28", retirementAge: "58", expectedAnnualInterestRate: "8.25" }).success).toBe(false)
  })

  it("parses a fully valid form", () => {
    const result = parseAndValidateEPFForm({ monthlyBasicSalary: "40000", employeeContributionPercent: "12", employerContributionPercent: "12", currentAge: "28", retirementAge: "58", expectedAnnualInterestRate: "8.25" })
    expect(result).toEqual({ success: true, data: valid })
  })
})
