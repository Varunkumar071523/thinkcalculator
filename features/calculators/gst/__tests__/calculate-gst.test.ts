import { describe, expect, it } from "vitest"
import { calculateGST } from "../calculate-gst"
import type { GSTInput } from "../gst-types"

const addIntra: GSTInput = { amount: 1_000, gstRate: 18, calculationMode: "add", supplyType: "intra-state" }
const close = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 10)

describe("calculateGST", () => {
  it("adds 18% GST and splits intra-State tax heads", () => { const result = calculateGST(addIntra); close(result.taxableValue, 1_000); close(result.totalGSTAmount, 180); close(result.invoiceValue, 1_180); close(result.cgstAmount, 90); close(result.sgstUtgstAmount, 90); expect(result.igstAmount).toBe(0) })
  it("removes 18% GST and shows inter-State IGST", () => { const result = calculateGST({ amount: 1_180, gstRate: 18, calculationMode: "remove", supplyType: "inter-state" }); close(result.taxableValue, 1_000); close(result.totalGSTAmount, 180); close(result.invoiceValue, 1_180); close(result.igstAmount, 180); expect(result.cgstAmount).toBe(0); expect(result.sgstUtgstAmount).toBe(0) })
  it("reverses add and remove operations", () => { const added = calculateGST({ ...addIntra, amount: 1_000, gstRate: 7.5 }); const removed = calculateGST({ ...addIntra, amount: added.invoiceValue, gstRate: 7.5, calculationMode: "remove" }); close(removed.taxableValue, 1_000); close(removed.totalGSTAmount, added.totalGSTAmount) })
  it("handles the zero-rate calculation option", () => { for (const calculationMode of ["add", "remove"] as const) { const result = calculateGST({ ...addIntra, calculationMode, gstRate: 0 }); expect(result.totalGSTAmount).toBe(0); expect(result.taxableValue).toBe(1_000); expect(result.invoiceValue).toBe(1_000); expect(result.cgstAmount + result.sgstUtgstAmount + result.igstAmount).toBe(0) } })
  it("supports a custom fractional rate", () => { const result = calculateGST({ ...addIntra, gstRate: 7.5 }); close(result.totalGSTAmount, 75); close(result.invoiceValue, 1_075) })
  it("multiplies directly in add mode without cancellation at large valid values", () => { const result = calculateGST({ ...addIntra, amount: 1_000_000_000_000_000, gstRate: 0.01 }); expect(result.totalGSTAmount).toBe(100_000_000_000); expect(result.invoiceValue).toBe(1_000_100_000_000_000) })
  it("retains paise inputs and reconciles totals", () => { const result = calculateGST({ ...addIntra, amount: 999.99 }); close(result.taxableValue + result.totalGSTAmount, result.invoiceValue); expect(result.taxableValue).toBe(999.99) })
  it("reconciles tax heads for both supply types", () => { for (const supplyType of ["intra-state", "inter-state"] as const) { const result = calculateGST({ ...addIntra, supplyType }); close(result.cgstAmount + result.sgstUtgstAmount + result.igstAmount, result.totalGSTAmount) } })
  it("changes only tax-head allocation when supply type changes", () => { const intra = calculateGST(addIntra); const inter = calculateGST({ ...addIntra, supplyType: "inter-state" }); expect(inter.taxableValue).toBe(intra.taxableValue); expect(inter.totalGSTAmount).toBe(intra.totalGSTAmount); expect(inter.invoiceValue).toBe(intra.invoiceValue); expect(inter.igstAmount).toBe(intra.totalGSTAmount); expect(inter.cgstAmount).toBe(0); expect(inter.sgstUtgstAmount).toBe(0) })
  it("does not round intermediate values", () => { const result = calculateGST({ ...addIntra, amount: 999.99, gstRate: 7.5 }); expect(result.totalGSTAmount).toBeCloseTo(74.99925, 10); expect(result.totalGSTAmount).not.toBe(75) })
  it("does not mutate its input", () => { const input = { ...addIntra }; const before = { ...input }; calculateGST(input); expect(input).toEqual(before) })
  it("keeps the accepted maximum combination finite", () => { const result = calculateGST({ ...addIntra, amount: 1_000_000_000_000_000, gstRate: 100 }); expect(Object.values(result).filter((value): value is number => typeof value === "number").every(Number.isFinite)).toBe(true); expect(result.invoiceValue).toBe(2_000_000_000_000_000) })
  it("rejects invalid input before calculating", () => { expect(() => calculateGST({ ...addIntra, amount: Number.NaN })).toThrow(RangeError) })
})
