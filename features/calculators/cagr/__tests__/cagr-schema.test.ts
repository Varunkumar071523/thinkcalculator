import { describe, expect, it } from "vitest"

import { parseAndValidateCAGRForm, validateCAGRInput } from "@/features/calculators/cagr/cagr-schema"

describe("CAGR validation", () => {
  it("parses valid decimal form values", () => {
    expect(parseAndValidateCAGRForm({ beginningValue: "100000", endingValue: "161051", investmentPeriodYears: "5.25" })).toEqual({
      success: true,
      data: { beginningValue: 100_000, endingValue: 161_051, investmentPeriodYears: 5.25 },
    })
  })

  it("returns field errors for blank and non-numeric values", () => {
    const result = parseAndValidateCAGRForm({ beginningValue: "", endingValue: "not-a-number", investmentPeriodYears: "Infinity" })
    expect(result.success).toBe(false)
    if (!result.success) expect(Object.keys(result.errors).toSorted()).toEqual(["beginningValue", "endingValue", "investmentPeriodYears"])
  })

  it("rejects a valid-domain combination whose annualised result cannot be represented", () => {
    const result = validateCAGRInput({ beginningValue: 0.01, endingValue: 1_000_000_000_000_000, investmentPeriodYears: 0.01 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.endingValue).toMatch(/too large/)
  })

  it("rejects an extreme combination whose percentage multiplication would overflow", () => {
    const result = validateCAGRInput({ beginningValue: 1, endingValue: 1_180, investmentPeriodYears: 0.01 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.endingValue).toMatch(/too large/)
  })

  it.each([
    ["surrounding whitespace", { beginningValue: " 100000 ", endingValue: "161051", investmentPeriodYears: "5" }],
    ["exponent notation", { beginningValue: "1e5", endingValue: "161051", investmentPeriodYears: "5" }],
    ["currency formatting", { beginningValue: "₹100000", endingValue: "161051", investmentPeriodYears: "5" }],
    ["group separators", { beginningValue: "100,000", endingValue: "161051", investmentPeriodYears: "5" }],
    ["excess period precision", { beginningValue: "100000", endingValue: "161051", investmentPeriodYears: "1.005" }],
  ])("rejects %s without coercion", (_label, values) => {
    expect(parseAndValidateCAGRForm(values).success).toBe(false)
  })

  it("enforces values immediately inside and outside every boundary", () => {
    expect(validateCAGRInput({ beginningValue: 0.01, endingValue: 0, investmentPeriodYears: 0.01 }).success).toBe(true)
    expect(validateCAGRInput({ beginningValue: 0.009, endingValue: 0, investmentPeriodYears: 0.01 }).success).toBe(false)
    expect(validateCAGRInput({ beginningValue: 0.01, endingValue: -0.01, investmentPeriodYears: 0.01 }).success).toBe(false)
    expect(validateCAGRInput({ beginningValue: 1, endingValue: 1, investmentPeriodYears: 100 }).success).toBe(true)
    expect(validateCAGRInput({ beginningValue: 1, endingValue: 1, investmentPeriodYears: 100.01 }).success).toBe(false)
  })

  it("normalises a negative-zero ending value to zero", () => {
    const result = validateCAGRInput({ beginningValue: 100, endingValue: -0, investmentPeriodYears: 5 })
    expect(result.success).toBe(true)
    if (result.success) expect(Object.is(result.data.endingValue, -0)).toBe(false)
  })
})
