import type { CalculatorDefinition } from "@/types/calculator"
import { ppfFAQs, ppfRelatedCalculators, ppfWorkedExample } from "./ppf-content"
import { PPF_RATE_CONFIG } from "./ppf-rate-config"

export const ppfCalculatorDefinition = {
  id: "ppf-calculator", slug: "ppf-calculator", title: "PPF Calculator", shortTitle: "PPF Calculator",
  description: "Estimate PPF maturity value, contributions, and interest using an editable constant rate and a transparent annual contribution-timing assumption.",
  category: "Finance", canonicalPath: "/finance/ppf-calculator",
  inputs: [
    { id: "annual-contribution", type: "number", label: "Annual contribution", description: "A whole-rupee amount from ₹500 to ₹1,50,000 in multiples of ₹50.", prefix: "₹", min: 500, max: 150_000, step: 50, required: true },
    { id: "assumed-annual-rate", type: "number", label: "Assumed annual interest rate", description: `${PPF_RATE_CONFIG.defaultRate}% is an editable reference default, not a current-rate claim.`, suffix: "%", min: 0.1, max: 15, step: 0.01, required: true },
    { id: "duration", type: "select", label: "Projection duration", description: "Choose 15 projection years or an illustrative five-year step; this is not an account-maturity or extension-eligibility decision.", options: [15, 20, 25, 30, 35, 40].map((years) => ({ label: `${years} years`, value: String(years) })), required: true },
  ],
  formula: { title: "Annual PPF projection recurrence", expression: "Closing balance = (Opening balance + annual contribution) × (1 + assumed rate ÷ 100)", description: "Each contribution is modeled at the beginning of its projection year and receives a full year's interest at one constant assumed rate. Actual PPF interest is determined monthly using the official lowest-balance rule.", variables: [{ symbol: "Opening balance", meaning: "Previous projection year's closing balance" }, { symbol: "Annual contribution", meaning: "Modeled beginning-of-year deposit" }, { symbol: "Assumed rate", meaning: "Editable constant annual projection rate" }] },
  workedExample: ppfWorkedExample, faqs: ppfFAQs, relatedCalculators: ppfRelatedCalculators,
  metadata: { title: "PPF Calculator: Estimate Maturity Value & Interest", description: "Estimate PPF maturity value, total contributions, and interest with an editable rate, 15–40 year durations, annual schedule, and clear assumptions.", keywords: ["PPF calculator", "public provident fund calculator", "PPF maturity calculator", "PPF interest calculator India"] },
  status: "published",
} as const satisfies CalculatorDefinition
