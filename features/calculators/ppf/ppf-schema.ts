import { PPF_DURATIONS, type PPFDuration, type PPFInput, type PPFValidationErrors, type PPFValidationResult } from "./ppf-types"

export const PPF_LIMITS = {
  annualContribution: { min: 500, max: 150_000, step: 50 },
  assumedAnnualInterestRate: { min: 0.1, max: 15 },
} as const

export type PPFFormValues = {
  readonly annualContribution: string
  readonly assumedAnnualInterestRate: string
  readonly durationYears: string
}

export function parsePPFNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
}

export function isPPFDuration(value: number): value is PPFDuration {
  return PPF_DURATIONS.includes(value as PPFDuration)
}

export function validatePPFInput(input: PPFInput): PPFValidationResult {
  const errors: PPFValidationErrors = {}
  const { annualContribution, assumedAnnualInterestRate, durationYears } = input
  if (!Number.isFinite(annualContribution) || !Number.isInteger(annualContribution) || annualContribution < PPF_LIMITS.annualContribution.min || annualContribution > PPF_LIMITS.annualContribution.max || annualContribution % PPF_LIMITS.annualContribution.step !== 0) {
    errors.annualContribution = "Enter a whole-rupee annual contribution from ₹500 to ₹1,50,000 in multiples of ₹50."
  }
  if (!Number.isFinite(assumedAnnualInterestRate) || assumedAnnualInterestRate < PPF_LIMITS.assumedAnnualInterestRate.min || assumedAnnualInterestRate > PPF_LIMITS.assumedAnnualInterestRate.max || !hasAtMostTwoDecimals(assumedAnnualInterestRate)) {
    errors.assumedAnnualInterestRate = "Enter an assumed rate from 0.1% to 15% with up to two decimal places."
  }
  if (!Number.isInteger(durationYears) || !isPPFDuration(durationYears)) {
    errors.durationYears = "Choose 15 years or a supported five-year extension up to 40 years."
  }
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: { ...input } }
}

export function parseAndValidatePPFForm(values: PPFFormValues): PPFValidationResult {
  const contribution = parsePPFNumericText(values.annualContribution)
  const rate = parsePPFNumericText(values.assumedAnnualInterestRate)
  const duration = parsePPFNumericText(values.durationYears)
  const errors: PPFValidationErrors = {}
  if (contribution === null) errors.annualContribution = "Enter a valid plain whole-number contribution."
  if (rate === null) errors.assumedAnnualInterestRate = "Enter a valid plain decimal rate."
  if (duration === null || !isPPFDuration(duration)) errors.durationYears = "Choose a supported duration."
  if (Object.keys(errors).length || contribution === null || rate === null || duration === null || !isPPFDuration(duration)) return { success: false, errors }
  return validatePPFInput({ annualContribution: contribution, assumedAnnualInterestRate: rate, durationYears: duration })
}
