import { describe, expect, it } from "vitest"

import { buildBestEffortComparisonInput, INCOME_TAX_DEFAULT_FORM_VALUES, parseAndValidateIncomeTaxForm } from "../income-tax-schema"
import type { IncomeTaxFormValues } from "../income-tax-types"

const oldValues: IncomeTaxFormValues = {
  regime: "old",
  grossIncome: "1000000",
  ageBand: "below60",
  oldRegimeDeductions: { section80C: "150000", section80D: "25000", hraExemption: "50000", homeLoanInterestSection24b: "200000", otherSection80Deductions: "10000" },
  newRegimeDeductions: { employerNpsSection80CCD2: "0" },
}

const newValues: IncomeTaxFormValues = {
  regime: "new",
  grossIncome: "1500000",
  ageBand: "below60",
  oldRegimeDeductions: { section80C: "0", section80D: "0", hraExemption: "0", homeLoanInterestSection24b: "0", otherSection80Deductions: "0" },
  newRegimeDeductions: { employerNpsSection80CCD2: "50000" },
}

describe("income tax form parsing and validation", () => {
  it("accepts valid old-regime form values and returns a TaxCalcInput with only old-regime deductions", () => {
    const result = parseAndValidateIncomeTaxForm(oldValues)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toEqual({
      regime: "old",
      grossIncome: 1_000_000,
      ageBand: "below60",
      deductions: { section80C: 150_000, section80D: 25_000, hraExemption: 50_000, homeLoanInterestSection24b: 200_000, otherSection80Deductions: 10_000 },
    })
  })

  it("accepts valid new-regime form values and returns a TaxCalcInput with only new-regime deductions", () => {
    const result = parseAndValidateIncomeTaxForm(newValues)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toEqual({ regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: { employerNpsSection80CCD2: 50_000 } })
  })

  it("never leaks the inactive regime's buffered deductions into a submission — old bucket populated, regime is new", () => {
    const values: IncomeTaxFormValues = { ...newValues, oldRegimeDeductions: oldValues.oldRegimeDeductions }
    const result = parseAndValidateIncomeTaxForm(values)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.regime).toBe("new")
    expect(result.data.deductions).toEqual({ employerNpsSection80CCD2: 50_000 })
    expect("section80C" in result.data.deductions).toBe(false)
  })

  it("never leaks the inactive regime's buffered deductions into a submission — new bucket populated, regime is old", () => {
    const values: IncomeTaxFormValues = { ...oldValues, newRegimeDeductions: { employerNpsSection80CCD2: "999999" } }
    const result = parseAndValidateIncomeTaxForm(values)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.regime).toBe("old")
    expect("employerNpsSection80CCD2" in result.data.deductions).toBe(false)
  })

  it("requires gross income — blank is invalid, not zero", () => {
    const result = parseAndValidateIncomeTaxForm({ ...newValues, grossIncome: "" })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.grossIncome).toBeTruthy()
  })

  it("treats blank deduction fields as zero, not invalid", () => {
    const result = parseAndValidateIncomeTaxForm({ ...oldValues, oldRegimeDeductions: { ...oldValues.oldRegimeDeductions, otherSection80Deductions: "" } })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.deductions).toMatchObject({ otherSection80Deductions: 0 })
  })

  it("rejects a non-numeric deduction field with a field-level error", () => {
    const result = parseAndValidateIncomeTaxForm({ ...oldValues, oldRegimeDeductions: { ...oldValues.oldRegimeDeductions, section80C: "abc" } })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.deductions?.section80C).toBeTruthy()
  })

  it("rejects an invalid age band", () => {
    const result = parseAndValidateIncomeTaxForm({ ...newValues, ageBand: "unknown" as never })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.ageBand).toBeTruthy()
  })

  // Adversarial-review fix (should-fix #2): the regime toggle can only ever emit "old" or
  // "new", so this path is unreachable through the built UI today — but it's a silent-failure
  // trap if a future input method (URL state, autofill, a refactor) ever hands the form a
  // regime value outside that pair. This calls the validation logic directly with a malformed
  // regime, bypassing the toggle UI entirely, to prove the error is actually produced (and, per
  // income-tax-calculator.tsx's `{errors.regime ? <p role="alert">...` block, would be rendered
  // rather than silently swallowed) if that ever happens.
  it("rejects a malformed regime value that bypasses the toggle UI, with a non-empty regime error", () => {
    const result = parseAndValidateIncomeTaxForm({ ...newValues, regime: "not-a-regime" as never })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.regime).toBeTruthy()
    expect(result.errors.regime).toMatch(/regime/i)
    // A malformed regime is a hard stop — no deduction bucket can be resolved without knowing
    // which one applies, so no other field should carry a leftover/misleading error.
    expect(result.errors.deductions).toBeUndefined()
  })

  it("surfaces the engine's statutory cap error for an over-limit old-regime deduction", () => {
    const result = parseAndValidateIncomeTaxForm({ ...oldValues, oldRegimeDeductions: { ...oldValues.oldRegimeDeductions, section80C: "200000" } })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.deductions?.section80C).toBeTruthy()
  })

  it("uses default form values as a valid new-regime submission", () => {
    expect(parseAndValidateIncomeTaxForm(INCOME_TAX_DEFAULT_FORM_VALUES).success).toBe(true)
  })
})

describe("live regime-comparison best-effort input", () => {
  it("falls back invalid or blank deduction fields to zero rather than blocking the comparison", () => {
    const input = buildBestEffortComparisonInput({ ...oldValues, oldRegimeDeductions: { ...oldValues.oldRegimeDeductions, section80C: "not-a-number" } })
    expect(input).not.toBeNull()
    expect(input?.oldRegimeDeductions.section80C).toBe(0)
  })

  it("returns null when gross income is not yet usable", () => {
    expect(buildBestEffortComparisonInput({ ...newValues, grossIncome: "" })).toBeNull()
  })

  it("returns both regimes' deduction buckets regardless of which regime is active", () => {
    const input = buildBestEffortComparisonInput(oldValues)
    expect(input?.oldRegimeDeductions.section80C).toBe(150_000)
    expect(input?.newRegimeDeductions.employerNpsSection80CCD2).toBe(0)
  })
})
