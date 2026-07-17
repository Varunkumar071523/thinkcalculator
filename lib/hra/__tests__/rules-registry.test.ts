import { describe, expect, it } from "vitest"

import { getHraRuleSet, HRA_RULE_SETS } from "../rules"

describe("HRA rule set registry", () => {
  it("registers FY 2025-26 under its financial year key", () => {
    expect(HRA_RULE_SETS["2025-26"]).toBeDefined()
    expect(HRA_RULE_SETS["2025-26"].financialYear).toBe("2025-26")
    expect(HRA_RULE_SETS["2025-26"].assessmentYear).toBe("2026-27")
  })

  it("looks up a registered ruleset by financial year", () => {
    const ruleSet = getHraRuleSet("2025-26")
    expect(ruleSet.metroSalaryPercentage).toBe(0.5)
    expect(ruleSet.nonMetroSalaryPercentage).toBe(0.4)
    expect(ruleSet.rentMinusSalaryPercentage).toBe(0.1)
  })

  it("throws for an unregistered financial year, so a missing FY fails loudly rather than silently", () => {
    expect(() => getHraRuleSet("2030-31")).toThrow(RangeError)
  })

  it("lists exactly the four FY 2025-26 metro cities, not the FY 2026-27 eight-city list", () => {
    const ruleSet = getHraRuleSet("2025-26")
    expect(ruleSet.metroCities).toEqual(["Delhi", "Mumbai", "Kolkata", "Chennai"])
    expect(ruleSet.metroCities).not.toContain("Bengaluru")
  })
})
