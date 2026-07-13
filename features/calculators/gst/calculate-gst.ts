import { validateGSTInput } from "./gst-schema"
import type { GSTInput, GSTResult } from "./gst-types"

export function calculateGST(input: GSTInput): GSTResult {
  const validation = validateGSTInput(input)
  if (!validation.success) throw new RangeError("Invalid GST input")
  const { amount, gstRate, calculationMode, supplyType } = validation.data
  const rate = gstRate / 100
  const taxableValue = calculationMode === "add" ? amount : amount / (1 + rate)
  const totalGSTAmount = calculationMode === "add" ? taxableValue * rate : amount - taxableValue
  const invoiceValue = calculationMode === "add" ? taxableValue + totalGSTAmount : amount
  const cgstAmount = supplyType === "intra-state" ? totalGSTAmount / 2 : 0
  const sgstUtgstAmount = supplyType === "intra-state" ? totalGSTAmount / 2 : 0
  const igstAmount = supplyType === "inter-state" ? totalGSTAmount : 0
  const values = [taxableValue, invoiceValue, totalGSTAmount, cgstAmount, sgstUtgstAmount, igstAmount]
  if (!values.every(Number.isFinite)) throw new RangeError("GST calculation produced a non-finite result")
  return { ...validation.data, taxableValue, totalGSTAmount, invoiceValue, cgstAmount, sgstUtgstAmount, igstAmount }
}
