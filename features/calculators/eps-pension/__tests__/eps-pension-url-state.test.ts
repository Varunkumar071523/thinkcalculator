import { describe, expect, it } from "vitest"

import {
  EPS_PENSION_DEFAULT_INPUT,
  buildEpsPensionCalculatorUrl,
  parseEpsPensionUrlState,
  parseValidEpsPensionUrlState,
  serializeEpsPensionUrlState,
} from "../eps-pension-url-state"

const query = "salary=24000&years=26&ageOption=standard&earlyAge=50"

describe("EPS pension URL state", () => {
  it("parses valid parameters", () => {
    expect(parseEpsPensionUrlState(new URLSearchParams(query))).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })

  it("parses an early-pension scenario", () => {
    const earlyQuery = "salary=10000&years=15&ageOption=early&earlyAge=53"
    expect(parseEpsPensionUrlState(new URLSearchParams(earlyQuery))).toEqual({
      averageMonthlySalary: 10_000,
      yearsOfPensionableService: 15,
      ageOption: "early",
      earlyPensionAge: 53,
    })
  })

  it("uses defaults for missing parameters", () => {
    expect(parseEpsPensionUrlState(new URLSearchParams())).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })

  it("uses defaults when only some parameters are present", () => {
    expect(parseEpsPensionUrlState(new URLSearchParams("salary=10000&years=15"))).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })

  it("returns null from parseValidEpsPensionUrlState for an invalid age option", () => {
    expect(parseValidEpsPensionUrlState(new URLSearchParams(query.replace("ageOption=standard", "ageOption=deferred")))).toBeNull()
  })

  it("returns null for an out-of-range value", () => {
    expect(parseValidEpsPensionUrlState(new URLSearchParams(query.replace("years=26", "years=999")))).toBeNull()
    expect(parseValidEpsPensionUrlState(new URLSearchParams(query.replace("earlyAge=50", "earlyAge=49")))).toBeNull()
  })

  it("returns null for a non-finite value", () => {
    expect(parseValidEpsPensionUrlState(new URLSearchParams(query.replace("salary=24000", "salary=Infinity")))).toBeNull()
  })

  it("serializes valid input", () => {
    expect(serializeEpsPensionUrlState(EPS_PENSION_DEFAULT_INPUT).toString()).toBe(query)
  })

  it("builds a canonical share URL", () => {
    expect(buildEpsPensionCalculatorUrl(EPS_PENSION_DEFAULT_INPUT, "https://thinkcalculator.in")).toBe(`https://thinkcalculator.in/finance/eps-pension-calculator?${query}`)
  })

  it("round trips", () => {
    expect(parseEpsPensionUrlState(serializeEpsPensionUrlState(EPS_PENSION_DEFAULT_INPUT))).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })

  it("throws when serializing invalid input", () => {
    expect(() => serializeEpsPensionUrlState({ ...EPS_PENSION_DEFAULT_INPUT, yearsOfPensionableService: -1 })).toThrow(RangeError)
  })
})
