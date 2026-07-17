import { FY2025_26_HRA_RULES } from "./fy2025-26"
import type { HraRuleSet } from "./types"

export const HRA_RULE_SETS: Readonly<Record<string, HraRuleSet>> = {
  "2025-26": FY2025_26_HRA_RULES,
}

export function getHraRuleSet(financialYear: string): HraRuleSet {
  const ruleSet = HRA_RULE_SETS[financialYear]
  if (!ruleSet) {
    throw new RangeError(`No HRA rule set registered for financial year "${financialYear}"`)
  }
  return ruleSet
}

export * from "./types"
