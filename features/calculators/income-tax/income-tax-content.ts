import { calculateIncomeTax } from "@/lib/tax/engine"
import { formatIndianCurrency } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { INCOME_TAX_FINANCIAL_YEAR } from "./income-tax-regulatory-config"

export const incomeTaxFAQs: readonly CalculatorFAQ[] = [
  {
    question: "Which regime should I choose — old or new?",
    answer:
      "It depends on how many deductions and exemptions you claim. The new regime has lower slab rates and a full rebate up to ₹12,00,000 taxable income, but allows far fewer deductions. The old regime has higher rates but lets you claim 80C, 80D, HRA, home loan interest, and other deductions. Fill in both sets of figures and use the comparison next to the regime toggle to see which is cheaper for your numbers.",
  },
  {
    question: "Why is my new-regime tax zero even though I have taxable income?",
    answer:
      "Under the new regime for FY 2025-26, Section 87A gives a full rebate (up to ₹60,000) when taxable income is up to ₹12,00,000. With the ₹75,000 standard deduction, a salaried person with gross income up to ₹12,75,000 pays no tax. Above that, marginal relief avoids a sudden jump: extra tax is capped at the extra income above ₹12,00,000.",
  },
  {
    question: "What counts as HRA exemption here?",
    answer:
      "This calculator accepts an already-calculated HRA exemption amount, not a salary breakdown. HRA exemption itself is the least of three separate statutory rules and needs basic salary, actual HRA received, rent paid, and city of residence. If you don't know your exact HRA exemption, use the HRA Exemption Calculator first — it computes the amount and can hand it straight to this field.",
  },
  {
    question: "Is the Section 80CCD(2) employer NPS contribution capped automatically?",
    answer:
      "No. The statutory cap is 14% of basic salary plus dearness allowance, which needs a salary breakdown this calculator does not collect. Enter the amount already capped at that limit — entering an uncapped, larger figure will overstate your deduction.",
  },
  {
    question: "Does this calculator account for capital gains, business income, or other special tax rates?",
    answer:
      "No. This calculator applies regular slab rates to gross income only. Capital gains taxed under Sections 111A/112/112A and other special-rate income are not modelled, and the surcharge calculation does not include their separate surcharge cap.",
  },
  {
    question: "What financial year do these figures apply to?",
    answer: `This calculator uses Financial Year ${INCOME_TAX_FINANCIAL_YEAR} (Assessment Year 2026-27) rates, as per the Finance Act 2025. See the calculation methodology below for the full source list.`,
  },
]

export const incomeTaxRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "hra-calculator", title: "HRA Calculator", description: "Calculate your Section 10(13A) HRA exemption to use in the old-regime HRA exemption field above.", href: "/finance/hra-calculator", category: "Finance" },
  { slug: "emi-calculator", title: "EMI Calculator", description: "Estimate monthly loan payments that may qualify for Section 24(b) or 80C treatment.", href: "/finance/emi-calculator", category: "Finance" },
  { slug: "ppf-calculator", title: "PPF Calculator", description: "Estimate PPF maturity value for a common Section 80C investment.", href: "/finance/ppf-calculator", category: "Finance" },
  { slug: "gratuity-calculator", title: "Gratuity Calculator", description: "Estimate statutory gratuity, generally exempt income under Section 10(10).", href: "/finance/gratuity-calculator", category: "Finance" },
  { slug: "gst-calculator", title: "GST Calculator", description: "Add or remove GST for everyday business calculations.", href: "/business/gst-calculator", category: "Business" },
]

const exampleResult = calculateIncomeTax(
  { regime: "new", grossIncome: 1_500_000, ageBand: "below60", deductions: { employerNpsSection80CCD2: 0 } },
  INCOME_TAX_FINANCIAL_YEAR,
)

export const incomeTaxWorkedExample: CalculatorWorkedExample = {
  title: "Income tax calculation example",
  description:
    "For a ₹15,00,000 gross salary under the new regime, the calculator applies the ₹75,000 standard deduction, computes slab-by-slab tax, and adds 4% cess. Taxable income is above the ₹12,00,000 rebate threshold, so no Section 87A rebate applies.",
  inputs: [
    { label: "Regime", value: "New Regime" },
    { label: "Gross income", value: "₹15,00,000" },
    { label: "Age band", value: "Below 60" },
  ],
  results: [
    { label: "Taxable income", value: formatIndianCurrency(exampleResult.taxableIncome) },
    { label: "Tax before rebate", value: formatIndianCurrency(exampleResult.taxBeforeRebate) },
    { label: "Cess (4%)", value: formatIndianCurrency(exampleResult.cess) },
    { label: "Total tax liability", value: formatIndianCurrency(exampleResult.totalTaxLiability) },
  ],
}
