import { describe, expect, it } from "vitest"

import { classifyHoldingPeriod, computeHoldingPeriodDays } from "../capital-gains-holding-period"

describe("classifyHoldingPeriod", () => {
  it("classifies a sale exactly 12 months after purchase as short-term", () => {
    expect(classifyHoldingPeriod("2025-01-15", "2026-01-15")).toBe("stcg")
  })

  it("classifies a sale one day beyond 12 months as long-term", () => {
    expect(classifyHoldingPeriod("2025-01-15", "2026-01-16")).toBe("ltcg")
  })

  it("classifies a zero-holding-period same-day sale as short-term", () => {
    expect(classifyHoldingPeriod("2026-06-15", "2026-06-15")).toBe("stcg")
  })

  it("classifies a multi-year holding period as long-term", () => {
    expect(classifyHoldingPeriod("2016-03-10", "2026-06-15")).toBe("ltcg")
  })
})

describe("computeHoldingPeriodDays", () => {
  it("returns zero for a same-day purchase and sale", () => {
    expect(computeHoldingPeriodDays("2026-06-15", "2026-06-15")).toBe(0)
  })

  it("returns a positive day count for a later sale", () => {
    expect(computeHoldingPeriodDays("2026-01-01", "2026-01-11")).toBe(10)
  })
})
