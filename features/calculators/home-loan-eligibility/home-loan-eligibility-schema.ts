import type {
  FOIRBand,
  HomeLoanEligibilityInput,
  HomeLoanEligibilityValidationErrors,
  HomeLoanEligibilityValidationResult,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-types"

export const FOIR_BANDS: Readonly<Record<FOIRBand, number>> = {
  conservative: 40,
  standard: 50,
  aggressive: 60,
}

export const FOIR_BAND_OPTIONS: readonly { readonly label: string; readonly value: FOIRBand }[] = [
  { label: "Conservative (40%)", value: "conservative" },
  { label: "Standard (50%)", value: "standard" },
  { label: "Aggressive (60%)", value: "aggressive" },
]

export const HOME_LOAN_ELIGIBILITY_LIMITS = {
  netMonthlyIncome: { min: 10_000, max: 10_000_000 },
  existingMonthlyEMI: { min: 0, max: 10_000_000 },
  annualInterestRate: { min: 1, max: 20 },
  tenureYears: { min: 1, max: 30 },
  ownContribution: { min: 0, max: 100_000_000 },
} as const

export type HomeLoanEligibilityFormValues = {
  readonly netMonthlyIncome: string
  readonly existingMonthlyEMI: string
  readonly annualInterestRate: string
  readonly tenureYears: string
  readonly ownContribution: string
  readonly foirBand: string
}

function parseFiniteNumber(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function isFOIRBand(value: string): value is FOIRBand {
  return value === "conservative" || value === "standard" || value === "aggressive"
}

export function validateHomeLoanEligibilityInput(input: HomeLoanEligibilityInput): HomeLoanEligibilityValidationResult {
  const errors: HomeLoanEligibilityValidationErrors = {}
  const { netMonthlyIncome, existingMonthlyEMI, annualInterestRate, tenureYears, ownContribution, foirBand } = input

  if (!Number.isFinite(netMonthlyIncome) || netMonthlyIncome < HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.min || netMonthlyIncome > HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.max) {
    errors.netMonthlyIncome = "Enter a net monthly income between ₹10,000 and ₹1,00,00,000."
  }

  if (!Number.isFinite(existingMonthlyEMI) || existingMonthlyEMI < HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.min || existingMonthlyEMI > HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.max) {
    errors.existingMonthlyEMI = "Enter existing monthly EMI obligations between ₹0 and ₹1,00,00,000."
  }

  if (!Number.isFinite(annualInterestRate) || annualInterestRate < HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.min || annualInterestRate > HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.max) {
    errors.annualInterestRate = "Enter an annual interest rate between 1% and 20%."
  }

  if (!Number.isFinite(tenureYears) || !Number.isInteger(tenureYears) || tenureYears < HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.min || tenureYears > HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.max) {
    errors.tenureYears = "Enter a whole-number loan tenure between 1 and 30 years."
  }

  if (!Number.isFinite(ownContribution) || ownContribution < HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.min || ownContribution > HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.max) {
    errors.ownContribution = "Enter an own contribution amount between ₹0 and ₹10,00,00,000."
  }

  if (foirBand !== "conservative" && foirBand !== "standard" && foirBand !== "aggressive") {
    errors.foirBand = "Choose a FOIR band."
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input }
}

export function parseAndValidateHomeLoanEligibilityForm(values: HomeLoanEligibilityFormValues): HomeLoanEligibilityValidationResult {
  const netMonthlyIncome = parseFiniteNumber(values.netMonthlyIncome)
  const existingMonthlyEMI = parseFiniteNumber(values.existingMonthlyEMI)
  const annualInterestRate = parseFiniteNumber(values.annualInterestRate)
  const tenureYears = parseFiniteNumber(values.tenureYears)
  const ownContribution = parseFiniteNumber(values.ownContribution)
  const errors: HomeLoanEligibilityValidationErrors = {}

  if (netMonthlyIncome === null) errors.netMonthlyIncome = "Enter a valid net monthly income."
  if (existingMonthlyEMI === null) errors.existingMonthlyEMI = "Enter a valid existing EMI amount."
  if (annualInterestRate === null) errors.annualInterestRate = "Enter a valid annual interest rate."
  if (tenureYears === null) errors.tenureYears = "Enter a valid loan tenure."
  if (ownContribution === null) errors.ownContribution = "Enter a valid own contribution amount."
  if (!isFOIRBand(values.foirBand)) errors.foirBand = "Choose a FOIR band."

  if (
    Object.keys(errors).length > 0
    || netMonthlyIncome === null
    || existingMonthlyEMI === null
    || annualInterestRate === null
    || tenureYears === null
    || ownContribution === null
    || !isFOIRBand(values.foirBand)
  ) {
    return { success: false, errors }
  }

  return validateHomeLoanEligibilityInput({
    netMonthlyIncome,
    existingMonthlyEMI,
    annualInterestRate,
    tenureYears,
    ownContribution,
    foirBand: values.foirBand,
  })
}
