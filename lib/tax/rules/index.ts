import { FY2025_26_RULES } from "./fy2025-26"
import type { TaxRuleSet } from "./types"

export const TAX_RULE_SETS: Readonly<Record<string, TaxRuleSet>> = {
  "2025-26": FY2025_26_RULES,
}

export function getTaxRuleSet(financialYear: string): TaxRuleSet {
  const ruleSet = TAX_RULE_SETS[financialYear]
  if (!ruleSet) {
    throw new RangeError(`No tax rule set registered for financial year "${financialYear}"`)
  }
  return ruleSet
}

export * from "./types"
