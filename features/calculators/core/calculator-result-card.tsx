import { Calculator } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CalculatorResultCardProps } from "@/features/calculators/core/calculator-types"
import {
  formatIndianCurrency,
  formatIndianNumber,
  formatPercentage,
} from "@/lib/formatters"
import type { CalculatorResultItem } from "@/types/calculator"

function formatResult(item: CalculatorResultItem): string {
  if (item.displayType === "text") {
    return String(item.value)
  }

  if (typeof item.value !== "number") {
    return "—"
  }

  if (item.displayType === "currency") {
    return formatIndianCurrency(item.value)
  }

  if (item.displayType === "percentage") {
    return formatPercentage(item.value)
  }

  return formatIndianNumber(item.value)
}

export function CalculatorResultCard({
  title = "Your result",
  items = [],
  emptyTitle = "Your result will appear here",
  emptyDescription = "Enter the required values and calculate to see a clear summary.",
}: CalculatorResultCardProps) {
  if (items.length === 0) {
    return (
      <Card className="h-fit bg-muted/30">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-background ring-1 ring-foreground/10">
            <Calculator className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{emptyTitle}</h2>
          <p className="mt-2 max-w-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    )
  }

  const primaryItem = items.find((item) => item.isPrimary) ?? items[0]
  const secondaryItems = items.filter((item) => item.id !== primaryItem.id)

  return (
    <Card className="h-fit" aria-live="polite">
      <CardHeader><CardTitle className="text-xl">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-xl bg-primary p-5 text-primary-foreground">
          <p className="text-sm opacity-80">{primaryItem.label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatResult(primaryItem)}</p>
          {primaryItem.description ? <p className="mt-2 text-sm opacity-80">{primaryItem.description}</p> : null}
        </div>
        {secondaryItems.length > 0 ? (
          <dl className="mt-5 divide-y">
            {secondaryItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="text-right font-medium">{formatResult(item)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
    </Card>
  )
}
