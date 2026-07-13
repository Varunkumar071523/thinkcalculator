import { describe, expect, it } from "vitest"

import {
  GRATUITY_LIMITS,
  parseAndValidateGratuityForm,
  parseGratuityNumericText,
  validateGratuityInput,
} from "../gratuity-schema"
import type { GratuityInput } from "../gratuity-types"

const valid: GratuityInput = { eligibleMonthlyWages: 50_000, completedYears: 7, additionalMonths: 7 }

describe("gratuity validation", () => {
  it("accepts valid inputs and upper boundaries", () => {
    expect(validateGratuityInput(valid)).toEqual({ success: true, data: valid })
    expect(validateGratuityInput({ eligibleMonthlyWages: GRATUITY_LIMITS.eligibleMonthlyWages.max, completedYears: 60, additionalMonths: 11 }).success).toBe(true)
  })

  it("rejects zero, negative, non-finite, and excessive wages", () => {
    for (const eligibleMonthlyWages of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, GRATUITY_LIMITS.eligibleMonthlyWages.max + 1]) {
      expect(validateGratuityInput({ ...valid, eligibleMonthlyWages }).success).toBe(false)
    }
  })

  it("rejects negative, fractional, and excessive completed years", () => {
    for (const completedYears of [-1, 1.5, 61, Number.NaN, Number.NEGATIVE_INFINITY]) {
      expect(validateGratuityInput({ ...valid, completedYears }).success).toBe(false)
    }
  })

  it("accepts month boundaries and rejects out-of-range or fractional months", () => {
    for (const additionalMonths of [0, 6, 7, 11]) expect(validateGratuityInput({ ...valid, additionalMonths }).success).toBe(true)
    for (const additionalMonths of [-1, 0.5, 11.5, 12, Number.NaN, Number.POSITIVE_INFINITY]) expect(validateGratuityInput({ ...valid, additionalMonths }).success).toBe(false)
  })

  it("strictly parses plain decimal numeric text", () => {
    for (const value of ["0", "0.01", ".5", "7", "50000.55"]) expect(parseGratuityNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 7", "7 ", "50,000", "₹50000", "+7", "-1", "1e3", "1.", ".", "NaN", "Infinity"]) expect(parseGratuityNumericText(value)).toBeNull()
  })

  it("rejects empty and malformed form values without dropping entered fields", () => {
    const empty = parseAndValidateGratuityForm({ eligibleMonthlyWages: "", completedYears: "", additionalMonths: "" })
    expect(empty.success).toBe(false)
    if (!empty.success) expect(Object.keys(empty.errors).sort()).toEqual(["additionalMonths", "completedYears", "eligibleMonthlyWages"])
    expect(parseAndValidateGratuityForm({ eligibleMonthlyWages: "50,000", completedYears: "7", additionalMonths: "7" }).success).toBe(false)
  })
})
