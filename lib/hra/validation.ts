import type { HraCalcInput, HraCalcValidationErrors, HraCalcValidationResult, HraCity } from "./types"

export const HRA_CITIES: readonly HraCity[] = ["metro", "non-metro"] as const

const AMOUNT_MAX = 1_000_000_000_000 // ₹1 lakh crore — same ceiling used elsewhere in the app (lib/tax/validation.ts)

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= AMOUNT_MAX
}

export function isHraCity(value: string): value is HraCity {
  return (HRA_CITIES as readonly string[]).includes(value)
}

export function validateHraCalcInput(input: HraCalcInput): HraCalcValidationResult {
  const errors: HraCalcValidationErrors = {}

  if (!isNonNegativeFinite(input.basicSalary)) {
    errors.basicSalary = "Enter basic salary that is zero or greater, up to ₹1 lakh crore."
  }
  if (!isNonNegativeFinite(input.da)) {
    errors.da = "Enter DA that is zero or greater, up to ₹1 lakh crore."
  }
  if (!isNonNegativeFinite(input.hraReceived)) {
    errors.hraReceived = "Enter HRA received that is zero or greater, up to ₹1 lakh crore."
  }
  if (!isNonNegativeFinite(input.rentPaid)) {
    errors.rentPaid = "Enter rent paid that is zero or greater, up to ₹1 lakh crore."
  }
  if (!isHraCity(input.city)) {
    errors.city = "Select whether you live in a metro city or a non-metro city."
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: { ...input } }
}
