import { describe, expect, it } from "vitest"

import { computeRebate87A, computeSlabTax } from "../engine"
import { FY2025_26_RULES } from "../rules/fy2025-26"

const { newRegime, oldRegime } = FY2025_26_RULES

describe("computeRebate87A — new regime (threshold ₹12,00,000, cap ₹60,000)", () => {
  it("fully rebates tax at exactly the threshold — no residual tax", () => {
    const taxableIncome = 1_200_000
    const tax = computeSlabTax(taxableIncome, newRegime.slabs)
    const result = computeRebate87A(taxableIncome, tax, newRegime.rebate87A)
    expect(result.taxAfterRebate).toBe(0)
    expect(result.marginalReliefApplied).toBe(false)
  })

  it("applies marginal relief ₹1 above the threshold instead of a tax cliff", () => {
    const taxableIncome = 1_200_001
    const tax = computeSlabTax(taxableIncome, newRegime.slabs)
    const result = computeRebate87A(taxableIncome, tax, newRegime.rebate87A)
    // Tax payable is capped at the excess of income over the threshold (₹1),
    // not the much larger slab tax on ₹12,00,001.
    expect(result.taxAfterRebate).toBeCloseTo(1, 6)
    expect(result.marginalReliefApplied).toBe(true)
    expect(result.taxAfterRebate).toBeLessThan(tax)
  })

  it("applies marginal relief comfortably above the threshold", () => {
    const taxableIncome = 1_250_000
    const tax = computeSlabTax(taxableIncome, newRegime.slabs)
    const result = computeRebate87A(taxableIncome, tax, newRegime.rebate87A)
    expect(result.taxAfterRebate).toBeCloseTo(50_000, 6)
    expect(result.marginalReliefApplied).toBe(true)
  })

  it("stops giving relief once slab tax itself drops back below the excess-over-threshold amount", () => {
    // Breakeven is at income ≈ ₹12,70,588.24 (solve 60,000 + 0.15d = d).
    const belowBreakeven = 1_260_000
    const aboveBreakeven = 1_300_000

    const taxBelow = computeSlabTax(belowBreakeven, newRegime.slabs)
    const resultBelow = computeRebate87A(belowBreakeven, taxBelow, newRegime.rebate87A)
    expect(resultBelow.marginalReliefApplied).toBe(true)

    const taxAbove = computeSlabTax(aboveBreakeven, newRegime.slabs)
    const resultAbove = computeRebate87A(aboveBreakeven, taxAbove, newRegime.rebate87A)
    expect(resultAbove.marginalReliefApplied).toBe(false)
    expect(resultAbove.taxAfterRebate).toBeCloseTo(taxAbove, 6)
  })

  it("produces a strictly increasing, cliff-free tax curve across the threshold", () => {
    const incomes = [1_199_999, 1_200_000, 1_200_001, 1_210_000, 1_250_000, 1_300_000, 1_400_000]
    const finalTaxes = incomes.map((income) => {
      const tax = computeSlabTax(income, newRegime.slabs)
      return computeRebate87A(income, tax, newRegime.rebate87A).taxAfterRebate
    })
    for (let i = 1; i < finalTaxes.length; i++) {
      expect(finalTaxes[i]).toBeGreaterThanOrEqual(finalTaxes[i - 1])
    }
    // No single-rupee income step should ever produce a jump anywhere near
    // the size of a full slab-tax cliff (₹60,000+).
    const jumpAtThreshold = finalTaxes[2] - finalTaxes[1]
    expect(jumpAtThreshold).toBeLessThan(10)
  })
})

describe("computeRebate87A — old regime (threshold ₹5,00,000, cap ₹12,500)", () => {
  it("fully rebates tax at exactly the threshold", () => {
    const taxableIncome = 500_000
    const tax = computeSlabTax(taxableIncome, oldRegime.slabsByAgeBand.below60)
    const result = computeRebate87A(taxableIncome, tax, oldRegime.rebate87A)
    expect(result.taxAfterRebate).toBe(0)
  })

  it("applies marginal relief ₹1 above the threshold", () => {
    const taxableIncome = 500_001
    const tax = computeSlabTax(taxableIncome, oldRegime.slabsByAgeBand.below60)
    const result = computeRebate87A(taxableIncome, tax, oldRegime.rebate87A)
    expect(result.taxAfterRebate).toBeCloseTo(1, 6)
    expect(result.marginalReliefApplied).toBe(true)
  })

  it("applies marginal relief comfortably above the threshold", () => {
    const taxableIncome = 510_000
    const tax = computeSlabTax(taxableIncome, oldRegime.slabsByAgeBand.below60)
    const result = computeRebate87A(taxableIncome, tax, oldRegime.rebate87A)
    expect(result.taxAfterRebate).toBeCloseTo(10_000, 6)
    expect(result.marginalReliefApplied).toBe(true)
  })

  it("stops giving relief once slab tax drops back below the excess amount (breakeven ≈ ₹5,15,625)", () => {
    const aboveBreakeven = 520_000
    const tax = computeSlabTax(aboveBreakeven, oldRegime.slabsByAgeBand.below60)
    const result = computeRebate87A(aboveBreakeven, tax, oldRegime.rebate87A)
    expect(result.marginalReliefApplied).toBe(false)
    expect(result.taxAfterRebate).toBeCloseTo(tax, 6)
  })
})
