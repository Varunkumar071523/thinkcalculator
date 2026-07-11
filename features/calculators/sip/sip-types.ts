export type SIPDurationUnit = "years" | "months"

export type SIPInput = {
  readonly monthlyInvestment: number
  readonly annualReturnRate: number
  readonly duration: number
  readonly durationUnit: SIPDurationUnit
}

export type SIPResult = {
  readonly monthlyInvestment: number
  readonly totalInvested: number
  readonly estimatedReturns: number
  readonly futureValue: number
  readonly monthlyRate: number
  readonly totalMonths: number
}
export type SIPScheduleRow = { readonly periodNumber: number; readonly monthsElapsed: number; readonly investedAmount: number; readonly estimatedReturns: number; readonly futureValue: number }

export type SIPField = keyof SIPInput
export type SIPValidationErrors = Partial<Record<SIPField, string>>

export type SIPValidationResult =
  | { readonly success: true; readonly data: SIPInput }
  | { readonly success: false; readonly errors: SIPValidationErrors }
