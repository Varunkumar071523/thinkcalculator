import type { RetirementInput, RetirementValidationErrors, RetirementValidationResult } from "./retirement-types"

export const RETIREMENT_LIMITS = {
  currentAge: { min: 18, max: 75 },
  retirementAge: { min: 19, max: 80 },
  lifeExpectancy: { min: 20, max: 110 },
  currentSavings: { min: 0, max: 1_000_000_000 },
  monthlyContribution: { min: 0, max: 10_000_000 },
  expectedReturnPreRetirement: { min: 0, max: 50 },
  expectedReturnPostRetirement: { min: 0, max: 50 },
  desiredMonthlyWithdrawal: { min: 100, max: 10_000_000 },
  // Matches the Inflation calculator's own bounds: a -10% floor models severe deflation without
  // destabilising the (1 + rate/100) compounding base; 50% mirrors the shared high-inflation
  // "stress case" ceiling other calculators in this repo use for annual rates.
  inflationRate: { min: -10, max: 50 },
} as const

export type RetirementFormValues = {
  readonly currentAge: string
  readonly retirementAge: string
  readonly lifeExpectancy: string
  readonly currentSavings: string
  readonly monthlyContribution: string
  readonly expectedReturnPreRetirement: string
  readonly expectedReturnPostRetirement: string
  readonly desiredMonthlyWithdrawal: string
  readonly inflationRate: string
}

