import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { calculateEpsPension } from "./calculate-eps-pension"
import {
  EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS,
  EPS_PENSION_DIVISOR,
  EPS_PENSION_EARLY_PENSION_MIN_AGE,
  EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR,
  EPS_PENSION_MINIMUM_MONTHLY_PENSION,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_REGULATORY_REVIEW_DATE,
  EPS_PENSION_STANDARD_RETIREMENT_AGE,
  EPS_PENSION_WAGE_CEILING,
} from "./eps-pension-regulatory-config"
import type { EpsPensionInput, EpsPensionResult } from "./eps-pension-types"
import { EPS_PENSION_DEFAULT_INPUT } from "./eps-pension-url-state"

export const epsPensionFAQs: readonly CalculatorFAQ[] = [
  {
    question: "What counts as \"pensionable salary\"?",
    answer: `The average of your basic pay plus dearness allowance over the last 60 months before exit from the pension fund, capped at ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}/month for standard members. It is not your gross salary, CTC, or your own EPF wage — those can be higher than the figure this calculator's formula actually uses.`,
  },
  {
    question: `Why is my salary capped at ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}?`,
    answer: `EPS contributions are funded from a portion of the employer's EPF contribution, and that portion is calculated only on wages up to the statutory ceiling — currently ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}/month, in force since 1 September 2014. Even if your actual basic + DA is much higher, the pension formula only ever uses this capped figure for a standard member.`,
  },
  {
    question: "What is the 20-year bonus?",
    answer: `A member who completes ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years or more of pensionable service gets 2 extra years added to pensionable service for the formula only — it does not change your actual years worked, and it does not apply below ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years.`,
  },
  {
    question: `What happens with less than ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service?`,
    answer: `A member needs at least ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service to draw a monthly pension at all. Below that, no monthly pension is payable under EPS — the corpus is instead eligible for a separate withdrawal benefit, which this calculator does not compute. This calculator shows ₹0 and flags ineligibility rather than a formula result you would not actually receive.`,
  },
  {
    question: `Is the ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum pension guaranteed no matter what?`,
    answer: `Yes, for any eligible member (${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}+ years of pensionable service) taking a pension at the standard age of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}, the payable pension is never less than ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")}/month even if the formula produces a smaller figure. Taking an early, reduced pension can bring the actual payout below this floor — the guarantee applies to the standard-age pension, not to every reduced variant of it.`,
  },
  {
    question: "What does taking an early pension cost me?",
    answer: `EPS allows drawing a pension from age ${EPS_PENSION_EARLY_PENSION_MIN_AGE} onward, reduced by ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR}% for every year short of age ${EPS_PENSION_STANDARD_RETIREMENT_AGE}. Starting at 50, the earliest possible age, cuts the standard-age pension by ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR * (EPS_PENSION_STANDARD_RETIREMENT_AGE - EPS_PENSION_EARLY_PENSION_MIN_AGE)}%, for life. This calculator keeps the early-pension figure in a clearly separate line from the standard-age pension so the two are never confused.`,
  },
  {
    question: "Is this the same as my EPF balance or NPS corpus?",
    answer: "No. EPS is a defined-benefit monthly pension computed by this formula, funded from part of your employer's EPF contribution — it has no separate account balance you can check like an EPF or NPS corpus. EPF and NPS are defined-contribution accumulations that grow with contributions and returns; EPS pays a fixed monthly amount for life once you qualify, regardless of how markets perform.",
  },
  {
    question: "Does this include the post-2022 Supreme Court \"higher pension\" option?",
    answer: "No. This calculator applies only the standard EPS 2026 formula with the statutory wage ceiling. It does not model the higher-pension option (computing pension on actual, uncapped salary) that the Supreme Court's November 2022 ruling made available to specific eligible members — that option depends on individual employer-contribution history and a separate EPFO application process outside this calculator's scope.",
  },
]

export const epsPensionRelatedCalculators: readonly RelatedCalculator[] = [
  {
    slug: "epf-calculator",
    title: "EPF Calculator",
    description: "Project your separate Employees' Provident Fund balance and maturity value.",
    href: "/finance/epf-calculator",
    category: "Finance",
  },
  {
    slug: "nps-calculator",
    title: "NPS Calculator",
    description: "Estimate the National Pension System corpus and annuity from your own contributions.",
    href: "/finance/nps-calculator",
    category: "Finance",
  },
  {
    slug: "retirement-corpus-calculator",
    title: "Retirement Corpus Calculator",
    description: "Plan how EPS, EPF, and other retirement income sources add up to your overall retirement corpus.",
    href: "/finance/retirement-corpus-calculator",
    category: "Finance",
  },
  {
    slug: "gratuity-calculator",
    title: "Gratuity Calculator",
    description: "Estimate the separate statutory gratuity benefit payable on retirement or resignation.",
    href: "/finance/gratuity-calculator",
    category: "Finance",
  },
]

