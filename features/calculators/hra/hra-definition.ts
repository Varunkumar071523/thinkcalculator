import type { CalculatorDefinition } from "@/types/calculator"
import { hraFAQs, hraRelatedCalculators, hraWorkedExample } from "./hra-content"
import { HRA_FINANCIAL_YEAR, HRA_RULE_SET } from "./hra-regulatory-config"
import { HRA_LIMITS } from "./hra-schema"

export const hraCalculatorDefinition = {
  id: "hra-calculator",
  slug: "hra-calculator",
  title: "HRA Exemption Calculator",
  shortTitle: "HRA Calculator",
  description: `Calculate your House Rent Allowance (HRA) exemption under Section 10(13A) for FY ${HRA_FINANCIAL_YEAR} (AY ${HRA_RULE_SET.assessmentYear}), old regime only, with all three limits shown and the binding one explained.`,
  category: "Finance",
  canonicalPath: "/finance/hra-calculator",
  inputs: [
    { id: "basic-salary", type: "number", label: "Basic salary (annual)", description: "Enter your annual basic salary.", prefix: "₹", min: HRA_LIMITS.amount.min, max: HRA_LIMITS.amount.max, step: 1_000, required: true },
    { id: "da", type: "number", label: "DA (annual)", description: "Dearness allowance that forms part of retirement benefits. Leave at 0 if not applicable.", prefix: "₹", min: HRA_LIMITS.amount.min, max: HRA_LIMITS.amount.max, step: 1_000 },
    { id: "hra-received", type: "number", label: "HRA received (annual)", description: "Enter the total HRA you received from your employer for the year.", prefix: "₹", min: HRA_LIMITS.amount.min, max: HRA_LIMITS.amount.max, step: 1_000, required: true },
    { id: "rent-paid", type: "number", label: "Rent paid (annual)", description: "Enter the total rent you paid for the year.", prefix: "₹", min: HRA_LIMITS.amount.min, max: HRA_LIMITS.amount.max, step: 1_000, required: true },
    { id: "city", type: "select", label: "City", description: `Metro: ${HRA_RULE_SET.metroCities.join(", ")}. All other cities are non-metro.`, options: [{ label: "Metro", value: "metro" }, { label: "Non-metro", value: "non-metro" }], required: true },
  ],
  formula: {
    title: "Least-of-three calculation methodology",
    expression: "Exempt HRA = least of (Actual HRA received, Rent paid − 10% of salary, 50%/40% of salary)",
    description:
      "Salary means basic salary plus DA where DA forms part of retirement benefits. The percentage-of-salary limit is 50% for a metro city (a fixed statutory list) and 40% for any other city. The rent-based limit is floored at zero — it cannot make the exemption negative. Taxable HRA is HRA received minus the exempt amount. This exemption applies only under the old tax regime.",
    variables: [
      { symbol: "Actual HRA received", meaning: "Total HRA paid by the employer for the year" },
      { symbol: "Rent paid − 10% of salary", meaning: "Annual rent paid, minus one-tenth of salary, floored at zero" },
      { symbol: "50%/40% of salary", meaning: "50% of salary in a metro city, 40% of salary elsewhere" },
    ],
  },
  workedExample: hraWorkedExample,
  faqs: hraFAQs,
  relatedCalculators: hraRelatedCalculators,
  metadata: {
    title: `HRA Exemption Calculator (FY ${HRA_FINANCIAL_YEAR}, AY ${HRA_RULE_SET.assessmentYear}) — Section 10(13A)`,
    description: `Calculate your House Rent Allowance exemption under Section 10(13A) / Rule 2A for FY ${HRA_FINANCIAL_YEAR}. See all three limits and which one binds, then use the result directly in the income tax calculator.`,
    keywords: [
      "hra calculator",
      "hra exemption calculator",
      "house rent allowance calculator India",
      `hra exemption fy ${HRA_FINANCIAL_YEAR}`,
      "section 10 13a calculator",
    ],
  },
  status: "published",
} as const satisfies CalculatorDefinition
