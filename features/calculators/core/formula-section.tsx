import { CalculatorSection } from "@/features/calculators/core/calculator-section"
import type { CalculatorFormula } from "@/types/calculator"

export function FormulaSection({ formula }: { readonly formula: CalculatorFormula }) {
  return (
    <CalculatorSection
      id="formula"
      title={formula.title ?? "Formula and methodology"}
      description={formula.description}
    >
      <div className="rounded-xl border bg-muted/30 p-5 sm:p-6">
        <p className="overflow-x-auto font-mono text-base font-semibold" aria-label={`Formula: ${formula.expression}`}>{formula.expression}</p>
        {formula.variables && formula.variables.length > 0 ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {formula.variables.map((variable) => (
              <div key={variable.symbol} className="flex gap-3">
                <dt className="font-mono font-semibold">{variable.symbol}</dt>
                <dd className="text-muted-foreground">{variable.meaning}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </CalculatorSection>
  )
}
