import type {
  EpsPensionAgeOption,
  EpsPensionInput,
  EpsPensionValidationErrors,
  EpsPensionValidationResult,
} from "./eps-pension-types"

export const EPS_PENSION_LIMITS = {
  averageMonthlySalary: { min: 0, max: 10_000_000 },
  yearsOfPensionableService: { min: 0, max: 60 },
  earlyPensionAge: { min: 50, max: 57 },
} as const

export type EpsPensionFormValues = {
  readonly averageMonthlySalary: string
  readonly yearsOfPensionableService: string
  readonly ageOption: string
  readonly earlyPensionAge: string
}

export function isEpsPensionAgeOption(value: string): value is EpsPensionAgeOption {
  return value === "standard" || value === "early"
}

export function parseEpsPensionNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^\d+(?:\.\d+)?$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateEpsPensionInput(input: EpsPensionInput): EpsPensionValidationResult {
  const errors: EpsPensionValidationErrors = {}
  const { averageMonthlySalary, yearsOfPensionableService, ageOption, earlyPensionAge } = input

  if (!Number.isFinite(averageMonthlySalary) || averageMonthlySalary < EPS_PENSION_LIMITS.averageMonthlySalary.min || averageMonthlySalary > EPS_PENSION_LIMITS.averageMonthlySalary.max) {
    errors.averageMonthlySalary = "Enter an average monthly basic + DA salary between ₹0 and ₹1,00,00,000."
  }
  if (!Number.isInteger(yearsOfPensionableService) || yearsOfPensionableService < EPS_PENSION_LIMITS.yearsOfPensionableService.min || yearsOfPensionableService > EPS_PENSION_LIMITS.yearsOfPensionableService.max) {
    errors.yearsOfPensionableService = "Enter a whole number of years of pensionable service from 0 to 60."
  }
  if (!isEpsPensionAgeOption(ageOption)) errors.ageOption = "Choose the standard or early pension option."
  if (!Number.isInteger(earlyPensionAge) || earlyPensionAge < EPS_PENSION_LIMITS.earlyPensionAge.min || earlyPensionAge > EPS_PENSION_LIMITS.earlyPensionAge.max) {
    errors.earlyPensionAge = "Enter a whole-number pension-start age from 50 to 57."
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { ...input } }
}

export function parseAndValidateEpsPensionForm(values: EpsPensionFormValues): EpsPensionValidationResult {
  const averageMonthlySalary = parseEpsPensionNumericText(values.averageMonthlySalary)
  const yearsOfPensionableService = parseEpsPensionNumericText(values.yearsOfPensionableService)
  const earlyPensionAge = parseEpsPensionNumericText(values.earlyPensionAge)
  const errors: EpsPensionValidationErrors = {}

  if (averageMonthlySalary === null) errors.averageMonthlySalary = "Enter a valid plain-decimal average monthly basic + DA salary."
  if (yearsOfPensionableService === null) errors.yearsOfPensionableService = "Enter years of pensionable service as a whole number."
  if (!isEpsPensionAgeOption(values.ageOption)) errors.ageOption = "Choose the standard or early pension option."
  if (earlyPensionAge === null) errors.earlyPensionAge = "Enter the pension-start age as a whole number."

  if (
    Object.keys(errors).length
    || averageMonthlySalary === null
    || yearsOfPensionableService === null
    || !isEpsPensionAgeOption(values.ageOption)
    || earlyPensionAge === null
  ) {
    return { success: false, errors }
  }

  return validateEpsPensionInput({
    averageMonthlySalary,
    yearsOfPensionableService,
    ageOption: values.ageOption,
    earlyPensionAge,
  })
}
