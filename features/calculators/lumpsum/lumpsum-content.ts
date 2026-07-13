import { calculateLumpsum } from "@/features/calculators/lumpsum/calculate-lumpsum"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const lumpsumFAQs: readonly CalculatorFAQ[] = [
  { question: "What is a lumpsum investment?", answer: "A lumpsum investment is a one-time amount invested at once rather than through recurring contributions such as a monthly SIP." },
  { question: "How is lumpsum future value calculated?", answer: "The initial amount is compounded using the expected annual return and investment duration. Durations entered in months are converted into fractional years." },
  { question: "Are lumpsum returns guaranteed?", answer: "No. Market-linked investment returns can vary and may be negative. This calculator provides an estimate based only on the return rate entered." },
  { question: "What return rate should I enter?", answer: "Use a reasonable assumption for the investment being evaluated or review relevant long-term historical information. Past performance does not guarantee future returns." },
  { question: "Is lumpsum better than SIP?", answer: "Neither is universally better. The choice can depend on available funds, timing, risk tolerance, and investment goals. This calculator does not provide personalised investment advice." },
  { question: "Does this calculator include taxes, fees, or inflation?", answer: "No. The estimate excludes expense ratios, taxes, exit loads, transaction costs, and inflation, which may affect actual and real returns." },
]

export const lumpsumRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "sip-calculator", title: "SIP Calculator", description: "Estimate the future value of monthly SIP contributions.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "step-up-sip", title: "Step-up SIP Calculator", description: "Explore tools for contributions that increase over time.", href: "/calculators", category: "Finance" },
  { slug: "cagr-calculator", title: "CAGR Calculator", description: "Calculate annualised growth between two values.", href: "/finance/cagr-calculator", category: "Finance" },
  { slug: "retirement", title: "Retirement Calculator", description: "Explore tools for long-term retirement planning.", href: "/calculators", category: "Finance" },
]

const exampleResult = calculateLumpsum({
  initialInvestment: 100_000,
  annualReturnRate: 12,
  duration: 10,
  durationUnit: "years",
})

export const lumpsumWorkedExample: CalculatorWorkedExample = {
  title: "Lumpsum calculation example",
  description: "For a ₹1,00,000 one-time investment with an assumed 12% annual return over 10 years, the calculator applies annual compound growth. Actual investment returns will vary.",
  inputs: [
    { label: "Initial investment", value: "₹1,00,000" },
    { label: "Expected annual return", value: "12%" },
    { label: "Investment duration", value: "10 years" },
  ],
  results: [
    { label: "Estimated future value", value: formatIndianCurrency(exampleResult.futureValue) },
    { label: "Initial investment", value: formatIndianCurrency(exampleResult.initialInvestment) },
    { label: "Estimated returns", value: formatIndianCurrency(exampleResult.estimatedReturns) },
    { label: "Investment duration", value: `${formatIndianNumber(exampleResult.totalMonths)} months` },
  ],
}
