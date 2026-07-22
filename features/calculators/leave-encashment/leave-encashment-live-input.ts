import { LEAVE_ENCASHMENT_LIMITS, MARGINAL_TAX_RATE_OPTIONS, isLeaveEncashmentEmployeeType, type LeaveEncashmentFormValues } from "./leave-encashment-schema"
import type { LeaveEncashmentInput } from "./leave-encashment-types"
import { LEAVE_ENCASHMENT_DEFAULT_INPUT } from "./leave-encashment-url-state"

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

const VALID_MARGINAL_TAX_RATES = new Set(MARGINAL_TAX_RATE_OPTIONS.map((option) => option.value))

function clampMarginalTaxRate(value: number): number {
  return VALID_MARGINAL_TAX_RATES.has(value) ? value : LEAVE_ENCASHMENT_DEFAULT_INPUT.marginalTaxRate
}

/** Best-effort live view of the current form text, clamped into range on every keystroke/slider
 * move, so the result panel never hands calculateLeaveEncashment a NaN/Infinity/out-of-range
 * value from an empty or mid-edit field — same guard as epf-live-input.ts's toLiveInput, extracted
 * into its own module from the start (per this sprint's brief) rather than left inline in the
 * "use client" component, so the clamp behavior is directly unit-testable without mounting a
 * component. leaveDaysEncashed, yearsOfCompletedService, and leaveDaysEarnedPerYear are rounded to
 * whole numbers because calculateLeaveEncashment's own validation rejects non-integers for all
 * three; marginalTaxRate snaps to the nearest valid picker option rather than clamping, since it
 * is a fixed-band select (see MARGINAL_TAX_RATE_OPTIONS), not a continuous range. */
export function toLiveInput(values: LeaveEncashmentFormValues): LeaveEncashmentInput {
  return {
    employeeType: isLeaveEncashmentEmployeeType(values.employeeType) ? values.employeeType : LEAVE_ENCASHMENT_DEFAULT_INPUT.employeeType,
    lastDrawnBasicSalary: clampFinite(Number(values.lastDrawnBasicSalary), LEAVE_ENCASHMENT_DEFAULT_INPUT.lastDrawnBasicSalary, LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.min, LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.max),
    averageMonthlySalary: clampFinite(Number(values.averageMonthlySalary), LEAVE_ENCASHMENT_DEFAULT_INPUT.averageMonthlySalary, LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.min, LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.max),
    leaveEncashmentAmountReceived: clampFinite(Number(values.leaveEncashmentAmountReceived), LEAVE_ENCASHMENT_DEFAULT_INPUT.leaveEncashmentAmountReceived, LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.min, LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.max),
    leaveDaysEncashed: Math.round(clampFinite(Number(values.leaveDaysEncashed), LEAVE_ENCASHMENT_DEFAULT_INPUT.leaveDaysEncashed, LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.min, LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.max)),
    yearsOfCompletedService: Math.round(clampFinite(Number(values.yearsOfCompletedService), LEAVE_ENCASHMENT_DEFAULT_INPUT.yearsOfCompletedService, LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.min, LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.max)),
    leaveDaysEarnedPerYear: Math.round(clampFinite(Number(values.leaveDaysEarnedPerYear), LEAVE_ENCASHMENT_DEFAULT_INPUT.leaveDaysEarnedPerYear, LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.min, LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.max)),
    marginalTaxRate: clampMarginalTaxRate(Number(values.marginalTaxRate)),
  }
}
