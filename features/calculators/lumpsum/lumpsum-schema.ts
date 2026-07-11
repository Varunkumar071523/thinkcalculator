import type {
  LumpsumDurationUnit,
  LumpsumInput,
  LumpsumValidationErrors,
  LumpsumValidationResult,
} from "@/features/calculators/lumpsum/lumpsum-types"

export const LUMPSUM_LIMITS = {
  initialInvestment: { min: 1_000, max: 100_000_000 },
  annualReturnRate: { min: 0, max: 50 },
  durationYears: { min: 1, max: 50 },
  durationMonths: { min: 1, max: 600 },
} as const

export type LumpsumFormValues = {
  readonly initialInvestment: string
  readonly annualReturnRate: string
  readonly duration: string
  readonly durationUnit: string
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isDurationUnit(value: string): value is LumpsumDurationUnit {
  return value === "years" || value === "months"
}

export function validateLumpsumInput(input: LumpsumInput): LumpsumValidationResult {
  const errors: LumpsumValidationErrors = {}
  const { initialInvestment, annualReturnRate, duration, durationUnit } = input

  if (!Number.isFinite(initialInvestment) || initialInvestment < LUMPSUM_LIMITS.initialInvestment.min || initialInvestment > LUMPSUM_LIMITS.initialInvestment.max) {
    errors.initialInvestment = "Enter an initial investment between ₹1,000 and ₹10,00,00,000."
  }

  if (!Number.isFinite(annualReturnRate) || annualReturnRate < LUMPSUM_LIMITS.annualReturnRate.min || annualReturnRate > LUMPSUM_LIMITS.annualReturnRate.max) {
    errors.annualReturnRate = "Enter an expected annual return between 0% and 50%."
  }

  const durationLimits = durationUnit === "years" ? LUMPSUM_LIMITS.durationYears : LUMPSUM_LIMITS.durationMonths
  if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration < durationLimits.min || duration > durationLimits.max) {
    errors.duration = durationUnit === "years"
      ? "Enter a whole-number duration between 1 and 50 years."
      : "Enter a whole-number duration between 1 and 600 months."
  }

  if (durationUnit !== "years" && durationUnit !== "months") {
    errors.durationUnit = "Choose years or months."
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input }
}

export function parseAndValidateLumpsumForm(values: LumpsumFormValues): LumpsumValidationResult {
  const initialInvestment = parseFiniteNumber(values.initialInvestment)
  const annualReturnRate = parseFiniteNumber(values.annualReturnRate)
  const duration = parseFiniteNumber(values.duration)
  const errors: LumpsumValidationErrors = {}

  if (initialInvestment === null) errors.initialInvestment = "Enter a valid initial investment."
  if (annualReturnRate === null) errors.annualReturnRate = "Enter a valid expected annual return."
  if (duration === null) errors.duration = "Enter a valid investment duration."
  if (!isDurationUnit(values.durationUnit)) errors.durationUnit = "Choose years or months."

  if (Object.keys(errors).length > 0 || initialInvestment === null || annualReturnRate === null || duration === null || !isDurationUnit(values.durationUnit)) {
    return { success: false, errors }
  }

  return validateLumpsumInput({ initialInvestment, annualReturnRate, duration, durationUnit: values.durationUnit })
}
