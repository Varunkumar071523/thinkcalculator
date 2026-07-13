export type GSTCalculationMode = "add" | "remove"
export type GSTSupplyType = "intra-state" | "inter-state"

export type GSTInput = {
  readonly amount: number
  readonly gstRate: number
  readonly calculationMode: GSTCalculationMode
  readonly supplyType: GSTSupplyType
}

export type GSTResult = GSTInput & {
  readonly taxableValue: number
  readonly totalGSTAmount: number
  readonly invoiceValue: number
  readonly cgstAmount: number
  readonly sgstUtgstAmount: number
  readonly igstAmount: number
}

export type GSTField = keyof GSTInput
export type GSTValidationErrors = Partial<Record<GSTField, string>>
export type GSTValidationResult =
  | { readonly success: true; readonly data: GSTInput }
  | { readonly success: false; readonly errors: GSTValidationErrors }
