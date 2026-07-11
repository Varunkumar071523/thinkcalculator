import { CalculatorSection } from "@/features/calculators/core/calculator-section"
import type { CalculatorWorkedExample } from "@/types/calculator"

export function WorkedExampleSection({ example }: { readonly example: CalculatorWorkedExample }) {
  return (
    <CalculatorSection id="worked-example" title={example.title ?? "Worked example"} description={example.description}>
      <div className="grid overflow-hidden rounded-xl border sm:grid-cols-2">
        <div className="p-5 sm:p-6">
          <h3 className="font-semibold">Sample inputs</h3>
          <dl className="mt-4 space-y-3">
            {example.inputs.map((item) => (
              <div key={item.label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{item.label}</dt><dd className="font-medium">{item.value}</dd></div>
            ))}
          </dl>
        </div>
        <div className="border-t bg-muted/30 p-5 sm:border-t-0 sm:border-l sm:p-6">
          <h3 className="font-semibold">Example results</h3>
          <dl className="mt-4 space-y-3">
            {example.results.map((item) => (
              <div key={item.label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{item.label}</dt><dd className="font-semibold">{item.value}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </CalculatorSection>
  )
}
