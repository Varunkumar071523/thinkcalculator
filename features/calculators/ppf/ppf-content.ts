import { calculatePPF } from "./calculate-ppf"
import { PPF_RATE_CONFIG } from "./ppf-rate-config"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import type { PPFInput, PPFResult } from "./ppf-types"

export const ppfFAQs: readonly CalculatorFAQ[] = [
  { question: "What is the minimum and maximum annual PPF contribution?", answer: "The official scheme permits ₹500 to ₹1,50,000 in a financial year, subject to the scheme's combined-account limit where applicable." },
  { question: "Why must PPF contributions be in multiples of ₹50?", answer: "The Public Provident Fund Scheme, 2019 requires deposits after account opening to be made in multiples of ₹50. This calculator enforces that rule." },
  { question: "Is the PPF interest rate fixed for the full term?", answer: "No. The Central Government notifies the applicable rate and it can change. This calculator holds your editable assumed rate constant only to create an illustration." },
  { question: "Why does contribution timing matter?", answer: "Official interest eligibility uses the lowest balance between the close of the fifth day and month-end. A later deposit can therefore earn less interest for that financial year." },
  { question: "Why can an actual PPF account balance differ?", answer: "Actual rates, deposit dates, monthly eligibility, rounding, missed deposits, account status, withdrawals, and account-office processing can differ from this simplified annual projection." },
  { question: "Can this calculator model a five-year PPF extension?", answer: "It can illustrate projection durations from 20 to 40 years in five-year steps, but it does not process an extension request or determine whether an account is eligible. Official closure and extension timing is measured from the end of the financial year in which the account was opened." },
  { question: "Does this include withdrawals, loans, missed years, revival fees, closure, or taxes?", answer: "No. It models one annual contribution and one constant assumed rate. Verify account and tax rules through official sources or a qualified professional." },
  { question: "Is the estimated maturity amount guaranteed?", answer: "No. It is an educational projection, not an official statement or guaranteed maturity amount." },
]

export const ppfRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "fd-calculator", title: "FD Calculator", description: "Project one lump-sum deposit using a chosen compounding convention.", href: "/finance/fd-calculator", category: "Finance" },
  { slug: "rd-calculator", title: "RD Calculator", description: "Project regular monthly deposits under an assumed bank-deposit rate.", href: "/finance/rd-calculator", category: "Finance" },
  { slug: "cagr-calculator", title: "CAGR Calculator", description: "Measure annualised growth between two known endpoint values.", href: "/finance/cagr-calculator", category: "Finance" },
]

export function createPPFResultText(input: PPFInput, result: PPFResult): string {
  return [
    "ThinkCalculator PPF Projection",
    "",
    `Annual contribution: ${formatIndianCurrency(input.annualContribution)}`,
    `Assumed constant rate: ${formatPercentage(input.assumedAnnualInterestRate)}`,
    `Projection duration: ${input.durationYears} years`,
    "Contribution timing: beginning of each projection year; assumed eligible for a full year's interest",
    `Total contributions: ${formatIndianCurrency(result.totalContributions)}`,
    `Estimated interest: ${formatIndianCurrency(result.totalInterest)}`,
    `Estimated maturity value: ${formatIndianCurrency(result.maturityValue)}`,
    "",
    `${PPF_RATE_CONFIG.defaultRate}% is a reference default for ${PPF_RATE_CONFIG.verifiedPeriod.toLowerCase()}, not a current-rate claim.`,
    "Actual PPF rates may change, and official interest uses the lowest balance between the close of the fifth day and month-end.",
    "Calculator:",
    "https://thinkcalculator.in/finance/ppf-calculator",
  ].join("\n")
}

export function createPPFPrintDisclaimer(): string {
  return `${PPF_RATE_CONFIG.defaultRate}% is a reference default for ${PPF_RATE_CONFIG.verifiedPeriod.toLowerCase()}, not a current-rate claim. This illustration assumes beginning-of-year contributions eligible for a full year's interest and one constant rate; actual notified rates, the official lowest-balance rule between the close of the fifth day and month-end, account events, and processing can differ.`
}

const workedExampleResult = calculatePPF({ annualContribution: 100_000, assumedAnnualInterestRate: PPF_RATE_CONFIG.defaultRate, durationYears: 15 })
export const ppfWorkedExample: CalculatorWorkedExample = {
  title: "PPF projection example",
  description: `This example adds ₹1,00,000 at the beginning of every projection year and applies a constant ${PPF_RATE_CONFIG.defaultRate}% annual rate for 15 years. It is an illustration, not an account statement or guaranteed outcome.`,
  inputs: [{ label: "Annual contribution", value: "₹1,00,000" }, { label: "Assumed annual rate", value: `${PPF_RATE_CONFIG.defaultRate}% constant` }, { label: "Duration", value: "15 years" }],
  results: [{ label: "Estimated maturity value", value: formatIndianCurrency(workedExampleResult.maturityValue) }, { label: "Total contributions", value: formatIndianCurrency(workedExampleResult.totalContributions) }, { label: "Estimated interest", value: formatIndianCurrency(workedExampleResult.totalInterest) }],
}
