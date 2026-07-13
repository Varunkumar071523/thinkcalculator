import { calculateCAGR } from "@/features/calculators/cagr/calculate-cagr"
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const cagrFAQs: readonly CalculatorFAQ[] = [
  { question: "What does CAGR mean?", answer: "CAGR means compound annual growth rate. It expresses the constant annual rate that would connect a beginning value to an ending value over the selected period." },
  { question: "Is CAGR the same as total return?", answer: "No. Total return measures the full percentage change from beginning to end. CAGR annualises that change, so the two figures answer different questions." },
  { question: "Can CAGR be negative?", answer: "Yes. When the ending value is below the beginning value, CAGR is negative. An ending value of zero represents a complete loss and produces a CAGR of -100%." },
  { question: "Can I use a period shorter than one year?", answer: "Yes. Enter a fractional period from 0.01 year, using no more than two decimal places. Annualising a very short period can produce an extreme figure, so interpret it carefully." },
  { question: "Does CAGR show year-by-year volatility?", answer: "No. CAGR smooths the entire period into one annualised rate. It does not show the sequence of gains, losses, cash flows, or volatility between the endpoints." },
  { question: "Does a higher historical CAGR guarantee a better investment?", answer: "No. CAGR does not show risk, volatility, liquidity, costs, or future performance. It should not be used alone to judge whether an investment is suitable." },
  { question: "Can I use CAGR when money was added or withdrawn?", answer: "A simple endpoint CAGR does not adjust for intermediate cash flows. For investments with contributions or withdrawals, a cash-flow-aware return measure may be more appropriate." },
  { question: "Does the calculator include inflation, fees, or taxes?", answer: "No. Enter endpoint values that reflect whichever effects you want included. The calculator itself does not separately adjust for inflation, fees, taxes, or distributions." },
]

export const cagrRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "lumpsum-calculator", title: "Lumpsum Calculator", description: "Estimate the future value of a one-time investment.", href: "/finance/lumpsum-calculator", category: "Finance" },
  { slug: "sip-calculator", title: "SIP Calculator", description: "Estimate the future value of regular contributions.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "fd-calculator", title: "FD Calculator", description: "Estimate deposit maturity under a stated rate.", href: "/finance/fd-calculator", category: "Finance" },
]

const exampleResult = calculateCAGR({ beginningValue: 100_000, endingValue: 161_051, investmentPeriodYears: 5 })

export const cagrWorkedExample: CalculatorWorkedExample = {
  title: "CAGR calculation example",
  description: "If a value grows from ₹1,00,000 to ₹1,61,051 over five years, the calculator finds the constant annual compound rate that connects those two endpoints.",
  inputs: [
    { label: "Beginning value", value: "₹1,00,000" },
    { label: "Ending value", value: "₹1,61,051" },
    { label: "Investment period", value: "5 years" },
  ],
  results: [
    { label: "CAGR", value: formatPercentage(exampleResult.cagrPercentage) },
    { label: "Absolute gain", value: formatIndianCurrency(exampleResult.absoluteGainLoss) },
    { label: "Total return", value: formatPercentage(exampleResult.totalReturnPercentage) },
    { label: "Growth multiple", value: `${formatIndianNumber(exampleResult.growthMultiple)}×` },
  ],
}
