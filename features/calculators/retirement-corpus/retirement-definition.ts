import type { CalculatorDefinition } from "@/types/calculator"
import { retirementFAQs, retirementRelatedCalculators, retirementWorkedExample } from "./retirement-content"

export const retirementCalculatorDefinition = {
  id: "retirement-corpus-calculator",
  slug: "retirement-corpus-calculator",
  title: "Retirement Corpus Calculator",
  shortTitle: "Retirement Corpus",
  description: "Project the corpus your savings and contributions could reach by retirement, then see how long an inflation-adjusted monthly withdrawal could sustain it through retirement.",
  category: "Finance",
  canonicalPath: "/finance/retirement-corpus-calculator",
  inputs: [
    { id: "current-age", type: "number", label: "Current age", suffix: "years", min: 18, max: 75, required: true },
    { id: "retirement-age", type: "number", label: "Retirement age", suffix: "years", min: 19, max: 80, required: true },
    { id: "life-expectancy", type: "number", label: "Life expectancy", suffix: "years", min: 20, max: 110, required: true },
    { id: "current-savings", type: "number", label: "Current savings", prefix: "₹", min: 0, max: 1_000_000_000, required: true },
    { id: "monthly-contribution", type: "number", label: "Monthly contribution", prefix: "₹", min: 0, max: 10_000_000, required: true },
    { id: "pre-retirement-return", type: "number", label: "Expected annual return before retirement", suffix: "%", min: 0, max: 50, required: true },
    { id: "post-retirement-return", type: "number", label: "Expected annual return during retirement", suffix: "%", min: 0, max: 50, required: true },
    { id: "desired-withdrawal", type: "number", label: "Desired monthly withdrawal (today's money)", prefix: "₹", min: 100, max: 10_000_000, required: true },
    { id: "inflation-rate", type: "number", label: "Assumed annual inflation rate", suffix: "%", min: -10, max: 50, required: true },
  ],
  formula: {
    title: "Two-phase accumulation and decumulation method",
    expression: "Accumulation: Bₘ = (Bₘ₋₁ + C) × (1 + r). Retirement: Wᵧ = W₁ × (1 + i)^(y−1); Bₘ = max(0, (Bₘ₋₁ − Wᵧ) × (1 + rₚ))",
    description: "The accumulation phase compounds a beginning-of-month contribution together with any existing savings at the pre-retirement rate. The exact closing balance becomes the retirement phase's opening balance. Each retirement year's nominal monthly withdrawal grows from the desired today's-money amount by the inflation rate; each month, the withdrawal is taken from the opening balance first, and only the remainder earns that month's post-retirement return.",
    variables: [
      { symbol: "C", meaning: "Monthly contribution" },
      { symbol: "r", meaning: "Pre-retirement monthly return" },
      { symbol: "rₚ", meaning: "Post-retirement monthly return" },
      { symbol: "W₁", meaning: "Desired monthly withdrawal in today's (year-1-of-retirement) money" },
      { symbol: "Wᵧ", meaning: "Nominal monthly withdrawal in retirement year y" },
      { symbol: "i", meaning: "Assumed annual inflation rate" },
      { symbol: "Bₘ", meaning: "Balance after month m" },
    ],
  },
  workedExample: retirementWorkedExample,
  faqs: retirementFAQs,
  relatedCalculators: retirementRelatedCalculators,
  metadata: {
    title: "Retirement Corpus Calculator: Accumulation and Withdrawal Projection",
    description: "Project a retirement corpus from savings and monthly contributions, then estimate how an inflation-adjusted monthly withdrawal could sustain it through retirement.",
    keywords: ["retirement corpus calculator", "retirement planning calculator", "retirement withdrawal calculator"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
