import {
  LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR,
  LEAVE_ENCASHMENT_STATUTORY_LIMIT,
} from "./leave-encashment-regulatory-config"
import { validateLeaveEncashmentInput } from "./leave-encashment-schema"
import type { LeaveEncashmentBindingConstraint, LeaveEncashmentInput, LeaveEncashmentResult } from "./leave-encashment-types"

type Candidate = { readonly key: LeaveEncashmentBindingConstraint; readonly value: number }

function leastOf(candidates: readonly Candidate[]): Candidate {
  return candidates.reduce((least, candidate) => (candidate.value < least.value ? candidate : least))
}

export function calculateLeaveEncashment(input: LeaveEncashmentInput): LeaveEncashmentResult {
  const validation = validateLeaveEncashmentInput(input)
  if (!validation.success) throw new RangeError("Invalid leave encashment input")

  const {
    employeeType,
    lastDrawnBasicSalary,
    averageMonthlySalary,
    leaveEncashmentAmountReceived,
    leaveDaysEncashed,
    yearsOfCompletedService,
    leaveDaysEarnedPerYear,
  } = validation.data

  const componentActualReceived = leaveEncashmentAmountReceived
  const componentTenMonthAverageSalary = averageMonthlySalary * 10
  const statutoryCappedLeaveDays = Math.min(leaveDaysEarnedPerYear, LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR) * yearsOfCompletedService
  const eligibleLeaveDaysForCredit = Math.min(leaveDaysEncashed, statutoryCappedLeaveDays)
  const dailySalaryRate = lastDrawnBasicSalary / 30
  const componentLeaveAtCredit = eligibleLeaveDaysForCredit * dailySalaryRate
  const componentStatutoryLimit = LEAVE_ENCASHMENT_STATUTORY_LIMIT

  let exemptAmount: number
  let bindingConstraint: LeaveEncashmentBindingConstraint
  if (employeeType === "government") {
    exemptAmount = componentActualReceived
    bindingConstraint = "government-full-exemption"
  } else {
    const least = leastOf([
      { key: "actual-received", value: componentActualReceived },
      { key: "ten-month-average", value: componentTenMonthAverageSalary },
      { key: "leave-at-credit", value: componentLeaveAtCredit },
      { key: "statutory-limit", value: componentStatutoryLimit },
    ])
    exemptAmount = least.value
    bindingConstraint = least.key
  }

  const taxableAmount = Math.max(0, leaveEncashmentAmountReceived - exemptAmount)
  const estimatedTaxOnTaxableAmount = taxableAmount * (validation.data.marginalTaxRate / 100)
  const netAmountAfterTax = leaveEncashmentAmountReceived - estimatedTaxOnTaxableAmount

  const numericValues = [
    componentTenMonthAverageSalary,
    statutoryCappedLeaveDays,
    eligibleLeaveDaysForCredit,
    dailySalaryRate,
    componentLeaveAtCredit,
    exemptAmount,
    taxableAmount,
    estimatedTaxOnTaxableAmount,
    netAmountAfterTax,
  ]
  if (!numericValues.every(Number.isFinite)) throw new RangeError("Leave encashment calculation produced a non-finite result")
  if (exemptAmount < 0 || taxableAmount < 0) throw new RangeError("Leave encashment calculation produced a negative exempt or taxable amount")

  return {
    ...validation.data,
    componentActualReceived,
    componentTenMonthAverageSalary,
    statutoryCappedLeaveDays,
    eligibleLeaveDaysForCredit,
    dailySalaryRate,
    componentLeaveAtCredit,
    componentStatutoryLimit,
    bindingConstraint,
    exemptAmount,
    taxableAmount,
    estimatedTaxOnTaxableAmount,
    netAmountAfterTax,
  }
}
