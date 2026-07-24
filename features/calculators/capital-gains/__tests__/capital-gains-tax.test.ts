import { describe, expect, it } from "vitest"

import { computeCapitalGainsTax } from "../capital-gains-tax"

describe("computeCapitalGainsTax", () => {
  it("taxes an STCG-only scenario at 20% with no exemption", () => {
    const result = computeCapitalGainsTax(50_000, 0)
    expect(result).toEqual({ ltcgExemptionUsed: 0, ltcgTaxableAfterExemption: 0, stcgTax: 10_000, ltcgTax: 0, totalTax: 10_000 })
  })

  it("produces zero tax for an all-LTCG scenario fully under the exemption", () => {
    const result = computeCapitalGainsTax(0, 100_000)
    expect(result).toEqual({ ltcgExemptionUsed: 100_000, ltcgTaxableAfterExemption: 0, stcgTax: 0, ltcgTax: 0, totalTax: 0 })
  })

  it("taxes only the portion of pooled LTCG above the ₹1,25,000 exemption", () => {
    const result = computeCapitalGainsTax(0, 190_000)
    expect(result.ltcgExemptionUsed).toBe(125_000)
    expect(result.ltcgTaxableAfterExemption).toBe(65_000)
    expect(result.ltcgTax).toBeCloseTo(8_125, 5)
    expect(result.stcgTax).toBe(0)
    expect(result.totalTax).toBeCloseTo(8_125, 5)
  })

  it("pools STCG and LTCG independently in a mixed scenario", () => {
    const result = computeCapitalGainsTax(7_500, 190_000)
    expect(result.stcgTax).toBeCloseTo(1_500, 5)
    expect(result.ltcgTax).toBeCloseTo(8_125, 5)
    expect(result.totalTax).toBeCloseTo(9_625, 5)
  })

  it("applies the exemption exactly at the boundary with zero taxable remainder", () => {
    const result = computeCapitalGainsTax(0, 125_000)
    expect(result.ltcgExemptionUsed).toBe(125_000)
    expect(result.ltcgTaxableAfterExemption).toBe(0)
    expect(result.ltcgTax).toBe(0)
  })

  it("treats a net LTCG loss as zero taxable and zero exemption used, not negative", () => {
    const result = computeCapitalGainsTax(0, -20_000)
    expect(result).toEqual({ ltcgExemptionUsed: 0, ltcgTaxableAfterExemption: 0, stcgTax: 0, ltcgTax: 0, totalTax: 0 })
  })

  it("treats a net STCG loss as zero tax, not negative", () => {
    const result = computeCapitalGainsTax(-5_000, 0)
    expect(result.stcgTax).toBe(0)
  })
})
