import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { HraCalcResult, HraConstraint } from "@/lib/hra/types"
import type { CalculatorResultItem } from "@/types/calculator"

const constraintLabels: Record<HraConstraint, string> = {
  actualHraReceived: "Actual HRA received",
  rentMinusTenPercentSalary: "Rent paid minus 10% of salary",
  percentOfSalary: "Percentage of salary limit",
}

export function createHraResultItems(result: HraCalcResult): readonly CalculatorResultItem[] {
  const percentLabel = `${formatPercentage(result.percentOfSalaryRate * 100)} of salary (${result.input.city === "metro" ? "metro" : "non-metro"})`
  return [
    { id: "exempt-hra", label: "Exempt HRA", value: result.exemptHra, displayType: "currency", isPrimary: true },
    { id: "taxable-hra", label: "Taxable HRA", value: result.taxableHra, displayType: "currency" },
    { id: "actual-hra-received", label: constraintLabels.actualHraReceived, value: result.actualHraReceived, displayType: "currency" },
    { id: "rent-minus-ten-percent", label: constraintLabels.rentMinusTenPercentSalary, value: result.rentMinusTenPercentSalary, displayType: "currency" },
    { id: "percent-of-salary", label: percentLabel, value: result.percentOfSalary, displayType: "currency" },
  ]
}

/** Human-readable explanation of why the binding constraint won, for the results card below. */
export function describeBindingConstraint(result: HraCalcResult): string {
  const cityLabel = result.input.city === "metro" ? "metro" : "non-metro"
  switch (result.bindingConstraint) {
    case "actualHraReceived":
      return `Your actual HRA received (${formatIndianCurrency(result.actualHraReceived)}) is your binding constraint — it is smaller than both the rent-based limit and the ${formatPercentage(result.percentOfSalaryRate * 100)} of salary limit, so your full HRA received is exempt.`
    case "rentMinusTenPercentSalary":
      return `The rent-based limit is your binding constraint — rent paid minus 10% of salary (${formatIndianCurrency(result.rentMinusTenPercentSalary)}) is smaller than both actual HRA received and the ${formatPercentage(result.percentOfSalaryRate * 100)} of salary limit.`
    case "percentOfSalary":
      return `The ${formatPercentage(result.percentOfSalaryRate * 100)} of salary limit (${cityLabel} rate) is your binding constraint at ${formatIndianCurrency(result.percentOfSalary)} — it is smaller than both actual HRA received and the rent-based limit.`
  }
}

export function HraResultSummary({ result }: { readonly result: HraCalcResult | null }) {
  return (
    <CalculatorResultCard
      title="HRA exemption"
      items={result ? createHraResultItems(result) : []}
      emptyTitle="Your HRA exemption will appear here"
      emptyDescription="Enter salary, HRA received, rent paid, and your city, then select Calculate."
    />
  )
}

export function HraBindingConstraintCard({ result }: { readonly result: HraCalcResult }) {
  return (
    <Card role="status" aria-live="polite" data-testid="hra-binding-constraint-card">
      <CardHeader>
        <CardTitle className="text-lg">Which limit is binding</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{describeBindingConstraint(result)}</p>
      </CardContent>
    </Card>
  )
}
