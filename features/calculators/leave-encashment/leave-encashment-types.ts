export type LeaveEncashmentEmployeeType = "government" | "non-government"

export type LeaveEncashmentBindingConstraint =
  | "government-full-exemption"
  | "actual-received"
  | "ten-month-average"
  | "leave-at-credit"
  | "statutory-limit"

export type LeaveEncashmentInput = {
  readonly employeeType: LeaveEncashmentEmployeeType
  readonly lastDrawnBasicSalary: number
  readonly averageMonthlySalary: number
  readonly leaveEncashmentAmountReceived: number
  readonly leaveDaysEncashed: number
  readonly yearsOfCompletedService: number
  readonly leaveDaysEarnedPerYear: number
  readonly marginalTaxRate: number
}

export type LeaveEncashmentResult = LeaveEncashmentInput & {
  readonly componentActualReceived: number
  readonly componentTenMonthAverageSalary: number
  readonly statutoryCappedLeaveDays: number
  readonly eligibleLeaveDaysForCredit: number
  readonly dailySalaryRate: number
  readonly componentLeaveAtCredit: number
  readonly componentStatutoryLimit: number
  readonly bindingConstraint: LeaveEncashmentBindingConstraint
  readonly exemptAmount: number
  readonly taxableAmount: number
  readonly estimatedTaxOnTaxableAmount: number
  readonly netAmountAfterTax: number
}

export type LeaveEncashmentField = keyof LeaveEncashmentInput
export type LeaveEncashmentValidationErrors = Partial<Record<LeaveEncashmentField, string>>
export type LeaveEncashmentValidationResult =
  | { readonly success: true; readonly data: LeaveEncashmentInput }
  | { readonly success: false; readonly errors: LeaveEncashmentValidationErrors }
