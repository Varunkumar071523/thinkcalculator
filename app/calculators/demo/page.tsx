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
import { createCalculatorMetadata } from "@/lib/seo"

export const metadata = createCalculatorMetadata(demoCalculatorDefinition)

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
