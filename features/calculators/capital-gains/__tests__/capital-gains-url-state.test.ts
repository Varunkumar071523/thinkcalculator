import { describe, expect, it } from "vitest"

import {
  CAPITAL_GAINS_DEFAULT_INPUT,
  buildCapitalGainsCalculatorUrl,
  parseCapitalGainsUrlState,
  parseValidCapitalGainsUrlState,
  serializeCapitalGainsUrlState,
} from "../capital-gains-url-state"

describe("capital gains URL state", () => {
  it("round-trips the default worked-example input through serialize/parse", () => {
    const params = serializeCapitalGainsUrlState(CAPITAL_GAINS_DEFAULT_INPUT)
    expect(parseValidCapitalGainsUrlState(params)).toEqual(CAPITAL_GAINS_DEFAULT_INPUT)
  })

  it("round-trips through a plain query-string record (as Next.js searchParams provides)", () => {
    const params = serializeCapitalGainsUrlState(CAPITAL_GAINS_DEFAULT_INPUT)
    const record = Object.fromEntries(params)
    expect(parseValidCapitalGainsUrlState(record)).toEqual(CAPITAL_GAINS_DEFAULT_INPUT)
  })

  it("returns null for missing recognised keys", () => {
    expect(parseValidCapitalGainsUrlState(new URLSearchParams({ type: "equity-share" }))).toBeNull()
  })

  it("returns null for malformed lot data", () => {
    const params = new URLSearchParams({ type: "equity-share", lots: "not-a-valid-lot", saleDate: "2026-06-15", unitsSold: "10", salePrice: "50" })
    expect(parseValidCapitalGainsUrlState(params)).toBeNull()
  })

  it("falls back to defaults for unparseable state via parseCapitalGainsUrlState", () => {
    expect(parseCapitalGainsUrlState(new URLSearchParams())).toEqual(CAPITAL_GAINS_DEFAULT_INPUT)
  })

  it("throws when serializing invalid input", () => {
    expect(() => serializeCapitalGainsUrlState({ ...CAPITAL_GAINS_DEFAULT_INPUT, lots: [] })).toThrow(RangeError)
  })

  it("builds an absolute calculator URL with an origin", () => {
    const url = buildCapitalGainsCalculatorUrl(CAPITAL_GAINS_DEFAULT_INPUT, "https://thinkcalculator.in")
    expect(url.startsWith("https://thinkcalculator.in/finance/capital-gains-calculator?")).toBe(true)
  })
})
