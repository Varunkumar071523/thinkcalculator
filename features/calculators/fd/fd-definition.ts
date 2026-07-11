import { fdFAQs, fdRelatedCalculators, fdWorkedExample } from "@/features/calculators/fd/fd-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const fdCalculatorDefinition = {
  id: "fd-calculator",
  slug: "fd-calculator",
  title: "FD Calculator",
  shortTitle: "FD Calculator",
  description: "Calculate fixed deposit maturity amount and interest earned based on deposit amount, interest rate, duration, and compounding frequency.",
  category: "Finance",
  canonicalPath: "/finance/fd-calculator",
  inputs: [
    { id: "deposit-amount", type: "number", label: "Deposit amount", description: "Enter the principal amount placed in the fixed deposit.", prefix: "₹", min: 1_000, max: 100_000_000, step: 1_000, required: true },
    { id: "annual-interest-rate", type: "number", label: "Annual interest rate", description: "Enter the annual rate offered for the deposit.", suffix: "%", min: 0, max: 20, step: 0.01, required: true },
    { id: "deposit-duration", type: "number", label: "Deposit duration", description: "Enter how long the deposit will remain invested.", min: 1, max: 50, step: 1, required: true },
    { id: "duration-unit", type: "select", label: "Duration unit", options: [{ label: "Years", value: "years" }, { label: "Months", value: "months" }], required: true },
    { id: "compounding-frequency", type: "select", label: "Compounding frequency", description: "Choose how often interest is added to the deposit.", options: [{ label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }, { label: "Half-yearly", value: "half-yearly" }, { label: "Yearly", value: "yearly" }], required: true },
  ],
  formula: {
    title: "Fixed deposit compound-interest formula",
    expression: "A = P × (1 + r ÷ m)^(m × t)",
    description: "More frequent compounding generally adds interest to the balance more often. When duration is entered in months, it is divided by 12 to obtain fractional years before the formula is applied.",
    variables: [
      { symbol: "A", meaning: "Estimated maturity amount" },
      { symbol: "P", meaning: "Principal deposit amount" },
      { symbol: "r", meaning: "Annual interest rate as a decimal" },
      { symbol: "m", meaning: "Compounding periods per year" },
      { symbol: "t", meaning: "Deposit duration in years" },
    ],
  },
  workedExample: fdWorkedExample,
  faqs: fdFAQs,
  relatedCalculators: fdRelatedCalculators,
  metadata: {
    title: "FD Calculator: Calculate Fixed Deposit Maturity & Interest",
    description: "Estimate fixed deposit maturity amount and interest earned in India using your deposit, annual rate, duration, and compounding frequency.",
    keywords: ["FD calculator", "fixed deposit calculator", "FD maturity calculator India"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
