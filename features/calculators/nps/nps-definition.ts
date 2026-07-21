import { npsFAQs, npsRelatedCalculators, npsWorkedExample } from "@/features/calculators/nps/nps-content"
import type { CalculatorDefinition } from "@/types/calculator"

export const npsCalculatorDefinition = {
  id: "nps-calculator",
  slug: "nps-calculator",
  title: "NPS Calculator",
  shortTitle: "NPS Calculator",
  description: "Project your National Pension System (NPS) corpus at retirement from a monthly contribution and an equity / corporate debt / government securities asset allocation.",
  category: "Finance",
  canonicalPath: "/finance/nps-calculator",
  inputs: [
    { id: "monthly-contribution", type: "number", label: "Monthly contribution", prefix: "₹", min: 0, max: 1_000_000, step: 500, required: true },
    { id: "current-age", type: "number", label: "Current age", min: 18, max: 65, step: 1, required: true },
    { id: "retirement-age", type: "number", label: "Retirement age", min: 19, max: 75, step: 1, required: true },
    { id: "equity-allocation-percent", type: "number", label: "Equity allocation", suffix: "%", min: 0, max: 100, step: 1, required: true },
    { id: "corporate-debt-allocation-percent", type: "number", label: "Corporate debt allocation", suffix: "%", min: 0, max: 100, step: 1, required: true },
    { id: "equity-expected-return", type: "number", label: "Expected equity return", suffix: "%", min: 0, max: 20, step: 0.1, required: true },
    { id: "corporate-debt-expected-return", type: "number", label: "Expected corporate debt return", suffix: "%", min: 0, max: 12, step: 0.1, required: true },
    { id: "govt-securities-expected-return", type: "number", label: "Expected govt securities return", suffix: "%", min: 0, max: 10, step: 0.1, required: true },
  ],
  formula: {
    title: "NPS blended-return accumulation formula",
    expression: "r = (E% × rE + D% × rD + G% × rG) ÷ 100; Balance(m) = (Balance(m−1) + Contribution) × (1 + r/12/100)",
    description: "Government securities allocation (G%) is always 100 − E% − D%. The three expected returns are weighted by their allocation share into one blended annual rate r, and the monthly contribution compounds at r/12 each month.",
    variables: [
      { symbol: "E%, D%, G%", meaning: "Equity, corporate debt, and government securities allocation share" },
      { symbol: "rE, rD, rG", meaning: "Expected annual return for each asset class" },
      { symbol: "r", meaning: "Blended assumed annual return" },
    ],
  },
  workedExample: npsWorkedExample,
  faqs: npsFAQs,
  relatedCalculators: npsRelatedCalculators,
  metadata: {
    title: "NPS Calculator: Project National Pension System Corpus",
    description: "Project your NPS corpus at retirement from a monthly contribution and an equity / corporate debt / government securities asset allocation.",
    keywords: ["NPS calculator", "National Pension System calculator", "NPS corpus calculator India"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
