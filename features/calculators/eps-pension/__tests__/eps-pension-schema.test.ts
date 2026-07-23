import { describe, expect, it } from "vitest"

import {
  EPS_PENSION_LIMITS,
  isEpsPensionAgeOption,
  parseAndValidateEpsPensionForm,
  parseEpsPensionNumericText,
  validateEpsPensionInput,
} from "../eps-pension-schema"
import type { EpsPensionInput } from "../eps-pension-types"

const valid: EpsPensionInput = {
  averageMonthlySalary: 24_000,
  yearsOfPensionableService: 26,
  ageOption: "standard",
  earlyPensionAge: 50,
}

describe("isEpsPensionAgeOption", () => {
  it("accepts only the two known age options", () => {
    expect(isEpsPensionAgeOption("standard")).toBe(true)
    expect(isEpsPensionAgeOption("early")).toBe(true)
    expect(isEpsPensionAgeOption("deferred")).toBe(false)
    expect(isEpsPensionAgeOption("")).toBe(false)
  })
})

describe("EPS pension validation", () => {
  it("accepts valid inputs and both age options", () => {
    expect(validateEpsPensionInput(valid)).toEqual({ success: true, data: valid })
    expect(validateEpsPensionInput({ ...valid, ageOption: "early" }).success).toBe(true)
  })

  it("accepts zero-value edge cases (0 salary, 0 years)", () => {
    expect(validateEpsPensionInput({ ...valid, averageMonthlySalary: 0, yearsOfPensionableService: 0 }).success).toBe(true)
  })

  it("accepts upper boundaries for every numeric field", () => {
    expect(validateEpsPensionInput({
      ...valid,
      averageMonthlySalary: EPS_PENSION_LIMITS.averageMonthlySalary.max,
      yearsOfPensionableService: EPS_PENSION_LIMITS.yearsOfPensionableService.max,
      earlyPensionAge: EPS_PENSION_LIMITS.earlyPensionAge.max,
    }).success).toBe(true)
  })

  it("rejects an invalid age option", () => {
    expect(validateEpsPensionInput({ ...valid, ageOption: "deferred" as never }).success).toBe(false)
  })

  it("rejects negative, non-finite, and excessive salary", () => {
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, EPS_PENSION_LIMITS.averageMonthlySalary.max + 1]) {
      expect(validateEpsPensionInput({ ...valid, averageMonthlySalary: bad }).success, `averageMonthlySalary=${bad} should be rejected`).toBe(false)
    }
  })

  it("rejects negative, fractional, and excessive service years", () => {
    for (const bad of [-1, 1.5, Number.NaN, EPS_PENSION_LIMITS.yearsOfPensionableService.max + 1]) {
      expect(validateEpsPensionInput({ ...valid, yearsOfPensionableService: bad }).success, `yearsOfPensionableService=${bad} should be rejected`).toBe(false)
    }
  })

  it("rejects an early pension age outside the 50–57 range", () => {
    for (const bad of [49, 58, 0, -1, 1.5, Number.NaN]) {
      expect(validateEpsPensionInput({ ...valid, earlyPensionAge: bad }).success, `earlyPensionAge=${bad} should be rejected`).toBe(false)
    }
  })

  it("accepts every value in the early pension age range", () => {
    for (let age = EPS_PENSION_LIMITS.earlyPensionAge.min; age <= EPS_PENSION_LIMITS.earlyPensionAge.max; age += 1) {
      expect(validateEpsPensionInput({ ...valid, earlyPensionAge: age }).success).toBe(true)
    }
  })

  it("strictly parses plain decimal numeric text", () => {
    for (const value of ["0", "0.01", "7", "24000", "26"]) expect(parseEpsPensionNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 7", "7 ", "24,000", "₹24000", "+7", "-1", "1e3", ".5", "1.", ".", "NaN", "Infinity"]) expect(parseEpsPensionNumericText(value)).toBeNull()
  })

  it("rejects empty and malformed form values without dropping entered fields", () => {
    const empty = parseAndValidateEpsPensionForm({
      averageMonthlySalary: "",
      yearsOfPensionableService: "",
      ageOption: "",
      earlyPensionAge: "",
    })
    expect(empty.success).toBe(false)
    if (!empty.success) {
      expect(Object.keys(empty.errors).sort()).toEqual([
        "ageOption",
        "averageMonthlySalary",
        "earlyPensionAge",
        "yearsOfPensionableService",
      ])
    }
  })

  it("parses a fully valid form", () => {
    const result = parseAndValidateEpsPensionForm({
      averageMonthlySalary: "24000",
      yearsOfPensionableService: "26",
      ageOption: "standard",
      earlyPensionAge: "50",
    })
    expect(result).toEqual({ success: true, data: valid })
  })
})
