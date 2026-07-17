import type { HraRuleSet } from "./types"

/**
 * HRA exemption rules for Financial Year 2025-26 (Assessment Year 2026-27)
 * under Section 10(13A) of the Income-tax Act, 1961, read with Rule 2A of
 * the Income-tax Rules, 1962.
 *
 * See ./README.md for sources and, importantly, why this is pinned to
 * FY 2025-26 rather than the financial year current at time of writing.
 */
export const FY2025_26_HRA_RULES: HraRuleSet = {
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  // The four cities notified as "metropolitan" for Rule 2A purposes for this
  // financial year — see README.md. This list changes by financial year and
  // must not be treated as a permanent constant.
  metroCities: ["Delhi", "Mumbai", "Kolkata", "Chennai"],
  metroSalaryPercentage: 0.5,
  nonMetroSalaryPercentage: 0.4,
  rentMinusSalaryPercentage: 0.1,
}
