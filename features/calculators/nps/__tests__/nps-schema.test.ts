import { describe, expect, it } from "vitest"

import {
  NPS_LIMITS,
  parseAndValidateNPSForm,
  parseNPSNumericText,
  validateNPSInput,
} from "../nps-schema"
import type { NPSInput } from "../nps-types"

const valid: NPSInput = {
  monthlyContribution: 10_000,
  currentAge: 30,
  retirementAge: 60,
  equityAllocationPercent: 50,
  corporateDebtAllocationPercent: 30,
  equityExpectedReturn: 12,
  corporateDebtExpectedReturn: 8,
  govtSecuritiesExpectedReturn: 7,
}

describe("NPS validation", () => {
  it("accepts valid inputs and boundary values", () => {
    expect(validateNPSInput(valid)).toEqual({ success: true, data: valid })
    expect(validateNPSInput({ ...valid, monthlyContribution: NPS_LIMITS.monthlyContribution.min }).success).toBe(true)
    expect(validateNPSInput({ ...valid, monthlyContribution: NPS_LIMITS.monthlyContribution.max }).success).toBe(true)
    expect(validateNPSInput({ ...valid, currentAge: NPS_LIMITS.currentAge.min, retirementAge: NPS_LIMITS.currentAge.min + 1 }).success).toBe(true)
    expect(validateNPSInput({ ...valid, currentAge: NPS_LIMITS.currentAge.max, retirementAge: NPS_LIMITS.retirementAge.max }).success).toBe(true)
  })

  it("accepts equity and corporate debt allocations that together equal exactly 100%", () => {
    expect(validateNPSInput({ ...valid, equityAllocationPercent: 100, corporateDebtAllocationPercent: 0 }).success).toBe(true)
    expect(validateNPSInput({ ...valid, equityAllocationPercent: 0, corporateDebtAllocationPercent: 100 }).success).toBe(true)
    expect(validateNPSInput({ ...valid, equityAllocationPercent: 60, corporateDebtAllocationPercent: 40 }).success).toBe(true)
  })

  it("rejects equity and corporate debt allocations that together exceed 100%", () => {
    const result = validateNPSInput({ ...valid, equityAllocationPercent: 80, corporateDebtAllocationPercent: 40 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.corporateDebtAllocationPercent).toBeTruthy()
  })

  it("rejects negative, non-finite, and excessive monthly contribution", () => {
    for (const monthlyContribution of [-1, Number.NaN, Number.POSITIVE_INFINITY, NPS_LIMITS.monthlyContribution.max + 1]) {
      expect(validateNPSInput({ ...valid, monthlyContribution }).success).toBe(false)
    }
  })

  it("rejects fractional or out-of-range ages", () => {
    for (const currentAge of [17, 66, 30.5, Number.NaN]) expect(validateNPSInput({ ...valid, currentAge }).success).toBe(false)
    for (const retirementAge of [18, 76, 60.5, Number.NaN]) expect(validateNPSInput({ ...valid, retirementAge }).success).toBe(false)
  })

  it("rejects a retirement age that is not after the current age", () => {
    expect(validateNPSInput({ ...valid, currentAge: 40, retirementAge: 40 }).success).toBe(false)
  })

  it("rejects out-of-range allocation and return percentages", () => {
    for (const equityAllocationPercent of [-1, 101]) expect(validateNPSInput({ ...valid, equityAllocationPercent }).success).toBe(false)
    for (const equityExpectedReturn of [-0.1, 20.1]) expect(validateNPSInput({ ...valid, equityExpectedReturn }).success).toBe(false)
    for (const corporateDebtExpectedReturn of [-0.1, 12.1]) expect(validateNPSInput({ ...valid, corporateDebtExpectedReturn }).success).toBe(false)
    for (const govtSecuritiesExpectedReturn of [-0.1, 10.1]) expect(validateNPSInput({ ...valid, govtSecuritiesExpectedReturn }).success).toBe(false)
  })

  it("strictly parses plain decimal numeric text", () => {
    for (const value of ["0", "0.01", ".5", "12", "10000.55"]) expect(parseNPSNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 12", "12 ", "10,000", "₹10000", "+12", "-1", "1e3", "1.", ".", "NaN", "Infinity"]) expect(parseNPSNumericText(value)).toBeNull()
  })

  it("rejects empty and malformed form values without dropping entered fields", () => {
    const empty = parseAndValidateNPSForm({ monthlyContribution: "", currentAge: "", retirementAge: "", equityAllocationPercent: "", corporateDebtAllocationPercent: "", equityExpectedReturn: "", corporateDebtExpectedReturn: "", govtSecuritiesExpectedReturn: "" })
    expect(empty.success).toBe(false)
    if (!empty.success) {
      expect(Object.keys(empty.errors).sort()).toEqual([
        "corporateDebtAllocationPercent", "corporateDebtExpectedReturn", "currentAge",
        "equityAllocationPercent", "equityExpectedReturn", "govtSecuritiesExpectedReturn",
        "monthlyContribution", "retirementAge",
      ])
    }
  })

  it("parses a fully valid form", () => {
    const result = parseAndValidateNPSForm({ monthlyContribution: "10000", currentAge: "30", retirementAge: "60", equityAllocationPercent: "50", corporateDebtAllocationPercent: "30", equityExpectedReturn: "12", corporateDebtExpectedReturn: "8", govtSecuritiesExpectedReturn: "7" })
    expect(result).toEqual({ success: true, data: valid })
  })
})
