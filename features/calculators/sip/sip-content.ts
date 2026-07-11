import { calculateSIP } from "@/features/calculators/sip/calculate-sip"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const sipFAQs: readonly CalculatorFAQ[] = [
  { question: "What is a SIP?", answer: "A Systematic Investment Plan, or SIP, is a way to invest a fixed amount in a mutual fund at regular intervals, commonly each month." },
  { question: "How is SIP maturity value calculated?", answer: "The estimate compounds each monthly contribution for its remaining investment period. This calculator assumes contributions are made at the beginning of each month." },
  { question: "Are SIP returns guaranteed?", answer: "No. Mutual fund returns depend on market performance and can differ significantly from the rate entered. The result is an estimate, not a guaranteed outcome." },
  { question: "What return rate should I enter?", answer: "Use a reasonable assumption suited to the investment being evaluated or review long-term historical information. Past performance does not guarantee future returns." },
  { question: "Can I stop or change my SIP?", answer: "Many SIPs allow investors to pause, stop, increase, or decrease contributions, subject to the fund and platform terms. Check the applicable scheme documents." },
  { question: "Does this calculator include taxes, fees, or inflation?", answer: "No. The estimate does not account for expense ratios, taxes, exit loads, transaction costs, or inflation, all of which may affect real-world outcomes." },
]

export const sipRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "lumpsum", title: "Lumpsum Calculator", description: "Explore tools for estimating a one-time investment.", href: "/calculators", category: "Finance" },
  { slug: "step-up-sip", title: "Step-up SIP Calculator", description: "Explore tools for investments that increase over time.", href: "/calculators", category: "Finance" },
  { slug: "cagr", title: "CAGR Calculator", description: "Explore tools for annualised investment growth.", href: "/calculators", category: "Finance" },
  { slug: "retirement", title: "Retirement Calculator", description: "Explore tools for long-term retirement planning.", href: "/calculators", category: "Finance" },
]

const exampleResult = calculateSIP({
  monthlyInvestment: 10_000,
  annualReturnRate: 12,
  duration: 10,
  durationUnit: "years",
})

export const sipWorkedExample: CalculatorWorkedExample = {
  title: "SIP calculation example",
  description: "For a ₹10,000 monthly SIP with an assumed 12% annual return over 10 years, the calculator uses 120 beginning-of-month contributions. Actual mutual fund returns will vary.",
  inputs: [
    { label: "Monthly investment", value: "₹10,000" },
    { label: "Expected annual return", value: "12%" },
    { label: "Investment duration", value: "10 years" },
  ],
  results: [
    { label: "Estimated future value", value: formatIndianCurrency(exampleResult.futureValue) },
    { label: "Total invested", value: formatIndianCurrency(exampleResult.totalInvested) },
    { label: "Estimated returns", value: formatIndianCurrency(exampleResult.estimatedReturns) },
    { label: "Monthly investments", value: formatIndianNumber(exampleResult.totalMonths) },
  ],
}
