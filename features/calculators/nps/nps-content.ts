import { calculateNPS } from "./calculate-nps"
import type { NPSInput, NPSResult } from "./nps-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const npsFAQs: readonly CalculatorFAQ[] = [
  { question: "What is NPS?", answer: "The National Pension System (NPS) is a market-linked, voluntary retirement savings scheme regulated by the PFRDA. Contributions are invested across equity, corporate debt, and government securities according to a chosen allocation, and returns are not fixed or guaranteed." },
  { question: "How does asset allocation affect my projected corpus?", answer: "This calculator blends your equity, corporate debt, and government securities expected returns by their allocation share into a single rate, and compounds your monthly contribution at that blended rate. A higher equity allocation raises the blended rate (and its uncertainty) if you also enter a higher expected equity return." },
  { question: "Are the expected returns for each asset class guaranteed?", answer: "No. Equity, corporate debt, and government securities returns are all market-linked and vary over time. The defaults in this calculator are illustrative modelling assumptions, not a forecast, guarantee, or historical average endorsed by any fund manager." },
  { question: "Why is government securities allocation not a separate slider?", answer: "It is always the remainder after equity and corporate debt allocation, so the three always sum to exactly 100% without needing to balance three independent sliders yourself." },
  { question: "Does this calculator model NPS Tier I and Tier II accounts separately?", answer: "No. It projects one blended-rate accumulation from a monthly contribution to a chosen retirement age. It does not model Tier I/Tier II distinctions, employer contributions under the corporate model, the mandatory annuitization portion at exit, withdrawal rules, or tax treatment." },
  { question: "Is the projected NPS corpus guaranteed?", answer: "No. It is an educational, market-linked projection using constant assumed returns, not an official statement or guaranteed maturity amount." },
]

export const npsRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "epf-calculator", title: "EPF Calculator", description: "Estimate your Employees' Provident Fund corpus at retirement.", href: "/finance/epf-calculator", category: "Finance" },
  { slug: "sip-calculator", title: "SIP Calculator", description: "Project the future value of regular mutual fund investments.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "retirement-corpus-calculator", title: "Retirement Corpus Calculator", description: "Project a full accumulation-to-withdrawal retirement plan.", href: "/finance/retirement-corpus-calculator", category: "Finance" },
  { slug: "ppf-calculator", title: "PPF Calculator", description: "Estimate Public Provident Fund maturity under a constant-rate assumption.", href: "/finance/ppf-calculator", category: "Finance" },
]

export function createNPSResultText(input: NPSInput, result: NPSResult): string {
  return [
    "ThinkCalculator NPS Projection",
    "",
    `Monthly contribution: ${formatIndianCurrency(input.monthlyContribution)}`,
    `Current age / retirement age: ${input.currentAge} / ${input.retirementAge}`,
    `Asset allocation — equity / corporate debt / govt securities: ${formatPercentage(result.equityAllocationPercent)} / ${formatPercentage(result.corporateDebtAllocationPercent)} / ${formatPercentage(result.govtSecuritiesAllocationPercent)}`,
    `Expected returns — equity / corporate debt / govt securities: ${formatPercentage(input.equityExpectedReturn)} / ${formatPercentage(input.corporateDebtExpectedReturn)} / ${formatPercentage(input.govtSecuritiesExpectedReturn)}`,
    `Blended assumed annual return: ${formatPercentage(result.blendedAnnualReturn)}`,
    `Total contributions: ${formatIndianCurrency(result.totalContributions)}`,
    `Estimated growth: ${formatIndianCurrency(result.totalGrowth)}`,
    `Estimated corpus at retirement: ${formatIndianCurrency(result.corpusAtRetirement)}`,
    "",
    "This is an illustrative, market-linked projection using constant assumed returns, not a forecast or guarantee. Excludes Tier I/Tier II distinctions, mandatory annuitization at exit, withdrawal rules, and tax treatment.",
    "Calculator:",
    `${siteConfig.url}/finance/nps-calculator`,
  ].join("\n")
}

const workedExampleInput: NPSInput = {
  monthlyContribution: 10_000,
  currentAge: 30,
  retirementAge: 60,
  equityAllocationPercent: 50,
  corporateDebtAllocationPercent: 30,
  equityExpectedReturn: 12,
  corporateDebtExpectedReturn: 8,
  govtSecuritiesExpectedReturn: 7,
}
const workedExampleResult = calculateNPS(workedExampleInput)

export const npsWorkedExample: CalculatorWorkedExample = {
  title: "NPS projection example",
  description: "For a ₹10,000 monthly contribution from age 30 to 60 with a 50% equity / 30% corporate debt / 20% government securities allocation, this calculator blends the three assumed returns into one rate and compounds the contribution monthly at that rate.",
  inputs: [
    { label: "Monthly contribution", value: "₹10,000" },
    { label: "Current age / retirement age", value: "30 / 60" },
    { label: "Allocation — equity / debt / govt", value: "50% / 30% / 20%" },
    { label: "Expected returns — equity / debt / govt", value: "12% / 8% / 7%" },
  ],
  results: [
    { label: "Blended assumed annual return", value: formatPercentage(workedExampleResult.blendedAnnualReturn) },
    { label: "Estimated corpus at retirement", value: formatIndianCurrency(workedExampleResult.corpusAtRetirement) },
    { label: "Total contributions", value: formatIndianCurrency(workedExampleResult.totalContributions) },
    { label: "Estimated growth", value: formatIndianCurrency(workedExampleResult.totalGrowth) },
  ],
}

export { workedExampleInput as npsWorkedExampleInput, workedExampleResult as npsWorkedExampleResult }
