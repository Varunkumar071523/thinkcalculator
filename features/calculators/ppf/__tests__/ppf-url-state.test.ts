import { describe, expect, it } from "vitest"
import { calculatePPF } from "../calculate-ppf"
import { PPF_RATE_CONFIG } from "../ppf-rate-config"
import { buildPPFCalculatorUrl, parsePPFUrlState, parseValidPPFUrlState, PPF_DEFAULT_INPUT, serializePPFUrlState } from "../ppf-url-state"

describe("PPF URL state", () => {
  const referenceRate = PPF_RATE_CONFIG.defaultRate
  const valid = new URLSearchParams("contribution=50000&rate=7.25&years=20")
  it("parses complete valid state", () => expect(parseValidPPFUrlState(valid)).toEqual({ annualContribution: 50_000, assumedAnnualInterestRate: 7.25, durationYears: 20 }))
  it.each(["", "contribution=50000", `contribution=50000&rate=${referenceRate}`, `contribution=525&rate=${referenceRate}&years=15`, "contribution=50000&rate=7.123&years=15", `contribution=50000&rate=${referenceRate}&years=16`])("falls back fully for %j", (query) => expect(parsePPFUrlState(new URLSearchParams(query))).toEqual(PPF_DEFAULT_INPUT))
  it("falls back fully for malformed numeric and out-of-range variants", () => {
    for (const query of [
      `contribution=5e2&rate=${referenceRate}&years=15`, `contribution=1%2C000&rate=${referenceRate}&years=15`,
      `contribution=%E2%82%B9500&rate=${referenceRate}&years=15`, `contribution=%20500&rate=${referenceRate}&years=15`,
      `contribution=%2B500&rate=${referenceRate}&years=15`, `contribution=500&rate=Infinity&years=15`,
      "contribution=500&rate=0.09&years=15", "contribution=500&rate=15.01&years=15",
      `contribution=450&rate=${referenceRate}&years=15`, `contribution=150050&rate=${referenceRate}&years=15`,
    ]) expect(parsePPFUrlState(new URLSearchParams(query))).toEqual(PPF_DEFAULT_INPUT)
  })
  it("rejects duplicate recognised parameters", () => {
    for (const query of [`contribution=500&contribution=1000&rate=${referenceRate}&years=15`, `contribution=500&rate=${referenceRate}&rate=7.25&years=15`, `contribution=500&rate=${referenceRate}&years=15&years=20`]) expect(parseValidPPFUrlState(new URLSearchParams(query))).toBeNull()
  })
  it("ignores unrelated parameters", () => expect(parseValidPPFUrlState(new URLSearchParams(`source=test&contribution=500&rate=${referenceRate}&years=15`))).toEqual({ annualContribution: 500, assumedAnnualInterestRate: referenceRate, durationYears: 15 }))
  it("serializes normalized raw values and round trips", () => { const serialized = serializePPFUrlState({ annualContribution: 50_000, assumedAnnualInterestRate: referenceRate, durationYears: 25 }); expect(serialized.toString()).toBe(`contribution=50000&rate=${referenceRate}&years=25`); expect(parsePPFUrlState(serialized)).toEqual({ annualContribution: 50_000, assumedAnnualInterestRate: referenceRate, durationYears: 25 }) })
  it("reproduces output from a shared URL", () => expect(calculatePPF(parsePPFUrlState(valid))).toEqual(calculatePPF({ annualContribution: 50_000, assumedAnnualInterestRate: 7.25, durationYears: 20 })))
  it("keeps the clean route while sharing only PPF keys", () => { const url = new URL(buildPPFCalculatorUrl(PPF_DEFAULT_INPUT, "https://thinkcalculator.in")); expect(url.pathname).toBe("/finance/ppf-calculator"); expect([...url.searchParams.keys()]).toEqual(["contribution", "rate", "years"]) })
})
