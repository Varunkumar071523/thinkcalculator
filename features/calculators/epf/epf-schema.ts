import type { EPFInput, EPFValidationErrors, EPFValidationResult } from "./epf-types"

export const EPF_LIMITS = {
  monthlyBasicSalary: { min: 0, max: 10_000_000 },
  employeeContributionPercent: { min: 0, max: 100 },
  employerContributionPercent: { min: 0, max: 100 },
  currentAge: { min: 18, max: 59 },
  retirementAge: { min: 19, max: 60 },
  expectedAnnualInterestRate: { min: 0, max: 15 },
} as const

export type EPFFormValues = {
  readonly monthlyBasicSalary: string
  readonly employeeContributionPercent: string
  readonly employerContributionPercent: string
  readonly currentAge: string
  readonly retirementAge: string
  readonly expectedAnnualInterestRate: string
}

export function parseEPFNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateEPFInput(input: EPFInput): EPFValidationResult {
  const errors: EPFValidationErrors = {}
  const { monthlyBasicSalary, employeeContributionPercent, employerContributionPercent, currentAge, retirementAge, expectedAnnualInterestRate } = input

  if (!Number.isFinite(monthlyBasicSalary) || monthlyBasicSalary < EPF_LIMITS.monthlyBasicSalary.min || monthlyBasicSalary > EPF_LIMITS.monthlyBasicSalary.max) {
    errors.monthlyBasicSalary = "Enter a monthly basic salary (plus DA) between ₹0 and ₹1,00,00,000."
  }
  if (!Number.isFinite(employeeContributionPercent) || employeeContributionPercent < EPF_LIMITS.employeeContributionPercent.min || employeeContributionPercent > EPF_LIMITS.employeeContributionPercent.max) {
    errors.employeeContributionPercent = "Enter an employee contribution rate between 0% and 100%."
  }
  if (!Number.isFinite(employerContributionPercent) || employerContributionPercent < EPF_LIMITS.employerContributionPercent.min || employerContributionPercent > EPF_LIMITS.employerContributionPercent.max) {
    errors.employerContributionPercent = "Enter an employer contribution rate between 0% and 100%."
  }
  if (!Number.isInteger(currentAge) || currentAge < EPF_LIMITS.currentAge.min || currentAge > EPF_LIMITS.currentAge.max) {
    errors.currentAge = "Enter a whole-number current age between 18 and 59."
  }
  if (!Number.isInteger(retirementAge) || retirementAge < EPF_LIMITS.retirementAge.min || retirementAge > EPF_LIMITS.retirementAge.max) {
    errors.retirementAge = "Enter a whole-number retirement age between 19 and 60."
  }
  if (!errors.currentAge && !errors.retirementAge && retirementAge - currentAge < 1) {
    errors.retirementAge = "Retirement age must be at least 1 year after the current age."
  }
  if (!Number.isFinite(expectedAnnualInterestRate) || expectedAnnualInterestRate < EPF_LIMITS.expectedAnnualInterestRate.min || expectedAnnualInterestRate > EPF_LIMITS.expectedAnnualInterestRate.max) {
    errors.expectedAnnualInterestRate = "Enter an expected annual interest rate between 0% and 15%."
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: input }
}

export function parseAndValidateEPFForm(values: EPFFormValues): EPFValidationResult {
  const monthlyBasicSalary = parseEPFNumericText(values.monthlyBasicSalary)
  const employeeContributionPercent = parseEPFNumericText(values.employeeContributionPercent)
  const employerContributionPercent = parseEPFNumericText(values.employerContributionPercent)
  const currentAge = parseEPFNumericText(values.currentAge)
  const retirementAge = parseEPFNumericText(values.retirementAge)
  const expectedAnnualInterestRate = parseEPFNumericText(values.expectedAnnualInterestRate)

  const errors: EPFValidationErrors = {}
  if (monthlyBasicSalary === null) errors.monthlyBasicSalary = "Enter a valid plain-decimal monthly basic salary without spaces, commas, symbols, or exponent notation."
  if (employeeContributionPercent === null) errors.employeeContributionPercent = "Enter a valid plain-decimal employee contribution rate without spaces, symbols, or exponent notation."
  if (employerContributionPercent === null) errors.employerContributionPercent = "Enter a valid plain-decimal employer contribution rate without spaces, symbols, or exponent notation."
  if (currentAge === null) errors.currentAge = "Enter a valid whole-number current age without spaces, commas, symbols, or exponent notation."
  if (retirementAge === null) errors.retirementAge = "Enter a valid whole-number retirement age without spaces, commas, symbols, or exponent notation."
  if (expectedAnnualInterestRate === null) errors.expectedAnnualInterestRate = "Enter a valid plain-decimal interest rate without spaces, symbols, or exponent notation."

  if (
    Object.keys(errors).length ||
    monthlyBasicSalary === null || employeeContributionPercent === null || employerContributionPercent === null ||
    currentAge === null || retirementAge === null || expectedAnnualInterestRate === null
  ) return { success: false, errors }

  return validateEPFInput({
    monthlyBasicSalary, employeeContributionPercent, employerContributionPercent,
    currentAge, retirementAge, expectedAnnualInterestRate,
  })
}
