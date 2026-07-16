import type { TaxRuleSet } from "./rules/types"
import type { AgeBand, TaxCalcInput, TaxCalcValidationErrors, TaxCalcValidationResult } from "./types"

export const AGE_BANDS: readonly AgeBand[] = ["below60", "60to80", "80plus"] as const

const GROSS_INCOME_MAX = 1_000_000_000_000 // ₹1 lakh crore — same ceiling used elsewhere in the app

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

export function validateTaxCalcInput(input: TaxCalcInput, ruleSet: TaxRuleSet): TaxCalcValidationResult {
  const errors: TaxCalcValidationErrors = {}

  if (!Number.isFinite(input.grossIncome) || input.grossIncome < 0 || input.grossIncome > GROSS_INCOME_MAX) {
    errors.grossIncome = "Enter gross income that is zero or greater, up to ₹1 lakh crore."
  }
  if (!AGE_BANDS.includes(input.ageBand)) {
    errors.ageBand = "Select a valid age band."
  }

  // `TaxCalcInput.regime` is only "old" | "new" at compile time. A caller
  // that deserialises external data (URL/form/JSON) and casts it to
  // TaxCalcInput can still hand this function a different runtime value, so
  // regime must be checked explicitly before any code branches on it —
  // otherwise a bad value silently reaches calculateIncomeTax's own
  // regime branching with no shared source of truth for what "unrecognised"
  // means, which previously produced NaN instead of a validation error.
  if (input.regime !== "old" && input.regime !== "new") {
    errors.regime = "Select a valid tax regime (old or new)."
    return { success: false, errors }
  }

  const deductionErrors: NonNullable<TaxCalcValidationErrors["deductions"]> = {}

  if (input.regime === "old") {
    const { section80C, section80D, hraExemption, homeLoanInterestSection24b, otherSection80Deductions } = input.deductions
    const caps = ruleSet.oldRegime.deductionCaps
    const section80DCap = input.ageBand === "below60" ? caps.section80D.below60 : caps.section80D.age60OrAbove

    if (!isNonNegativeFinite(section80C) || section80C > caps.section80C) {
      deductionErrors.section80C = `Enter Section 80C deductions between ₹0 and ₹${caps.section80C.toLocaleString("en-IN")}.`
    }
    if (!isNonNegativeFinite(section80D) || section80D > section80DCap) {
      deductionErrors.section80D = `Enter Section 80D deductions between ₹0 and ₹${section80DCap.toLocaleString("en-IN")} for the selected age band.`
    }
    // HRA exemption and the generic "other 80-series" bucket have no single
    // statutory ceiling this engine can apply (HRA is a least-of-three-rules
    // computation out of scope until Sprint 26; "other" spans many
    // provisions with different limits). Gross income is the only bound
    // that is always true regardless of which provisions are behind these
    // numbers — a deduction cannot legitimately exceed the income it is
    // deducted from — so it is used as a sanity ceiling, not a statutory one.
    if (!isNonNegativeFinite(hraExemption) || hraExemption > input.grossIncome) {
      deductionErrors.hraExemption = "Enter an HRA exemption amount that is zero or greater and does not exceed gross income."
    }
    if (!isNonNegativeFinite(homeLoanInterestSection24b) || homeLoanInterestSection24b > caps.homeLoanInterestSection24b) {
      deductionErrors.homeLoanInterestSection24b = `Enter Section 24(b) home loan interest between ₹0 and ₹${caps.homeLoanInterestSection24b.toLocaleString("en-IN")}.`
    }
    if (!isNonNegativeFinite(otherSection80Deductions) || otherSection80Deductions > input.grossIncome) {
      deductionErrors.otherSection80Deductions = "Enter other Section 80-series deductions that are zero or greater and do not exceed gross income."
    }
  } else {
    const { employerNpsSection80CCD2 } = input.deductions
    // Same sanity-ceiling rationale as above: the real Sec 80CCD(2) cap is
    // 14% of basic salary + DA, which this engine does not collect, so
    // gross income is the best available bound short of that breakdown.
    if (!isNonNegativeFinite(employerNpsSection80CCD2) || employerNpsSection80CCD2 > input.grossIncome) {
      deductionErrors.employerNpsSection80CCD2 =
        "Enter an employer NPS Section 80CCD(2) contribution that is zero or greater and does not exceed gross income."
    }
  }

  if (Object.keys(deductionErrors).length) errors.deductions = deductionErrors

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: input }
}
