import type {
  GratuityInput,
  GratuityValidationErrors,
  GratuityValidationResult,
} from "./gratuity-types"

export const GRATUITY_LIMITS = {
  eligibleMonthlyWages: { min: 0.01, max: 1_000_000_000_000 },
  completedYears: { min: 0, max: 60 },
  additionalMonths: { min: 0, max: 11 },
} as const

export type GratuityFormValues = {
  readonly eligibleMonthlyWages: string
  readonly completedYears: string
  readonly additionalMonths: string
}

export function parseGratuityNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateGratuityInput(input: GratuityInput): GratuityValidationResult {
  const errors: GratuityValidationErrors = {}

  if (
    !Number.isFinite(input.eligibleMonthlyWages) ||
    input.eligibleMonthlyWages < GRATUITY_LIMITS.eligibleMonthlyWages.min ||
    input.eligibleMonthlyWages > GRATUITY_LIMITS.eligibleMonthlyWages.max
  ) {
    errors.eligibleMonthlyWages = "Enter eligible monthly wages greater than zero and up to ₹1 lakh crore."
  }
  if (
    !Number.isInteger(input.completedYears) ||
    input.completedYears < GRATUITY_LIMITS.completedYears.min ||
    input.completedYears > GRATUITY_LIMITS.completedYears.max
  ) {
    errors.completedYears = "Enter a whole number of completed years from 0 to 60."
  }
  if (
    !Number.isInteger(input.additionalMonths) ||
    input.additionalMonths < GRATUITY_LIMITS.additionalMonths.min ||
    input.additionalMonths > GRATUITY_LIMITS.additionalMonths.max
  ) {
    errors.additionalMonths = "Enter a whole number of additional completed months from 0 to 11."
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { ...input } }
}

export function parseAndValidateGratuityForm(values: GratuityFormValues): GratuityValidationResult {
  const eligibleMonthlyWages = parseGratuityNumericText(values.eligibleMonthlyWages)
  const completedYears = parseGratuityNumericText(values.completedYears)
  const additionalMonths = parseGratuityNumericText(values.additionalMonths)
  const errors: GratuityValidationErrors = {}

  if (eligibleMonthlyWages === null) errors.eligibleMonthlyWages = "Enter valid plain-decimal wages without spaces, commas, symbols, or exponent notation."
  if (completedYears === null) errors.completedYears = "Enter completed years as a whole number without spaces or symbols."
  if (additionalMonths === null) errors.additionalMonths = "Enter additional months as a whole number without spaces or symbols."

  if (Object.keys(errors).length || eligibleMonthlyWages === null || completedYears === null || additionalMonths === null) {
    return { success: false, errors }
  }

  return validateGratuityInput({ eligibleMonthlyWages, completedYears, additionalMonths })
}
