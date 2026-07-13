import { cagrFAQs, cagrRelatedCalculators, cagrWorkedExample } from "@/features/calculators/cagr/cagr-content"
import { CAGR_LIMITS } from "@/features/calculators/cagr/cagr-schema"
import type { CalculatorDefinition } from "@/types/calculator"

export const cagrCalculatorDefinition = {
  id: "cagr-calculator",
  slug: "cagr-calculator",
  title: "CAGR Calculator",
  shortTitle: "CAGR Calculator",
  description: "Calculate compound annual growth rate from a beginning value, ending value, and investment period, with total return and gain or loss.",
  category: "Finance",
  canonicalPath: "/finance/cagr-calculator",
  inputs: [
    { id: "beginning-value", type: "number", label: "Beginning value", prefix: "₹", min: CAGR_LIMITS.beginningValue.min, max: CAGR_LIMITS.beginningValue.max, step: 0.01, required: true },
    { id: "ending-value", type: "number", label: "Ending value", prefix: "₹", min: CAGR_LIMITS.endingValue.min, max: CAGR_LIMITS.endingValue.max, step: 0.01, required: true },
    { id: "investment-period", type: "number", label: "Investment period", suffix: "years", description: "Fractional years are accepted to two decimal places.", min: CAGR_LIMITS.investmentPeriodYears.min, max: CAGR_LIMITS.investmentPeriodYears.max, step: 0.01, required: true },
  ],
  formula: {
    title: "Compound annual growth rate formula",
    expression: "CAGR = [(Ending value ÷ Beginning value)^(1 ÷ Years) − 1] × 100",
    description: "The formula converts the complete endpoint change into a smooth annual compound rate. It does not reconstruct the actual year-by-year path.",
    variables: [
      { symbol: "Ending value", meaning: "Value at the end of the selected period" },
      { symbol: "Beginning value", meaning: "Positive value at the start of the period" },
      { symbol: "Years", meaning: "Elapsed period in years, including supported fractions" },
    ],
  },
  workedExample: cagrWorkedExample,
  faqs: cagrFAQs,
  relatedCalculators: cagrRelatedCalculators,
  metadata: {
    title: "CAGR Calculator: Compound Annual Growth Rate",
    description: "Calculate CAGR, total return, growth multiple, and absolute gain or loss from beginning and ending values over a period.",
    keywords: ["CAGR calculator", "compound annual growth rate calculator", "annualised return calculator", "investment growth rate"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
