import type { InflationInput, InflationMode, InflationValidationErrors, InflationValidationResult } from "./inflation-types"

export const INFLATION_LIMITS = {
  amount: { min: 1, max: 100_000_000 },
  // A -10% floor models a plausible severe deflationary scenario without opening the formula to
  // (1 + rate/100) approaching zero or negative, which would make the compounding factor unstable.
  // 50% mirrors the high-inflation "stress case" ceiling other calculators use for annual rates
  // (SIP/Step-up SIP/SWP/Lumpsum all cap expected annual return at 50%).
  annualInflationRate: { min: -10, max: 50 },
  years: { min: 1, max: 50 },
} as const

export type InflationFormValues = { readonly mode:string; readonly amount:string; readonly annualInflationRate:string; readonly years:string }

function isInflationMode(value: string): value is InflationMode {
  return value === "futureCost" || value === "presentValue"
}

// Allows an optional leading "-" (unlike the other calculators' strict non-negative numeric parsers)
// because annualInflationRate must support deflation. Amount and years are still bounds-checked to
// their non-negative ranges downstream, so a stray "-" typed into those fields simply fails validation.
export function parseInflationNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^-?(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateInflationInput(input: InflationInput): InflationValidationResult {
  const errors: InflationValidationErrors = {}
  if (!isInflationMode(input.mode)) errors.mode = "Choose future cost or present value."
  if (!Number.isFinite(input.amount) || input.amount < INFLATION_LIMITS.amount.min || input.amount > INFLATION_LIMITS.amount.max) errors.amount = "Enter an amount between ₹1 and ₹10,00,00,000."
  if (!Number.isFinite(input.annualInflationRate) || input.annualInflationRate < INFLATION_LIMITS.annualInflationRate.min || input.annualInflationRate > INFLATION_LIMITS.annualInflationRate.max) errors.annualInflationRate = "Enter an assumed annual inflation rate between -10% and 50%."
  if (!Number.isInteger(input.years) || input.years < INFLATION_LIMITS.years.min || input.years > INFLATION_LIMITS.years.max) errors.years = "Enter a whole-number duration between 1 and 50 years."
  if (Object.keys(errors).length === 0 && input.mode === "futureCost") {
    const projected = input.amount * Math.pow(1 + input.annualInflationRate / 100, input.years)
    if (!Number.isFinite(projected) || projected > Number.MAX_SAFE_INTEGER) errors.amount = "This combination grows the future cost beyond a safe calculation range."
  }
  return Object.keys(errors).length ? { success:false, errors } : { success:true, data:input }
}

export function parseAndValidateInflationForm(values: InflationFormValues): InflationValidationResult {
  const amount = parseInflationNumericText(values.amount)
  const annualInflationRate = parseInflationNumericText(values.annualInflationRate)
  const years = parseInflationNumericText(values.years)
  const errors: InflationValidationErrors = {}
  if (amount === null) errors.amount = "Enter a valid plain-decimal amount without spaces, commas, symbols, or exponent notation."
  if (annualInflationRate === null) errors.annualInflationRate = "Enter a valid plain-decimal inflation rate without spaces, symbols, or exponent notation."
  if (years === null) errors.years = "Enter a whole-number duration without spaces or symbols."
  if (!isInflationMode(values.mode)) errors.mode = "Choose future cost or present value."
  if (Object.keys(errors).length || amount === null || annualInflationRate === null || years === null || !isInflationMode(values.mode)) return { success:false, errors }
  return validateInflationInput({ mode:values.mode, amount, annualInflationRate, years })
}
