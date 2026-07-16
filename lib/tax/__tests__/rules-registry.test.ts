import { describe, expect, it } from "vitest"

import { getTaxRuleSet, TAX_RULE_SETS } from "../rules"

describe("tax rule set registry", () => {
  it("registers FY 2025-26 under its financial year key", () => {
    expect(TAX_RULE_SETS["2025-26"]).toBeDefined()
    expect(TAX_RULE_SETS["2025-26"].financialYear).toBe("2025-26")
    expect(TAX_RULE_SETS["2025-26"].assessmentYear).toBe("2026-27")
  })

  it("looks up a registered ruleset by financial year", () => {
    const ruleSet = getTaxRuleSet("2025-26")
    expect(ruleSet.newRegime.standardDeduction).toBe(75_000)
    expect(ruleSet.oldRegime.standardDeduction).toBe(50_000)
  })

  it("throws for an unregistered financial year, so a missing FY fails loudly rather than silently", () => {
    expect(() => getTaxRuleSet("2030-31")).toThrow(RangeError)
  })

  it("keeps the new-regime rebate cap consistent with slab tax at its own threshold", () => {
    const ruleSet = getTaxRuleSet("2025-26")
    const { thresholdTaxableIncome, maxRebateAmount } = ruleSet.newRegime.rebate87A
    expect(thresholdTaxableIncome).toBe(1_200_000)
    expect(maxRebateAmount).toBe(60_000)
  })

  it("keeps the old-regime rebate cap consistent with slab tax at its own threshold", () => {
    const ruleSet = getTaxRuleSet("2025-26")
    const { thresholdTaxableIncome, maxRebateAmount } = ruleSet.oldRegime.rebate87A
    expect(thresholdTaxableIncome).toBe(500_000)
    expect(maxRebateAmount).toBe(12_500)
  })

  it("orders surcharge tiers ascending by threshold for both regimes", () => {
    const ruleSet = getTaxRuleSet("2025-26")
    for (const tiers of [ruleSet.newRegime.surchargeTiers, ruleSet.oldRegime.surchargeTiers]) {
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].thresholdTaxableIncome).toBeGreaterThan(tiers[i - 1].thresholdTaxableIncome)
        expect(tiers[i].rate).toBeGreaterThan(tiers[i - 1].rate)
      }
    }
  })

  it("gives the old regime a 37% top surcharge tier that the new regime does not have", () => {
    const ruleSet = getTaxRuleSet("2025-26")
    const oldRates = ruleSet.oldRegime.surchargeTiers.map((t) => t.rate)
    const newRates = ruleSet.newRegime.surchargeTiers.map((t) => t.rate)
    expect(oldRates).toContain(0.37)
    expect(newRates).not.toContain(0.37)
    expect(Math.max(...newRates)).toBe(0.25)
  })
})
