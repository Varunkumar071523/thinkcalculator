import { getTaxRuleSet } from "./rules"
import type { Rebate87ARule, SlabRate, SurchargeTier, TaxRuleSet } from "./rules/types"
import type {
  CompareRegimesInput,
  CompareRegimesResult,
  Rebate87AResult,
  SlabBreakdownRow,
  SurchargeResult,
  TaxCalcInput,
  TaxCalculationResult,
  TaxRegime,
} from "./types"
import { validateTaxCalcInput } from "./validation"

/**
 * Progressive slab-by-slab breakdown of tax on `taxableIncome`, in slab
 * order. Each row's `taxableAmountInSlab` is the portion of income taxed
 * at that row's `rate`.
 */
export function computeSlabBreakdown(taxableIncome: number, slabs: readonly SlabRate[]): SlabBreakdownRow[] {
  const rows: SlabBreakdownRow[] = []
  if (taxableIncome <= 0) return rows

  let lowerBound = 0
  for (const slab of slabs) {
    if (taxableIncome <= lowerBound) break
    const upperBound = slab.upTo ?? Infinity
    const taxableAmountInSlab = Math.min(taxableIncome, upperBound) - lowerBound
    rows.push({
      from: lowerBound,
      to: slab.upTo,
      rate: slab.rate,
      taxableAmountInSlab,
      taxAtThisSlab: taxableAmountInSlab * slab.rate,
    })
    lowerBound = upperBound
  }
  return rows
}

/** Applies progressive slab rates to `taxableIncome`. No rebate or surcharge. */
export function computeSlabTax(taxableIncome: number, slabs: readonly SlabRate[]): number {
  return computeSlabBreakdown(taxableIncome, slabs).reduce((sum, row) => sum + row.taxAtThisSlab, 0)
}

/**
 * Section 87A rebate with marginal relief. Below the threshold, tax is
 * rebated in full (capped at `rule.maxRebateAmount`, which by construction
 * equals the slab tax at the threshold). Above the threshold, tax is capped
 * at the amount by which taxable income exceeds the threshold — so there is
 * no cliff at the boundary — until slab tax alone drops back below that cap,
 * at which point the rebate stops applying.
 */
export function computeRebate87A(taxableIncome: number, taxBeforeRebate: number, rule: Rebate87ARule): Rebate87AResult {
  if (taxableIncome <= rule.thresholdTaxableIncome) {
    const rebateAmount = Math.min(taxBeforeRebate, rule.maxRebateAmount)
    return { rebateAmount, marginalReliefApplied: false, taxAfterRebate: taxBeforeRebate - rebateAmount }
  }

  const excessOverThreshold = taxableIncome - rule.thresholdTaxableIncome
  if (taxBeforeRebate > excessOverThreshold) {
    const rebateAmount = taxBeforeRebate - excessOverThreshold
    return { rebateAmount, marginalReliefApplied: true, taxAfterRebate: excessOverThreshold }
  }

  return { rebateAmount: 0, marginalReliefApplied: false, taxAfterRebate: taxBeforeRebate }
}

/**
 * Tiered surcharge with marginal relief at every threshold: total tax +
 * surcharge on income just above a threshold cannot exceed [tax + surcharge
 * payable at the threshold itself] + [income in excess of the threshold].
 * `taxPreSurchargeAtIncome` recomputes tax (post-rebate) at a hypothetical
 * income equal to the threshold, so relief is derived from an actual
 * recalculation rather than an approximation.
 */
export function computeSurcharge(
  taxPreSurcharge: number,
  taxableIncome: number,
  tiers: readonly SurchargeTier[],
  taxPreSurchargeAtIncome: (income: number) => number,
): SurchargeResult {
  let tierIndex = -1
  for (let i = 0; i < tiers.length; i++) {
    if (taxableIncome > tiers[i].thresholdTaxableIncome) tierIndex = i
  }
  if (tierIndex === -1) {
    return { rate: 0, surchargeBeforeRelief: 0, marginalReliefApplied: false, marginalReliefAmount: 0, surcharge: 0 }
  }

  const tier = tiers[tierIndex]
  const surchargeBeforeRelief = taxPreSurcharge * tier.rate
  const priorRate = tierIndex > 0 ? tiers[tierIndex - 1].rate : 0
  const taxAtThreshold = taxPreSurchargeAtIncome(tier.thresholdTaxableIncome)
  const capAtThreshold = taxAtThreshold + taxAtThreshold * priorRate + (taxableIncome - tier.thresholdTaxableIncome)
  const totalBeforeRelief = taxPreSurcharge + surchargeBeforeRelief

  if (totalBeforeRelief > capAtThreshold) {
    const surcharge = capAtThreshold - taxPreSurcharge
    return {
      rate: tier.rate,
      surchargeBeforeRelief,
      marginalReliefApplied: true,
      marginalReliefAmount: surchargeBeforeRelief - surcharge,
      surcharge,
    }
  }

  return { rate: tier.rate, surchargeBeforeRelief, marginalReliefApplied: false, marginalReliefAmount: 0, surcharge: surchargeBeforeRelief }
}

