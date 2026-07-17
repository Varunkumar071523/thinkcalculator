import { getHraRuleSet } from "@/lib/hra/rules"

/**
 * The single financial year this calculator targets — pinned to match
 * `INCOME_TAX_FINANCIAL_YEAR` (features/calculators/income-tax/income-tax-regulatory-config.ts)
 * so the exemption this calculator computes is always valid input for the
 * income tax calculator it passes through into. See lib/hra/rules/README.md
 * for why this matters: FY 2026-27 uses a different (wider) metro city list.
 */
export const HRA_FINANCIAL_YEAR = "2025-26"

export const HRA_RULE_SET = getHraRuleSet(HRA_FINANCIAL_YEAR)

export const HRA_REGULATORY_REVIEW_DATE = "16 July 2026"

/**
 * The four cities the Income-tax Rules, 2026 add to the 50%-of-salary metro
 * tier from FY 2026-27 onward — the current financial year, not a future
 * one. This calculator still uses the FY 2025-26 four-city list (see
 * HRA_FINANCIAL_YEAR's doc comment and lib/hra/rules/README.md for why),
 * so a live FY 2026-27 user in one of these cities would otherwise see
 * themselves misclassified as non-metro with no on-page indication. Used
 * only for the on-page disclosure text in hra-content.ts — not fed into
 * `computeHraExemption`, which must not silently upgrade to the 8-city
 * list here (see the sprint note in lib/hra/rules/README.md).
 */
export const HRA_FY2026_27_ADDITIONAL_METRO_CITIES = ["Bengaluru", "Hyderabad", "Pune", "Ahmedabad"] as const

export const HRA_FY2026_27_METRO_LIST_SOURCE = "Income-tax Rules, 2026"
