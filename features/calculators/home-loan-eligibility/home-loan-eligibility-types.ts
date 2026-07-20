export type FOIRBand = "conservative" | "standard" | "aggressive"

export type HomeLoanEligibilityInput = {
  readonly netMonthlyIncome: number
  readonly existingMonthlyEMI: number
  readonly annualInterestRate: number
  readonly tenureYears: number
  readonly ownContribution: number
  readonly foirBand: FOIRBand
}

export type HomeLoanEligibilityResult = {
  readonly foirBand: FOIRBand
  readonly foirPercentage: number
  readonly foirBudget: number
  readonly maxEligibleEMI: number
  readonly maxEligibleLoanAmount: number
  readonly totalPropertyAffordability: number
  readonly ownContribution: number
  readonly existingEMIExceedsBudget: boolean
  readonly monthlyInterestRate: number
  readonly totalMonths: number
}

export type FOIRBandComparisonRow = {
  readonly foirBand: FOIRBand
  readonly foirPercentage: number
  readonly maxEligibleEMI: number
  readonly maxEligibleLoanAmount: number
  readonly totalPropertyAffordability: number
  readonly existingEMIExceedsBudget: boolean
}

export type HomeLoanEligibilityField = keyof HomeLoanEligibilityInput

export type HomeLoanEligibilityValidationErrors = Partial<Record<HomeLoanEligibilityField, string>>

export type HomeLoanEligibilityValidationResult =
  | { readonly success: true; readonly data: HomeLoanEligibilityInput }
  | { readonly success: false; readonly errors: HomeLoanEligibilityValidationErrors }
