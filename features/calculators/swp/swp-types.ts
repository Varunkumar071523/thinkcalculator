export type SWPWithdrawalMode = "fixedDuration" | "untilExhausted"
export type SWPInput = { readonly initialInvestment:number; readonly monthlyWithdrawal:number; readonly expectedAnnualReturn:number; readonly withdrawalMode:SWPWithdrawalMode; readonly durationYears:number }
export type SWPMonthlyScheduleRow = { readonly month:number; readonly year:number; readonly openingBalance:number; readonly withdrawal:number; readonly growth:number; readonly closingBalance:number }
export type SWPYearlyScheduleRow = { readonly year:number; readonly openingBalance:number; readonly withdrawalsInYear:number; readonly growthInYear:number; readonly closingBalance:number; readonly isExhaustionYear:boolean }
export type SWPResult = {
  readonly totalWithdrawn:number
  readonly totalGrowth:number
  readonly remainingBalance:number
  readonly monthsSimulated:number
  readonly yearsSimulated:number
  readonly exhaustionMonth:number|null
  readonly isExhausted:boolean
  readonly finalWithdrawalAmount:number
  readonly cappedAtMaxDuration:boolean
  readonly schedule:readonly SWPYearlyScheduleRow[]
}
export type SWPField = keyof SWPInput
export type SWPValidationErrors = Partial<Record<SWPField,string>>
export type SWPValidationResult = {readonly success:true;readonly data:SWPInput}|{readonly success:false;readonly errors:SWPValidationErrors}
