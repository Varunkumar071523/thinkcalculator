import { describe, expect, it } from "vitest"
import { parseAndValidateGSTForm, parseGSTNumericText, validateGSTInput } from "../gst-schema"
import type { GSTInput } from "../gst-types"

const valid: GSTInput = { amount: 1_000, gstRate: 18, calculationMode: "add", supplyType: "intra-state" }
describe("GST validation", () => {
  it("accepts amount boundaries and two-decimal paise", () => { for (const amount of [0.01, 999.99, 1_000_000_000_000_000]) expect(validateGSTInput({ ...valid, amount }).success).toBe(true) })
  it("rejects invalid amount boundaries and precision", () => { for (const amount of [0, -1, 0.001, 1_000_000_000_000_001, Number.NaN, Number.POSITIVE_INFINITY]) expect(validateGSTInput({ ...valid, amount }).success).toBe(false) })
  it("accepts rate boundaries and fractional rates", () => { for (const gstRate of [0, 7.5, 18, 100]) expect(validateGSTInput({ ...valid, gstRate }).success).toBe(true) })
  it("rejects invalid rate boundaries and precision", () => { for (const gstRate of [-0.01, 7.555, 100.01, Number.NaN, Number.NEGATIVE_INFINITY]) expect(validateGSTInput({ ...valid, gstRate }).success).toBe(false) })
  it("accepts only supported modes", () => { expect(validateGSTInput({ ...valid, calculationMode: "remove" }).success).toBe(true); expect(validateGSTInput({ ...valid, calculationMode: "other" as GSTInput["calculationMode"] }).success).toBe(false) })
  it("accepts only supported supply types", () => { expect(validateGSTInput({ ...valid, supplyType: "inter-state" }).success).toBe(true); expect(validateGSTInput({ ...valid, supplyType: "local" as GSTInput["supplyType"] }).success).toBe(false) })
  it("strictly parses plain decimals", () => { for (const value of ["0", "0.01", ".5", "100", "7.50"]) expect(parseGSTNumericText(value)).toBe(Number(value)); for (const value of ["", " ", " 18", "18 ", "1,000", "₹1000", "+18", "-18", "+", "-", "1e3", "1.", ".", "NaN", "Infinity", "1..2"]) expect(parseGSTNumericText(value)).toBeNull() })
  it("applies strict parsing in form validation", () => { expect(parseAndValidateGSTForm({ amount: "1000.50", gstRate: "7.5", calculationMode: "remove", supplyType: "inter-state" }).success).toBe(true); expect(parseAndValidateGSTForm({ amount: "1,000", gstRate: "18", calculationMode: "add", supplyType: "intra-state" }).success).toBe(false) })
})
