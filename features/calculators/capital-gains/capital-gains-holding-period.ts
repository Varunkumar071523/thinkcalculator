import type { CapitalGainsClassification } from "./capital-gains-types"
import { CAPITAL_GAINS_LONG_TERM_HOLDING_MONTHS } from "./capital-gains-regulatory-config"

function addMonthsToIsoDate(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, day))
  return date.toISOString().slice(0, 10)
}

/** Section 111A/112A classify holding period by calendar date, not a fixed day count (so month
 * length does not skew the boundary): a sale on or before the date exactly
 * CAPITAL_GAINS_LONG_TERM_HOLDING_MONTHS after the purchase date is short-term; a sale any later
 * is long-term. A same-day purchase and sale (zero holding period) is short-term. */
export function classifyHoldingPeriod(purchaseDate: string, saleDate: string): CapitalGainsClassification {
  const longTermThresholdDate = addMonthsToIsoDate(purchaseDate, CAPITAL_GAINS_LONG_TERM_HOLDING_MONTHS)
  return saleDate > longTermThresholdDate ? "ltcg" : "stcg"
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Informational day count for display only — classification itself uses classifyHoldingPeriod's
 * calendar-month comparison, not this figure. */
export function computeHoldingPeriodDays(purchaseDate: string, saleDate: string): number {
  const purchase = new Date(`${purchaseDate}T00:00:00Z`).getTime()
  const sale = new Date(`${saleDate}T00:00:00Z`).getTime()
  return Math.round((sale - purchase) / MS_PER_DAY)
}
