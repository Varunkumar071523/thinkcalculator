import { describe, expect, it } from "vitest"

import { computeSlabTax, computeSurcharge } from "../engine"
import { FY2025_26_RULES } from "../rules/fy2025-26"

const { newRegime, oldRegime } = FY2025_26_RULES

function taxPreSurchargeAt(income: number, slabs: typeof newRegime.slabs) {
  return computeSlabTax(income, slabs)
}

describe("computeSurcharge — no surcharge below the first threshold", () => {
  it("charges nothing at exactly ₹50,00,000", () => {
    const income = 5_000_000
    const tax = computeSlabTax(income, oldRegime.slabsByAgeBand.below60)
    const result = computeSurcharge(tax, income, oldRegime.surchargeTiers, (i) =>
      taxPreSurchargeAt(i, oldRegime.slabsByAgeBand.below60),
    )
    expect(result.rate).toBe(0)
    expect(result.surcharge).toBe(0)
  })
})

describe("computeSurcharge — marginal relief at the ₹50,00,000 threshold (old regime)", () => {
  it("caps the surcharge just above the threshold instead of applying the full 10% rate", () => {
    const income = 5_010_000
    const tax = computeSlabTax(income, oldRegime.slabsByAgeBand.below60)
    const result = computeSurcharge(tax, income, oldRegime.surchargeTiers, (i) =>
      taxPreSurchargeAt(i, oldRegime.slabsByAgeBand.below60),
    )
    expect(result.marginalReliefApplied).toBe(true)
    expect(result.surcharge).toBeCloseTo(7_000, 0)
    expect(result.surcharge).toBeLessThan(result.surchargeBeforeRelief)
    // Total tax increase over the threshold cannot exceed the income increase.
    const taxAtThreshold = computeSlabTax(5_000_000, oldRegime.slabsByAgeBand.below60)
    expect(tax + result.surcharge - taxAtThreshold).toBeLessThanOrEqual(income - 5_000_000 + 1e-6)
  })
})

describe("computeSurcharge — marginal relief at the ₹1,00,00,000 threshold (new regime)", () => {
  it("caps the surcharge just above the threshold instead of jumping straight to 15%", () => {
    const income = 10_100_000
    const tax = computeSlabTax(income, newRegime.slabs)
    const result = computeSurcharge(tax, income, newRegime.surchargeTiers, (i) => taxPreSurchargeAt(i, newRegime.slabs))
    expect(result.marginalReliefApplied).toBe(true)
    expect(result.surcharge).toBeCloseTo(328_000, 0)
    expect(result.surcharge).toBeLessThan(result.surchargeBeforeRelief)
  })

  it("applies the full 15% rate comfortably above the threshold, with no relief", () => {
    const income = 15_000_000
    const tax = computeSlabTax(income, newRegime.slabs)
    const result = computeSurcharge(tax, income, newRegime.surchargeTiers, (i) => taxPreSurchargeAt(i, newRegime.slabs))
    expect(result.marginalReliefApplied).toBe(false)
    expect(result.surcharge).toBeCloseTo(612_000, 0)
  })
})

describe("computeSurcharge — marginal relief at the ₹2,00,00,000 threshold (new regime)", () => {
  it("caps the surcharge just above the threshold instead of jumping straight to 25%", () => {
    const income = 20_100_000
    const tax = computeSlabTax(income, newRegime.slabs)
    const result = computeSurcharge(tax, income, newRegime.surchargeTiers, (i) => taxPreSurchargeAt(i, newRegime.slabs))
    expect(result.marginalReliefApplied).toBe(true)
    expect(result.surcharge).toBeCloseTo(907_000, 0)
  })
})

describe("computeSurcharge — new vs old regime diverge above ₹5,00,00,000", () => {
  it("caps new-regime surcharge at 25% while old regime rises to 37%", () => {
    const income = 60_000_000

    const newTax = computeSlabTax(income, newRegime.slabs)
    const newSurcharge = computeSurcharge(newTax, income, newRegime.surchargeTiers, (i) => taxPreSurchargeAt(i, newRegime.slabs))
    expect(newSurcharge.rate).toBeCloseTo(0.25, 6)
    expect(newSurcharge.marginalReliefApplied).toBe(false)

    const oldTax = computeSlabTax(income, oldRegime.slabsByAgeBand.below60)
    const oldSurcharge = computeSurcharge(oldTax, income, oldRegime.surchargeTiers, (i) =>
      taxPreSurchargeAt(i, oldRegime.slabsByAgeBand.below60),
    )
    expect(oldSurcharge.rate).toBeCloseTo(0.37, 6)
    expect(oldSurcharge.marginalReliefApplied).toBe(false)

    expect(newTax + newSurcharge.surcharge).toBeLessThan(oldTax + oldSurcharge.surcharge)
  })

  it("applies marginal relief crossing the ₹5,00,00,000 threshold for the old regime's 37% tier", () => {
    const income = 50_100_000
    const tax = computeSlabTax(income, oldRegime.slabsByAgeBand.below60)
    const result = computeSurcharge(tax, income, oldRegime.surchargeTiers, (i) =>
      taxPreSurchargeAt(i, oldRegime.slabsByAgeBand.below60),
    )
    expect(result.marginalReliefApplied).toBe(true)
    expect(result.surcharge).toBeCloseTo(3_773_125, -1)
  })
})
