import { buildCalculatorUrl } from "@/lib/calculator-url"
import { validateHomeLoanEligibilityInput } from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-schema"
import type { FOIRBand, HomeLoanEligibilityInput } from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-types"

export const HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT: HomeLoanEligibilityInput = {
  netMonthlyIncome: 100_000,
  existingMonthlyEMI: 10_000,
  annualInterestRate: 8.5,
  tenureYears: 20,
  ownContribution: 1_000_000,
  foirBand: "standard",
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>

function readParameter(search: SearchInput, key: string): string | undefined {
  if (search instanceof URLSearchParams) return search.get(key) ?? undefined
  const value = search[key]
  return Array.isArray(value) ? value[0] : value
}

export function parseHomeLoanEligibilityUrlState(search: SearchInput, defaults: HomeLoanEligibilityInput = HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT): HomeLoanEligibilityInput {
  const income = readParameter(search, "income")
  const existingEmi = readParameter(search, "existingEmi")
  const rate = readParameter(search, "rate")
  const tenure = readParameter(search, "tenure")
  const contribution = readParameter(search, "contribution")
  const foir = readParameter(search, "foir")

  const candidate: HomeLoanEligibilityInput = {
    netMonthlyIncome: income === undefined ? defaults.netMonthlyIncome : Number(income),
    existingMonthlyEMI: existingEmi === undefined ? defaults.existingMonthlyEMI : Number(existingEmi),
    annualInterestRate: rate === undefined ? defaults.annualInterestRate : Number(rate),
    tenureYears: tenure === undefined ? defaults.tenureYears : Number(tenure),
    ownContribution: contribution === undefined ? defaults.ownContribution : Number(contribution),
    foirBand: (foir === undefined ? defaults.foirBand : foir) as FOIRBand,
  }

  const validation = validateHomeLoanEligibilityInput(candidate)
  if (validation.success) return validation.data

  const withFallbacks: HomeLoanEligibilityInput = {
    netMonthlyIncome: validation.errors.netMonthlyIncome ? defaults.netMonthlyIncome : candidate.netMonthlyIncome,
    existingMonthlyEMI: validation.errors.existingMonthlyEMI ? defaults.existingMonthlyEMI : candidate.existingMonthlyEMI,
    annualInterestRate: validation.errors.annualInterestRate ? defaults.annualInterestRate : candidate.annualInterestRate,
    tenureYears: validation.errors.tenureYears ? defaults.tenureYears : candidate.tenureYears,
    ownContribution: validation.errors.ownContribution ? defaults.ownContribution : candidate.ownContribution,
    foirBand: validation.errors.foirBand ? defaults.foirBand : candidate.foirBand,
  }
  const fallbackValidation = validateHomeLoanEligibilityInput(withFallbacks)
  return fallbackValidation.success ? fallbackValidation.data : defaults
}

export function serializeHomeLoanEligibilityUrlState(input: HomeLoanEligibilityInput): URLSearchParams {
  const validation = validateHomeLoanEligibilityInput(input)
  if (!validation.success) throw new RangeError("Invalid Home Loan Eligibility URL state")
  return new URLSearchParams({
    income: String(input.netMonthlyIncome),
    existingEmi: String(input.existingMonthlyEMI),
    rate: String(input.annualInterestRate),
    tenure: String(input.tenureYears),
    contribution: String(input.ownContribution),
    foir: input.foirBand,
  })
}

export function buildHomeLoanEligibilityCalculatorUrl(input: HomeLoanEligibilityInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/home-loan-eligibility-calculator",
    Object.fromEntries(serializeHomeLoanEligibilityUrlState(input)),
    origin,
  )
}
