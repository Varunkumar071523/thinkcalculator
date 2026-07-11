export type FDDurationUnit = "years" | "months"
export type FDCompoundingFrequency = "monthly" | "quarterly" | "half-yearly" | "yearly"

export type FDInput = {
  readonly principalAmount: number
  readonly annualInterestRate: number
  readonly duration: number
  readonly durationUnit: FDDurationUnit
  readonly compoundingFrequency: FDCompoundingFrequency
}

export type FDResult = {
  readonly principalAmount: number
  readonly interestEarned: number
  readonly maturityAmount: number
  readonly annualInterestRate: number
  readonly compoundingFrequency: FDCompoundingFrequency
  readonly compoundingPeriodsPerYear: number
  readonly durationInYears: number
  readonly totalMonths: number
}

export type FDField = keyof FDInput
export type FDValidationErrors = Partial<Record<FDField, string>>

export type FDValidationResult =
  | { readonly success: true; readonly data: FDInput }
  | { readonly success: false; readonly errors: FDValidationErrors }
