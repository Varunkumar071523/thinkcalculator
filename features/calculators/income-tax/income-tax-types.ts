import type {
  AgeBand,
  NewRegimeDeductionField,
  OldRegimeDeductionField,
  TaxCalcValidationErrors,
  TaxRegime,
} from "@/lib/tax/types"

export type { AgeBand, TaxRegime } from "@/lib/tax/types"

/**
 * String-valued form buffers, one per regime, kept independently so
 * switching the regime toggle back and forth does not discard what the user
 * typed into the other regime's fields. Only the bucket matching the active
 * `regime` is ever read when building a `TaxCalcInput` for validation or
 * calculation (see `buildTaxCalcInput` in income-tax-schema.ts) — the other
 * bucket's values can never leak into a submission for the active regime,
 * because `TaxCalcInput` itself has no field that could hold them.
 */
export type IncomeTaxFormValues = {
  readonly regime: TaxRegime
  readonly grossIncome: string
  readonly ageBand: AgeBand
  readonly oldRegimeDeductions: Record<OldRegimeDeductionField, string>
  readonly newRegimeDeductions: Record<NewRegimeDeductionField, string>
}

export type IncomeTaxFormErrors = TaxCalcValidationErrors
