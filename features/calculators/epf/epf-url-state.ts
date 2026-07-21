import { buildCalculatorUrl } from "@/lib/calculator-url"
import { EPF_RATE_CONFIG } from "./epf-rate-config"
import { validateEPFInput } from "./epf-schema"
import type { EPFInput } from "./epf-types"

export const EPF_DEFAULT_INPUT: EPFInput = {
  monthlyBasicSalary: 30_000,
  employeeContributionPercent: 12,
  employerContributionPercent: 12,
  currentAge: 30,
  retirementAge: 58,
  expectedAnnualInterestRate: EPF_RATE_CONFIG.defaultRate,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>

function readParameter(search: SearchInput, key: string): string | undefined {
  if (search instanceof URLSearchParams) return search.get(key) ?? undefined
  const value = search[key]
  return Array.isArray(value) ? value[0] : value
}

export function parseEPFUrlState(search: SearchInput, defaults: EPFInput = EPF_DEFAULT_INPUT): EPFInput {
  const salary = readParameter(search, "salary")
  const empPct = readParameter(search, "empPct")
  const erPct = readParameter(search, "erPct")
  const age = readParameter(search, "age")
  const retireAge = readParameter(search, "retireAge")
  const rate = readParameter(search, "rate")

  const candidate: EPFInput = {
    monthlyBasicSalary: salary === undefined ? defaults.monthlyBasicSalary : Number(salary),
    employeeContributionPercent: empPct === undefined ? defaults.employeeContributionPercent : Number(empPct),
    employerContributionPercent: erPct === undefined ? defaults.employerContributionPercent : Number(erPct),
    currentAge: age === undefined ? defaults.currentAge : Number(age),
    retirementAge: retireAge === undefined ? defaults.retirementAge : Number(retireAge),
    expectedAnnualInterestRate: rate === undefined ? defaults.expectedAnnualInterestRate : Number(rate),
  }

  const validation = validateEPFInput(candidate)
  if (validation.success) return validation.data

  const withFallbacks: EPFInput = {
    monthlyBasicSalary: validation.errors.monthlyBasicSalary ? defaults.monthlyBasicSalary : candidate.monthlyBasicSalary,
    employeeContributionPercent: validation.errors.employeeContributionPercent ? defaults.employeeContributionPercent : candidate.employeeContributionPercent,
    employerContributionPercent: validation.errors.employerContributionPercent ? defaults.employerContributionPercent : candidate.employerContributionPercent,
    currentAge: validation.errors.currentAge ? defaults.currentAge : candidate.currentAge,
    retirementAge: validation.errors.retirementAge ? defaults.retirementAge : candidate.retirementAge,
    expectedAnnualInterestRate: validation.errors.expectedAnnualInterestRate ? defaults.expectedAnnualInterestRate : candidate.expectedAnnualInterestRate,
  }
  const fallbackValidation = validateEPFInput(withFallbacks)
  return fallbackValidation.success ? fallbackValidation.data : defaults
}

export function serializeEPFUrlState(input: EPFInput): URLSearchParams {
  const validation = validateEPFInput(input)
  if (!validation.success) throw new RangeError("Invalid EPF URL state")
  return new URLSearchParams({
    salary: String(input.monthlyBasicSalary),
    empPct: String(input.employeeContributionPercent),
    erPct: String(input.employerContributionPercent),
    age: String(input.currentAge),
    retireAge: String(input.retirementAge),
    rate: String(input.expectedAnnualInterestRate),
  })
}

export function buildEPFCalculatorUrl(input: EPFInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/epf-calculator",
    Object.fromEntries(serializeEPFUrlState(input)),
    origin,
  )
}
