import { buildCalculatorUrl } from "@/lib/calculator-url"
import { validateEMIInput } from "@/features/calculators/emi/emi-schema"
import type { EMIInput, TenureUnit } from "@/features/calculators/emi/emi-types"

export const EMI_DEFAULT_INPUT: EMIInput = {
  principalAmount: 2_500_000,
  annualInterestRate: 8.5,
  tenure: 20,
  tenureUnit: "years",
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>

function readParameter(search: SearchInput, key: string): string | undefined {
  if (search instanceof URLSearchParams) return search.get(key) ?? undefined
  const value = search[key]
  return Array.isArray(value) ? value[0] : value
}

export function parseEMIUrlState(search: SearchInput, defaults: EMIInput = EMI_DEFAULT_INPUT): EMIInput {
  const amount = readParameter(search, "amount")
  const rate = readParameter(search, "rate")
  const tenure = readParameter(search, "tenure")
  const unit = readParameter(search, "unit")

  const candidate: EMIInput = {
    principalAmount: amount === undefined ? defaults.principalAmount : Number(amount),
    annualInterestRate: rate === undefined ? defaults.annualInterestRate : Number(rate),
    tenure: tenure === undefined ? defaults.tenure : Number(tenure),
    tenureUnit: (unit === undefined ? defaults.tenureUnit : unit) as TenureUnit,
  }

  const validation = validateEMIInput(candidate)
  if (validation.success) return validation.data

  const withFallbacks: EMIInput = {
    principalAmount: validation.errors.principalAmount ? defaults.principalAmount : candidate.principalAmount,
    annualInterestRate: validation.errors.annualInterestRate ? defaults.annualInterestRate : candidate.annualInterestRate,
    tenure: validation.errors.tenure ? defaults.tenure : candidate.tenure,
    tenureUnit: validation.errors.tenureUnit ? defaults.tenureUnit : candidate.tenureUnit,
  }
  const fallbackValidation = validateEMIInput(withFallbacks)
  return fallbackValidation.success ? fallbackValidation.data : defaults
}

export function serializeEMIUrlState(input: EMIInput): URLSearchParams {
  const validation = validateEMIInput(input)
  if (!validation.success) throw new RangeError("Invalid EMI URL state")
  return new URLSearchParams({
    amount: String(input.principalAmount),
    rate: String(input.annualInterestRate),
    tenure: String(input.tenure),
    unit: input.tenureUnit,
  })
}

export function buildEMICalculatorUrl(input: EMIInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/emi-calculator",
    Object.fromEntries(serializeEMIUrlState(input)),
    origin,
  )
}
