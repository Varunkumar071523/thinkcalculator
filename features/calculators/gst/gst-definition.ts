import type { CalculatorDefinition } from "@/types/calculator"
import { gstFAQs, gstRelatedCalculators, gstWorkedExample } from "./gst-content"
import { GST_LIMITS } from "./gst-schema"

export const gstCalculatorDefinition = {
  id: "gst-calculator", slug: "gst-calculator", title: "GST Calculator", shortTitle: "GST Calculator",
  description: "Add GST to an exclusive amount or remove embedded GST from an inclusive amount, with user-selected intra-State or inter-State tax-head arithmetic.",
  category: "Business", canonicalPath: "/business/gst-calculator",
  inputs: [
    { id: "gst-amount", type: "number", label: "Amount", description: "Meaning changes with the selected mode.", prefix: "₹", min: GST_LIMITS.amount.min, max: GST_LIMITS.amount.max, step: 0.01, required: true },
    { id: "gst-rate", type: "number", label: "GST rate", description: "Use a preset or enter a custom arithmetic rate; this does not determine legal applicability.", suffix: "%", min: GST_LIMITS.gstRate.min, max: GST_LIMITS.gstRate.max, step: 0.01, required: true },
    { id: "gst-mode", type: "select", label: "Calculation mode", options: [{ label: "Add GST to exclusive amount", value: "add" }, { label: "Remove GST from inclusive amount", value: "remove" }], required: true },
    { id: "gst-supply", type: "select", label: "Supply type for arithmetic", options: [{ label: "Intra-State — split CGST + SGST/UTGST", value: "intra-state" }, { label: "Inter-State — show IGST", value: "inter-state" }], required: true },
  ],
  formula: {
    title: "GST addition and removal formulas",
    expression: "Add: GST = E × r ÷ 100; I = E + GST. Remove: E = I ÷ (1 + r ÷ 100); GST = I − E.",
    description: "E is the exclusive taxable value, I is the inclusive value, and r is the entered percentage. Removing GST divides by the gross-up factor rather than subtracting the percentage from the inclusive amount.",
    variables: [{ symbol: "E", meaning: "GST-exclusive taxable value" }, { symbol: "I", meaning: "GST-inclusive value" }, { symbol: "r", meaning: "User-entered GST percentage" }],
  },
  workedExample: gstWorkedExample, faqs: gstFAQs, relatedCalculators: gstRelatedCalculators,
  metadata: {
    title: "GST Calculator: Add or Remove GST in India",
    description: "Add GST to an exclusive amount or remove GST from an inclusive amount, with CGST/SGST or IGST arithmetic and custom rates.",
    keywords: ["GST calculator", "add GST calculator", "remove GST calculator", "GST inclusive calculator", "CGST SGST IGST calculator"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
