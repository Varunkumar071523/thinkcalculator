import { describe, expect, it } from "vitest"

import { toLiveInput } from "../capital-gains-live-input"
import { CAPITAL_GAINS_DEFAULT_INPUT } from "../capital-gains-url-state"
import type { CapitalGainsFormValues } from "../capital-gains-schema"

function toFormValues(): CapitalGainsFormValues {
  return {
    assetType: CAPITAL_GAINS_DEFAULT_INPUT.assetType,
    lots: CAPITAL_GAINS_DEFAULT_INPUT.lots.map((lot) => ({
      id: lot.id,
      purchaseDate: lot.purchaseDate,
      units: String(lot.units),
      costPerUnit: String(lot.costPerUnit),
      fairMarketValuePerUnitOn31Jan2018: lot.fairMarketValuePerUnitOn31Jan2018 === null ? "" : String(lot.fairMarketValuePerUnitOn31Jan2018),
    })),
    saleDate: CAPITAL_GAINS_DEFAULT_INPUT.saleDate,
    unitsSold: String(CAPITAL_GAINS_DEFAULT_INPUT.unitsSold),
    salePricePerUnit: String(CAPITAL_GAINS_DEFAULT_INPUT.salePricePerUnit),
  }
}

describe("toLiveInput", () => {
  it("passes well-formed values through unchanged", () => {
    expect(toLiveInput(toFormValues())).toEqual(CAPITAL_GAINS_DEFAULT_INPUT)
  })

  it("clamps an empty units-sold field to the minimum bound (Number('') coerces to 0, not NaN)", () => {
    const values = { ...toFormValues(), unitsSold: "" }
    expect(toLiveInput(values).unitsSold).toBe(0.0001)
  })

  it("falls back a genuinely non-finite units-sold field to the last-known-good default", () => {
    const values = { ...toFormValues(), unitsSold: "not-a-number" }
    expect(toLiveInput(values).unitsSold).toBe(CAPITAL_GAINS_DEFAULT_INPUT.unitsSold)
  })

  it("clamps an out-of-range sale price down to the maximum", () => {
    const values = { ...toFormValues(), salePricePerUnit: "999999999999" }
    expect(toLiveInput(values).salePricePerUnit).toBe(10_000_000)
  })

  it("falls back to a valid default date for an invalid sale date", () => {
    const values = { ...toFormValues(), saleDate: "not-a-date" }
    expect(toLiveInput(values).saleDate).toBe(CAPITAL_GAINS_DEFAULT_INPUT.saleDate)
  })

  it("falls back to the default asset type for an unrecognised value", () => {
    const values = { ...toFormValues(), assetType: "bogus" }
    expect(toLiveInput(values).assetType).toBe(CAPITAL_GAINS_DEFAULT_INPUT.assetType)
  })

  it("passes an empty lots array through unchanged rather than fabricating a row", () => {
    const values = { ...toFormValues(), lots: [] }
    expect(toLiveInput(values).lots).toEqual([])
  })

  it("clamps a lot's non-finite units field to a positive fallback", () => {
    const values = toFormValues()
    const nextLots = [...values.lots]
    nextLots[0] = { ...nextLots[0], units: "" }
    expect(toLiveInput({ ...values, lots: nextLots }).lots[0].units).toBeGreaterThan(0)
  })

  it("clears fairMarketValuePerUnitOn31Jan2018 to null once the purchase date moves past the cutoff", () => {
    const values = toFormValues()
    const nextLots = [...values.lots]
    nextLots[0] = { ...nextLots[0], purchaseDate: "2020-01-01", fairMarketValuePerUnitOn31Jan2018: "999" }
    expect(toLiveInput({ ...values, lots: nextLots }).lots[0].fairMarketValuePerUnitOn31Jan2018).toBeNull()
  })

  it("clamps a non-finite FMV for a pre-cutoff lot to a fallback rather than leaving it null", () => {
    const values = toFormValues()
    const nextLots = [...values.lots]
    nextLots[0] = { ...nextLots[0], fairMarketValuePerUnitOn31Jan2018: "" }
    const live = toLiveInput({ ...values, lots: nextLots })
    expect(live.lots[0].fairMarketValuePerUnitOn31Jan2018).not.toBeNull()
    expect(Number.isFinite(live.lots[0].fairMarketValuePerUnitOn31Jan2018)).toBe(true)
  })
})
