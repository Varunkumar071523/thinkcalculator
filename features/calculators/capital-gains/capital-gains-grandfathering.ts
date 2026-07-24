import { CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE } from "./capital-gains-regulatory-config"

/** A lot acquired strictly before 31 January 2018 is eligible for the section 112A grandfathering
 * cost-basis rule. Comparing ISO `YYYY-MM-DD` strings lexicographically is equivalent to
 * comparing them chronologically. */
export function isGrandfatheringApplicable(purchaseDate: string): boolean {
  return purchaseDate < CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE
}

/** Section 112A grandfathering: for a pre-31-January-2018 acquisition, the cost of acquisition
 * used for the LTCG computation is the HIGHER of (a) the actual cost of acquisition, and (b) the
 * LOWER of (i) fair market value as on 31 January 2018, and (ii) the actual sale consideration
 * (per unit here, since it is applied per matched lot before totalling). This can only raise the
 * cost basis relative to the actual cost — never lower it — per CBDT Circular No. 4/2018. */
export function computeGrandfatheredCostPerUnit(
  actualCostPerUnit: number,
  fairMarketValuePerUnitOn31Jan2018: number,
  salePricePerUnit: number,
): number {
  const lowerOfFmvOrSaleConsideration = Math.min(fairMarketValuePerUnitOn31Jan2018, salePricePerUnit)
  return Math.max(actualCostPerUnit, lowerOfFmvOrSaleConsideration)
}
