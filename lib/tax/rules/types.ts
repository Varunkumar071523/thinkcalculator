export type TaxRegime = "old" | "new"
export type AgeBand = "below60" | "60to80" | "80plus"

/**
 * One progressive slab. `upTo` is the absolute upper bound of taxable income
 * (in rupees) for this slab; `null` means "and above" (no upper bound).
 * The lower bound is implied by the previous slab's `upTo` (0 for the first).
 */
export type SlabRate = {
  readonly upTo: number | null
  readonly rate: number
}

export type OldRegimeSlabsByAgeBand = {
  readonly below60: readonly SlabRate[]
  readonly "60to80": readonly SlabRate[]
  readonly "80plus": readonly SlabRate[]
}

/**
 * Section 87A rebate rule. `thresholdTaxableIncome` is the income up to which
 * tax is fully rebated; `maxRebateAmount` is the rebate cap, which by design
 * equals the slab tax at exactly the threshold. Marginal relief above the
 * threshold is derived at calculation time, not stored here.
 */
export type Rebate87ARule = {
  readonly thresholdTaxableIncome: number
  readonly maxRebateAmount: number
}

/**
 * One surcharge tier: the rate applies to total tax when taxable income
 * strictly exceeds `thresholdTaxableIncome`. Tiers must be sorted ascending
 * by threshold.
 */
export type SurchargeTier = {
  readonly thresholdTaxableIncome: number
  readonly rate: number
}

export type OldRegimeDeductionCaps = {
  readonly section80C: number
  readonly section80D: { readonly below60: number; readonly age60OrAbove: number }
  readonly homeLoanInterestSection24b: number
}

export type NewRegimeRules = {
  readonly slabs: readonly SlabRate[]
  readonly standardDeduction: number
  readonly rebate87A: Rebate87ARule
  readonly surchargeTiers: readonly SurchargeTier[]
}

export type OldRegimeRules = {
  readonly slabsByAgeBand: OldRegimeSlabsByAgeBand
  readonly standardDeduction: number
  readonly rebate87A: Rebate87ARule
  readonly surchargeTiers: readonly SurchargeTier[]
  readonly deductionCaps: OldRegimeDeductionCaps
}

export type TaxRuleSet = {
  readonly financialYear: string
  readonly assessmentYear: string
  readonly newRegime: NewRegimeRules
  readonly oldRegime: OldRegimeRules
  readonly cessRate: number
}
