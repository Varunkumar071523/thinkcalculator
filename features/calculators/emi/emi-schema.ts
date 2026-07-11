import type {
  EMIInput,
  EMIValidationErrors,
  EMIValidationResult,
  TenureUnit,
} from "@/features/calculators/emi/emi-types"

export const EMI_LIMITS = {
  principalAmount: { min: 10_000, max: 100_000_000 },
  annualInterestRate: { min: 0, max: 30 },
  tenureYears: { min: 1, max: 40 },
  tenureMonths: { min: 1, max: 480 },
} as const

export type EMIFormValues = {
  readonly principalAmount: string
  readonly annualInterestRate: string
  readonly tenure: string
  readonly tenureUnit: string
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isTenureUnit(value: string): value is TenureUnit {
  return value === "years" || value === "months"
}

export function validateEMIInput(input: EMIInput): EMIValidationResult {
  const errors: EMIValidationErrors = {}
  const { principalAmount, annualInterestRate, tenure, tenureUnit } = input

  if (!Number.isFinite(principalAmount) || principalAmount < EMI_LIMITS.principalAmount.min || principalAmount > EMI_LIMITS.principalAmount.max) {
    errors.principalAmount = "Enter a loan amount between ₹10,000 and ₹10,00,00,000."
  }

  if (!Number.isFinite(annualInterestRate) || annualInterestRate < EMI_LIMITS.annualInterestRate.min || annualInterestRate > EMI_LIMITS.annualInterestRate.max) {
    errors.annualInterestRate = "Enter an annual interest rate between 0% and 30%."
  }

  const tenureLimits = tenureUnit === "years" ? EMI_LIMITS.tenureYears : EMI_LIMITS.tenureMonths
  if (!Number.isFinite(tenure) || !Number.isInteger(tenure) || tenure < tenureLimits.min || tenure > tenureLimits.max) {
    errors.tenure = tenureUnit === "years"
      ? "Enter a whole-number tenure between 1 and 40 years."
      : "Enter a whole-number tenure between 1 and 480 months."
  }

  if (tenureUnit !== "years" && tenureUnit !== "months") {
    errors.tenureUnit = "Choose years or months."
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input }
}

export function parseAndValidateEMIForm(values: EMIFormValues): EMIValidationResult {
  const principalAmount = parseFiniteNumber(values.principalAmount)
  const annualInterestRate = parseFiniteNumber(values.annualInterestRate)
  const tenure = parseFiniteNumber(values.tenure)
  const errors: EMIValidationErrors = {}

  if (principalAmount === null) errors.principalAmount = "Enter a valid loan amount."
  if (annualInterestRate === null) errors.annualInterestRate = "Enter a valid annual interest rate."
  if (tenure === null) errors.tenure = "Enter a valid loan tenure."
  if (!isTenureUnit(values.tenureUnit)) errors.tenureUnit = "Choose years or months."

  if (Object.keys(errors).length > 0 || principalAmount === null || annualInterestRate === null || tenure === null || !isTenureUnit(values.tenureUnit)) {
    return { success: false, errors }
  }

  return validateEMIInput({
    principalAmount,
    annualInterestRate,
    tenure,
    tenureUnit: values.tenureUnit,
  })
}
