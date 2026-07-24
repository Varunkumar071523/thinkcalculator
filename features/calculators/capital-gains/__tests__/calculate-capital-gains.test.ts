import { describe, expect, it } from "vitest"

import { calculateCapitalGains } from "../calculate-capital-gains"
import { CAPITAL_GAINS_DEFAULT_INPUT } from "../capital-gains-url-state"
import type { CapitalGainsInput } from "../capital-gains-types"

function baseInput(overrides: Partial<CapitalGainsInput> = {}): CapitalGainsInput {
  return { ...CAPITAL_GAINS_DEFAULT_INPUT, ...overrides }
}

describe("calculateCapitalGains — worked example", () => {
  const result = calculateCapitalGains(CAPITAL_GAINS_DEFAULT_INPUT)

  it("matches three lots via FIFO, fully consuming the two oldest and partially the newest", () => {
    expect(result.matchedLots).toHaveLength(3)
    expect(result.matchedLots[0]).toMatchObject({ lotId: "lot-1", matchedUnits: 1500 })
    expect(result.matchedLots[1]).toMatchObject({ lotId: "lot-2", matchedUnits: 500 })
    expect(result.matchedLots[2]).toMatchObject({ lotId: "lot-3", matchedUnits: 150 })
  })

  it("applies grandfathering only to the pre-2018 lot, raising its cost basis to the FMV", () => {
    expect(result.matchedLots[0]).toMatchObject({ isGrandfathered: true, originalCostPerUnit: 50, effectiveCostPerUnit: 100 })
    expect(result.matchedLots[1]).toMatchObject({ isGrandfathered: false, effectiveCostPerUnit: 120 })
    expect(result.matchedLots[2]).toMatchObject({ isGrandfathered: false, effectiveCostPerUnit: 150 })
  })

  it("classifies the two older lots as LTCG and the recent partially-consumed lot as STCG", () => {
    expect(result.matchedLots[0].classification).toBe("ltcg")
    expect(result.matchedLots[1].classification).toBe("ltcg")
    expect(result.matchedLots[2].classification).toBe("stcg")
  })

  it("computes the exact per-lot gains", () => {
    expect(result.matchedLots[0].gain).toBe(150_000)
    expect(result.matchedLots[1].gain).toBe(40_000)
    expect(result.matchedLots[2].gain).toBe(7_500)
  })

  it("pools LTCG across lots, partially exceeding the ₹1,25,000 exemption", () => {
    expect(result.totalLTCG).toBe(190_000)
    expect(result.totalSTCG).toBe(7_500)
    expect(result.ltcgExemptionUsed).toBe(125_000)
    expect(result.ltcgTaxableAfterExemption).toBe(65_000)
  })

  it("computes the exact tax and net proceeds", () => {
    expect(result.ltcgTax).toBeCloseTo(8_125, 5)
    expect(result.stcgTax).toBeCloseTo(1_500, 5)
    expect(result.totalTax).toBeCloseTo(9_625, 5)
    expect(result.totalSaleValue).toBe(430_000)
    expect(result.netProceedsAfterTax).toBeCloseTo(420_375, 5)
  })
})

describe("calculateCapitalGains — edge cases", () => {
  it("errors clearly rather than miscalculating when the sale exceeds total units held", () => {
    expect(() => calculateCapitalGains(baseInput({ unitsSold: 100_000 }))).toThrow(RangeError)
  })

  it("throws for zero lots", () => {
    expect(() => calculateCapitalGains(baseInput({ lots: [], unitsSold: 10 }))).toThrow(RangeError)
  })

  it("handles a lot with zero holding period (same-day purchase and sale) as STCG", () => {
    const input = baseInput({
      lots: [{ id: "same-day", purchaseDate: "2026-06-15", units: 100, costPerUnit: 50, fairMarketValuePerUnitOn31Jan2018: null }],
      saleDate: "2026-06-15",
      unitsSold: 100,
      salePricePerUnit: 80,
    })
    const result = calculateCapitalGains(input)
    expect(result.matchedLots[0].classification).toBe("stcg")
    expect(result.matchedLots[0].holdingPeriodDays).toBe(0)
    expect(result.totalSTCG).toBe(3_000)
    expect(result.stcgTax).toBeCloseTo(600, 5)
  })

  it("computes an all-STCG scenario with a flat 20% tax and no exemption", () => {
    const input = baseInput({
      lots: [{ id: "recent", purchaseDate: "2026-01-01", units: 200, costPerUnit: 100, fairMarketValuePerUnitOn31Jan2018: null }],
      saleDate: "2026-06-01",
      unitsSold: 200,
      salePricePerUnit: 150,
    })
    const result = calculateCapitalGains(input)
    expect(result.totalLTCG).toBe(0)
    expect(result.totalSTCG).toBe(10_000)
    expect(result.stcgTax).toBeCloseTo(2_000, 5)
    expect(result.ltcgTax).toBe(0)
    expect(result.totalTax).toBeCloseTo(2_000, 5)
  })

  it("produces zero total tax for an all-LTCG scenario entirely under the exemption", () => {
    const input = baseInput({
      lots: [{ id: "old", purchaseDate: "2020-01-01", units: 100, costPerUnit: 500, fairMarketValuePerUnitOn31Jan2018: null }],
      saleDate: "2026-06-01",
      unitsSold: 100,
      salePricePerUnit: 1_000,
    })
    const result = calculateCapitalGains(input)
    expect(result.totalLTCG).toBe(50_000)
    expect(result.totalTax).toBe(0)
    expect(result.netProceedsAfterTax).toBe(result.totalSaleValue)
  })

  it("throws when given invalid input directly (defence-in-depth alongside form validation)", () => {
    expect(() => calculateCapitalGains(baseInput({ unitsSold: -5 }))).toThrow(RangeError)
  })
})
