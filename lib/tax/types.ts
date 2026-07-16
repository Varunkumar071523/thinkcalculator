import type { AgeBand, TaxRegime } from "./rules/types"

export type { AgeBand, TaxRegime } from "./rules/types"

/**
 * Old-regime deductions. Only these fields are recognised under the old
 * regime; new-regime inputs cannot carry them (see `TaxCalcInput`).
 * `hraExemption` is a pre-computed exemption amount — HRA exemption
 * *calculation* is out of scope for this engine (Sprint 26).
 */
export type OldRegimeDeductionInput = {
  readonly section80C: number
  readonly section80D: number
  readonly hraExemption: number
  readonly homeLoanInterestSection24b: number
  readonly otherSection80Deductions: number
}

/**
 * New-regime deductions. Only employer NPS contributions u/s 80CCD(2) are
 * allowed under the new regime, in addition to the automatic standard
 * deduction. The caller is expected to supply an already-capped amount
 * (the statutory cap depends on basic salary, which this engine does not
 * model — see rules/README.md).
 */
export type NewRegimeDeductionInput = {
  readonly employerNpsSection80CCD2: number
}

export type TaxCalcInput =
  | {
      readonly regime: "old"
      readonly grossIncome: number
      readonly ageBand: AgeBand
      readonly deductions: OldRegimeDeductionInput
    }
  | {
      readonly regime: "new"
      readonly grossIncome: number
      readonly ageBand: AgeBand
      readonly deductions: NewRegimeDeductionInput
    }

export type OldRegimeDeductionField = keyof OldRegimeDeductionInput
export type NewRegimeDeductionField = keyof NewRegimeDeductionInput

export type TaxCalcValidationErrors = {
  regime?: string
  grossIncome?: string
  ageBand?: string
  deductions?: Partial<Record<OldRegimeDeductionField | NewRegimeDeductionField, string>>
}

export type TaxCalcValidationResult =
  | { readonly success: true; readonly data: TaxCalcInput }
  | { readonly success: false; readonly errors: TaxCalcValidationErrors }

export type SlabBreakdownRow = {
  readonly from: number
  readonly to: number | null
  readonly rate: number
  readonly taxableAmountInSlab: number
  readonly taxAtThisSlab: number
}

export type Rebate87AResult = {
  readonly rebateAmount: number
  readonly marginalReliefApplied: boolean
  readonly taxAfterRebate: number
}

export type SurchargeResult = {
  readonly rate: number
  readonly surchargeBeforeRelief: number
  readonly marginalReliefApplied: boolean
  readonly marginalReliefAmount: number
  readonly surcharge: number
}

/**
 * Full, structured breakdown of a single-regime tax calculation, intended
 * for the Sprint 25 calculator UI to render line by line.
 */
export type TaxCalculationResult = {
  readonly financialYear: string
  readonly assessmentYear: string
  readonly regime: TaxRegime
  readonly ageBand: AgeBand
  readonly grossIncome: number
  readonly standardDeduction: number
  readonly totalOtherDeductions: number
  readonly totalDeductions: number
  readonly taxableIncome: number
  readonly slabBreakdown: readonly SlabBreakdownRow[]
  readonly taxBeforeRebate: number
  readonly rebate87A: Rebate87AResult
  readonly taxAfterRebate: number
  readonly surcharge: SurchargeResult
  readonly taxPlusSurcharge: number
  readonly cess: number
  readonly totalTaxLiability: number
}

export type CompareRegimesInput = {
  readonly grossIncome: number
  readonly ageBand: AgeBand
  readonly oldRegimeDeductions: OldRegimeDeductionInput
  readonly newRegimeDeductions: NewRegimeDeductionInput
}

export type CompareRegimesResult = {
  readonly oldRegime: TaxCalculationResult
  readonly newRegime: TaxCalculationResult
  readonly beneficialRegime: TaxRegime
  /** Positive rupee amount saved by choosing `beneficialRegime` over the other. */
  readonly savings: number
}
