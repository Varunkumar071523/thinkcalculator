import type {
  LeaveEncashmentEmployeeType,
  LeaveEncashmentInput,
  LeaveEncashmentValidationErrors,
  LeaveEncashmentValidationResult,
} from "./leave-encashment-types"

export const LEAVE_ENCASHMENT_LIMITS = {
  lastDrawnBasicSalary: { min: 0, max: 10_000_000 },
  averageMonthlySalary: { min: 0, max: 10_000_000 },
  leaveEncashmentAmountReceived: { min: 0, max: 100_000_000 },
  leaveDaysEncashed: { min: 0, max: 3_650 },
  yearsOfCompletedService: { min: 0, max: 60 },
  leaveDaysEarnedPerYear: { min: 0, max: 60 },
} as const

/** Illustrative marginal-rate picker for the taxable-portion impact figure only — not the
 * statutory ₹25 lakh exemption cap, which is never user-editable (see
 * leave-encashment-regulatory-config.ts). Mirrors the fixed-band select pattern already used by
 * FOIR_BAND_OPTIONS (home-loan-eligibility-schema.ts) rather than a free-typed percentage. */
export const MARGINAL_TAX_RATE_OPTIONS: readonly { readonly label: string; readonly value: number }[] = [
  { label: "0% (no tax / rebate)", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
  { label: "15%", value: 15 },
  { label: "20%", value: 20 },
  { label: "30%", value: 30 },
]
const VALID_MARGINAL_TAX_RATES = new Set(MARGINAL_TAX_RATE_OPTIONS.map((option) => option.value))

export type LeaveEncashmentFormValues = {
  readonly employeeType: string
  readonly lastDrawnBasicSalary: string
  readonly averageMonthlySalary: string
  readonly leaveEncashmentAmountReceived: string
  readonly leaveDaysEncashed: string
  readonly yearsOfCompletedService: string
  readonly leaveDaysEarnedPerYear: string
  readonly marginalTaxRate: string
}

export function isLeaveEncashmentEmployeeType(value: string): value is LeaveEncashmentEmployeeType {
  return value === "government" || value === "non-government"
}

export function parseLeaveEncashmentNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^\d+(?:\.\d+)?$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateLeaveEncashmentInput(input: LeaveEncashmentInput): LeaveEncashmentValidationResult {
  const errors: LeaveEncashmentValidationErrors = {}
  const {
    employeeType,
    lastDrawnBasicSalary,
    averageMonthlySalary,
    leaveEncashmentAmountReceived,
    leaveDaysEncashed,
    yearsOfCompletedService,
    leaveDaysEarnedPerYear,
    marginalTaxRate,
  } = input

  if (!isLeaveEncashmentEmployeeType(employeeType)) errors.employeeType = "Choose an employee type."

  if (!Number.isFinite(lastDrawnBasicSalary) || lastDrawnBasicSalary < LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.min || lastDrawnBasicSalary > LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.max) {
    errors.lastDrawnBasicSalary = "Enter a last-drawn basic + DA salary between ₹0 and ₹1,00,00,000."
  }
  if (!Number.isFinite(averageMonthlySalary) || averageMonthlySalary < LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.min || averageMonthlySalary > LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.max) {
    errors.averageMonthlySalary = "Enter a 10-month average salary between ₹0 and ₹1,00,00,000."
  }
  if (!Number.isFinite(leaveEncashmentAmountReceived) || leaveEncashmentAmountReceived < LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.min || leaveEncashmentAmountReceived > LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.max) {
    errors.leaveEncashmentAmountReceived = "Enter a leave encashment amount between ₹0 and ₹10,00,00,000."
  }
  if (!Number.isInteger(leaveDaysEncashed) || leaveDaysEncashed < LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.min || leaveDaysEncashed > LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.max) {
    errors.leaveDaysEncashed = "Enter a whole number of leave days encashed from 0 to 3,650."
  }
  if (!Number.isInteger(yearsOfCompletedService) || yearsOfCompletedService < LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.min || yearsOfCompletedService > LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.max) {
    errors.yearsOfCompletedService = "Enter a whole number of completed years of service from 0 to 60."
  }
  if (!Number.isInteger(leaveDaysEarnedPerYear) || leaveDaysEarnedPerYear < LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.min || leaveDaysEarnedPerYear > LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.max) {
    errors.leaveDaysEarnedPerYear = "Enter a whole number of leave days earned per year from 0 to 60."
  }
  if (!VALID_MARGINAL_TAX_RATES.has(marginalTaxRate)) errors.marginalTaxRate = "Choose a marginal tax rate."

  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { ...input } }
}

export function parseAndValidateLeaveEncashmentForm(values: LeaveEncashmentFormValues): LeaveEncashmentValidationResult {
  const lastDrawnBasicSalary = parseLeaveEncashmentNumericText(values.lastDrawnBasicSalary)
  const averageMonthlySalary = parseLeaveEncashmentNumericText(values.averageMonthlySalary)
  const leaveEncashmentAmountReceived = parseLeaveEncashmentNumericText(values.leaveEncashmentAmountReceived)
  const leaveDaysEncashed = parseLeaveEncashmentNumericText(values.leaveDaysEncashed)
  const yearsOfCompletedService = parseLeaveEncashmentNumericText(values.yearsOfCompletedService)
  const leaveDaysEarnedPerYear = parseLeaveEncashmentNumericText(values.leaveDaysEarnedPerYear)
  const marginalTaxRate = parseLeaveEncashmentNumericText(values.marginalTaxRate)
  const errors: LeaveEncashmentValidationErrors = {}

  if (!isLeaveEncashmentEmployeeType(values.employeeType)) errors.employeeType = "Choose an employee type."
  if (lastDrawnBasicSalary === null) errors.lastDrawnBasicSalary = "Enter a valid plain-decimal last-drawn basic + DA salary."
  if (averageMonthlySalary === null) errors.averageMonthlySalary = "Enter a valid plain-decimal 10-month average salary."
  if (leaveEncashmentAmountReceived === null) errors.leaveEncashmentAmountReceived = "Enter a valid plain-decimal leave encashment amount."
  if (leaveDaysEncashed === null) errors.leaveDaysEncashed = "Enter leave days encashed as a whole number."
  if (yearsOfCompletedService === null) errors.yearsOfCompletedService = "Enter completed years of service as a whole number."
  if (leaveDaysEarnedPerYear === null) errors.leaveDaysEarnedPerYear = "Enter leave days earned per year as a whole number."
  if (marginalTaxRate === null) errors.marginalTaxRate = "Choose a marginal tax rate."

  if (
    Object.keys(errors).length
    || !isLeaveEncashmentEmployeeType(values.employeeType)
    || lastDrawnBasicSalary === null
    || averageMonthlySalary === null
    || leaveEncashmentAmountReceived === null
    || leaveDaysEncashed === null
    || yearsOfCompletedService === null
    || leaveDaysEarnedPerYear === null
    || marginalTaxRate === null
  ) {
    return { success: false, errors }
  }

  return validateLeaveEncashmentInput({
    employeeType: values.employeeType,
    lastDrawnBasicSalary,
    averageMonthlySalary,
    leaveEncashmentAmountReceived,
    leaveDaysEncashed,
    yearsOfCompletedService,
    leaveDaysEarnedPerYear,
    marginalTaxRate,
  })
}
