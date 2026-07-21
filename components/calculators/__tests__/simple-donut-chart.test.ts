import { describe, expect, it } from "vitest"

import { computeDonutSegments } from "../simple-donut-chart"

function item(label: string, value: number) {
  return { label, value, formattedValue: String(value), colorClass: "bg-money" }
}

describe("computeDonutSegments", () => {
  it("splits a 2-item donut proportionally, starting at offset 0", () => {
    const segments = computeDonutSegments([item("A", 75), item("B", 25)])
    expect(segments).toEqual([
      { percent: 75, dashOffset: 0 },
      { percent: 25, dashOffset: -75 },
    ])
  })

  it("splits a 3-item donut so the segments sum to a full circle", () => {
    const segments = computeDonutSegments([item("Equity", 50), item("Corporate debt", 30), item("Govt securities", 20)])
    expect(segments).toEqual([
      { percent: 50, dashOffset: 0 },
      { percent: 30, dashOffset: -50 },
      { percent: 20, dashOffset: -80 },
    ])
    expect(segments.reduce((sum, segment) => sum + segment.percent, 0)).toBeCloseTo(100)
  })

  it("attributes the whole ring to the first item when every value is zero (zero-total edge case)", () => {
    expect(computeDonutSegments([item("A", 0), item("B", 0)])).toEqual([
      { percent: 100, dashOffset: 0 },
      { percent: 0, dashOffset: -100 },
    ])
    expect(computeDonutSegments([item("Equity", 0), item("Corporate debt", 0), item("Govt securities", 0)])).toEqual([
      { percent: 100, dashOffset: 0 },
      { percent: 0, dashOffset: -100 },
      { percent: 0, dashOffset: -100 },
    ])
  })

  it("draws a single full-circle segment when 100% of the allocation is in one asset class", () => {
    const segments = computeDonutSegments([item("Equity", 100), item("Corporate debt", 0), item("Govt securities", 0)])
    expect(segments).toEqual([
      { percent: 100, dashOffset: 0 },
      { percent: 0, dashOffset: -100 },
      { percent: 0, dashOffset: -100 },
    ])
  })

  it("is stable under floating-point values (no NaN, sums to ~100)", () => {
    const segments = computeDonutSegments([item("A", 33.33), item("B", 33.33), item("C", 33.34)])
    expect(segments.every((segment) => Number.isFinite(segment.percent) && Number.isFinite(segment.dashOffset))).toBe(true)
    expect(segments.reduce((sum, segment) => sum + segment.percent, 0)).toBeCloseTo(100)
  })
})
