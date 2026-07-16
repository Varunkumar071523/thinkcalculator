import { getTaxRuleSet } from "@/lib/tax/rules"

/**
 * The single financial year this calculator targets. Bumping this to a new
 * FY requires that year's ruleset to already be registered in
 * lib/tax/rules/index.ts — see lib/tax/rules/README.md.
 */
export const INCOME_TAX_FINANCIAL_YEAR = "2025-26"

export const INCOME_TAX_RULE_SET = getTaxRuleSet(INCOME_TAX_FINANCIAL_YEAR)

export const INCOME_TAX_REGULATORY_REVIEW_DATE = "16 July 2026"
