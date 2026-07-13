import type {
  CAGRInput,
  CAGRValidationErrors,
  CAGRValidationResult,
} from "@/features/calculators/cagr/cagr-types"

export const CAGR_LIMITS = {
  beginningValue: { min: 0.01, max: 1_000_000_000_000_000 },
  endingValue: { min: 0, max: 1_000_000_000_000_000 },
  investmentPeriodYears: { min: 0.01, max: 100 },
} as const

export type CAGRFormValues = {
  readonly beginningValue: string
  readonly endingValue: string
  readonly investmentPeriodYears: string
}

export function parseCAGRNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^-?(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  const scaled = value * 100
  return Math.abs(scaled - Math.round(scaled)) < 1e-9
}

export function validateCAGRInput(input: CAGRInput): CAGRValidationResult {
  const errors: CAGRValidationErrors = {}
  const { beginningValue, endingValue, investmentPeriodYears } = input

  if (!Number.isFinite(beginningValue) || beginningValue < CAGR_LIMITS.beginningValue.min || beginningValue > CAGR_LIMITS.beginningValue.max) {
    errors.beginningValue = "Enter a beginning value greater than zero and up to ₹1,000 lakh crore."
  }
  if (!Number.isFinite(endingValue) || endingValue < CAGR_LIMITS.endingValue.min || endingValue > CAGR_LIMITS.endingValue.max) {
    errors.endingValue = "Enter an ending value from ₹0 up to ₹1,000 lakh crore."
  }
  if (!Number.isFinite(investmentPeriodYears) || investmentPeriodYears < CAGR_LIMITS.investmentPeriodYears.min || investmentPeriodYears > CAGR_LIMITS.investmentPeriodYears.max || !hasAtMostTwoDecimalPlaces(investmentPeriodYears)) {
    errors.investmentPeriodYears = "Enter 0.01 to 100 years, using no more than two decimal places."
  }

  if (Object.keys(errors).length === 0 && endingValue > 0) {
    const cagrPercentage = ((endingValue / beginningValue) ** (1 / investmentPeriodYears) - 1) * 100
    if (!Number.isFinite(cagrPercentage)) {
      errors.endingValue = "These values and this short period produce a result too large to display."
    }
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: { ...input, endingValue: endingValue === 0 ? 0 : endingValue } }
}

export function parseAndValidateCAGRForm(values: CAGRFormValues): CAGRValidationResult {
  const beginningValue = parseCAGRNumericText(values.beginningValue)
  const endingValue = parseCAGRNumericText(values.endingValue)
  const investmentPeriodYears = parseCAGRNumericText(values.investmentPeriodYears)
  const errors: CAGRValidationErrors = {}

  if (beginningValue === null) errors.beginningValue = "Enter a valid beginning value."
  if (endingValue === null) errors.endingValue = "Enter a valid ending value."
  if (investmentPeriodYears === null) errors.investmentPeriodYears = "Enter a valid investment period."
  if (Object.keys(errors).length > 0 || beginningValue === null || endingValue === null || investmentPeriodYears === null) {
    return { success: false, errors }
  }

  return validateCAGRInput({ beginningValue, endingValue, investmentPeriodYears })
}
