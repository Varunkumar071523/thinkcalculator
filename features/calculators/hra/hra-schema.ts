import { isHraCity, validateHraCalcInput } from "@/lib/hra/validation"
import type { HraCalcInput, HraCalcValidationErrors, HraCalcValidationResult } from "@/lib/hra/types"
import type { HraFormValues } from "./hra-types"

export const HRA_LIMITS = {
  amount: { min: 0, max: 1_000_000_000_000 },
} as const

export const HRA_DEFAULT_FORM_VALUES: HraFormValues = {
  basicSalary: "600000",
  da: "0",
  hraReceived: "240000",
  rentPaid: "180000",
  city: "metro",
}

/** Required field: blank text is invalid, distinct from a deliberate zero. */
function parseRequiredAmount(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** DA is optional — blank means "no DA forming part of retirement benefits", i.e. zero. */
function parseOptionalAmount(value: string): number | null {
  if (value.trim() === "") return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseAndValidateHraForm(values: HraFormValues): HraCalcValidationResult {
  const basicSalary = parseRequiredAmount(values.basicSalary)
  const da = parseOptionalAmount(values.da)
  const hraReceived = parseRequiredAmount(values.hraReceived)
  const rentPaid = parseRequiredAmount(values.rentPaid)

  const errors: HraCalcValidationErrors = {}
  if (basicSalary === null) errors.basicSalary = "Enter a valid basic salary amount."
  if (da === null) errors.da = "Enter a valid DA amount."
  if (hraReceived === null) errors.hraReceived = "Enter a valid HRA received amount."
  if (rentPaid === null) errors.rentPaid = "Enter a valid rent paid amount."
  if (!isHraCity(values.city)) errors.city = "Select whether you live in a metro city or a non-metro city."

  if (basicSalary === null || da === null || hraReceived === null || rentPaid === null || !isHraCity(values.city)) {
    return { success: false, errors }
  }

  const input: HraCalcInput = { basicSalary, da, hraReceived, rentPaid, city: values.city }
  return validateHraCalcInput(input)
}
