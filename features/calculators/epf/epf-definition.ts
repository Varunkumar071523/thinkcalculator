import { epfFAQs, epfRelatedCalculators, epfWorkedExample } from "@/features/calculators/epf/epf-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const epfCalculatorDefinition = {
  id: "epf-calculator",
  slug: "epf-calculator",
  title: "EPF Calculator",
  shortTitle: "EPF Calculator",
  description: "Estimate your Employees' Provident Fund (EPF) corpus at retirement from monthly basic salary, employee and employer contribution rates, and an assumed annual interest rate.",
  category: "Finance",
  canonicalPath: "/finance/epf-calculator",
  inputs: [
    { id: "monthly-basic-salary", type: "number", label: "Monthly basic salary (+DA)", description: "Enter your monthly basic pay plus dearness allowance.", prefix: "₹", min: 0, max: 10_000_000, step: 1_000, required: true },
    { id: "employee-contribution-percent", type: "number", label: "Employee contribution rate", description: "Share of basic salary contributed by the employee.", suffix: "%", min: 0, max: 100, step: 0.5, required: true },
    { id: "employer-contribution-percent", type: "number", label: "Employer contribution rate", description: "Share of basic salary contributed by the employer.", suffix: "%", min: 0, max: 100, step: 0.5, required: true },
    { id: "current-age", type: "number", label: "Current age", min: 18, max: 59, step: 1, required: true },
    { id: "retirement-age", type: "number", label: "Retirement age", min: 19, max: 60, step: 1, required: true },
    { id: "expected-annual-interest-rate", type: "number", label: "Expected annual interest rate", suffix: "%", min: 0, max: 15, step: 0.05, required: true },
  ],
  formula: {
    title: "EPF accumulation formula",
    expression: "Balance(m) = (Balance(m−1) + Employee contribution + Employer contribution) × (1 + r)",
    description: "Each month, that month's employee and employer contributions are added to the running balance before that month's interest is applied, where r is the assumed annual interest rate divided by 12 and 100.",
    variables: [
      { symbol: "Balance(m)", meaning: "Closing balance after month m" },
      { symbol: "r", meaning: "Monthly interest rate as a decimal" },
    ],
  },
  workedExample: epfWorkedExample,
  faqs: epfFAQs,
  relatedCalculators: epfRelatedCalculators,
  metadata: {
    title: "EPF Calculator: Estimate Provident Fund Corpus at Retirement",
    description: "Estimate your Employees' Provident Fund (EPF) corpus at retirement from basic salary, contribution rates, age, and an assumed interest rate.",
    keywords: ["EPF calculator", "provident fund calculator", "EPFO interest calculator India"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
