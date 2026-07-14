import type { SWPInput, SWPValidationErrors, SWPValidationResult, SWPWithdrawalMode } from "./swp-types"

export const SWP_LIMITS = {
  initialInvestment: { min: 1_000, max: 100_000_000 },
  monthlyWithdrawal: { min: 100, max: 10_000_000 },
  expectedAnnualReturn: { min: 0, max: 50 },
  durationYears: { min: 1, max: 50 },
} as const

export type SWPFormValues = { readonly initialInvestment:string; readonly monthlyWithdrawal:string; readonly expectedAnnualReturn:string; readonly withdrawalMode:string; readonly durationYears:string }

export function parseSWPNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isSWPWithdrawalMode(value: string): value is SWPWithdrawalMode {
  return value === "fixedDuration" || value === "untilExhausted"
}

export function validateSWPInput(input: SWPInput): SWPValidationResult {
  const errors: SWPValidationErrors = {}
  if (!Number.isFinite(input.initialInvestment) || input.initialInvestment < SWP_LIMITS.initialInvestment.min || input.initialInvestment > SWP_LIMITS.initialInvestment.max) errors.initialInvestment = "Enter an initial investment between ₹1,000 and ₹10,00,00,000."
  if (!Number.isFinite(input.monthlyWithdrawal) || input.monthlyWithdrawal < SWP_LIMITS.monthlyWithdrawal.min || input.monthlyWithdrawal > SWP_LIMITS.monthlyWithdrawal.max) errors.monthlyWithdrawal = "Enter a monthly withdrawal between ₹100 and ₹1,00,00,000."
  if (!Number.isFinite(input.expectedAnnualReturn) || input.expectedAnnualReturn < SWP_LIMITS.expectedAnnualReturn.min || input.expectedAnnualReturn > SWP_LIMITS.expectedAnnualReturn.max) errors.expectedAnnualReturn = "Enter an expected annual return between 0% and 50%."
  if (!isSWPWithdrawalMode(input.withdrawalMode)) errors.withdrawalMode = "Choose a fixed duration or until balance is exhausted."
  // durationYears is only used in "fixedDuration" mode, but it is still bounds-checked in every mode so the
  // typed input always carries a valid, form-round-trippable value even while the field is hidden in "untilExhausted" mode.
  if (!Number.isInteger(input.durationYears) || input.durationYears < SWP_LIMITS.durationYears.min || input.durationYears > SWP_LIMITS.durationYears.max) errors.durationYears = "Enter a whole-number duration between 1 and 50 years."
  return Object.keys(errors).length ? { success:false, errors } : { success:true, data:input }
}

export function parseAndValidateSWPForm(values: SWPFormValues): SWPValidationResult {
  const initialInvestment = parseSWPNumericText(values.initialInvestment)
  const monthlyWithdrawal = parseSWPNumericText(values.monthlyWithdrawal)
  const expectedAnnualReturn = parseSWPNumericText(values.expectedAnnualReturn)
  const durationYears = parseSWPNumericText(values.durationYears)
  const errors: SWPValidationErrors = {}
  if (initialInvestment === null) errors.initialInvestment = "Enter a valid plain-decimal initial investment without spaces, commas, symbols, or exponent notation."
  if (monthlyWithdrawal === null) errors.monthlyWithdrawal = "Enter a valid plain-decimal monthly withdrawal without spaces, commas, symbols, or exponent notation."
  if (expectedAnnualReturn === null) errors.expectedAnnualReturn = "Enter a valid plain-decimal expected return without spaces, symbols, or exponent notation."
  if (durationYears === null) errors.durationYears = "Enter a whole-number duration without spaces or symbols."
  if (!isSWPWithdrawalMode(values.withdrawalMode)) errors.withdrawalMode = "Choose a fixed duration or until balance is exhausted."
  if (Object.keys(errors).length || initialInvestment === null || monthlyWithdrawal === null || expectedAnnualReturn === null || durationYears === null || !isSWPWithdrawalMode(values.withdrawalMode)) return { success:false, errors }
  return validateSWPInput({ initialInvestment, monthlyWithdrawal, expectedAnnualReturn, withdrawalMode:values.withdrawalMode, durationYears })
}
