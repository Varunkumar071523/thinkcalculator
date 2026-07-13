import { describe, expect, it } from "vitest"
import { parseAndValidatePPFForm, parsePPFNumericText, validatePPFInput } from "../ppf-schema"
import { PPF_RATE_CONFIG } from "../ppf-rate-config"

const referenceRate = PPF_RATE_CONFIG.defaultRate

describe("PPF validation", () => {
  it.each([500, 150_000])("accepts contribution %s", (annualContribution) => expect(validatePPFInput({ annualContribution, assumedAnnualInterestRate: referenceRate, durationYears: 15 }).success).toBe(true))
  it.each([0, -0, 499, 150_001, 525, 500.5, NaN, Infinity, -Infinity])("rejects contribution %s", (annualContribution) => expect(validatePPFInput({ annualContribution, assumedAnnualInterestRate: referenceRate, durationYears: 15 }).success).toBe(false))
  it.each([0.1, referenceRate, 15])("accepts rate %s", (assumedAnnualInterestRate) => expect(validatePPFInput({ annualContribution: 500, assumedAnnualInterestRate, durationYears: 15 }).success).toBe(true))
  it.each([0, -0, 0.001, 7.123, 15.01, NaN, Infinity])("rejects rate %s", (assumedAnnualInterestRate) => expect(validatePPFInput({ annualContribution: 500, assumedAnnualInterestRate, durationYears: 15 }).success).toBe(false))
  it.each([15, 20, 25, 30, 35, 40] as const)("accepts duration %s", (durationYears) => expect(validatePPFInput({ annualContribution: 500, assumedAnnualInterestRate: referenceRate, durationYears }).success).toBe(true))
  it.each([10, 16, 45, 20.5])("rejects duration %s", (durationYears) => expect(validatePPFInput({ annualContribution: 500, assumedAnnualInterestRate: referenceRate, durationYears: durationYears as 15 }).success).toBe(false))
  it.each(["", " ", " 500", "500 ", "+500", "-0", "-500", "5e2", "1,000", "₹500", ".", "NaN", "Infinity"])("rejects numeric text %j", (value) => expect(parsePPFNumericText(value)).toBeNull())
  it("keeps form parsing aligned with numeric and domain validation", () => { const rate = String(referenceRate); expect(parseAndValidatePPFForm({ annualContribution: "100000", assumedAnnualInterestRate: rate, durationYears: "20" })).toEqual({ success: true, data: { annualContribution: 100_000, assumedAnnualInterestRate: referenceRate, durationYears: 20 } }); const invalid = parseAndValidatePPFForm({ annualContribution: "525", assumedAnnualInterestRate: rate, durationYears: "20" }); expect(invalid.success).toBe(false); if (!invalid.success) expect(invalid.errors.annualContribution).toContain("multiples") })
})
