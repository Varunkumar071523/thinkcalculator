import type {
  CalculatorCategory,
  CalculatorDefinition,
  RelatedCalculator,
} from "@/types/calculator"
import { emiCalculatorDefinition } from "@/features/calculators/emi/emi-definition"
import { sipCalculatorDefinition } from "@/features/calculators/sip/sip-definition"
import { lumpsumCalculatorDefinition } from "@/features/calculators/lumpsum/lumpsum-definition"
import { fdCalculatorDefinition } from "@/features/calculators/fd/fd-definition"
import { rdCalculatorDefinition } from "@/features/calculators/rd/rd-definition"
import { cagrCalculatorDefinition } from "@/features/calculators/cagr/cagr-definition"

export const demoCalculatorDefinition = {
  id: "framework-demo",
  slug: "demo",
  title: "Calculator Framework Demo",
  shortTitle: "Framework Demo",
  description:
    "A static demonstration of the reusable ThinkCalculator input, result, formula, example, FAQ, and related-tool components.",
  category: "Utility",
  canonicalPath: "/calculators/demo",
  inputs: [
    {
      id: "sample-amount",
      type: "number",
      label: "Sample amount",
      description: "Enter any demonstration amount.",
      prefix: "₹",
      min: 0,
      step: 100,
    },
    {
      id: "sample-rate",
      type: "number",
      label: "Sample rate",
      description: "Enter a sample percentage rate.",
      suffix: "%",
      min: 0,
      max: 100,
      step: 0.1,
    },
    {
      id: "sample-duration",
      type: "select",
      label: "Sample duration",
      description: "Choose a demonstration duration.",
      options: [
        { label: "1 year", value: "1" },
        { label: "3 years", value: "3" },
        { label: "5 years", value: "5" },
      ],
    },
  ],
  formula: {
    title: "Demonstration formula",
    expression: "Display value = A × (1 + R × D)",
    description:
      "This text demonstrates how a future calculator can explain its methodology. The demo does not evaluate this expression.",
    variables: [
      { symbol: "A", meaning: "Sample amount" },
      { symbol: "R", meaning: "Sample rate" },
      { symbol: "D", meaning: "Sample duration" },
    ],
  },
  workedExample: {
    title: "Static worked example",
    description:
      "This example illustrates the presentation pattern only and is not financial guidance.",
    inputs: [
      { label: "Sample amount", value: "₹1,00,000" },
      { label: "Sample rate", value: "8%" },
      { label: "Sample duration", value: "3 years" },
    ],
    results: [
      { label: "Demonstration value", value: "₹1,24,000" },
      { label: "Sample increase", value: "24%" },
    ],
  },
  faqs: [
    {
      question: "Does this demo perform a real financial calculation?",
      answer:
        "No. It uses predefined sample results solely to demonstrate the reusable calculator interface.",
    },
    {
      question: "Will production calculators use this framework?",
      answer:
        "Yes. Future calculators can reuse these layouts and controls while keeping their validated calculation logic in separate pure TypeScript modules.",
    },
    {
      question: "Are formulas evaluated dynamically?",
      answer:
        "No. Formula content is explanatory text. Each production calculator will have explicit, tested TypeScript calculation logic.",
    },
  ],
  relatedCalculators: [
    {
      slug: "emi",
      title: "EMI Calculator",
      description: "Estimate loan repayments when the production calculator is available.",
      href: "/calculators",
      category: "Finance",
    },
    {
      slug: "percentage",
      title: "Percentage Calculator",
      description: "Explore everyday percentage tools in the calculator directory.",
      href: "/calculators",
      category: "Utility",
    },
  ],
  metadata: {
    title: "Calculator Framework Demo",
    description:
      "Preview the reusable calculator framework used to build ThinkCalculator tools.",
    keywords: ["calculator framework", "ThinkCalculator demo"],
  },
  status: "draft",
} as const satisfies CalculatorDefinition

export const calculatorRegistry: readonly CalculatorDefinition[] = [
  demoCalculatorDefinition,
  emiCalculatorDefinition,
  sipCalculatorDefinition,
  lumpsumCalculatorDefinition,
  fdCalculatorDefinition,
  rdCalculatorDefinition,
  cagrCalculatorDefinition,
]

export function getCalculatorBySlug(
  slug: string,
): CalculatorDefinition | undefined {
  return calculatorRegistry.find((calculator) => calculator.slug === slug)
}

export function getCalculatorsByCategory(
  category: CalculatorCategory,
): readonly CalculatorDefinition[] {
  return calculatorRegistry.filter(
    (calculator) => calculator.category === category,
  )
}

export function getRelatedCalculators(
  slug: string,
): readonly RelatedCalculator[] {
  return getCalculatorBySlug(slug)?.relatedCalculators ?? []
}
