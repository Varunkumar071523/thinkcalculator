import { HRA_FINANCIAL_YEAR, HRA_FY2026_27_ADDITIONAL_METRO_CITIES, HRA_FY2026_27_METRO_LIST_SOURCE } from "@/features/calculators/hra/hra-regulatory-config"
import { FY2025_26_RULES } from "@/lib/tax/rules/fy2025-26"

export type ChangelogEntry = {
  readonly date: string
  readonly title: string
  readonly description: string
  readonly link?: { readonly href: string; readonly label: string }
}

/**
 * Homepage-facing update log. Every fact this references (financial year, metro-city list) is
 * read from the same versioned rule-set constants the calculators themselves use — see
 * lib/tax/rules and features/calculators/hra/hra-regulatory-config.ts — so this can never drift
 * out of sync with what a calculator actually computes. `date` is the entry's own historical
 * record and is independent of those constants. Entries are unordered here; callers sort/cap via
 * `getRecentChangelogEntries`.
 */
export const changelogEntries: readonly ChangelogEntry[] = [
  {
    date: "2026-07-17",
    title: "HRA exemption calculator added",
    description: `Estimate exempt House Rent Allowance under the old tax regime for FY ${HRA_FINANCIAL_YEAR}, with a direct pass-through into the Income Tax Calculator.`,
    link: { href: "/finance/hra-calculator", label: "Open HRA calculator" },
  },
  {
    date: "2026-07-16",
    title: `FY ${FY2025_26_RULES.financialYear} income tax slabs confirmed`,
    description: `Old and new regime slabs, standard deduction, Section 87A rebate, surcharge, and cess for FY ${FY2025_26_RULES.financialYear} (AY ${FY2025_26_RULES.assessmentYear}) are live in the Income Tax Calculator.`,
    link: { href: "/finance/income-tax-calculator", label: "Open Income Tax calculator" },
  },
  {
    date: "2026-07-16",
    title: "Metro-city HRA expansion disclosed",
    description: `${HRA_FY2026_27_METRO_LIST_SOURCE} add ${HRA_FY2026_27_ADDITIONAL_METRO_CITIES.join(", ")} to the 50%-of-salary metro tier from FY 2026-27 onward. The HRA calculator still targets FY ${HRA_FINANCIAL_YEAR} — see the calculator for the on-page disclosure.`,
    link: { href: "/finance/hra-calculator", label: "Open HRA calculator" },
  },
] as const

export function getRecentChangelogEntries(limit = 4): readonly ChangelogEntry[] {
  return [...changelogEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}
