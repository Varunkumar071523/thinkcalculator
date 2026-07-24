import { describe, expect, it } from "vitest"

import { matchLotsFifo } from "../capital-gains-fifo-matcher"
import type { CapitalGainsLotInput } from "../capital-gains-types"

function lot(id: string, purchaseDate: string, units: number, costPerUnit: number): CapitalGainsLotInput {
  return { id, purchaseDate, units, costPerUnit, fairMarketValuePerUnitOn31Jan2018: null }
}

describe("matchLotsFifo", () => {
  it("matches a single lot fully consumed", () => {
    const lots = [lot("a", "2020-01-01", 100, 10)]
    expect(matchLotsFifo(lots, 100)).toEqual([{ lotId: "a", purchaseDate: "2020-01-01", matchedUnits: 100, costPerUnit: 10, fairMarketValuePerUnitOn31Jan2018: null }])
  })

  it("consumes multiple lots oldest-first regardless of input order", () => {
    const lots = [lot("newer", "2022-01-01", 100, 20), lot("older", "2020-01-01", 50, 10)]
    const result = matchLotsFifo(lots, 120)
    expect(result).toEqual([
      { lotId: "older", purchaseDate: "2020-01-01", matchedUnits: 50, costPerUnit: 10, fairMarketValuePerUnitOn31Jan2018: null },
      { lotId: "newer", purchaseDate: "2022-01-01", matchedUnits: 70, costPerUnit: 20, fairMarketValuePerUnitOn31Jan2018: null },
    ])
  })

  it("partially consumes only the last lot needed, leaving later lots untouched", () => {
    const lots = [lot("a", "2020-01-01", 100, 10), lot("b", "2021-01-01", 100, 20), lot("c", "2022-01-01", 100, 30)]
    const result = matchLotsFifo(lots, 150)
    expect(result).toEqual([
      { lotId: "a", purchaseDate: "2020-01-01", matchedUnits: 100, costPerUnit: 10, fairMarketValuePerUnitOn31Jan2018: null },
      { lotId: "b", purchaseDate: "2021-01-01", matchedUnits: 50, costPerUnit: 20, fairMarketValuePerUnitOn31Jan2018: null },
    ])
  })

  it("matches exactly the total units held across lots with none left over", () => {
    const lots = [lot("a", "2020-01-01", 40, 10), lot("b", "2021-01-01", 60, 20)]
    const result = matchLotsFifo(lots, 100)
    expect(result.reduce((sum, portion) => sum + portion.matchedUnits, 0)).toBe(100)
    expect(result).toHaveLength(2)
  })

  it("throws when the sale quantity exceeds total units held", () => {
    const lots = [lot("a", "2020-01-01", 40, 10)]
    expect(() => matchLotsFifo(lots, 41)).toThrow(RangeError)
  })

  it("throws for any positive sale against zero lots", () => {
    expect(() => matchLotsFifo([], 1)).toThrow(RangeError)
  })

  it("returns an empty match list for zero lots and zero units sold", () => {
    expect(matchLotsFifo([], 0)).toEqual([])
  })

  it("carries the fair market value field through unchanged for grandfathering downstream", () => {
    const lots: CapitalGainsLotInput[] = [{ id: "a", purchaseDate: "2016-01-01", units: 10, costPerUnit: 5, fairMarketValuePerUnitOn31Jan2018: 25 }]
    expect(matchLotsFifo(lots, 10)[0].fairMarketValuePerUnitOn31Jan2018).toBe(25)
  })
})
