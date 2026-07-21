export type EPFInput = {
  readonly monthlyBasicSalary: number
  readonly employeeContributionPercent: number
  readonly employerContributionPercent: number
  readonly currentAge: number
  readonly retirementAge: number
  readonly expectedAnnualInterestRate: number
}

export type EPFScheduleRow = {
  readonly year: number
  readonly age: number
  readonly employeeContribution: number
  readonly employerContribution: number
  readonly interestEarned: number
  readonly cumulativeEmployeeContribution: number
  readonly cumulativeEmployerContribution: number
  readonly cumulativeInterest: number
  readonly closingBalance: number
}

export type EPFResult = EPFInput & {
  readonly monthlyEmployeeContribution: number
  readonly monthlyEmployerContribution: number
  readonly totalEmployeeContribution: number
  readonly totalEmployerContribution: number
  readonly totalInterest: number
  readonly maturityValue: number
  readonly schedule: readonly EPFScheduleRow[]
}

export type EPFField = keyof EPFInput
export type EPFValidationErrors = Partial<Record<EPFField, string>>
export type EPFValidationResult =
  | { readonly success: true; readonly data: EPFInput }
  | { readonly success: false; readonly errors: EPFValidationErrors }
