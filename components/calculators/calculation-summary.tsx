import type { ReactNode } from "react"

type SummaryItem = { readonly label: string; readonly value: ReactNode }
type CalculationSummaryProps = {
  readonly title: string
  readonly items: readonly SummaryItem[]
  readonly calculationDate: string
  readonly disclaimer: string
}

export function CalculationSummary({ title, items, calculationDate, disclaimer }: CalculationSummaryProps) {
  return (
    <section className="calculation-summary rounded-xl border bg-card p-5" data-print-summary aria-labelledby="calculation-summary-heading">
      <h2 id="calculation-summary-heading" className="text-xl font-semibold">{title}</h2>
      <dl className="mt-4 divide-y">
        {items.map((item) => <div key={item.label} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{item.label}</dt><dd className="text-right font-medium">{item.value}</dd></div>)}
      </dl>
      <p className="mt-4 text-sm">Calculated on {calculationDate}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{disclaimer}</p>
    </section>
  )
}
