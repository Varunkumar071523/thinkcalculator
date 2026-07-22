import { describe, expect, it } from "vitest"

import {
  LEAVE_ENCASHMENT_LIMITS,
  isLeaveEncashmentEmployeeType,
  parseAndValidateLeaveEncashmentForm,
  parseLeaveEncashmentNumericText,
  validateLeaveEncashmentInput,
} from "../leave-encashment-schema"
import type { LeaveEncashmentInput } from "../leave-encashment-types"

const valid: LeaveEncashmentInput = {
  employeeType: "non-government",
  lastDrawnBasicSalary: 300_000,
  averageMonthlySalary: 260_000,
  leaveEncashmentAmountReceived: 3_200_000,
  leaveDaysEncashed: 300,
  yearsOfCompletedService: 30,
  leaveDaysEarnedPerYear: 30,
  marginalTaxRate: 30,
}

describe("isLeaveEncashmentEmployeeType", () => {
  it("accepts only the two known employee types", () => {
    expect(isLeaveEncashmentEmployeeType("government")).toBe(true)
    expect(isLeaveEncashmentEmployeeType("non-government")).toBe(true)
    expect(isLeaveEncashmentEmployeeType("psu")).toBe(false)
    expect(isLeaveEncashmentEmployeeType("")).toBe(false)
  })
})

describe("leave encashment validation", () => {
  it("accepts valid inputs and both employee types", () => {
    expect(validateLeaveEncashmentInput(valid)).toEqual({ success: true, data: valid })
    expect(validateLeaveEncashmentInput({ ...valid, employeeType: "government" }).success).toBe(true)
  })

  it("accepts zero-value edge cases (0 leave days, 0 years, 0 amounts)", () => {
    expect(validateLeaveEncashmentInput({ ...valid, leaveDaysEncashed: 0, yearsOfCompletedService: 0, leaveDaysEarnedPerYear: 0, leaveEncashmentAmountReceived: 0, lastDrawnBasicSalary: 0, averageMonthlySalary: 0 }).success).toBe(true)
  })

  it("accepts upper boundaries for every numeric field", () => {
    expect(validateLeaveEncashmentInput({
      ...valid,
      lastDrawnBasicSalary: LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.max,
      averageMonthlySalary: LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.max,
      leaveEncashmentAmountReceived: LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.max,
      leaveDaysEncashed: LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.max,
      yearsOfCompletedService: LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.max,
      leaveDaysEarnedPerYear: LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.max,
    }).success).toBe(true)
  })

  it("rejects an invalid employee type", () => {
    expect(validateLeaveEncashmentInput({ ...valid, employeeType: "contractor" as never }).success).toBe(false)
  })

  it("rejects negative, non-finite, and excessive salary and amount fields", () => {
    for (const field of ["lastDrawnBasicSalary", "averageMonthlySalary", "leaveEncashmentAmountReceived"] as const) {
      for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, LEAVE_ENCASHMENT_LIMITS[field].max + 1]) {
        expect(validateLeaveEncashmentInput({ ...valid, [field]: bad }).success, `${field}=${bad} should be rejected`).toBe(false)
      }
    }
  })

  it("rejects negative, fractional, and excessive counts", () => {
    for (const field of ["leaveDaysEncashed", "yearsOfCompletedService", "leaveDaysEarnedPerYear"] as const) {
      for (const bad of [-1, 1.5, Number.NaN, LEAVE_ENCASHMENT_LIMITS[field].max + 1]) {
        expect(validateLeaveEncashmentInput({ ...valid, [field]: bad }).success, `${field}=${bad} should be rejected`).toBe(false)
      }
    }
  })

  it("rejects a marginal tax rate outside the fixed picker options", () => {
    for (const bad of [1, 25, 40, -5, Number.NaN]) {
      expect(validateLeaveEncashmentInput({ ...valid, marginalTaxRate: bad }).success).toBe(false)
    }
  })

  it("accepts every marginal tax rate option", () => {
    for (const rate of [0, 5, 10, 15, 20, 30]) {
      expect(validateLeaveEncashmentInput({ ...valid, marginalTaxRate: rate }).success).toBe(true)
    }
  })

  it("strictly parses plain decimal numeric text", () => {
    for (const value of ["0", "0.01", "7", "300000", "50000.55"]) expect(parseLeaveEncashmentNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 7", "7 ", "50,000", "₹50000", "+7", "-1", "1e3", ".5", "1.", ".", "NaN", "Infinity"]) expect(parseLeaveEncashmentNumericText(value)).toBeNull()
  })

  it("rejects empty and malformed form values without dropping entered fields", () => {
    const empty = parseAndValidateLeaveEncashmentForm({
      employeeType: "",
      lastDrawnBasicSalary: "",
      averageMonthlySalary: "",
      leaveEncashmentAmountReceived: "",
      leaveDaysEncashed: "",
      yearsOfCompletedService: "",
      leaveDaysEarnedPerYear: "",
      marginalTaxRate: "",
    })
    expect(empty.success).toBe(false)
    if (!empty.success) {
      expect(Object.keys(empty.errors).sort()).toEqual([
        "averageMonthlySalary",
        "employeeType",
        "lastDrawnBasicSalary",
        "leaveDaysEarnedPerYear",
        "leaveDaysEncashed",
        "leaveEncashmentAmountReceived",
        "marginalTaxRate",
        "yearsOfCompletedService",
      ])
    }
  })

  it("parses a fully valid form", () => {
    const result = parseAndValidateLeaveEncashmentForm({
      employeeType: "non-government",
      lastDrawnBasicSalary: "300000",
      averageMonthlySalary: "260000",
      leaveEncashmentAmountReceived: "3200000",
      leaveDaysEncashed: "300",
      yearsOfCompletedService: "30",
      leaveDaysEarnedPerYear: "30",
      marginalTaxRate: "30",
    })
    expect(result).toEqual({ success: true, data: valid })
  })
})
