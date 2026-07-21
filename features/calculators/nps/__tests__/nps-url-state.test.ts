import { describe, expect, it } from "vitest"

import { calculateNPS } from "../calculate-nps"
import {
  buildNPSCalculatorUrl,
  NPS_DEFAULT_INPUT,
  parseNPSUrlState,
  serializeNPSUrlState,
} from "../nps-url-state"

describe("NPS URL state", () => {
  it("parses complete valid state", () => {
    const serialized = serializeNPSUrlState(NPS_DEFAULT_INPUT)
    expect(parseNPSUrlState(serialized)).toEqual(NPS_DEFAULT_INPUT)
  })

  it("serializes only recognised normalized keys", () => {
    const serialized = serializeNPSUrlState(NPS_DEFAULT_INPUT)
    expect([...serialized.keys()]).toEqual(["contribution", "age", "retireAge", "equity", "debt", "equityReturn", "debtReturn", "govtReturn"])
  })

  it("round-trips valid state and reproduces the result", () => {
    const input = { monthlyContribution: 15_000, currentAge: 25, retirementAge: 60, equityAllocationPercent: 75, corporateDebtAllocationPercent: 25, equityExpectedReturn: 11, corporateDebtExpectedReturn: 7.5, govtSecuritiesExpectedReturn: 6.5 }
    const restored = parseNPSUrlState(serializeNPSUrlState(input))
    expect(restored).toEqual(input)
    expect(calculateNPS(restored)).toEqual(calculateNPS(input))
  })

  it("ignores unknown keys", () => {
    const serialized = serializeNPSUrlState(NPS_DEFAULT_INPUT)
    serialized.set("utm_source", "test")
    expect(parseNPSUrlState(serialized)).toEqual(NPS_DEFAULT_INPUT)
  })

  it("falls back to defaults when equity + corporate debt exceed 100% even after per-field fallback", () => {
    // equity=90 is valid in isolation, so only "debt" gets an error and falls back to the default
    // corporateDebtAllocationPercent (30) — but 90 + 30 is still over 100%, so the second
    // validation pass also fails and the whole state reverts to NPS_DEFAULT_INPUT, matching
    // parseEPFUrlState/parseEMIUrlState's "fall back to defaults as a whole" behavior when even the
    // per-field-fallback candidate remains invalid.
    const serialized = serializeNPSUrlState(NPS_DEFAULT_INPUT)
    serialized.set("equity", "90")
    serialized.set("debt", "50")
    expect(parseNPSUrlState(serialized)).toEqual(NPS_DEFAULT_INPUT)
  })

  it("keeps the canonical route query-free while the share URL carries state", () => {
    const serialized = serializeNPSUrlState(NPS_DEFAULT_INPUT)
    expect(buildNPSCalculatorUrl(NPS_DEFAULT_INPUT)).toBe(`/finance/nps-calculator?${serialized.toString()}`)
  })

  it("rejects invalid state during serialization", () => {
    expect(() => serializeNPSUrlState({ ...NPS_DEFAULT_INPUT, retirementAge: NPS_DEFAULT_INPUT.currentAge })).toThrow(RangeError)
  })
})
