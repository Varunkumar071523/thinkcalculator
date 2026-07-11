export type LumpsumDurationUnit = "years" | "months"

export type LumpsumInput = {
  readonly initialInvestment: number
  readonly annualReturnRate: number
  readonly duration: number
  readonly durationUnit: LumpsumDurationUnit
}

export type LumpsumResult = {
  readonly initialInvestment: number
  readonly estimatedReturns: number
  readonly futureValue: number
  readonly annualRate: number
  readonly durationInYears: number
  readonly totalMonths: number
}
export type LumpsumScheduleRow = { readonly periodNumber: number; readonly monthsElapsed: number; readonly initialInvestment: number; readonly estimatedReturns: number; readonly futureValue: number }

export type LumpsumField = keyof LumpsumInput
export type LumpsumValidationErrors = Partial<Record<LumpsumField, string>>

export type LumpsumValidationResult =
  | { readonly success: true; readonly data: LumpsumInput }
  | { readonly success: false; readonly errors: LumpsumValidationErrors }
