import { describe, expect, it } from "vitest"

import { INCOME_TAX_DEFAULT_FORM_VALUES, parseAndValidateIncomeTaxForm } from "../income-tax-schema"
import { applyHraExemptionPassThrough, parseHraExemptionPassThrough, parseIncomeTaxUrlState } from "../income-tax-url-state"

// Sprint 26: the HRA calculator's "Use this in the Income Tax Calculator" link lands here with an
// `hraExemption` query param. This must force the old regime (HRA exemption is old-regime-only)
// and pre-fill only that one field, without ever producing a malformed or mixed-regime
// TaxCalcInput — the same regime-separation invariant Sprint 25's review verified for
// TaxCalcInput's discriminated union must hold for this new entry point too.
describe("HRA exemption pass-through", () => {
  it("parses a valid hraExemption query param", () => {
    const search = new URLSearchParams({ hraExemption: "150000" })
    expect(parseHraExemptionPassThrough(search)).toBe(150_000)
  })

  it("ignores a missing, non-numeric, or negative hraExemption param", () => {
    expect(parseHraExemptionPassThrough(new URLSearchParams())).toBeNull()
    expect(parseHraExemptionPassThrough(new URLSearchParams({ hraExemption: "not-a-number" }))).toBeNull()
    expect(parseHraExemptionPassThrough(new URLSearchParams({ hraExemption: "-1" }))).toBeNull()
  })

  it("forces the old regime and pre-fills only the HRA exemption field, leaving other old-regime deductions at default", () => {
    const search = new URLSearchParams({ hraExemption: "150000" })
    const { values, hraPassThroughAmount } = applyHraExemptionPassThrough(parseIncomeTaxUrlState(search), search)

    expect(hraPassThroughAmount).toBe(150_000)
    expect(values.regime).toBe("old")
    expect(values.oldRegimeDeductions.hraExemption).toBe("150000")
    expect(values.oldRegimeDeductions.section80C).toBe(INCOME_TAX_DEFAULT_FORM_VALUES.oldRegimeDeductions.section80C)
    expect(values.oldRegimeDeductions.section80D).toBe(INCOME_TAX_DEFAULT_FORM_VALUES.oldRegimeDeductions.section80D)
    expect(values.oldRegimeDeductions.homeLoanInterestSection24b).toBe(INCOME_TAX_DEFAULT_FORM_VALUES.oldRegimeDeductions.homeLoanInterestSection24b)
    expect(values.oldRegimeDeductions.otherSection80Deductions).toBe(INCOME_TAX_DEFAULT_FORM_VALUES.oldRegimeDeductions.otherSection80Deductions)
    // The new-regime bucket is untouched by the pass-through.
    expect(values.newRegimeDeductions).toEqual(INCOME_TAX_DEFAULT_FORM_VALUES.newRegimeDeductions)
  })

  it("does not touch form values when no hraExemption param is present", () => {
    const search = new URLSearchParams()
    const { values, hraPassThroughAmount } = applyHraExemptionPassThrough(parseIncomeTaxUrlState(search), search)
    expect(hraPassThroughAmount).toBeNull()
    expect(values).toEqual(INCOME_TAX_DEFAULT_FORM_VALUES)
  })

  it("produces a well-formed, old-regime-only TaxCalcInput on submit, with no new-regime field leakage", () => {
    const search = new URLSearchParams({ hraExemption: "150000" })
    const { values } = applyHraExemptionPassThrough(parseIncomeTaxUrlState(search), search)

    const validation = parseAndValidateIncomeTaxForm(values)
    expect(validation.success).toBe(true)
    if (!validation.success) return

    expect(validation.data.regime).toBe("old")
    if (validation.data.regime !== "old") return // narrows the discriminated union for TypeScript

    expect(validation.data.deductions.hraExemption).toBe(150_000)
    // The discriminated union's old-regime branch has exactly these five fields — proving the
    // pass-through never smuggles a new-regime field (e.g. employerNpsSection80CCD2) into an
    // old-regime submission, and never leaves TaxCalcInput in a shape that isn't one of its two
    // valid branches.
    expect(Object.keys(validation.data.deductions).sort()).toEqual(
      ["section80C", "section80D", "hraExemption", "homeLoanInterestSection24b", "otherSection80Deductions"].sort(),
    )
  })

  it("still resolves a full share-link's own regime when no hraExemption pass-through is present", () => {
    const search = new URLSearchParams({ regime: "new", income: "1500000", age: "below60", nps: "0" })
    const { values, hraPassThroughAmount } = applyHraExemptionPassThrough(parseIncomeTaxUrlState(search), search)
    expect(hraPassThroughAmount).toBeNull()
    expect(values.regime).toBe("new")
  })
})
