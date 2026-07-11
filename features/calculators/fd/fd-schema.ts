import type {
  FDCompoundingFrequency,
  FDDurationUnit,
  FDInput,
  FDValidationErrors,
  FDValidationResult,
} from "@/features/calculators/fd/fd-types"

export const FD_LIMITS = {
  principalAmount: { min: 1_000, max: 100_000_000 },
  annualInterestRate: { min: 0, max: 20 },
  durationYears: { min: 1, max: 50 },
  durationMonths: { min: 1, max: 600 },
} as const

export type FDFormValues = {
  readonly principalAmount: string
  readonly annualInterestRate: string
  readonly duration: string
  readonly durationUnit: string
  readonly compoundingFrequency: string
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isDurationUnit(value: string): value is FDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is FDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

export function validateFDInput(input: FDInput): FDValidationResult {
  const errors: FDValidationErrors = {}
  const { principalAmount, annualInterestRate, duration, durationUnit, compoundingFrequency } = input

  if (!Number.isFinite(principalAmount) || principalAmount < FD_LIMITS.principalAmount.min || principalAmount > FD_LIMITS.principalAmount.max) {
    errors.principalAmount = "Enter a deposit amount between ₹1,000 and ₹10,00,00,000."
  }

  if (!Number.isFinite(annualInterestRate) || annualInterestRate < FD_LIMITS.annualInterestRate.min || annualInterestRate > FD_LIMITS.annualInterestRate.max) {
    errors.annualInterestRate = "Enter an annual interest rate between 0% and 20%."
  }

  const durationLimits = durationUnit === "years" ? FD_LIMITS.durationYears : FD_LIMITS.durationMonths
  if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration < durationLimits.min || duration > durationLimits.max) {
    errors.duration = durationUnit === "years"
      ? "Enter a whole-number duration between 1 and 50 years."
      : "Enter a whole-number duration between 1 and 600 months."
  }

  if (durationUnit !== "years" && durationUnit !== "months") {
    errors.durationUnit = "Choose years or months."
  }

  if (!isCompoundingFrequency(compoundingFrequency)) {
    errors.compoundingFrequency = "Choose a valid compounding frequency."
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input }
}

export function parseAndValidateFDForm(values: FDFormValues): FDValidationResult {
  const principalAmount = parseFiniteNumber(values.principalAmount)
  const annualInterestRate = parseFiniteNumber(values.annualInterestRate)
  const duration = parseFiniteNumber(values.duration)
  const errors: FDValidationErrors = {}

  if (principalAmount === null) errors.principalAmount = "Enter a valid deposit amount."
  if (annualInterestRate === null) errors.annualInterestRate = "Enter a valid annual interest rate."
  if (duration === null) errors.duration = "Enter a valid deposit duration."
  if (!isDurationUnit(values.durationUnit)) errors.durationUnit = "Choose years or months."
  if (!isCompoundingFrequency(values.compoundingFrequency)) errors.compoundingFrequency = "Choose a valid compounding frequency."

  if (Object.keys(errors).length > 0 || principalAmount === null || annualInterestRate === null || duration === null || !isDurationUnit(values.durationUnit) || !isCompoundingFrequency(values.compoundingFrequency)) {
    return { success: false, errors }
  }

  return validateFDInput({ principalAmount, annualInterestRate, duration, durationUnit: values.durationUnit, compoundingFrequency: values.compoundingFrequency })
}
