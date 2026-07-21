import { describe, expect, it } from "vitest"

import { buildStackedDatasets, formatCompactINR, type YearlyBarChartSeries } from "../yearly-bar-chart"

describe("buildStackedDatasets", () => {
  it("maps a 2-series (backward-compatible) breakdown onto one shared stack", () => {
    const series: readonly [YearlyBarChartSeries, YearlyBarChartSeries] = [
      { label: "Principal", values: [100, 200], colorVar: "--money" },
      { label: "Interest", values: [10, 15], colorVar: "--gold" },
    ]
    expect(buildStackedDatasets(series)).toEqual([
      { label: "Principal", data: [100, 200], stack: "yearly" },
      { label: "Interest", data: [10, 15], stack: "yearly" },
    ])
  })

  it("maps a 3-series breakdown (e.g. EPF employee/employer/interest) onto one shared stack", () => {
    const series: readonly [YearlyBarChartSeries, YearlyBarChartSeries, YearlyBarChartSeries] = [
      { label: "Employee contribution", values: [12_000], colorVar: "--money" },
      { label: "Employer contribution", values: [12_000], colorVar: "--cat-loans" },
      { label: "Interest", values: [990], colorVar: "--gold" },
    ]
    const datasets = buildStackedDatasets(series)
    expect(datasets).toHaveLength(3)
    expect(datasets.every((dataset) => dataset.stack === "yearly")).toBe(true)
    expect(datasets.map((dataset) => dataset.label)).toEqual(["Employee contribution", "Employer contribution", "Interest"])
  })

  it("handles a single-year tenure (one-entry values array) without dropping data", () => {
    const series: readonly [YearlyBarChartSeries, YearlyBarChartSeries] = [
      { label: "Contribution", values: [5_000], colorVar: "--money" },
      { label: "Growth", values: [0], colorVar: "--gold" },
    ]
    expect(buildStackedDatasets(series).map((dataset) => dataset.data)).toEqual([[5_000], [0]])
  })

  it("handles an all-zero series (zero contribution edge case)", () => {
    const series: readonly [YearlyBarChartSeries, YearlyBarChartSeries, YearlyBarChartSeries] = [
      { label: "Employee contribution", values: [0, 0, 0], colorVar: "--money" },
      { label: "Employer contribution", values: [0, 0, 0], colorVar: "--cat-loans" },
      { label: "Interest", values: [0, 0, 0], colorVar: "--gold" },
    ]
    const datasets = buildStackedDatasets(series)
    expect(datasets.every((dataset) => dataset.data.every((value) => value === 0))).toBe(true)
  })
})

describe("formatCompactINR", () => {
  it("formats sub-thousand, thousand, lakh, and crore magnitudes", () => {
    expect(formatCompactINR(0)).toBe("₹0")
    expect(formatCompactINR(999)).toBe("₹999")
    expect(formatCompactINR(8_400)).toBe("₹8.4K")
    expect(formatCompactINR(5_50_000)).toBe("₹5.5L")
    expect(formatCompactINR(20_00_00_000)).toBe("₹20Cr")
  })

  it("formats negative values with a leading sign", () => {
    expect(formatCompactINR(-8_400)).toBe("-₹8.4K")
  })
})
