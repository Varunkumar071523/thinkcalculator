import type { NPSInput, NPSValidationErrors, NPSValidationResult } from "./nps-types"

export const NPS_LIMITS = {
  monthlyContribution: { min: 0, max: 1_000_000 },
  currentAge: { min: 18, max: 65 },
  retirementAge: { min: 19, max: 75 },
  equityAllocationPercent: { min: 0, max: 100 },
  corporateDebtAllocationPercent: { min: 0, max: 100 },
  equityExpectedReturn: { min: 0, max: 20 },
  corporateDebtExpectedReturn: { min: 0, max: 12 },
  govtSecuritiesExpectedReturn: { min: 0, max: 10 },
} as const

export type NPSFormValues = {
  readonly monthlyContribution: string
  readonly currentAge: string
  readonly retirementAge: string
  readonly equityAllocationPercent: string
  readonly corporateDebtAllocationPercent: string
  readonly equityExpectedReturn: string
  readonly corporateDebtExpectedReturn: string
  readonly govtSecuritiesExpectedReturn: string
}

export function parseNPSNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Equity and corporate debt are direct inputs; government securities is always the remainder of
 * the 100% allocation (see nps-types.ts's NPSResult.govtSecuritiesAllocationPercent) — so the only
 * cross-field rule here is that the two direct inputs cannot themselves exceed 100%. This avoids the
 * classic "three sliders that must sum to 100" UX/validation problem while still allowing a genuine
 * 100%-to-one-asset-class scenario (e.g. equity = 100, corporate debt = 0). */
export function validateNPSInput(input: NPSInput): NPSValidationResult {
  const errors: NPSValidationErrors = {}
  const { monthlyContribution, currentAge, retirementAge, equityAllocationPercent, corporateDebtAllocationPercent, equityExpectedReturn, corporateDebtExpectedReturn, govtSecuritiesExpectedReturn } = input

  if (!Number.isFinite(monthlyContribution) || monthlyContribution < NPS_LIMITS.monthlyContribution.min || monthlyContribution > NPS_LIMITS.monthlyContribution.max) {
    errors.monthlyContribution = "Enter a monthly contribution between ₹0 and ₹10,00,000."
  }
  if (!Number.isInteger(currentAge) || currentAge < NPS_LIMITS.currentAge.min || currentAge > NPS_LIMITS.currentAge.max) {
    errors.currentAge = "Enter a whole-number current age between 18 and 65."
  }
  if (!Number.isInteger(retirementAge) || retirementAge < NPS_LIMITS.retirementAge.min || retirementAge > NPS_LIMITS.retirementAge.max) {
    errors.retirementAge = "Enter a whole-number retirement age between 19 and 75."
  }
  if (!errors.currentAge && !errors.retirementAge && retirementAge - currentAge < 1) {
    errors.retirementAge = "Retirement age must be at least 1 year after the current age."
  }
  if (!Number.isFinite(equityAllocationPercent) || equityAllocationPercent < NPS_LIMITS.equityAllocationPercent.min || equityAllocationPercent > NPS_LIMITS.equityAllocationPercent.max) {
    errors.equityAllocationPercent = "Enter an equity allocation between 0% and 100%."
  }
  if (!Number.isFinite(corporateDebtAllocationPercent) || corporateDebtAllocationPercent < NPS_LIMITS.corporateDebtAllocationPercent.min || corporateDebtAllocationPercent > NPS_LIMITS.corporateDebtAllocationPercent.max) {
    errors.corporateDebtAllocationPercent = "Enter a corporate debt allocation between 0% and 100%."
  }
  if (!errors.equityAllocationPercent && !errors.corporateDebtAllocationPercent && equityAllocationPercent + corporateDebtAllocationPercent > 100) {
    errors.corporateDebtAllocationPercent = "Equity and corporate debt allocations together cannot exceed 100%."
  }
  if (!Number.isFinite(equityExpectedReturn) || equityExpectedReturn < NPS_LIMITS.equityExpectedReturn.min || equityExpectedReturn > NPS_LIMITS.equityExpectedReturn.max) {
    errors.equityExpectedReturn = "Enter an expected equity return between 0% and 20%."
  }
  if (!Number.isFinite(corporateDebtExpectedReturn) || corporateDebtExpectedReturn < NPS_LIMITS.corporateDebtExpectedReturn.min || corporateDebtExpectedReturn > NPS_LIMITS.corporateDebtExpectedReturn.max) {
    errors.corporateDebtExpectedReturn = "Enter an expected corporate debt return between 0% and 12%."
  }
  if (!Number.isFinite(govtSecuritiesExpectedReturn) || govtSecuritiesExpectedReturn < NPS_LIMITS.govtSecuritiesExpectedReturn.min || govtSecuritiesExpectedReturn > NPS_LIMITS.govtSecuritiesExpectedReturn.max) {
    errors.govtSecuritiesExpectedReturn = "Enter an expected government securities return between 0% and 10%."
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: input }
}

export function parseAndValidateNPSForm(values: NPSFormValues): NPSValidationResult {
  const monthlyContribution = parseNPSNumericText(values.monthlyContribution)
  const currentAge = parseNPSNumericText(values.currentAge)
  const retirementAge = parseNPSNumericText(values.retirementAge)
  const equityAllocationPercent = parseNPSNumericText(values.equityAllocationPercent)
  const corporateDebtAllocationPercent = parseNPSNumericText(values.corporateDebtAllocationPercent)
  const equityExpectedReturn = parseNPSNumericText(values.equityExpectedReturn)
  const corporateDebtExpectedReturn = parseNPSNumericText(values.corporateDebtExpectedReturn)
  const govtSecuritiesExpectedReturn = parseNPSNumericText(values.govtSecuritiesExpectedReturn)

  const errors: NPSValidationErrors = {}
  if (monthlyContribution === null) errors.monthlyContribution = "Enter a valid plain-decimal monthly contribution without spaces, commas, symbols, or exponent notation."
  if (currentAge === null) errors.currentAge = "Enter a valid whole-number current age without spaces, commas, symbols, or exponent notation."
  if (retirementAge === null) errors.retirementAge = "Enter a valid whole-number retirement age without spaces, commas, symbols, or exponent notation."
  if (equityAllocationPercent === null) errors.equityAllocationPercent = "Enter a valid plain-decimal equity allocation without spaces, symbols, or exponent notation."
  if (corporateDebtAllocationPercent === null) errors.corporateDebtAllocationPercent = "Enter a valid plain-decimal corporate debt allocation without spaces, symbols, or exponent notation."
  if (equityExpectedReturn === null) errors.equityExpectedReturn = "Enter a valid plain-decimal expected equity return without spaces, symbols, or exponent notation."
  if (corporateDebtExpectedReturn === null) errors.corporateDebtExpectedReturn = "Enter a valid plain-decimal expected corporate debt return without spaces, symbols, or exponent notation."
  if (govtSecuritiesExpectedReturn === null) errors.govtSecuritiesExpectedReturn = "Enter a valid plain-decimal expected government securities return without spaces, symbols, or exponent notation."

  if (
    Object.keys(errors).length ||
    monthlyContribution === null || currentAge === null || retirementAge === null ||
    equityAllocationPercent === null || corporateDebtAllocationPercent === null ||
    equityExpectedReturn === null || corporateDebtExpectedReturn === null || govtSecuritiesExpectedReturn === null
  ) return { success: false, errors }

  return validateNPSInput({
    monthlyContribution, currentAge, retirementAge,
    equityAllocationPercent, corporateDebtAllocationPercent,
    equityExpectedReturn, corporateDebtExpectedReturn, govtSecuritiesExpectedReturn,
  })
}
