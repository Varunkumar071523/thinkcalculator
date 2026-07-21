export type NPSInput = {
  readonly monthlyContribution: number
  readonly currentAge: number
  readonly retirementAge: number
  readonly equityAllocationPercent: number
  readonly corporateDebtAllocationPercent: number
  readonly equityExpectedReturn: number
  readonly corporateDebtExpectedReturn: number
  readonly govtSecuritiesExpectedReturn: number
}

export type NPSScheduleRow = {
  readonly year: number
  readonly age: number
  readonly contribution: number
  readonly cumulativeInvestment: number
  readonly yearEndBalance: number
  readonly gainToDate: number
}

export type NPSResult = NPSInput & {
  /** 100 − equityAllocationPercent − corporateDebtAllocationPercent, i.e. the remainder of the
   * asset-allocation split. Not a direct input — see nps-schema.ts. */
  readonly govtSecuritiesAllocationPercent: number
  /** Weighted average of the three asset classes' expected returns, by their allocation share —
   * this is the single rate the accumulation schedule actually compounds at. */
  readonly blendedAnnualReturn: number
  readonly totalContributions: number
  readonly totalGrowth: number
  readonly corpusAtRetirement: number
  readonly schedule: readonly NPSScheduleRow[]
}

export type NPSField = keyof NPSInput
export type NPSValidationErrors = Partial<Record<NPSField, string>>
export type NPSValidationResult =
  | { readonly success: true; readonly data: NPSInput }
  | { readonly success: false; readonly errors: NPSValidationErrors }
