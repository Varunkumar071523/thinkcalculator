import { AGE_BANDS, validateTaxCalcInput } from "@/lib/tax/validation"
import type {
  AgeBand,
  NewRegimeDeductionInput,
  OldRegimeDeductionInput,
  TaxCalcInput,
  TaxCalcValidationErrors,
  TaxCalcValidationResult,
  TaxRegime,
} from "@/lib/tax/types"
import { INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"
import type { IncomeTaxFormValues } from "./income-tax-types"

export const INCOME_TAX_LIMITS = {
  grossIncome: { min: 0, max: 1_000_000_000_000 },
} as const

export const INCOME_TAX_DEFAULT_FORM_VALUES: IncomeTaxFormValues = {
  regime: "new",
  grossIncome: "1275000",
  ageBand: "below60",
  oldRegimeDeductions: {
    section80C: "0",
    section80D: "0",
    hraExemption: "0",
    homeLoanInterestSection24b: "0",
    otherSection80Deductions: "0",
  },
  newRegimeDeductions: {
    employerNpsSection80CCD2: "0",
  },
}

export function isTaxRegime(value: string): value is TaxRegime {
  return value === "old" || value === "new"
}

export function isAgeBand(value: string): value is AgeBand {
  return (AGE_BANDS as readonly string[]).includes(value)
}

/** Required field: blank text is invalid, distinct from a deliberate zero. */
function parseRequiredAmount(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Deduction fields are optional — blank means "not claiming this deduction", i.e. zero. */
function parseDeductionAmount(value: string): number | null {
  if (value.trim() === "") return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOldRegimeDeductions(
  values: IncomeTaxFormValues["oldRegimeDeductions"],
): { data: OldRegimeDeductionInput | null; errors: NonNullable<TaxCalcValidationErrors["deductions"]> } {
  const section80C = parseDeductionAmount(values.section80C)
  const section80D = parseDeductionAmount(values.section80D)
  const hraExemption = parseDeductionAmount(values.hraExemption)
  const homeLoanInterestSection24b = parseDeductionAmount(values.homeLoanInterestSection24b)
  const otherSection80Deductions = parseDeductionAmount(values.otherSection80Deductions)

  const errors: NonNullable<TaxCalcValidationErrors["deductions"]> = {}
  if (section80C === null) errors.section80C = "Enter a valid Section 80C amount."
  if (section80D === null) errors.section80D = "Enter a valid Section 80D amount."
  if (hraExemption === null) errors.hraExemption = "Enter a valid HRA exemption amount."
  if (homeLoanInterestSection24b === null) errors.homeLoanInterestSection24b = "Enter a valid Section 24(b) interest amount."
  if (otherSection80Deductions === null) errors.otherSection80Deductions = "Enter a valid amount for other Section 80-series deductions."

  if (section80C === null || section80D === null || hraExemption === null || homeLoanInterestSection24b === null || otherSection80Deductions === null) {
    return { data: null, errors }
  }
  return { data: { section80C, section80D, hraExemption, homeLoanInterestSection24b, otherSection80Deductions }, errors }
}

function parseNewRegimeDeductions(
  values: IncomeTaxFormValues["newRegimeDeductions"],
): { data: NewRegimeDeductionInput | null; errors: NonNullable<TaxCalcValidationErrors["deductions"]> } {
  const employerNpsSection80CCD2 = parseDeductionAmount(values.employerNpsSection80CCD2)
  const errors: NonNullable<TaxCalcValidationErrors["deductions"]> = {}
  if (employerNpsSection80CCD2 === null) errors.employerNpsSection80CCD2 = "Enter a valid employer NPS Section 80CCD(2) amount."
  if (employerNpsSection80CCD2 === null) return { data: null, errors }
  return { data: { employerNpsSection80CCD2 }, errors }
}

/**
 * Parses raw form strings and validates them against the Sprint 24 engine's
 * own `validateTaxCalcInput`, so this UI layer never re-implements or
 * duplicates a statutory rule. Only the deduction bucket matching
 * `values.regime` is read — the other regime's buffered strings are never
 * inspected here, so they cannot end up in the returned `TaxCalcInput`.
 */
export function parseAndValidateIncomeTaxForm(values: IncomeTaxFormValues): TaxCalcValidationResult {
  const grossIncome = parseRequiredAmount(values.grossIncome)
  const errors: TaxCalcValidationErrors = {}
  if (grossIncome === null) errors.grossIncome = "Enter a valid gross income."
  if (!isAgeBand(values.ageBand)) errors.ageBand = "Select a valid age band."

  if (!isTaxRegime(values.regime)) {
    errors.regime = "Select a valid tax regime (old or new)."
    return { success: false, errors }
  }

  if (values.regime === "old") {
    const { data: deductions, errors: deductionErrors } = parseOldRegimeDeductions(values.oldRegimeDeductions)
    if (Object.keys(deductionErrors).length) errors.deductions = deductionErrors
    if (grossIncome === null || !isAgeBand(values.ageBand) || deductions === null) {
      return { success: false, errors }
    }
    const input: TaxCalcInput = { regime: "old", grossIncome, ageBand: values.ageBand, deductions }
    return validateTaxCalcInput(input, INCOME_TAX_RULE_SET)
  }

  const { data: deductions, errors: deductionErrors } = parseNewRegimeDeductions(values.newRegimeDeductions)
  if (Object.keys(deductionErrors).length) errors.deductions = deductionErrors
  if (grossIncome === null || !isAgeBand(values.ageBand) || deductions === null) {
    return { success: false, errors }
  }
  const input: TaxCalcInput = { regime: "new", grossIncome, ageBand: values.ageBand, deductions }
  return validateTaxCalcInput(input, INCOME_TAX_RULE_SET)
}

/**
 * Best-effort input for the live regime-comparison callout: invalid or
 * blank fields fall back to zero rather than blocking the comparison, since
 * this runs on every keystroke, not on submit. Returns `null` only when the
 * shared fields (gross income, age band) are not yet usable at all.
 */
export function buildBestEffortComparisonInput(values: IncomeTaxFormValues): {
  grossIncome: number
  ageBand: AgeBand
  oldRegimeDeductions: OldRegimeDeductionInput
  newRegimeDeductions: NewRegimeDeductionInput
} | null {
  const grossIncome = parseRequiredAmount(values.grossIncome)
  if (grossIncome === null || !isAgeBand(values.ageBand)) return null

  const zeroIfInvalid = (value: string): number => {
    const parsed = parseDeductionAmount(value)
    return parsed ?? 0
  }

  return {
    grossIncome,
    ageBand: values.ageBand,
    oldRegimeDeductions: {
      section80C: zeroIfInvalid(values.oldRegimeDeductions.section80C),
      section80D: zeroIfInvalid(values.oldRegimeDeductions.section80D),
      hraExemption: zeroIfInvalid(values.oldRegimeDeductions.hraExemption),
      homeLoanInterestSection24b: zeroIfInvalid(values.oldRegimeDeductions.homeLoanInterestSection24b),
      otherSection80Deductions: zeroIfInvalid(values.oldRegimeDeductions.otherSection80Deductions),
    },
    newRegimeDeductions: {
      employerNpsSection80CCD2: zeroIfInvalid(values.newRegimeDeductions.employerNpsSection80CCD2),
    },
  }
}
