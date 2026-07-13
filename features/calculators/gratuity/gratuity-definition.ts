import type { CalculatorDefinition } from "@/types/calculator"
import {
  gratuityFAQs,
  gratuityRelatedCalculators,
  gratuityWorkedExample,
} from "./gratuity-content"
import { GRATUITY_LIMITS } from "./gratuity-schema"

export const gratuityCalculatorDefinition = {
  id: "gratuity-calculator",
  slug: "gratuity-calculator",
  title: "Gratuity Calculator",
  shortTitle: "Gratuity Calculator",
  description: "Estimate statutory gratuity for a regular monthly rated employee in India using eligible last-drawn wages, completed service, the current standard formula, and the statutory ceiling.",
  category: "Finance",
  canonicalPath: "/finance/gratuity-calculator",
  inputs: [
    {
      id: "eligible-monthly-wages",
      type: "number",
      label: "Eligible monthly wages",
      description: "Enter last-drawn wages under the Code definition, not gross salary automatically.",
      prefix: "₹",
      min: GRATUITY_LIMITS.eligibleMonthlyWages.min,
      max: GRATUITY_LIMITS.eligibleMonthlyWages.max,
      step: 0.01,
      required: true,
    },
    {
      id: "completed-years",
      type: "number",
      label: "Completed years of service",
      min: GRATUITY_LIMITS.completedYears.min,
      max: GRATUITY_LIMITS.completedYears.max,
      step: 1,
      required: true,
    },
    {
      id: "additional-months",
      type: "number",
      label: "Additional completed months",
      description: "Use 0 to 11. Exactly six months does not add a year; seven to eleven months does.",
      min: GRATUITY_LIMITS.additionalMonths.min,
      max: GRATUITY_LIMITS.additionalMonths.max,
      step: 1,
      required: true,
    },
  ],
  formula: {
    title: "Standard monthly rated employee formula",
    expression: "Gratuity before ceiling = eligible monthly wages × 15 ÷ 26 × counted service years",
    description: "Counted service equals completed years plus one only when the additional completed months are in excess of six. The statutory ceiling is then applied to the formula amount.",
    variables: [
      { symbol: "Eligible monthly wages", meaning: "Last-drawn wages determined under the current statutory wage definition" },
      { symbol: "15/26", meaning: "Fifteen days' wages for a monthly rated employee" },
      { symbol: "Counted service years", meaning: "Completed years, with a part-year added only when additional months exceed six" },
    ],
  },
  workedExample: gratuityWorkedExample,
  faqs: gratuityFAQs,
  relatedCalculators: gratuityRelatedCalculators,
  metadata: {
    title: "Gratuity Calculator India: Estimate Statutory Gratuity",
    description: "Estimate gratuity from eligible monthly wages and completed service using the 15/26 formula, six-month boundary, and current ₹20 lakh ceiling.",
    keywords: ["gratuity calculator", "gratuity calculator India", "gratuity formula", "15 26 gratuity", "gratuity service years"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
