import type { RDCompoundingFrequency, RDDurationUnit, RDInput, RDValidationErrors, RDValidationResult } from "@/features/calculators/rd/rd-types"

export const RD_LIMITS = {
  monthlyDeposit: { min: 100, max: 1_000_000 },
  annualInterestRate: { min: 0, max: 20 },
  duration: { min: 1, max: 20 },
} as const

export type RDFormValues = {
  readonly monthlyDeposit: string
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

function isDurationUnit(value: string): value is RDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is RDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

export function validateRDInput(input: RDInput): RDValidationResult {
  const errors: RDValidationErrors = {}
  const { monthlyDeposit, annualInterestRate, duration, durationUnit, compoundingFrequency } = input

  if (!Number.isFinite(monthlyDeposit) || monthlyDeposit < RD_LIMITS.monthlyDeposit.min || monthlyDeposit > RD_LIMITS.monthlyDeposit.max) {
    errors.monthlyDeposit = "Enter a monthly deposit between ₹100 and ₹10,00,000."
  }
  if (!Number.isFinite(annualInterestRate) || annualInterestRate < RD_LIMITS.annualInterestRate.min || annualInterestRate > RD_LIMITS.annualInterestRate.max) {
    errors.annualInterestRate = "Enter an annual interest rate between 0% and 20%."
  }
  if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration < RD_LIMITS.duration.min || duration > RD_LIMITS.duration.max) {
    errors.duration = `Enter a whole-number duration between 1 and 20 ${durationUnit === "months" ? "months" : "years"}.`
  }
  if (!isDurationUnit(durationUnit)) errors.durationUnit = "Choose years or months."
  if (!isCompoundingFrequency(compoundingFrequency)) errors.compoundingFrequency = "Choose a valid compounding frequency."

  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data: input }
}

export function parseAndValidateRDForm(values: RDFormValues): RDValidationResult {
  const monthlyDeposit = parseFiniteNumber(values.monthlyDeposit)
  const annualInterestRate = parseFiniteNumber(values.annualInterestRate)
  const duration = parseFiniteNumber(values.duration)
  const errors: RDValidationErrors = {}

  if (monthlyDeposit === null) errors.monthlyDeposit = "Enter a valid monthly deposit."
  if (annualInterestRate === null) errors.annualInterestRate = "Enter a valid annual interest rate."
  if (duration === null) errors.duration = "Enter a valid deposit duration."
  if (!isDurationUnit(values.durationUnit)) errors.durationUnit = "Choose years or months."
  if (!isCompoundingFrequency(values.compoundingFrequency)) errors.compoundingFrequency = "Choose a valid compounding frequency."

  if (Object.keys(errors).length > 0 || monthlyDeposit === null || annualInterestRate === null || duration === null || !isDurationUnit(values.durationUnit) || !isCompoundingFrequency(values.compoundingFrequency)) {
    return { success: false, errors }
  }
  return validateRDInput({ monthlyDeposit, annualInterestRate, duration, durationUnit: values.durationUnit, compoundingFrequency: values.compoundingFrequency })
}
