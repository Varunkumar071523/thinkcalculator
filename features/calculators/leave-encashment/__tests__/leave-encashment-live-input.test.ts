import { describe, expect, it } from "vitest"

import { calculateLeaveEncashment } from "../calculate-leave-encashment"
import { toLiveInput } from "../leave-encashment-live-input"
import { validateLeaveEncashmentInput } from "../leave-encashment-schema"
import type { LeaveEncashmentFormValues } from "../leave-encashment-schema"
import { LEAVE_ENCASHMENT_DEFAULT_INPUT } from "../leave-encashment-url-state"

const validText: LeaveEncashmentFormValues = {
  employeeType: "non-government",
  lastDrawnBasicSalary: "300000",
  averageMonthlySalary: "260000",
  leaveEncashmentAmountReceived: "3200000",
  leaveDaysEncashed: "300",
  yearsOfCompletedService: "30",
  leaveDaysEarnedPerYear: "30",
  marginalTaxRate: "30",
}

describe("leave encashment toLiveInput defensive clamping", () => {
  it("passes valid text through unchanged", () => {
    expect(toLiveInput(validText)).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })

  it("falls back to the default for empty, NaN, or malformed text on every numeric field", () => {
    const numericFields = ["lastDrawnBasicSalary", "averageMonthlySalary", "leaveEncashmentAmountReceived", "leaveDaysEncashed", "yearsOfCompletedService", "leaveDaysEarnedPerYear"] as const
    for (const field of numericFields) {
      for (const malformed of ["", "abc", "NaN", "Infinity", "-1e10"]) {
        const input = toLiveInput({ ...validText, [field]: malformed })
        expect(Number.isFinite(input[field]), `${field}="${malformed}" produced a non-finite live value`).toBe(true)
      }
    }
  })

  it("falls back to the default employee type for an unrecognised value", () => {
    expect(toLiveInput({ ...validText, employeeType: "contractor" }).employeeType).toBe(LEAVE_ENCASHMENT_DEFAULT_INPUT.employeeType)
    expect(toLiveInput({ ...validText, employeeType: "" }).employeeType).toBe(LEAVE_ENCASHMENT_DEFAULT_INPUT.employeeType)
    expect(toLiveInput({ ...validText, employeeType: "government" }).employeeType).toBe("government")
  })

  it("snaps an out-of-band marginal tax rate to the default rather than clamping to a nearby value", () => {
    expect(toLiveInput({ ...validText, marginalTaxRate: "25" }).marginalTaxRate).toBe(LEAVE_ENCASHMENT_DEFAULT_INPUT.marginalTaxRate)
    expect(toLiveInput({ ...validText, marginalTaxRate: "abc" }).marginalTaxRate).toBe(LEAVE_ENCASHMENT_DEFAULT_INPUT.marginalTaxRate)
    // Number("") is 0, which happens to be a valid picker option, so it is returned as-is rather than falling back.
    expect(toLiveInput({ ...validText, marginalTaxRate: "" }).marginalTaxRate).toBe(0)
    expect(toLiveInput({ ...validText, marginalTaxRate: "0" }).marginalTaxRate).toBe(0)
  })

  it("clamps a below-minimum value up to the field's minimum", () => {
    const input = toLiveInput({ ...validText, leaveDaysEncashed: "-50", yearsOfCompletedService: "-5" })
    expect(input.leaveDaysEncashed).toBe(0)
    expect(input.yearsOfCompletedService).toBe(0)
  })

  it("clamps an above-maximum value down to the field's maximum", () => {
    const input = toLiveInput({ ...validText, leaveEncashmentAmountReceived: "999999999999", yearsOfCompletedService: "999" })
    expect(input.leaveEncashmentAmountReceived).toBe(100_000_000)
    expect(input.yearsOfCompletedService).toBe(60)
  })

  it("rounds fractional day/year counts to whole numbers", () => {
    const input = toLiveInput({ ...validText, leaveDaysEncashed: "300.6", yearsOfCompletedService: "29.4", leaveDaysEarnedPerYear: "30.5" })
    expect(input.leaveDaysEncashed).toBe(301)
    expect(input.yearsOfCompletedService).toBe(29)
    expect(input.leaveDaysEarnedPerYear).toBe(31)
  })

  it("handles zero leave days and zero service years at the slider minimum without producing NaN", () => {
    const input = toLiveInput({ ...validText, leaveDaysEncashed: "0", yearsOfCompletedService: "0", leaveDaysEarnedPerYear: "0" })
    expect(validateLeaveEncashmentInput(input).success).toBe(true)
    const result = calculateLeaveEncashment(input)
    expect(result.exemptAmount).toBe(0)
    expect(Number.isFinite(result.taxableAmount)).toBe(true)
  })

  it("always produces a fully valid, calculable input regardless of raw text extremes (the core defensive-clamp guarantee)", () => {
    const extremeCombinations: readonly Partial<LeaveEncashmentFormValues>[] = [
      { lastDrawnBasicSalary: "-1", averageMonthlySalary: "-1", leaveEncashmentAmountReceived: "-1", leaveDaysEncashed: "-1", yearsOfCompletedService: "-1", leaveDaysEarnedPerYear: "-1" },
      { lastDrawnBasicSalary: "1e20", averageMonthlySalary: "1e20", leaveEncashmentAmountReceived: "1e20", leaveDaysEncashed: "999999", yearsOfCompletedService: "999", leaveDaysEarnedPerYear: "999" },
      { leaveDaysEncashed: "0", yearsOfCompletedService: "0", leaveDaysEarnedPerYear: "0" },
      { employeeType: "not-a-type", marginalTaxRate: "999" },
      { lastDrawnBasicSalary: "", averageMonthlySalary: "", leaveEncashmentAmountReceived: "", leaveDaysEncashed: "", yearsOfCompletedService: "", leaveDaysEarnedPerYear: "", marginalTaxRate: "", employeeType: "" },
    ]
    for (const overrides of extremeCombinations) {
      const input = toLiveInput({ ...validText, ...overrides })
      const validation = validateLeaveEncashmentInput(input)
      expect(validation.success, `toLiveInput(${JSON.stringify(overrides)}) => ${JSON.stringify(input)} failed validation`).toBe(true)
      expect(() => calculateLeaveEncashment(input)).not.toThrow()
      const result = calculateLeaveEncashment(input)
      expect(result.exemptAmount).toBeGreaterThanOrEqual(0)
      expect(result.taxableAmount).toBeGreaterThanOrEqual(0)
    }
  })

  it("falls back to LEAVE_ENCASHMENT_DEFAULT_INPUT's values when every field is malformed", () => {
    const input = toLiveInput({
      employeeType: "x",
      lastDrawnBasicSalary: "x",
      averageMonthlySalary: "x",
      leaveEncashmentAmountReceived: "x",
      leaveDaysEncashed: "x",
      yearsOfCompletedService: "x",
      leaveDaysEarnedPerYear: "x",
      marginalTaxRate: "x",
    })
    expect(input).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })
})
