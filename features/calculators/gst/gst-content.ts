import { calculateGST } from "./calculate-gst"
import type { GSTInput, GSTResult } from "./gst-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const gstFAQs: readonly CalculatorFAQ[] = [
  { question: "How do I add GST to an amount?", answer: "Choose Add GST, enter the GST-exclusive taxable value and the rate, then calculate. The calculator multiplies the taxable value by the rate and adds that GST amount to produce the inclusive value." },
  { question: "How do I remove GST from an inclusive amount?", answer: "Choose Remove GST and enter the inclusive amount. The calculator divides it by 1 plus the rate as a decimal to recover the exclusive value, then subtracts that value from the inclusive amount to find GST." },
  { question: "Why can’t I subtract 18% from an 18%-inclusive price?", answer: "The 18% was applied to the smaller exclusive value, not to the larger inclusive value. Dividing by 1.18 reverses an 18% addition; subtracting 18% of the inclusive amount does not." },
  { question: "What is the difference between CGST/SGST and IGST?", answer: "For this arithmetic, an intra-State selection divides total GST equally into CGST and SGST/UTGST, while an inter-State selection shows the total as IGST. The calculator does not determine place of supply or which selection legally applies." },
  { question: "How do I know which GST rate applies?", answer: "Do not use the presets as a classification decision. Applicability depends on current classification, notifications, place-of-supply rules, and transaction facts. Check official sources or ask a qualified professional." },
  { question: "Does the calculator include cess?", answer: "No. It calculates only the entered GST percentage and the selected CGST/SGST/UTGST or IGST arithmetic. Compensation cess and every other cess are excluded." },
  { question: "Does it calculate input tax credit?", answer: "No. Input tax credit, reverse charge, composition levy, TDS/TCS, return liability, filing, penalties, and other compliance matters are outside this calculator." },
  { question: "Can actual invoice totals differ because of rounding?", answer: "Yes. This calculator retains full precision internally and rounds only displayed currency. Invoice-line rounding, multiple items, discounts, valuation adjustments, and accounting-system rules can produce different totals." },
]

export const gstRelatedCalculators: readonly RelatedCalculator[] = []

const exampleInput: GSTInput = { amount: 1_000, gstRate: 18, calculationMode: "add", supplyType: "intra-state" }
const exampleResult = calculateGST(exampleInput)
export const gstWorkedExample: CalculatorWorkedExample = {
  title: "Add GST example",
  description: "For an exclusive amount of ₹1,000 at an entered 18% rate, the calculator adds ₹180 GST. With intra-State arithmetic selected, it divides that GST equally between the two displayed tax heads.",
  inputs: [
    { label: "Exclusive taxable value", value: formatIndianCurrency(exampleInput.amount) },
    { label: "Entered GST rate", value: formatPercentage(exampleInput.gstRate) },
    { label: "Mode", value: "Add GST" },
    { label: "Supply type", value: "Intra-State" },
  ],
  results: [
    { label: "Taxable value", value: formatIndianCurrency(exampleResult.taxableValue) },
    { label: "Total GST", value: formatIndianCurrency(exampleResult.totalGSTAmount) },
    { label: "Invoice value", value: formatIndianCurrency(exampleResult.invoiceValue) },
    { label: "CGST / SGST or UTGST", value: `${formatIndianCurrency(exampleResult.cgstAmount)} each` },
  ],
}

export function normaliseGSTDisplayZero(value: number): number { return Object.is(value, -0) ? 0 : value }
export function formatGSTCurrency(value: number): string { return formatIndianCurrency(normaliseGSTDisplayZero(value)) }
export function createGSTResultText(input: GSTInput, result: GSTResult): string {
  return [
    "ThinkCalculator GST Calculation", "",
    `Entered amount (${input.calculationMode === "add" ? "GST-exclusive taxable value" : "GST-inclusive value"}): ${formatIndianCurrency(input.amount)}`,
    `GST rate entered: ${formatPercentage(input.gstRate)}`,
    `Mode: ${input.calculationMode === "add" ? "Add GST" : "Remove GST"}`,
    `Supply arithmetic: ${input.supplyType === "intra-state" ? "Intra-State — CGST plus SGST/UTGST" : "Inter-State — IGST"}`,
    `Taxable / exclusive value: ${formatGSTCurrency(result.taxableValue)}`,
    `Total GST: ${formatGSTCurrency(result.totalGSTAmount)}`,
    `Invoice / inclusive value: ${formatGSTCurrency(result.invoiceValue)}`,
    `CGST: ${formatGSTCurrency(result.cgstAmount)}`,
    `SGST/UTGST: ${formatGSTCurrency(result.sgstUtgstAmount)}`,
    `IGST: ${formatGSTCurrency(result.igstAmount)}`, "",
    "The supply type and rate were selected by the user for arithmetic only. This is not an invoice-ready tax computation or tax/legal advice.", "", "Calculator:",
    "https://thinkcalculator.in/business/gst-calculator",
  ].join("\n")
}

export function createGSTPrintDisclaimer(): string {
  return "The entered rate and user-selected supply type are used for arithmetic only. This educational estimate is not an invoice-ready tax computation, does not determine classification or place of supply, and excludes cess, applicable statutory or accounting rounding rules, discounts, valuation adjustments, reverse charge, input tax credit, composition levy, TDS/TCS, filing, penalties, and compliance. Verify current applicability from official sources or a qualified professional."
}
