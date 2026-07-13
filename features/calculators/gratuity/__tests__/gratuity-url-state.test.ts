import { describe, expect, it } from "vitest"

import { calculateGratuity } from "../calculate-gratuity"
import {
  GRATUITY_DEFAULT_INPUT,
  buildGratuityCalculatorUrl,
  parseGratuityUrlState,
  parseValidGratuityUrlState,
  serializeGratuityUrlState,
} from "../gratuity-url-state"

describe("gratuity URL state", () => {
  it("parses complete valid state", () => {
    expect(parseValidGratuityUrlState(new URLSearchParams("wages=50000&years=7&months=7"))).toEqual(GRATUITY_DEFAULT_INPUT)
  })

  it("serializes only recognised normalized keys", () => {
    const serialized = serializeGratuityUrlState(GRATUITY_DEFAULT_INPUT)
    expect([...serialized.keys()]).toEqual(["wages", "years", "months"])
    expect(serialized.toString()).toBe("wages=50000&years=7&months=7")
  })

  it("round-trips valid state and reproduces the result", () => {
    const input = { eligibleMonthlyWages: 75_000.5, completedYears: 10, additionalMonths: 6 }
    const restored = parseValidGratuityUrlState(serializeGratuityUrlState(input))
    expect(restored).toEqual(input)
    expect(calculateGratuity(restored!)).toEqual(calculateGratuity(input))
  })

  it("ignores unknown keys", () => {
    expect(parseValidGratuityUrlState(new URLSearchParams("wages=50000&years=7&months=7&utm_source=test"))).toEqual(GRATUITY_DEFAULT_INPUT)
  })

  it("falls back as a whole for partial state", () => {
    expect(parseGratuityUrlState(new URLSearchParams("wages=60000&years=8"))).toEqual(GRATUITY_DEFAULT_INPUT)
  })

  it("rejects malformed, whitespace, duplicate, and out-of-range values", () => {
    for (const query of [
      "wages=50%2C000&years=7&months=7",
      "wages=50000&years=7.5&months=7",
      "wages=50000&years=7&months=12",
      "wages=&years=7&months=7",
      "wages=1000000000001&years=7&months=7",
      "wages=50000&years=%207&months=7",
      "wages=50000&wages=60000&years=7&months=7",
    ]) expect(parseValidGratuityUrlState(new URLSearchParams(query))).toBeNull()
  })

  it("keeps the canonical route query-free while the share URL carries state", () => {
    expect(buildGratuityCalculatorUrl(GRATUITY_DEFAULT_INPUT)).toBe("/finance/gratuity-calculator?wages=50000&years=7&months=7")
  })

  it("rejects invalid state during serialization", () => {
    expect(() => serializeGratuityUrlState({ ...GRATUITY_DEFAULT_INPUT, additionalMonths: 12 })).toThrow(RangeError)
  })
})
