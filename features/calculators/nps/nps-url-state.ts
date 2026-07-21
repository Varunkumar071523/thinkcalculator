import { buildCalculatorUrl } from "@/lib/calculator-url"
import { validateNPSInput } from "./nps-schema"
import type { NPSInput } from "./nps-types"

export const NPS_DEFAULT_INPUT: NPSInput = {
  monthlyContribution: 5_000,
  currentAge: 30,
  retirementAge: 60,
  equityAllocationPercent: 50,
  corporateDebtAllocationPercent: 30,
  equityExpectedReturn: 12,
  corporateDebtExpectedReturn: 8,
  govtSecuritiesExpectedReturn: 7,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>

function readParameter(search: SearchInput, key: string): string | undefined {
  if (search instanceof URLSearchParams) return search.get(key) ?? undefined
  const value = search[key]
  return Array.isArray(value) ? value[0] : value
}

export function parseNPSUrlState(search: SearchInput, defaults: NPSInput = NPS_DEFAULT_INPUT): NPSInput {
  const contribution = readParameter(search, "contribution")
  const age = readParameter(search, "age")
  const retireAge = readParameter(search, "retireAge")
  const equity = readParameter(search, "equity")
  const debt = readParameter(search, "debt")
  const equityReturn = readParameter(search, "equityReturn")
  const debtReturn = readParameter(search, "debtReturn")
  const govtReturn = readParameter(search, "govtReturn")

  const candidate: NPSInput = {
    monthlyContribution: contribution === undefined ? defaults.monthlyContribution : Number(contribution),
    currentAge: age === undefined ? defaults.currentAge : Number(age),
    retirementAge: retireAge === undefined ? defaults.retirementAge : Number(retireAge),
    equityAllocationPercent: equity === undefined ? defaults.equityAllocationPercent : Number(equity),
    corporateDebtAllocationPercent: debt === undefined ? defaults.corporateDebtAllocationPercent : Number(debt),
    equityExpectedReturn: equityReturn === undefined ? defaults.equityExpectedReturn : Number(equityReturn),
    corporateDebtExpectedReturn: debtReturn === undefined ? defaults.corporateDebtExpectedReturn : Number(debtReturn),
    govtSecuritiesExpectedReturn: govtReturn === undefined ? defaults.govtSecuritiesExpectedReturn : Number(govtReturn),
  }

  const validation = validateNPSInput(candidate)
  if (validation.success) return validation.data

  const withFallbacks: NPSInput = {
    monthlyContribution: validation.errors.monthlyContribution ? defaults.monthlyContribution : candidate.monthlyContribution,
    currentAge: validation.errors.currentAge ? defaults.currentAge : candidate.currentAge,
    retirementAge: validation.errors.retirementAge ? defaults.retirementAge : candidate.retirementAge,
    equityAllocationPercent: validation.errors.equityAllocationPercent ? defaults.equityAllocationPercent : candidate.equityAllocationPercent,
    corporateDebtAllocationPercent: validation.errors.corporateDebtAllocationPercent ? defaults.corporateDebtAllocationPercent : candidate.corporateDebtAllocationPercent,
    equityExpectedReturn: validation.errors.equityExpectedReturn ? defaults.equityExpectedReturn : candidate.equityExpectedReturn,
    corporateDebtExpectedReturn: validation.errors.corporateDebtExpectedReturn ? defaults.corporateDebtExpectedReturn : candidate.corporateDebtExpectedReturn,
    govtSecuritiesExpectedReturn: validation.errors.govtSecuritiesExpectedReturn ? defaults.govtSecuritiesExpectedReturn : candidate.govtSecuritiesExpectedReturn,
  }
  const fallbackValidation = validateNPSInput(withFallbacks)
  return fallbackValidation.success ? fallbackValidation.data : defaults
}

export function serializeNPSUrlState(input: NPSInput): URLSearchParams {
  const validation = validateNPSInput(input)
  if (!validation.success) throw new RangeError("Invalid NPS URL state")
  return new URLSearchParams({
    contribution: String(input.monthlyContribution),
    age: String(input.currentAge),
    retireAge: String(input.retirementAge),
    equity: String(input.equityAllocationPercent),
    debt: String(input.corporateDebtAllocationPercent),
    equityReturn: String(input.equityExpectedReturn),
    debtReturn: String(input.corporateDebtExpectedReturn),
    govtReturn: String(input.govtSecuritiesExpectedReturn),
  })
}

export function buildNPSCalculatorUrl(input: NPSInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/nps-calculator",
    Object.fromEntries(serializeNPSUrlState(input)),
    origin,
  )
}
