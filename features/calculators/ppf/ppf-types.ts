export const PPF_DURATIONS = [15, 20, 25, 30, 35, 40] as const
export type PPFDuration = (typeof PPF_DURATIONS)[number]

export type PPFInput = {
  readonly annualContribution: number
  readonly assumedAnnualInterestRate: number
  readonly durationYears: PPFDuration
}

export type PPFScheduleRow = {
  readonly year: number
  readonly openingBalance: number
  readonly contribution: number
  readonly interestEarned: number
  readonly closingBalance: number
}

export type PPFResult = PPFInput & {
  readonly totalContributions: number
  readonly totalInterest: number
  readonly maturityValue: number
  readonly schedule: readonly PPFScheduleRow[]
}

export type PPFField = keyof PPFInput
export type PPFValidationErrors = Partial<Record<PPFField, string>>
export type PPFValidationResult =
  | { readonly success: true; readonly data: PPFInput }
  | { readonly success: false; readonly errors: PPFValidationErrors }
