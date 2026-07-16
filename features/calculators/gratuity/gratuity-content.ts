import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { calculateGratuity } from "./calculate-gratuity"
import {
  GRATUITY_ORDINARY_SERVICE_YEARS,
  GRATUITY_REGULATORY_REVIEW_DATE,
} from "./gratuity-regulatory-config"
import type { GratuityInput, GratuityResult } from "./gratuity-types"

export const gratuityFAQs: readonly CalculatorFAQ[] = [
  {
    question: "What should I enter as eligible monthly wages?",
    answer: "Use the last-drawn monthly wages determined under section 2(88) of the Code on Social Security, 2020, not gross salary automatically. The definition includes basic pay, dearness allowance, and retaining allowance, with specified exclusions and a 50% add-back rule that can require payroll review.",
  },
  {
    question: "How does this calculator count six and seven additional months?",
    answer: "The standard formula counts a part-year only when it is in excess of six months. Exactly six additional months does not add a year; seven through eleven additional completed months add one counted year.",
  },
  {
    question: "Why does the formula divide monthly wages by 26?",
    answer: "Section 53 clarifies that fifteen days' wages for a monthly rated employee are calculated by dividing last-drawn monthly wages by 26 and multiplying by 15.",
  },
  {
    question: "Does the calculator decide whether I am legally eligible?",
    answer: "No. It shows the standard amount and an informational warning when completed service is below the ordinary five-year threshold. Coverage, continuous service, the termination event, exceptions, employment category, and other facts need separate review.",
  },
  {
    question: "Are there exceptions to the ordinary five-year service rule?",
    answer: "Yes. The Code and official FAQs identify different treatment for death, disablement, fixed-term employment, working journalists, and notified events. This regular monthly rated employee calculator does not calculate those cases.",
  },
  {
    question: "What gratuity ceiling does the calculator apply?",
    answer: "It applies the currently confirmed statutory maximum of ₹20,00,000. That ceiling is time-sensitive and should be rechecked against official notifications for a future employment-termination date.",
  },
  {
    question: "Can an employer pay more than this estimate?",
    answer: "Yes. Section 53 preserves better gratuity terms under an award, agreement, or contract. Employer policy and contractual terms can therefore produce a higher amount than this statutory-scope estimate.",
  },
  {
    question: "Why might an employer's final calculation differ?",
    answer: "Differences can arise from the applicable wage components, establishment coverage, continuous-service history, employment category, contract or award terms, reduced wages after disablement, forfeiture rules, rounding, and later changes in law.",
  },
]

export const gratuityRelatedCalculators: readonly RelatedCalculator[] = [
  {
    slug: "ppf-calculator",
    title: "PPF Calculator",
    description: "Explore a long-term savings projection separately from an employment benefit estimate.",
    href: "/finance/ppf-calculator",
    category: "Finance",
  },
  {
    slug: "fd-calculator",
    title: "FD Calculator",
    description: "Estimate growth if a one-time amount is placed in a fixed deposit.",
    href: "/finance/fd-calculator",
    category: "Finance",
  },
  {
    slug: "sip-calculator",
    title: "SIP Calculator",
    description: "Model regular investing as a separate, market-linked planning scenario.",
    href: "/finance/sip-calculator",
    category: "Finance",
  },
]

export const gratuityWorkedExampleInput: GratuityInput = {
  eligibleMonthlyWages: 50_000,
  completedYears: 7,
  additionalMonths: 7,
}
export const gratuityWorkedExampleResult = calculateGratuity(gratuityWorkedExampleInput)

export const gratuityWorkedExample: CalculatorWorkedExample = {
  title: "Seven additional months example",
  description: "With ₹50,000 of eligible monthly wages and 7 years 7 months of service, the part-year is in excess of six months, so the formula uses 8 counted years. At exactly 7 years 6 months it would use only 7 counted years.",
  inputs: [
    { label: "Eligible monthly wages", value: formatIndianCurrency(gratuityWorkedExampleInput.eligibleMonthlyWages) },
    { label: "Completed service", value: `${gratuityWorkedExampleInput.completedYears} years ${gratuityWorkedExampleInput.additionalMonths} months` },
  ],
  results: [
    { label: "Counted service", value: `${gratuityWorkedExampleResult.countedServiceYears} years` },
    { label: "Gratuity before ceiling", value: formatIndianCurrency(gratuityWorkedExampleResult.gratuityBeforeCeiling) },
    { label: "Estimated gratuity", value: formatIndianCurrency(gratuityWorkedExampleResult.estimatedGratuity) },
  ],
}

export function hasOrdinaryGratuityService(input: GratuityInput): boolean {
  return input.completedYears >= GRATUITY_ORDINARY_SERVICE_YEARS
}

export function createGratuityOrdinaryServiceText(input: GratuityInput): string {
  return hasOrdinaryGratuityService(input)
    ? "At least five completed years entered; legal eligibility still requires separate review"
    : "Below five completed years entered; exceptions may follow different rules"
}

export function createGratuityResultText(input: GratuityInput, result: GratuityResult): string {
  return [
    "ThinkCalculator Gratuity Estimate",
    "",
    `Eligible monthly wages entered: ${formatIndianCurrency(input.eligibleMonthlyWages)}`,
    `Completed service entered: ${input.completedYears} years and ${input.additionalMonths} months`,
    `Counted service for standard formula: ${formatIndianNumber(result.countedServiceYears)} years`,
    `Daily wage basis (monthly wages ÷ 26): ${formatIndianCurrency(result.dailyWageBasis)}`,
    `Gratuity before statutory ceiling: ${formatIndianCurrency(result.gratuityBeforeCeiling)}`,
    `Statutory ceiling used: ${formatIndianCurrency(result.statutoryCeiling)}`,
    `Estimated gratuity after ceiling: ${formatIndianCurrency(result.estimatedGratuity)}`,
    `Ceiling status: ${result.ceilingApplied ? `Applied; amount reduced by ${formatIndianCurrency(result.ceilingAdjustment)}` : "Not applied"}`,
    `Ordinary service threshold: ${createGratuityOrdinaryServiceText(input)}`,
    "",
    `Regulatory sources reviewed ${GRATUITY_REGULATORY_REVIEW_DATE}. This is an educational standard-formula estimate, not a legal eligibility or employer determination.`,
    "Calculator:",
    `${siteConfig.url}/finance/gratuity-calculator`,
  ].join("\n")
}

export function createGratuityPrintDisclaimer(): string {
  return `Official sources reviewed ${GRATUITY_REGULATORY_REVIEW_DATE}. This standard monthly rated employee estimate uses entered Code-defined eligible wages, the 15/26 formula, the part-year rule, and the currently confirmed ₹20 lakh ceiling. It does not determine legal eligibility, coverage, continuous service, exceptions, forfeiture, contractual improvements, or the employer's final wage basis.`
}
