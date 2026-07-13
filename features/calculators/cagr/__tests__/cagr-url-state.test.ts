import { describe, expect, it } from "vitest"

import {
  CAGR_DEFAULT_INPUT,
  buildCAGRCalculatorUrl,
  parseCAGRUrlState,
  parseValidCAGRUrlState,
  serializeCAGRUrlState,
} from "@/features/calculators/cagr/cagr-url-state"

describe("CAGR URL state", () => {
  it("parses complete valid state and ignores unrelated parameters", () => {
    expect(parseCAGRUrlState(new URLSearchParams("beginning=50000&ending=75000&years=2.5&utm_source=test"))).toEqual({
      beginningValue: 50_000,
      endingValue: 75_000,
      investmentPeriodYears: 2.5,
    })
  })

  it("uses defaults when no recognised parameters exist", () => {
    expect(parseCAGRUrlState(new URLSearchParams("utm_source=test"))).toEqual(CAGR_DEFAULT_INPUT)
  })

  it.each([
    "beginning=100&ending=120",
    "beginning=0&ending=120&years=2",
    "beginning=100&ending=-1&years=2",
    "beginning=100&ending=120&years=NaN",
    "beginning=100&ending=120&years=0",
    "beginning=1e2&ending=120&years=2",
    "beginning=100&ending=1e309&years=2",
    "beginning=%E2%82%B9100&ending=120&years=2",
    "beginning=100%2C000&ending=120000&years=2",
    "beginning=%20100&ending=120&years=2",
    "beginning=100&ending=120&years=1.005",
  ])("falls back entirely for invalid or incomplete state: %s", (query) => {
    expect(parseCAGRUrlState(new URLSearchParams(query))).toEqual(CAGR_DEFAULT_INPUT)
  })

  it("rejects duplicate recognised parameters without being affected by unrelated duplicates", () => {
    expect(parseCAGRUrlState(new URLSearchParams("beginning=100&beginning=200&ending=300&years=2"))).toEqual(CAGR_DEFAULT_INPUT)
    expect(parseCAGRUrlState(new URLSearchParams("beginning=100&ending=121&years=2&tag=a&tag=b"))).toEqual({ beginningValue: 100, endingValue: 121, investmentPeriodYears: 2 })
  })

  it("serialises in a stable order and round trips", () => {
    const serialised = serializeCAGRUrlState(CAGR_DEFAULT_INPUT)
    expect(serialised.toString()).toBe("beginning=100000&ending=161051&years=5")
    expect(parseCAGRUrlState(serialised)).toEqual(CAGR_DEFAULT_INPUT)
  })

  it("preserves a zero ending value through a round trip", () => {
    const input = { beginningValue: 100_000, endingValue: 0, investmentPeriodYears: 5 }
    expect(parseCAGRUrlState(serializeCAGRUrlState(input))).toEqual(input)
  })

  it("preserves fractional years as raw numeric state", () => {
    const input = { beginningValue: 100_000.25, endingValue: 125_000.75, investmentPeriodYears: 2.5 }
    const serialised = serializeCAGRUrlState(input)
    expect(serialised.toString()).toBe("beginning=100000.25&ending=125000.75&years=2.5")
    expect(parseCAGRUrlState(serialised)).toEqual(input)
  })

  it("restores the same validated input used to reproduce a shared result", () => {
    const shared = new URLSearchParams("beginning=100000&ending=80000&years=2")
    expect(parseValidCAGRUrlState(shared)).toEqual({ beginningValue: 100_000, endingValue: 80_000, investmentPeriodYears: 2 })
  })

  it("builds clean relative and absolute share URLs", () => {
    expect(buildCAGRCalculatorUrl(CAGR_DEFAULT_INPUT)).toBe("/finance/cagr-calculator?beginning=100000&ending=161051&years=5")
    expect(buildCAGRCalculatorUrl(CAGR_DEFAULT_INPUT, "https://thinkcalculator.in")).toBe("https://thinkcalculator.in/finance/cagr-calculator?beginning=100000&ending=161051&years=5")
    expect("/finance/cagr-calculator").not.toContain("?")
  })
})