/** Health and Education Cess on tax plus surcharge. */
export function computeCess(taxPlusSurcharge: number, ruleSet: TaxRuleSet): number {
  return taxPlusSurcharge * ruleSet.cessRate
}

function sumOldRegimeDeductions(deductions: Extract<TaxCalcInput, { regime: "old" }>["deductions"]): number {
  return (
    deductions.section80C +
    deductions.section80D +
    deductions.hraExemption +
    deductions.homeLoanInterestSection24b +
    deductions.otherSection80Deductions
  )
}

/**
 * Resolves the slabs, regime-level rules, and non-standard deductions for
 * one regime. Written as an explicit if/if/throw rather than a ternary so
 * neither branch is an implicit "else" default — validateTaxCalcInput
 * already rejects any `regime` that isn't exactly "old" or "new" before
 * calculateIncomeTax runs, but this stays exhaustive on its own so the two
 * functions can never disagree about what an unrecognised regime means.
 */
function resolveRegimeConfig(
  data: TaxCalcInput,
  ruleSet: TaxRuleSet,
): { regimeRules: TaxRuleSet["oldRegime"] | TaxRuleSet["newRegime"]; slabs: readonly SlabRate[]; totalOtherDeductions: number } {
  if (data.regime === "old") {
    return {
      regimeRules: ruleSet.oldRegime,
      slabs: ruleSet.oldRegime.slabsByAgeBand[data.ageBand],
      totalOtherDeductions: sumOldRegimeDeductions(data.deductions),
    }
  }
  if (data.regime === "new") {
    return {
      regimeRules: ruleSet.newRegime,
      slabs: ruleSet.newRegime.slabs,
      totalOtherDeductions: data.deductions.employerNpsSection80CCD2,
    }
  }
  const unreachable: never = data
  throw new RangeError(`Unknown tax regime: ${JSON.stringify(unreachable)}`)
}

/**
 * Full calculation pipeline for one regime: validates input, applies
 * deductions, slab tax, Section 87A rebate (with marginal relief),
 * surcharge (with marginal relief), and cess. Returns a structured
 * breakdown rather than a single number so the calculator UI can show
 * every step.
 */
export function calculateIncomeTax(input: TaxCalcInput, financialYear: string): TaxCalculationResult {
  const ruleSet = getTaxRuleSet(financialYear)
  const validation = validateTaxCalcInput(input, ruleSet)
  if (!validation.success) throw new RangeError("Invalid tax calculation input")
  const data = validation.data

  const { regimeRules, slabs, totalOtherDeductions } = resolveRegimeConfig(data, ruleSet)
  const rebateRule = regimeRules.rebate87A
  const surchargeTiers = regimeRules.surchargeTiers
  const standardDeduction = regimeRules.standardDeduction

  const totalDeductions = standardDeduction + totalOtherDeductions
  const taxableIncome = Math.max(0, data.grossIncome - totalDeductions)

  const slabBreakdown = computeSlabBreakdown(taxableIncome, slabs)
  const taxBeforeRebate = slabBreakdown.reduce((sum, row) => sum + row.taxAtThisSlab, 0)

  const rebate87A = computeRebate87A(taxableIncome, taxBeforeRebate, rebateRule)
  const taxAfterRebate = rebate87A.taxAfterRebate

  const surcharge = computeSurcharge(taxAfterRebate, taxableIncome, surchargeTiers, (income) => {
    const tax = computeSlabTax(income, slabs)
    return computeRebate87A(income, tax, rebateRule).taxAfterRebate
  })

  const taxPlusSurcharge = taxAfterRebate + surcharge.surcharge
  const cess = computeCess(taxPlusSurcharge, ruleSet)
  const totalTaxLiability = taxPlusSurcharge + cess

  return {
    financialYear: ruleSet.financialYear,
    assessmentYear: ruleSet.assessmentYear,
    regime: data.regime,
    ageBand: data.ageBand,
    grossIncome: data.grossIncome,
    standardDeduction,
    totalOtherDeductions,
    totalDeductions,
    taxableIncome,
    slabBreakdown,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    surcharge,
    taxPlusSurcharge,
    cess,
    totalTaxLiability,
  }
}

/** Runs both regimes for the same person and reports which is cheaper. */
export function compareRegimes(input: CompareRegimesInput, financialYear: string): CompareRegimesResult {
  const oldRegime = calculateIncomeTax(
    { regime: "old", grossIncome: input.grossIncome, ageBand: input.ageBand, deductions: input.oldRegimeDeductions },
    financialYear,
  )
  const newRegime = calculateIncomeTax(
    { regime: "new", grossIncome: input.grossIncome, ageBand: input.ageBand, deductions: input.newRegimeDeductions },
    financialYear,
  )

  const beneficialRegime: TaxRegime = newRegime.totalTaxLiability <= oldRegime.totalTaxLiability ? "new" : "old"
  const savings = Math.abs(oldRegime.totalTaxLiability - newRegime.totalTaxLiability)

  return { oldRegime, newRegime, beneficialRegime, savings }
}
