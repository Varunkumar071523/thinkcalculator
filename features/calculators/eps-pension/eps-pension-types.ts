export type EpsPensionAgeOption = "standard" | "early"

export type EpsPensionInput = {
  readonly averageMonthlySalary: number
  readonly yearsOfPensionableService: number
  readonly ageOption: EpsPensionAgeOption
  readonly earlyPensionAge: number
}

export type EpsPensionResult = EpsPensionInput & {
  readonly isEligible: boolean
  readonly pensionableSalaryUsed: number
  readonly isWageCeilingBinding: boolean
  readonly bonusYearsApplied: boolean
  readonly pensionableServiceUsed: number
  readonly formulaPension: number
  readonly minimumPensionFloor: number
  readonly isFloorBinding: boolean
  readonly standardMonthlyPension: number
  readonly earlyPensionReductionPercent: number
  readonly earlyMonthlyPension: number
  readonly monthlyPension: number
}

export type EpsPensionField = keyof EpsPensionInput
export type EpsPensionValidationErrors = Partial<Record<EpsPensionField, string>>
export type EpsPensionValidationResult =
  | { readonly success: true; readonly data: EpsPensionInput }
  | { readonly success: false; readonly errors: EpsPensionValidationErrors }
