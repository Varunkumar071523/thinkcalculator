export type GratuityInput = {
  readonly eligibleMonthlyWages: number
  readonly completedYears: number
  readonly additionalMonths: number
}

export type GratuityResult = GratuityInput & {
  readonly countedServiceYears: number
  readonly dailyWageBasis: number
  readonly gratuityBeforeCeiling: number
  readonly statutoryCeiling: number
  readonly estimatedGratuity: number
  readonly ceilingAdjustment: number
  readonly ceilingApplied: boolean
}

export type GratuityField = keyof GratuityInput
export type GratuityValidationErrors = Partial<Record<GratuityField, string>>
export type GratuityValidationResult =
  | { readonly success: true; readonly data: GratuityInput }
  | { readonly success: false; readonly errors: GratuityValidationErrors }
