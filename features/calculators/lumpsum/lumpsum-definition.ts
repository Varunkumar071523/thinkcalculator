import { lumpsumFAQs, lumpsumRelatedCalculators, lumpsumWorkedExample } from "@/features/calculators/lumpsum/lumpsum-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const lumpsumCalculatorDefinition = {
  id: "lumpsum-calculator",
  slug: "lumpsum-calculator",
  title: "Lumpsum Calculator",
  shortTitle: "Lumpsum Calculator",
  description: "Calculate the estimated future value of a one-time investment based on the investment amount, expected return, and duration.",
  category: "Finance",
  canonicalPath: "/finance/lumpsum-calculator",
  inputs: [
    { id: "initial-investment", type: "number", label: "Initial investment", description: "Enter the one-time amount you plan to invest.", prefix: "₹", min: 1_000, max: 100_000_000, step: 1_000, required: true },
    { id: "annual-return-rate", type: "number", label: "Expected annual return", description: "Enter an estimated annual return rate; actual returns may vary.", suffix: "%", min: 0, max: 50, step: 0.1, required: true },
    { id: "investment-duration", type: "number", label: "Investment duration", description: "Enter how long the amount may remain invested.", min: 1, max: 50, step: 1, required: true },
    { id: "duration-unit", type: "select", label: "Duration unit", options: [{ label: "Years", value: "years" }, { label: "Months", value: "months" }], required: true },
  ],
  formula: {
    title: "Compound-growth formula",
    expression: "FV = P × (1 + r)ᵗ",
    description: "The annual return percentage is divided by 100 to obtain a decimal rate. When duration is entered in months, it is divided by 12 to obtain fractional years before applying compound growth.",
    variables: [
      { symbol: "P", meaning: "Initial investment" },
      { symbol: "r", meaning: "Expected annual rate of return as a decimal" },
      { symbol: "t", meaning: "Investment duration in years" },
    ],
  },
  workedExample: lumpsumWorkedExample,
  faqs: lumpsumFAQs,
  relatedCalculators: lumpsumRelatedCalculators,
  metadata: {
    title: "Lumpsum Calculator: Estimate Investment Returns & Future Value",
    description: "Estimate the future value and potential returns of a one-time investment in India using your amount, return assumption, and investment duration.",
    keywords: ["lumpsum calculator", "investment return calculator", "lumpsum calculator India"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