export function parseRetirementNumericText(value: string, allowNegative = false): number | null {
  const pattern = allowNegative ? /^-?(?:\d+|\d*\.\d+)$/ : /^(?:\d+|\d*\.\d+)$/
  if (value === "" || value.trim() !== value || !pattern.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateRetirementInput(input: RetirementInput): RetirementValidationResult {
  const errors: RetirementValidationErrors = {}
  if (!Number.isInteger(input.currentAge) || input.currentAge < RETIREMENT_LIMITS.currentAge.min || input.currentAge > RETIREMENT_LIMITS.currentAge.max) errors.currentAge = "Enter a whole-number current age between 18 and 75."
  if (!Number.isInteger(input.retirementAge) || input.retirementAge < RETIREMENT_LIMITS.retirementAge.min || input.retirementAge > RETIREMENT_LIMITS.retirementAge.max) errors.retirementAge = "Enter a whole-number retirement age between 19 and 80."
  if (!Number.isInteger(input.lifeExpectancy) || input.lifeExpectancy < RETIREMENT_LIMITS.lifeExpectancy.min || input.lifeExpectancy > RETIREMENT_LIMITS.lifeExpectancy.max) errors.lifeExpectancy = "Enter a whole-number life expectancy between 20 and 110."
  if (!errors.currentAge && !errors.retirementAge && input.retirementAge - input.currentAge < 1) errors.retirementAge = "Retirement age must be at least 1 year after the current age."
  if (!errors.retirementAge && !errors.lifeExpectancy && input.lifeExpectancy - input.retirementAge < 1) errors.lifeExpectancy = "Life expectancy must be at least 1 year after retirement age."
  if (!Number.isFinite(input.currentSavings) || input.currentSavings < RETIREMENT_LIMITS.currentSavings.min || input.currentSavings > RETIREMENT_LIMITS.currentSavings.max) errors.currentSavings = "Enter current savings between ₹0 and ₹1,00,00,00,000."
  if (!Number.isFinite(input.monthlyContribution) || input.monthlyContribution < RETIREMENT_LIMITS.monthlyContribution.min || input.monthlyContribution > RETIREMENT_LIMITS.monthlyContribution.max) errors.monthlyContribution = "Enter a monthly contribution between ₹0 and ₹1,00,00,000."
  if (!Number.isFinite(input.expectedReturnPreRetirement) || input.expectedReturnPreRetirement < RETIREMENT_LIMITS.expectedReturnPreRetirement.min || input.expectedReturnPreRetirement > RETIREMENT_LIMITS.expectedReturnPreRetirement.max) errors.expectedReturnPreRetirement = "Enter an expected pre-retirement return between 0% and 50%."
  if (!Number.isFinite(input.expectedReturnPostRetirement) || input.expectedReturnPostRetirement < RETIREMENT_LIMITS.expectedReturnPostRetirement.min || input.expectedReturnPostRetirement > RETIREMENT_LIMITS.expectedReturnPostRetirement.max) errors.expectedReturnPostRetirement = "Enter an expected post-retirement return between 0% and 50%."
  if (!Number.isFinite(input.desiredMonthlyWithdrawal) || input.desiredMonthlyWithdrawal < RETIREMENT_LIMITS.desiredMonthlyWithdrawal.min || input.desiredMonthlyWithdrawal > RETIREMENT_LIMITS.desiredMonthlyWithdrawal.max) errors.desiredMonthlyWithdrawal = "Enter a desired monthly withdrawal between ₹100 and ₹1,00,00,000."
  if (!Number.isFinite(input.inflationRate) || input.inflationRate < RETIREMENT_LIMITS.inflationRate.min || input.inflationRate > RETIREMENT_LIMITS.inflationRate.max) errors.inflationRate = "Enter an assumed annual inflation rate between -10% and 50%."

  // Safety net for the two genuinely new compounding paths this calculator introduces: a lump sum
  // and a monthly contribution compounding together for up to ~57 years, and a monthly withdrawal
  // target that itself compounds with inflation for up to ~91 years. Each is checked with the
  // closed-form equivalent of the recurrence the calculation functions use (future-value-of-annuity
  // for accumulation; a single Math.pow for the last inflation-escalated year), not by re-running the
  // month-by-month loops here — this file must not import from calculate-retirement.ts, since that
  // module already imports validateRetirementInput from here. Matches the "safe calculation range"
  // guard pattern used by inflation-schema.ts and step-up-sip-schema.ts.
  if (Object.keys(errors).length === 0) {
    const months = (input.retirementAge - input.currentAge) * 12
    const monthlyRate = input.expectedReturnPreRetirement / 12 / 100
    const projectedCorpus = monthlyRate === 0
      ? input.currentSavings + input.monthlyContribution * months
      : input.currentSavings * Math.pow(1 + monthlyRate, months) + input.monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
    if (!Number.isFinite(projectedCorpus) || projectedCorpus > Number.MAX_SAFE_INTEGER) {
      errors.monthlyContribution = "This combination grows the projected corpus beyond a safe calculation range."
    } else {
      const retirementDurationYears = input.lifeExpectancy - input.retirementAge
      const lastYearWithdrawal = input.desiredMonthlyWithdrawal * Math.pow(1 + input.inflationRate / 100, retirementDurationYears - 1)
      if (!Number.isFinite(lastYearWithdrawal) || lastYearWithdrawal > Number.MAX_SAFE_INTEGER) {
        errors.inflationRate = "This combination grows the inflation-adjusted withdrawal beyond a safe calculation range."
      }
    }
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: input }
}

export function parseAndValidateRetirementForm(values: RetirementFormValues): RetirementValidationResult {
  const currentAge = parseRetirementNumericText(values.currentAge)
  const retirementAge = parseRetirementNumericText(values.retirementAge)
  const lifeExpectancy = parseRetirementNumericText(values.lifeExpectancy)
  const currentSavings = parseRetirementNumericText(values.currentSavings)
  const monthlyContribution = parseRetirementNumericText(values.monthlyContribution)
  const expectedReturnPreRetirement = parseRetirementNumericText(values.expectedReturnPreRetirement)
  const expectedReturnPostRetirement = parseRetirementNumericText(values.expectedReturnPostRetirement)
  const desiredMonthlyWithdrawal = parseRetirementNumericText(values.desiredMonthlyWithdrawal)
  const inflationRate = parseRetirementNumericText(values.inflationRate, true)

  const errors: RetirementValidationErrors = {}
  if (currentAge === null) errors.currentAge = "Enter a valid whole-number current age without spaces, commas, symbols, or exponent notation."
  if (retirementAge === null) errors.retirementAge = "Enter a valid whole-number retirement age without spaces, commas, symbols, or exponent notation."
  if (lifeExpectancy === null) errors.lifeExpectancy = "Enter a valid whole-number life expectancy without spaces, commas, symbols, or exponent notation."
  if (currentSavings === null) errors.currentSavings = "Enter a valid plain-decimal current savings amount without spaces, commas, symbols, or exponent notation."
  if (monthlyContribution === null) errors.monthlyContribution = "Enter a valid plain-decimal monthly contribution without spaces, commas, symbols, or exponent notation."
  if (expectedReturnPreRetirement === null) errors.expectedReturnPreRetirement = "Enter a valid plain-decimal pre-retirement return without spaces, symbols, or exponent notation."
  if (expectedReturnPostRetirement === null) errors.expectedReturnPostRetirement = "Enter a valid plain-decimal post-retirement return without spaces, symbols, or exponent notation."
  if (desiredMonthlyWithdrawal === null) errors.desiredMonthlyWithdrawal = "Enter a valid plain-decimal desired monthly withdrawal without spaces, commas, symbols, or exponent notation."
  if (inflationRate === null) errors.inflationRate = "Enter a valid plain-decimal inflation rate without spaces, symbols, or exponent notation."

  if (
    Object.keys(errors).length ||
    currentAge === null || retirementAge === null || lifeExpectancy === null ||
    currentSavings === null || monthlyContribution === null ||
    expectedReturnPreRetirement === null || expectedReturnPostRetirement === null ||
    desiredMonthlyWithdrawal === null || inflationRate === null
  ) return { success: false, errors }

  return validateRetirementInput({
    currentAge, retirementAge, lifeExpectancy, currentSavings, monthlyContribution,
    expectedReturnPreRetirement, expectedReturnPostRetirement, desiredMonthlyWithdrawal, inflationRate,
  })
}
