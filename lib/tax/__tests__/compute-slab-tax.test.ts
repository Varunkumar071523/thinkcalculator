import { describe, expect, it } from "vitest"

import { computeSlabTax } from "../engine"
import { FY2025_26_RULES } from "../rules/fy2025-26"

const { newRegime, oldRegime } = FY2025_26_RULES

describe("computeSlabTax", () => {
  it("returns zero for zero or negative income", () => {
    expect(computeSlabTax(0, newRegime.slabs)).toBe(0)
    expect(computeSlabTax(-1000, newRegime.slabs)).toBe(0)
  })

  it.each([
    [400_000, 0],
    [400_001, 0.05],
    [800_000, 20_000],
    [800_001, 20_000.1],
    [1_200_000, 60_000],
    [1_600_000, 120_000],
    [2_000_000, 200_000],
    [2_400_000, 300_000],
    [3_000_000, 480_000],
  ])("new regime: taxes ₹%i as ₹%s", (income, expected) => {
    expect(computeSlabTax(income, newRegime.slabs)).toBeCloseTo(expected, 6)
  })

  it.each([
    [250_000, 0],
    [500_000, 12_500],
    [1_000_000, 112_500],
    [1_500_000, 262_500],
  ])("old regime, below 60: taxes ₹%i as ₹%s", (income, expected) => {
    expect(computeSlabTax(income, oldRegime.slabsByAgeBand.below60)).toBeCloseTo(expected, 6)
  })

  it.each([
    [300_000, 0],
    [500_000, 10_000],
    [1_000_000, 110_000],
    [1_500_000, 260_000],
  ])("old regime, 60 to 80: taxes ₹%i as ₹%s", (income, expected) => {
    expect(computeSlabTax(income, oldRegime.slabsByAgeBand["60to80"])).toBeCloseTo(expected, 6)
  })

  it.each([
    [500_000, 0],
    [1_000_000, 100_000],
    [1_500_000, 250_000],
  ])("old regime, 80 plus: taxes ₹%i as ₹%s", (income, expected) => {
    expect(computeSlabTax(income, oldRegime.slabsByAgeBand["80plus"])).toBeCloseTo(expected, 6)
  })

  it("older age bands owe less tax than a younger taxpayer on identical income", () => {
    const income = 900_000
    const below60 = computeSlabTax(income, oldRegime.slabsByAgeBand.below60)
    const senior = computeSlabTax(income, oldRegime.slabsByAgeBand["60to80"])
    const superSenior = computeSlabTax(income, oldRegime.slabsByAgeBand["80plus"])
    expect(senior).toBeLessThan(below60)
    expect(superSenior).toBeLessThan(senior)
  })
})
