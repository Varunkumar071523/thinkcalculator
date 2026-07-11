import { sipFAQs, sipRelatedCalculators, sipWorkedExample } from "@/features/calculators/sip/sip-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const sipCalculatorDefinition = {
  id: "sip-calculator",
  slug: "sip-calculator",
  title: "SIP Calculator",
  shortTitle: "SIP Calculator",
  description: "Calculate the estimated future value of monthly SIP investments based on your contribution, expected return, and investment duration.",
  category: "Finance",
  canonicalPath: "/finance/sip-calculator",
  inputs: [
    { id: "monthly-investment", type: "number", label: "Monthly investment", description: "Enter the amount you plan to invest each month.", prefix: "₹", min: 500, max: 10_000_000, step: 500, required: true },
    { id: "annual-return-rate", type: "number", label: "Expected annual return", description: "Enter an estimated annual return rate; actual returns may vary.", suffix: "%", min: 0, max: 50, step: 0.1, required: true },
    { id: "investment-duration", type: "number", label: "Investment duration", description: "Enter how long you plan to continue the SIP.", min: 1, max: 50, step: 1, required: true },
    { id: "duration-unit", type: "select", label: "Duration unit", options: [{ label: "Years", value: "years" }, { label: "Months", value: "months" }], required: true },
  ],
  formula: {
    title: "SIP future-value formula",
    expression: "FV = P × [((1 + r)ⁿ − 1) ÷ r] × (1 + r)",
    description: "The annual return is divided by 12 and 100 to obtain a monthly decimal rate. This formula assumes each contribution is made at the beginning of the month, so every instalment receives one additional month of potential growth.",
    variables: [
      { symbol: "P", meaning: "Monthly SIP contribution" },
      { symbol: "r", meaning: "Expected monthly rate of return as a decimal" },
      { symbol: "n", meaning: "Total number of monthly contributions" },
    ],
  },
  workedExample: sipWorkedExample,
  faqs: sipFAQs,
  relatedCalculators: sipRelatedCalculators,
  metadata: {
    title: "SIP Calculator: Estimate SIP Returns & Future Value",
    description: "Estimate the future value, invested amount, and potential returns of monthly SIP investments in India using your contribution, return assumption, and duration.",
    keywords: ["SIP calculator", "SIP return calculator", "mutual fund SIP calculator India"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
