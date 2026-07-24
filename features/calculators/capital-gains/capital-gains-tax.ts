import {
  CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION,
  CAPITAL_GAINS_LTCG_TAX_RATE,
  CAPITAL_GAINS_STCG_TAX_RATE,
} from "./capital-gains-regulatory-config"

export type CapitalGainsTaxSummary = {
  readonly ltcgExemptionUsed: number
  readonly ltcgTaxableAfterExemption: number
  readonly stcgTax: number
  readonly ltcgTax: number
  readonly totalTax: number
}

/** Pools all LTCG-classified lot gains into one figure and all STCG-classified lot gains into
 * another, then applies the section 112A/111A tax rules: the single ₹1,25,000 annual exemption
 * applies once against the pooled LTCG total (never per lot), with the remainder taxed at the
 * LTCG rate; the pooled STCG total is taxed in full at the STCG rate with no exemption. A net
 * loss in either pool (totalLTCG or totalSTCG below zero — a lot-level loss can bring the pool
 * negative) produces zero tax for that pool rather than a negative figure, since capital losses
 * reduce a different computation (loss carry-forward/set-off) that this calculator does not
 * model. */
export function computeCapitalGainsTax(totalSTCG: number, totalLTCG: number): CapitalGainsTaxSummary {
  const ltcgTaxableBase = Math.max(0, totalLTCG)
  const ltcgExemptionUsed = Math.min(CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION, ltcgTaxableBase)
  const ltcgTaxableAfterExemption = Math.max(0, ltcgTaxableBase - CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION)
  const ltcgTax = ltcgTaxableAfterExemption * CAPITAL_GAINS_LTCG_TAX_RATE

  const stcgTaxableBase = Math.max(0, totalSTCG)
  const stcgTax = stcgTaxableBase * CAPITAL_GAINS_STCG_TAX_RATE

  return {
    ltcgExemptionUsed,
    ltcgTaxableAfterExemption,
    stcgTax,
    ltcgTax,
    totalTax: stcgTax + ltcgTax,
  }
}
