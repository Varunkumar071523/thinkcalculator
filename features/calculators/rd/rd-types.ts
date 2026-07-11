export type RDDurationUnit = "years" | "months"
export type RDCompoundingFrequency = "monthly" | "quarterly" | "half-yearly" | "yearly"

export type RDInput = {
  readonly monthlyDeposit: number
  readonly annualInterestRate: number
  readonly duration: number
  readonly durationUnit: RDDurationUnit
  readonly compoundingFrequency: RDCompoundingFrequency
}

export type RDResult = {
  readonly monthlyDeposit: number
  readonly totalDeposited: number
  readonly interestEarned: number
  readonly maturityAmount: number
  readonly annualInterestRate: number
  readonly compoundingFrequency: RDCompoundingFrequency
  readonly compoundingPeriodsPerYear: number
  readonly totalMonths: number
  readonly durationInYears: number
}
export type RDScheduleRow = { readonly periodNumber: number; readonly monthsElapsed: number; readonly totalDeposited: number; readonly interestEarned: number; readonly maturityAmount: number }

export type RDField = keyof RDInput
export type RDValidationErrors = Partial<Record<RDField, string>>
export type RDValidationResult =
  | { readonly success: true; readonly data: RDInput }
  | { readonly success: false; readonly errors: RDValidationErrors }
