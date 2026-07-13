export type CAGRInput = {
  readonly beginningValue: number
  readonly endingValue: number
  readonly investmentPeriodYears: number
}

export type CAGRResult = CAGRInput & {
  readonly cagrPercentage: number
  readonly absoluteGainLoss: number
  readonly totalReturnPercentage: number
  readonly growthMultiple: number
}

export type CAGRField = keyof CAGRInput
export type CAGRValidationErrors = Partial<Record<CAGRField, string>>
export type CAGRValidationResult =
  | { readonly success: true; readonly data: CAGRInput }
  | { readonly success: false; readonly errors: CAGRValidationErrors }
