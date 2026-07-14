export type RetirementInput = {
  readonly currentAge: number
  readonly retirementAge: number
  readonly lifeExpectancy: number
  readonly currentSavings: number
  readonly monthlyContribution: number
  readonly expectedReturnPreRetirement: number
  readonly expectedReturnPostRetirement: number
  readonly desiredMonthlyWithdrawal: number
  readonly inflationRate: number
}

export type RetirementAccumulationScheduleRow = {
  readonly year: number
  readonly age: number
  readonly contributionThisYear: number
  readonly cumulativeInvestment: number
  readonly yearEndBalance: number
  readonly gainToDate: number
}

// Internal monthly granularity for the decumulation phase, mirroring SWP's monthly-row pattern
// (see calculate-retirement.ts). Not part of RetirementResult; exported for direct unit testing,
// the same way SWPMonthlyScheduleRow is exported without appearing in SWPResult.
export type RetirementDecumulationMonthlyRow = {
  readonly month: number
  readonly year: number
  readonly openingBalance: number
  readonly targetWithdrawal: number
  readonly withdrawal: number
  readonly growth: number
  readonly closingBalance: number
}

export type RetirementDecumulationScheduleRow = {
  readonly year: number
  readonly age: number
  readonly openingBalance: number
  readonly monthlyWithdrawalThisYear: number
  readonly withdrawalsInYear: number
  readonly growthInYear: number
  readonly closingBalance: number
  readonly isExhaustionYear: boolean
}

export type RetirementResult = {
  readonly yearsToRetirement: number
  readonly retirementDurationYears: number
  readonly totalContributions: number
  readonly corpusAtRetirement: number
  readonly totalGainAtRetirement: number
  readonly accumulationSchedule: readonly RetirementAccumulationScheduleRow[]
  readonly firstYearMonthlyWithdrawal: number
  readonly totalWithdrawn: number
  readonly totalGrowthInRetirement: number
  readonly remainingBalanceAtLifeExpectancy: number
  readonly decumulationSchedule: readonly RetirementDecumulationScheduleRow[]
  readonly isExhausted: boolean
  readonly exhaustionMonth: number | null
  readonly exhaustionYear: number | null
  readonly exhaustionAge: number | null
  readonly finalMonthlyWithdrawal: number
  readonly corpusLastsFullDuration: boolean
}

export type RetirementField = keyof RetirementInput
export type RetirementValidationErrors = Partial<Record<RetirementField, string>>
export type RetirementValidationResult = { readonly success: true; readonly data: RetirementInput } | { readonly success: false; readonly errors: RetirementValidationErrors }
