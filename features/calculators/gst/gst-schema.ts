import { GST_RATE_CONFIG } from "./gst-rate-config"
import type { GSTCalculationMode, GSTInput, GSTSupplyType, GSTValidationErrors, GSTValidationResult } from "./gst-types"

export const GST_LIMITS = {
  amount: { min: 0.01, max: 1_000_000_000_000_000 },
  gstRate: { min: GST_RATE_CONFIG.minimumRate, max: GST_RATE_CONFIG.maximumRate },
} as const

export type GSTFormValues = {
  readonly amount: string
  readonly gstRate: string
  readonly calculationMode: string
  readonly supplyType: string
}

export function parseGSTNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
}

export function isGSTCalculationMode(value: string): value is GSTCalculationMode {
  return value === "add" || value === "remove"
}

export function isGSTSupplyType(value: string): value is GSTSupplyType {
  return value === "intra-state" || value === "inter-state"
}

export function validateGSTInput(input: GSTInput): GSTValidationResult {
  const errors: GSTValidationErrors = {}
  if (!Number.isFinite(input.amount) || input.amount < GST_LIMITS.amount.min || input.amount > GST_LIMITS.amount.max || !hasAtMostTwoDecimals(input.amount)) {
    errors.amount = "Enter an amount greater than zero and up to ₹1,000 lakh crore, with no more than two decimal places."
  }
  if (!Number.isFinite(input.gstRate) || input.gstRate < GST_LIMITS.gstRate.min || input.gstRate > GST_LIMITS.gstRate.max || !hasAtMostTwoDecimals(input.gstRate)) {
    errors.gstRate = "Enter a GST rate from 0% to 100%, with no more than two decimal places."
  }
  if (!isGSTCalculationMode(input.calculationMode)) errors.calculationMode = "Choose Add GST or Remove GST."
  if (!isGSTSupplyType(input.supplyType)) errors.supplyType = "Choose intra-State or inter-State arithmetic."
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: { ...input } }
}

export function parseAndValidateGSTForm(values: GSTFormValues): GSTValidationResult {
  const amount = parseGSTNumericText(values.amount)
  const gstRate = parseGSTNumericText(values.gstRate)
  const errors: GSTValidationErrors = {}
  if (amount === null) errors.amount = "Enter a valid plain-decimal amount without spaces, commas, symbols, or exponent notation."
  if (gstRate === null) errors.gstRate = "Enter a valid plain-decimal rate without spaces, signs, or exponent notation."
  if (!isGSTCalculationMode(values.calculationMode)) errors.calculationMode = "Choose Add GST or Remove GST."
  if (!isGSTSupplyType(values.supplyType)) errors.supplyType = "Choose intra-State or inter-State arithmetic."
  if (Object.keys(errors).length || amount === null || gstRate === null || !isGSTCalculationMode(values.calculationMode) || !isGSTSupplyType(values.supplyType)) return { success: false, errors }
  return validateGSTInput({ amount, gstRate, calculationMode: values.calculationMode, supplyType: values.supplyType })
}
