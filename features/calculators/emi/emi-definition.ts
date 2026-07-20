import { emiFAQs, emiRelatedCalculators, emiWorkedExample } from "@/features/calculators/emi/emi-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const emiCalculatorDefinition = {
  id: "emi-calculator",
  slug: "emi-calculator",
  title: "EMI Calculator",
  shortTitle: "EMI Calculator",
  description: "Calculate monthly loan EMI, total interest payable, and total repayment amount for home, car, personal, or education loans.",
  category: "Finance",
  canonicalPath: "/finance/emi-calculator",
  inputs: [
    { id: "loan-amount", type: "number", label: "Loan amount", description: "Enter the principal amount you plan to borrow.", prefix: "₹", min: 10_000, max: 100_000_000, step: 10_000, required: true },
    { id: "annual-interest-rate", type: "number", label: "Annual interest rate", description: "Enter the lender's annual interest rate.", suffix: "%", min: 0.1, max: 30, step: 0.1, required: true },
    { id: "loan-tenure", type: "number", label: "Loan tenure", description: "Enter the repayment period.", min: 1, max: 40, step: 1, required: true },
    { id: "tenure-unit", type: "select", label: "Tenure unit", options: [{ label: "Years", value: "years" }, { label: "Months", value: "months" }], required: true },
  ],
  formula: {
    title: "EMI formula",
    expression: "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)",
    description: "The annual percentage rate is divided by 12 and 100 to obtain the monthly decimal rate. A tenure entered in years is multiplied by 12 to obtain the number of monthly instalments.",
    variables: [
      { symbol: "P", meaning: "Principal loan amount" },
      { symbol: "r", meaning: "Monthly interest rate as a decimal" },
      { symbol: "n", meaning: "Total number of monthly instalments" },
    ],
  },
  workedExample: emiWorkedExample,
  faqs: emiFAQs,
  relatedCalculators: emiRelatedCalculators,
  metadata: {
    title: "EMI Calculator: Calculate Loan EMI, Interest & Repayment",
    description: "Calculate your monthly loan EMI, total interest, and total repayment for home, car, personal, or education loans in India.",
    keywords: ["EMI calculator", "loan EMI calculator", "loan interest calculator India"],
  },
  status: "published",
  badge: "popular",
} as const satisfies CalculatorDefinition
