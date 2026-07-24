import type { CapitalGainsLotInput } from "./capital-gains-types"

export type FifoMatchedPortion = {
  readonly lotId: string
  readonly purchaseDate: string
  readonly matchedUnits: number
  readonly costPerUnit: number
  readonly fairMarketValuePerUnitOn31Jan2018: number | null
}

/** Matches a sale quantity against purchase lots oldest-first (FIFO), consuming each lot fully
 * before moving to the next. Lots are sorted by purchaseDate rather than trusted to already be in
 * order, since a repeatable-row UI does not guarantee entry order matches purchase order. Returns
 * one portion per lot actually touched by the sale — a lot with zero matched units is omitted
 * rather than returned with matchedUnits: 0, so callers never need to filter zero-unit portions
 * out again downstream (per-lot classification/grandfathering). Throws when the sale quantity
 * exceeds total units held across all lots, so an oversell is caught here rather than silently
 * producing a partial or negative-remainder match. */
export function matchLotsFifo(lots: readonly CapitalGainsLotInput[], unitsSold: number): readonly FifoMatchedPortion[] {
  const totalAvailableUnits = lots.reduce((sum, lot) => sum + lot.units, 0)
  if (unitsSold > totalAvailableUnits) {
    throw new RangeError(`Units sold (${unitsSold}) exceeds total units held across all lots (${totalAvailableUnits})`)
  }

  const sortedLots = [...lots].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
  const portions: FifoMatchedPortion[] = []
  let remainingToMatch = unitsSold

  for (const lot of sortedLots) {
    if (remainingToMatch <= 0) break
    const matchedUnits = Math.min(lot.units, remainingToMatch)
    if (matchedUnits > 0) {
      portions.push({
        lotId: lot.id,
        purchaseDate: lot.purchaseDate,
        matchedUnits,
        costPerUnit: lot.costPerUnit,
        fairMarketValuePerUnitOn31Jan2018: lot.fairMarketValuePerUnitOn31Jan2018,
      })
      remainingToMatch -= matchedUnits
    }
  }

  return portions
}
