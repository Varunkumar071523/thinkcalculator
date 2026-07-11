import type { Metadata } from "next"

import { DemoCalculator } from "@/features/calculators/demo/demo-calculator"
import {
  CalculatorPageLayout,
  FAQSection,
  FormulaSection,
  RelatedCalculators,
  WorkedExampleSection,
  demoCalculatorDefinition,
  getRelatedCalculators,
} from "@/features/calculators/core"

export const metadata: Metadata = {
  title: demoCalculatorDefinition.metadata.title,
  description: demoCalculatorDefinition.metadata.description,
  keywords: demoCalculatorDefinition.metadata.keywords
    ? [...demoCalculatorDefinition.metadata.keywords]
    : undefined,
  alternates: { canonical: demoCalculatorDefinition.canonicalPath },
  robots: { index: false, follow: true },
}

export default function CalculatorDemoPage() {
  const calculator = demoCalculatorDefinition

  return (
    <CalculatorPageLayout calculator={calculator} form={<DemoCalculator />} result={null}>
      {calculator.formula ? <FormulaSection formula={calculator.formula} /> : null}
      {calculator.workedExample ? <WorkedExampleSection example={calculator.workedExample} /> : null}
      <FAQSection faqs={calculator.faqs} />
      <RelatedCalculators calculators={getRelatedCalculators(calculator.slug)} />
    </CalculatorPageLayout>
  )
}
