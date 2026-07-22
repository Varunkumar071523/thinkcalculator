import { describe, expect, it } from "vitest"

import { calculateLeaveEncashment } from "../calculate-leave-encashment"
import { LEAVE_ENCASHMENT_STATUTORY_LIMIT } from "../leave-encashment-regulatory-config"
import type { LeaveEncashmentInput } from "../leave-encashment-types"

const base: LeaveEncashmentInput = {
  employeeType: "non-government",
  lastDrawnBasicSalary: 300_000,
  averageMonthlySalary: 260_000,
  leaveEncashmentAmountReceived: 3_200_000,
  leaveDaysEncashed: 300,
  yearsOfCompletedService: 30,
  leaveDaysEarnedPerYear: 30,
  marginalTaxRate: 30,
}

describe("calculateLeaveEncashment — non-government least-of-four branches", () => {
  it("binds on the actual amount received", () => {
    const input: LeaveEncashmentInput = {
      ...base,
      leaveEncashmentAmountReceived: 100_000,
      averageMonthlySalary: 50_000, // ×10 = 500,000
      lastDrawnBasicSalary: 60_000, // daily 2,000
      yearsOfCompletedService: 10,
      leaveDaysEarnedPerYear: 30,
      leaveDaysEncashed: 300, // capped=300, credit = 300×2,000 = 600,000
    }
    const result = calculateLeaveEncashment(input)
    expect(result.bindingConstraint).toBe("actual-received")
    expect(result.exemptAmount).toBe(100_000)
    expect(result.taxableAmount).toBe(0)
  })

  it("binds on the 10-month average salary", () => {
    const input: LeaveEncashmentInput = {
      ...base,
      leaveEncashmentAmountReceived: 3_000_000,
      averageMonthlySalary: 50_000, // ×10 = 500,000
      lastDrawnBasicSalary: 200_000, // daily 6,666.67
      yearsOfCompletedService: 20,
      leaveDaysEarnedPerYear: 30, // capped days = 600
      leaveDaysEncashed: 600, // credit ≈ 4,000,000
    }
    const result = calculateLeaveEncashment(input)
    expect(result.bindingConstraint).toBe("ten-month-average")
    expect(result.exemptAmount).toBe(500_000)
    expect(result.taxableAmount).toBe(2_500_000)
  })

  it("binds on the cash equivalent of leave at credit", () => {
    const tuned: LeaveEncashmentInput = {
      ...base,
      leaveEncashmentAmountReceived: 3_000_000,
      averageMonthlySalary: 500_000, // ×10 = 5,000,000
      lastDrawnBasicSalary: 30_000, // daily 1,000
      yearsOfCompletedService: 5,
      leaveDaysEarnedPerYear: 20, // capped days = 100
      leaveDaysEncashed: 100, // credit = 100,000
    }
    const result = calculateLeaveEncashment(tuned)
    expect(result.eligibleLeaveDaysForCredit).toBe(100)
    expect(result.componentLeaveAtCredit).toBe(100_000)
    expect(result.bindingConstraint).toBe("leave-at-credit")
    expect(result.exemptAmount).toBe(100_000)
    expect(result.taxableAmount).toBe(2_900_000)
  })

  it("binds on the statutory limit (the worked-example scenario)", () => {
    const result = calculateLeaveEncashment(base)
    expect(result.componentActualReceived).toBe(3_200_000)
    expect(result.componentTenMonthAverageSalary).toBe(2_600_000)
    expect(result.componentLeaveAtCredit).toBe(3_000_000)
    expect(result.componentStatutoryLimit).toBe(LEAVE_ENCASHMENT_STATUTORY_LIMIT)
    expect(result.bindingConstraint).toBe("statutory-limit")
    expect(result.exemptAmount).toBe(2_500_000)
    expect(result.taxableAmount).toBe(700_000)
    expect(result.estimatedTaxOnTaxableAmount).toBe(210_000)
    expect(result.netAmountAfterTax).toBe(2_990_000)
  })
})

