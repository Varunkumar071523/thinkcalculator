import { computeHraExemption } from "@/lib/hra/engine"
import type { HraCalcInput, HraCalcResult } from "@/lib/hra/types"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import {
  HRA_FINANCIAL_YEAR,
  HRA_FY2026_27_ADDITIONAL_METRO_CITIES,
  HRA_FY2026_27_METRO_LIST_SOURCE,
  HRA_RULE_SET,
} from "./hra-regulatory-config"

/**
 * On-page disclosure text for the FY 2025-26 vs FY 2026-27 metro-city-list
 * gap (Sprint 26 follow-up): FY 2026-27 is the current financial year, and
 * this calculator is deliberately still pinned to FY 2025-26's four-city
 * list (see hra-regulatory-config.ts), so a live user in one of the four
 * newly-added cities needs this stated plainly, not left to a FAQ.
 */
export function createMetroCityListNoticeText(): string {
  return `This calculator currently uses the FY ${HRA_FINANCIAL_YEAR} metro city list (${HRA_RULE_SET.metroCities.join(", ")}). From FY 2026-27 — the current financial year — ${HRA_FY2026_27_ADDITIONAL_METRO_CITIES.join(", ")} are also classified as metro (50% of salary) under the ${HRA_FY2026_27_METRO_LIST_SOURCE}. If you live in one of those four cities and are calculating for FY 2026-27, treat your city as metro even though it isn't yet listed as one below.`
}

export const hraFAQs: readonly CalculatorFAQ[] = [
  {
    question: "How is HRA exemption calculated?",
    answer:
      "Exempt HRA under Section 10(13A), read with Rule 2A, is the least of three amounts: the actual HRA you received, rent paid minus 10% of salary, and 50% of salary (metro city) or 40% of salary (non-metro city). Whichever of the three is smallest is your exemption; the rest of the HRA received is taxable.",
  },
  {
    question: "Which cities count as metro for this calculation?",
    answer: `For FY ${HRA_FINANCIAL_YEAR}, only ${HRA_RULE_SET.metroCities.join(", ")} count as metro cities, giving a 50% of salary limit. Every other city uses the 40% limit. This four-city list is specific to FY ${HRA_FINANCIAL_YEAR}; a later financial year's list may differ — see this calculator's methodology section for details.`,
  },
  {
    question: "Can I claim HRA exemption under the new tax regime?",
    answer:
      "No. Section 10(13A) HRA exemption is available only under the old tax regime. Under the new regime, your entire HRA received is taxable, so this calculator's result should only be used when you have chosen (or are comparing) the old regime.",
  },
  {
    question: "What counts as 'salary' for the HRA calculation?",
    answer:
      "Basic salary, plus dearness allowance (DA) only where DA forms part of retirement benefits. If your DA does not form part of retirement benefits, or you have no DA, enter 0 for it. Commission that is a fixed percentage of turnover also counts under the statutory definition but is not collected as a separate input by this calculator.",
  },
  {
    question: "What if I pay rent below 10% of my salary?",
    answer:
      "The rent-based limit (rent paid minus 10% of salary) cannot go below zero. If your rent is at or below 10% of salary, that limit contributes 0 to the exemption, which usually means little or no HRA exemption is available even if you received HRA and pay some rent.",
  },
  {
    question: "How do I use this result in the income tax calculator?",
    answer:
      "After calculating, select \"Use this in the Income Tax Calculator\". It opens the income tax calculator with the old regime selected and your computed exemption pre-filled into the HRA exemption field — you still need to enter your other income and deduction details there.",
  },
]

export const hraRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "income-tax-calculator", title: "Income Tax Calculator", description: "Use your computed HRA exemption as an old-regime deduction in a full tax calculation.", href: "/finance/income-tax-calculator", category: "Finance" },
  { slug: "gratuity-calculator", title: "Gratuity Calculator", description: "Estimate statutory gratuity, another salary-linked, generally exempt benefit.", href: "/finance/gratuity-calculator", category: "Finance" },
  { slug: "emi-calculator", title: "EMI Calculator", description: "Estimate monthly loan payments that may separately qualify for Section 24(b) or 80C.", href: "/finance/emi-calculator", category: "Finance" },
]

export const hraWorkedExampleInput: HraCalcInput = {
  basicSalary: 600_000,
  da: 0,
  hraReceived: 240_000,
  rentPaid: 180_000,
  city: "metro",
}
export const hraWorkedExampleResult = computeHraExemption(hraWorkedExampleInput, HRA_FINANCIAL_YEAR)

export const hraWorkedExample: CalculatorWorkedExample = {
  title: "Metro city example",
  description:
    "With a ₹6,00,000 basic salary, no DA, ₹2,40,000 HRA received, ₹1,80,000 rent paid, and a metro city, the rent-based limit (rent minus 10% of salary) is the smallest of the three amounts, so it is the binding constraint.",
  inputs: [
    { label: "Basic salary + DA", value: formatIndianCurrency(hraWorkedExampleInput.basicSalary + hraWorkedExampleInput.da) },
    { label: "HRA received", value: formatIndianCurrency(hraWorkedExampleInput.hraReceived) },
    { label: "Rent paid", value: formatIndianCurrency(hraWorkedExampleInput.rentPaid) },
    { label: "City", value: "Metro" },
  ],
  results: [
    { label: "Actual HRA received", value: formatIndianCurrency(hraWorkedExampleResult.actualHraReceived) },
    { label: "Rent minus 10% of salary", value: formatIndianCurrency(hraWorkedExampleResult.rentMinusTenPercentSalary) },
    { label: "50% of salary (metro)", value: formatIndianCurrency(hraWorkedExampleResult.percentOfSalary) },
    { label: "Exempt HRA", value: formatIndianCurrency(hraWorkedExampleResult.exemptHra) },
  ],
}

export function createHraResultText(result: HraCalcResult): string {
  return [
    "ThinkCalculator HRA Exemption Calculation",
    "",
    `Financial year: ${result.financialYear} (AY ${result.assessmentYear})`,
    `City: ${result.input.city === "metro" ? "Metro" : "Non-metro"}`,
    `Salary (basic + DA): ${formatIndianCurrency(result.salary)}`,
    `HRA received: ${formatIndianCurrency(result.input.hraReceived)}`,
    `Rent paid: ${formatIndianCurrency(result.input.rentPaid)}`,
    "",
    `Actual HRA received: ${formatIndianCurrency(result.actualHraReceived)}`,
    `Rent paid minus 10% of salary: ${formatIndianCurrency(result.rentMinusTenPercentSalary)}`,
    `${result.percentOfSalaryRate * 100}% of salary (${result.input.city === "metro" ? "metro" : "non-metro"}): ${formatIndianCurrency(result.percentOfSalary)}`,
    "",
    `Exempt HRA: ${formatIndianCurrency(result.exemptHra)}`,
    `Taxable HRA: ${formatIndianCurrency(result.taxableHra)}`,
    "",
    "This exemption applies only under the old tax regime.",
    "Calculator:",
    `${siteConfig.url}/finance/hra-calculator`,
  ].join("\n")
}

export function createHraPrintDisclaimer(): string {
  return `Uses the FY ${HRA_FINANCIAL_YEAR} (AY ${HRA_RULE_SET.assessmentYear}) metro city list and percentages under Section 10(13A) / Rule 2A. HRA exemption applies only under the old tax regime. This is an estimate for informational purposes only; verify against official sources or consult a qualified professional before filing.`
}
