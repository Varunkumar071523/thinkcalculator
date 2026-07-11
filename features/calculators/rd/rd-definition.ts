import { rdFAQs, rdRelatedCalculators, rdWorkedExample } from "@/features/calculators/rd/rd-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const rdCalculatorDefinition = {
  id: "rd-calculator", slug: "rd-calculator", title: "RD Calculator", shortTitle: "RD Calculator",
  description: "Calculate recurring deposit maturity amount and interest earned based on monthly deposit, interest rate, duration, and compounding frequency.",
  category: "Finance", canonicalPath: "/finance/rd-calculator",
  inputs: [
    { id: "monthly-deposit", type: "number", label: "Monthly deposit", description: "Enter the amount deposited at the beginning of each month.", prefix: "₹", min: 100, max: 1_000_000, step: 100, required: true },
    { id: "annual-interest-rate", type: "number", label: "Annual interest rate", suffix: "%", min: 0, max: 20, step: 0.01, required: true },
    { id: "deposit-duration", type: "number", label: "Deposit duration", min: 1, max: 20, step: 1, required: true },
    { id: "duration-unit", type: "select", label: "Duration unit", options: [{ label: "Years", value: "years" }, { label: "Months", value: "months" }], required: true },
    { id: "compounding-frequency", type: "select", label: "Compounding frequency", options: [{ label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }, { label: "Half-yearly", value: "half-yearly" }, { label: "Yearly", value: "yearly" }], required: true },
  ],
  formula: {
    title: "Recurring deposit future-value formula", expression: "FV = Σ [P × (1 + r ÷ m)^(m × remainingYears)]",
    description: "The calculator treats every monthly deposit as a separate contribution made at the beginning of the month. The first deposit compounds for the full term, while each later deposit has one month less to earn interest.",
    variables: [
      { symbol: "FV", meaning: "Estimated maturity amount" }, { symbol: "P", meaning: "Monthly deposit" },
      { symbol: "r", meaning: "Annual interest rate as a decimal" }, { symbol: "m", meaning: "Compounding periods per year" },
      { symbol: "remainingYears", meaning: "Time from each contribution date until maturity" },
    ],
  },
  workedExample: rdWorkedExample, faqs: rdFAQs, relatedCalculators: rdRelatedCalculators,
  metadata: { title: "RD Calculator: Calculate Recurring Deposit Maturity & Interest", description: "Estimate recurring deposit maturity amount and interest earned in India using your monthly deposit, annual rate, duration, and compounding frequency.", keywords: ["RD calculator", "recurring deposit calculator", "RD maturity calculator India"] },
  status: "published",
} as const satisfies CalculatorDefinition
