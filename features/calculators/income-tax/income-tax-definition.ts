import { incomeTaxFAQs, incomeTaxRelatedCalculators, incomeTaxWorkedExample } from "./income-tax-content"
import { INCOME_TAX_FINANCIAL_YEAR, INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"
import type { CalculatorDefinition } from "@/types/calculator"

export const incomeTaxCalculatorDefinition = {
  id: "income-tax-calculator",
  slug: "income-tax-calculator",
  title: "Income Tax Calculator",
  shortTitle: "Income Tax Calculator",
  description: `Calculate your income tax liability under the old and new regimes for FY ${INCOME_TAX_FINANCIAL_YEAR} (AY ${INCOME_TAX_RULE_SET.assessmentYear}), with a full slab, rebate, surcharge, and cess breakdown.`,
  category: "Finance",
  canonicalPath: "/finance/income-tax-calculator",
  inputs: [
    { id: "tax-regime", type: "select", label: "Tax regime", description: "Choose the old or new tax regime.", options: [{ label: "New Regime", value: "new" }, { label: "Old Regime", value: "old" }], required: true },
    { id: "gross-income", type: "number", label: "Gross income", description: "Enter your total gross income for the year.", prefix: "₹", min: 0, step: 10_000, required: true },
    { id: "age-band", type: "select", label: "Age band", description: "Select your age band.", options: [{ label: "Below 60", value: "below60" }, { label: "60 to 80", value: "60to80" }, { label: "80 and above", value: "80plus" }], required: true },
    { id: "section-80c", type: "number", label: "Section 80C", description: "Old regime only: PF, ELSS, life insurance, and similar investments.", prefix: "₹", min: 0, step: 1_000 },
    { id: "section-80d", type: "number", label: "Section 80D", description: "Old regime only: health insurance premium.", prefix: "₹", min: 0, step: 1_000 },
    { id: "hra-exemption", type: "number", label: "HRA exemption", description: "Old regime only: your already-calculated HRA exemption amount.", prefix: "₹", min: 0, step: 1_000 },
    { id: "home-loan-interest-24b", type: "number", label: "Home loan interest (24b)", description: "Old regime only: self-occupied property home loan interest.", prefix: "₹", min: 0, step: 1_000 },
    { id: "other-80-deductions", type: "number", label: "Other Section 80 deductions", description: "Old regime only: 80E, 80G, 80TTA, and similar.", prefix: "₹", min: 0, step: 1_000 },
    { id: "employer-nps-80ccd2", type: "number", label: "Employer NPS (80CCD(2))", description: "New regime only: employer NPS contribution, already capped at 14% of basic + DA.", prefix: "₹", min: 0, step: 1_000 },
  ],
  formula: {
    title: "Calculation methodology",
    expression: "Tax = Slab tax on (Gross income − Deductions) − Section 87A rebate + Surcharge + 4% Cess",
    description:
      "Deductions include the regime's standard deduction plus any regime-specific deductions entered. Slab tax is computed progressively across each rate band. Section 87A gives a full rebate below the regime's threshold, with marginal relief immediately above it. Surcharge applies above ₹50 lakh taxable income, tiered by threshold, with its own marginal relief at each tier and a 25% cap under the new regime. Health & Education Cess of 4% applies to tax plus surcharge.",
    variables: [
      { symbol: "Gross income", meaning: "Total income before deductions" },
      { symbol: "Deductions", meaning: "Standard deduction plus regime-specific deductions" },
      { symbol: "Section 87A rebate", meaning: "Full or marginal-relief rebate below the regime's threshold" },
      { symbol: "Surcharge", meaning: "Tiered surcharge above ₹50 lakh taxable income, with marginal relief" },
    ],
  },
  workedExample: incomeTaxWorkedExample,
  faqs: incomeTaxFAQs,
  relatedCalculators: incomeTaxRelatedCalculators,
  metadata: {
    title: `Income Tax Calculator India (FY ${INCOME_TAX_FINANCIAL_YEAR}, AY ${INCOME_TAX_RULE_SET.assessmentYear}) — Old vs New Regime`,
    description: `Calculate income tax for FY ${INCOME_TAX_FINANCIAL_YEAR} under the old and new regimes. Full slab, Section 87A rebate, surcharge, and cess breakdown, with a live old-vs-new comparison.`,
    keywords: [
      "income tax calculator",
      "income tax calculator India",
      `income tax calculator FY ${INCOME_TAX_FINANCIAL_YEAR}`,
      "old vs new tax regime calculator",
      "income tax slab calculator India",
    ],
  },
  status: "published",
} as const satisfies CalculatorDefinition
