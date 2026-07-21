import { describe, expect, it } from "vitest"

import { calculateEPF } from "../calculate-epf"
import {
  buildEPFCalculatorUrl,
  EPF_DEFAULT_INPUT,
  parseEPFUrlState,
  serializeEPFUrlState,
} from "../epf-url-state"

describe("EPF URL state", () => {
  it("parses complete valid state", () => {
    const serialized = serializeEPFUrlState(EPF_DEFAULT_INPUT)
    expect(parseEPFUrlState(serialized)).toEqual(EPF_DEFAULT_INPUT)
  })

  it("serializes only recognised normalized keys", () => {
    const serialized = serializeEPFUrlState(EPF_DEFAULT_INPUT)
    expect([...serialized.keys()]).toEqual(["salary", "empPct", "erPct", "age", "retireAge", "rate"])
  })

  it("round-trips valid state and reproduces the result", () => {
    const input = { monthlyBasicSalary: 55_000, employeeContributionPercent: 12, employerContributionPercent: 12, currentAge: 35, retirementAge: 60, expectedAnnualInterestRate: 8.25 }
    const restored = parseEPFUrlState(serializeEPFUrlState(input))
    expect(restored).toEqual(input)
    expect(calculateEPF(restored)).toEqual(calculateEPF(input))
  })

  it("ignores unknown keys", () => {
    const serialized = serializeEPFUrlState(EPF_DEFAULT_INPUT)
    serialized.set("utm_source", "test")
    expect(parseEPFUrlState(serialized)).toEqual(EPF_DEFAULT_INPUT)
  })

  it("fills missing fields from defaults (per-field fallback, matching EMI/PPF's URL-state pattern)", () => {
    expect(parseEPFUrlState(new URLSearchParams("salary=60000&age=30"))).toEqual({
      ...EPF_DEFAULT_INPUT,
      monthlyBasicSalary: 60_000,
      currentAge: 30,
    })
  })

  it("falls back per-field for out-of-range values", () => {
    const serialized = serializeEPFUrlState(EPF_DEFAULT_INPUT)
    serialized.set("rate", "999")
    const result = parseEPFUrlState(serialized)
    expect(result.expectedAnnualInterestRate).toBe(EPF_DEFAULT_INPUT.expectedAnnualInterestRate)
    expect(result.monthlyBasicSalary).toBe(EPF_DEFAULT_INPUT.monthlyBasicSalary)
  })

  it("keeps the canonical route query-free while the share URL carries state", () => {
    const serialized = serializeEPFUrlState(EPF_DEFAULT_INPUT)
    expect(buildEPFCalculatorUrl(EPF_DEFAULT_INPUT)).toBe(`/finance/epf-calculator?${serialized.toString()}`)
  })

  it("rejects invalid state during serialization", () => {
    expect(() => serializeEPFUrlState({ ...EPF_DEFAULT_INPUT, retirementAge: EPF_DEFAULT_INPUT.currentAge })).toThrow(RangeError)
  })
})
