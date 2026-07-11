export type TenureUnit = "years" | "months"

export type EMIInput = {
  readonly principalAmount: number
  readonly annualInterestRate: number
  readonly tenure: number
  readonly tenureUnit: TenureUnit
}

export type EMIResult = {
  readonly monthlyEMI: number
  readonly principalAmount: number
  readonly totalInterest: number
  readonly totalPayment: number
  readonly monthlyInterestRate: number
  readonly totalMonths: number
}

export type AmortizationRow = {
  readonly paymentNumber: number
  readonly openingBalance: number
  readonly emi: number
  readonly principalPaid: number
  readonly interestPaid: number
  readonly closingBalance: number
  readonly cumulativePrincipal: number
  readonly cumulativeInterest: number
}

export type EMIField = keyof EMIInput

export type EMIValidationErrors = Partial<Record<EMIField, string>>

export type EMIValidationResult =
  | { readonly success: true; readonly data: EMIInput }
  | { readonly success: false; readonly errors: EMIValidationErrors }
