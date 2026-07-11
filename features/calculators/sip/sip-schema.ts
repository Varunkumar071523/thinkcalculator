import type {
  SIPDurationUnit,
  SIPInput,
  SIPValidationErrors,
  SIPValidationResult,
} from "@/features/calculators/sip/sip-types"

export const SIP_LIMITS = {
  monthlyInvestment: { min: 500, max: 10_000_000 },
  annualReturnRate: { min: 0, max: 50 },
  durationYears: { min: 1, max: 50 },
  durationMonths: { min: 1, max: 600 },
} as const

export type SIPFormValues = {
  readonly monthlyInvestment: string
  readonly annualReturnRate: string
  readonly duration: string
  readonly durationUnit: string
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isDurationUnit(value: string): value is SIPDurationUnit {
  return value === "years" || value === "months"
}

export function validateSIPInput(input: SIPInput): SIPValidationResult {
  const errors: SIPValidationErrors = {}
  const { monthlyInvestment, annualReturnRate, duration, durationUnit } = input

  if (!Number.isFinite(monthlyInvestment) || monthlyInvestment < SIP_LIMITS.monthlyInvestment.min || monthlyInvestment > SIP_LIMITS.monthlyInvestment.max) {
    errors.monthlyInvestment = "Enter a monthly investment between ₹500 and ₹1,00,00,000."
  }

  if (!Number.isFinite(annualReturnRate) || annualReturnRate < SIP_LIMITS.annualReturnRate.min || annualReturnRate > SIP_LIMITS.annualReturnRate.max) {
    errors.annualReturnRate = "Enter an expected annual return between 0% and 50%."
  }

  const durationLimits = durationUnit === "years" ? SIP_LIMITS.durationYears : SIP_LIMITS.durationMonths
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

export function parseAndValidateSIPForm(values: SIPFormValues): SIPValidationResult {
  const monthlyInvestment = parseFiniteNumber(values.monthlyInvestment)
  const annualReturnRate = parseFiniteNumber(values.annualReturnRate)
  const duration = parseFiniteNumber(values.duration)
  const errors: SIPValidationErrors = {}

  if (monthlyInvestment === null) errors.monthlyInvestment = "Enter a valid monthly investment."
  if (annualReturnRate === null) errors.annualReturnRate = "Enter a valid expected annual return."
  if (duration === null) errors.duration = "Enter a valid investment duration."
  if (!isDurationUnit(values.durationUnit)) errors.durationUnit = "Choose years or months."

  if (Object.keys(errors).length > 0 || monthlyInvestment === null || annualReturnRate === null || duration === null || !isDurationUnit(values.durationUnit)) {
    return { success: false, errors }
  }

  return validateSIPInput({ monthlyInvestment, annualReturnRate, duration, durationUnit: values.durationUnit })
}