export const epsPensionWorkedExampleInput: EpsPensionInput = EPS_PENSION_DEFAULT_INPUT
export const epsPensionWorkedExampleResult = calculateEpsPension(epsPensionWorkedExampleInput)

export const epsPensionWorkedExample: CalculatorWorkedExample = {
  title: "Wage ceiling and 20-year bonus both bind",
  description: `A member retires at the standard age with 26 years of pensionable service and an average monthly basic + DA of ₹24,000 over the last 60 months. The ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} wage ceiling caps the pensionable salary used in the formula well below the ₹24,000 actually drawn, and because 26 years is past the ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year mark, 2 bonus years are added to pensionable service — both non-trivial rules apply at once.`,
  inputs: [
    { label: "Average monthly basic + DA (last 60 months)", value: formatIndianCurrency(epsPensionWorkedExampleInput.averageMonthlySalary) },
    { label: "Years of pensionable service", value: `${epsPensionWorkedExampleInput.yearsOfPensionableService} years` },
    { label: "Pension option", value: "Standard age (58)" },
  ],
  results: [
    { label: "Pensionable salary used (after ceiling)", value: formatIndianCurrency(epsPensionWorkedExampleResult.pensionableSalaryUsed) },
    { label: "Pensionable service used (after bonus)", value: `${formatIndianNumber(epsPensionWorkedExampleResult.pensionableServiceUsed)} years` },
    { label: "Formula pension", value: formatIndianCurrency(epsPensionWorkedExampleResult.formulaPension) },
    { label: "Monthly pension payable", value: formatIndianCurrency(epsPensionWorkedExampleResult.monthlyPension) },
  ],
}

export function createEpsPensionResultText(input: EpsPensionInput, result: EpsPensionResult): string {
  return [
    "ThinkCalculator EPS Pension Estimate",
    "",
    `Average monthly basic + DA (last 60 months): ${formatIndianCurrency(input.averageMonthlySalary)}`,
    `Years of pensionable service: ${input.yearsOfPensionableService}`,
    result.isEligible ? "" : `Not eligible: fewer than ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service.`,
    `Pensionable salary used: ${formatIndianCurrency(result.pensionableSalaryUsed)}${result.isWageCeilingBinding ? ` (capped at the ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} ceiling)` : ""}`,
    `Pensionable service used: ${formatIndianNumber(result.pensionableServiceUsed)} years${result.bonusYearsApplied ? ` (includes the ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus)` : ""}`,
    `Formula pension (pensionable salary × pensionable service ÷ ${EPS_PENSION_DIVISOR}): ${formatIndianCurrency(result.formulaPension)}`,
    `Standard-age monthly pension: ${formatIndianCurrency(result.standardMonthlyPension)}${result.isFloorBinding ? ` (₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum-pension floor applied)` : ""}`,
    input.ageOption === "early" ? `Early pension from age ${input.earlyPensionAge} (${formatIndianNumber(result.earlyPensionReductionPercent)}% reduction): ${formatIndianCurrency(result.earlyMonthlyPension)}` : "",
    `Monthly pension payable: ${formatIndianCurrency(result.monthlyPension)}`,
    "",
    `Regulatory sources reviewed ${EPS_PENSION_REGULATORY_REVIEW_DATE}. This is an educational estimate under EPS 2026, not financial or pension advice.`,
    "Calculator:",
    `${siteConfig.url}/finance/eps-pension-calculator`,
  ].filter(Boolean).join("\n")
}

export function createEpsPensionPrintDisclaimer(): string {
  return `Official sources reviewed ${EPS_PENSION_REGULATORY_REVIEW_DATE}. This estimate applies the EPS 2026 formula (pensionable salary × pensionable service ÷ ${EPS_PENSION_DIVISOR}) using the current ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} wage ceiling and ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum pension. It is not personalised pension advice, does not model the post-2022 Supreme Court higher-pension option, and does not verify your actual EPFO service record or exit date.`
}
