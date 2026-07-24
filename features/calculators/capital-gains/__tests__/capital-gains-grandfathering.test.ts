import { describe, expect, it } from "vitest"

import { computeGrandfatheredCostPerUnit, isGrandfatheringApplicable } from "../capital-gains-grandfathering"

describe("isGrandfatheringApplicable", () => {
  it("applies to a lot acquired before 31 January 2018", () => {
    expect(isGrandfatheringApplicable("2018-01-30")).toBe(true)
    expect(isGrandfatheringApplicable("2000-06-15")).toBe(true)
  })

  it("does not apply on or after 31 January 2018", () => {
    expect(isGrandfatheringApplicable("2018-01-31")).toBe(false)
    expect(isGrandfatheringApplicable("2018-02-01")).toBe(false)
    expect(isGrandfatheringApplicable("2021-04-01")).toBe(false)
  })
})

describe("computeGrandfatheredCostPerUnit", () => {
  it("uses FMV as the cost basis when FMV is above actual cost and below sale price", () => {
    // higher(actual=50, lower(FMV=120, sale=200)=120) = 120
    expect(computeGrandfatheredCostPerUnit(50, 120, 200)).toBe(120)
  })

  it("falls back to actual cost when FMV is below actual cost", () => {
    // higher(actual=80, lower(FMV=40, sale=200)=40) = 80
    expect(computeGrandfatheredCostPerUnit(80, 40, 200)).toBe(80)
  })

  it("caps the FMV-derived basis at the sale price when FMV exceeds the sale price", () => {
    // higher(actual=50, lower(FMV=300, sale=200)=200) = 200 — this collapses the gain to zero,
    // never turns it into a manufactured loss, matching CBDT Circular 4/2018's intent.
    expect(computeGrandfatheredCostPerUnit(50, 300, 200)).toBe(200)
  })

  it("never produces a cost basis below the actual cost of acquisition", () => {
    expect(computeGrandfatheredCostPerUnit(90, 10, 50)).toBe(90)
  })
})