describe("calculateLeaveEncashment — government employees", () => {
  it("exempts the full amount received regardless of the other components", () => {
    const input: LeaveEncashmentInput = { ...base, employeeType: "government", leaveEncashmentAmountReceived: 10_000_000 }
    const result = calculateLeaveEncashment(input)
    expect(result.bindingConstraint).toBe("government-full-exemption")
    expect(result.exemptAmount).toBe(10_000_000)
    expect(result.taxableAmount).toBe(0)
    expect(result.estimatedTaxOnTaxableAmount).toBe(0)
    expect(result.netAmountAfterTax).toBe(10_000_000)
  })

  it("still reports the four components for display even though they do not bind", () => {
    const result = calculateLeaveEncashment({ ...base, employeeType: "government" })
    expect(result.componentStatutoryLimit).toBe(LEAVE_ENCASHMENT_STATUTORY_LIMIT)
    expect(Number.isFinite(result.componentLeaveAtCredit)).toBe(true)
    expect(Number.isFinite(result.componentTenMonthAverageSalary)).toBe(true)
  })
})

describe("calculateLeaveEncashment — defensive clamping and extreme inputs", () => {
  it("handles zero leave days, zero service years, and zero amounts without NaN or negative results", () => {
    const result = calculateLeaveEncashment({ ...base, leaveDaysEncashed: 0, yearsOfCompletedService: 0, leaveDaysEarnedPerYear: 0, leaveEncashmentAmountReceived: 0 })
    expect(result.statutoryCappedLeaveDays).toBe(0)
    expect(result.eligibleLeaveDaysForCredit).toBe(0)
    expect(result.componentLeaveAtCredit).toBe(0)
    expect(result.exemptAmount).toBe(0)
    expect(result.taxableAmount).toBe(0)
    expect(Number.isFinite(result.exemptAmount)).toBe(true)
    expect(result.exemptAmount).toBeGreaterThanOrEqual(0)
    expect(result.taxableAmount).toBeGreaterThanOrEqual(0)
  })

  it("handles zero last-drawn salary (zero daily rate) without producing NaN", () => {
    const result = calculateLeaveEncashment({ ...base, lastDrawnBasicSalary: 0 })
    expect(result.dailySalaryRate).toBe(0)
    expect(result.componentLeaveAtCredit).toBe(0)
    expect(Number.isFinite(result.exemptAmount)).toBe(true)
  })

  it("handles the maximum realistic service years and leave-earning rate without overflow", () => {
    const result = calculateLeaveEncashment({ ...base, yearsOfCompletedService: 60, leaveDaysEarnedPerYear: 60, leaveDaysEncashed: 3_650 })
    expect(result.statutoryCappedLeaveDays).toBe(1_800) // min(60,30) × 60
    expect(result.eligibleLeaveDaysForCredit).toBe(1_800) // min(3650, 1800)
    expect(Number.isFinite(result.componentLeaveAtCredit)).toBe(true)
    expect(Number.isFinite(result.exemptAmount)).toBe(true)
    expect(result.exemptAmount).toBeGreaterThanOrEqual(0)
  })

  it("never produces an exempt amount greater than the amount received", () => {
    for (const received of [0, 1, 100_000, 5_000_000, 100_000_000]) {
      const result = calculateLeaveEncashment({ ...base, leaveEncashmentAmountReceived: received })
      expect(result.exemptAmount).toBeLessThanOrEqual(received)
      expect(result.taxableAmount).toBe(received - result.exemptAmount)
    }
  })

  it("caps the leave-at-credit component at 30 days per year regardless of a higher earning rate", () => {
    const lower = calculateLeaveEncashment({ ...base, leaveDaysEarnedPerYear: 30, leaveDaysEncashed: 300, yearsOfCompletedService: 10 })
    const higher = calculateLeaveEncashment({ ...base, leaveDaysEarnedPerYear: 45, leaveDaysEncashed: 300, yearsOfCompletedService: 10 })
    expect(lower.statutoryCappedLeaveDays).toBe(300)
    expect(higher.statutoryCappedLeaveDays).toBe(300)
    expect(lower.componentLeaveAtCredit).toBe(higher.componentLeaveAtCredit)
  })

  it("rejects invalid input", () => {
    expect(() => calculateLeaveEncashment({ ...base, marginalTaxRate: 25 })).toThrow(RangeError)
    expect(() => calculateLeaveEncashment({ ...base, yearsOfCompletedService: -1 })).toThrow(RangeError)
    expect(() => calculateLeaveEncashment({ ...base, leaveEncashmentAmountReceived: Number.NaN })).toThrow(RangeError)
  })
})
