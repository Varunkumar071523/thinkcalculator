import { Calculator, IndianRupee, ShieldCheck } from "lucide-react"

const stats = [
  { icon: Calculator, label: "calculators", getValue: (calculatorCount: number) => `${calculatorCount}` },
  { icon: ShieldCheck, label: "No login", getValue: () => null },
  { icon: IndianRupee, label: "Built for ₹ and Indian tax rules", getValue: () => null },
] as const

/**
 * A distinct visual band, not a restatement of the hero's inline stat row — same three facts
 * (calculator count, no login, ₹/Indian tax rules), styled as its own bordered strip so it reads
 * as a trust signal on re-scan rather than more hero copy.
 */
export function TrustStatsStrip({ calculatorCount }: { readonly calculatorCount: number }) {
  return (
    <div data-testid="trust-stats-strip" className="border-y border-line bg-money-soft/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
        {stats.map(({ icon: Icon, label, getValue }) => {
          const value = getValue(calculatorCount)
          return (
            <div key={label} className="flex items-center justify-center gap-2.5 py-3.5 text-center sm:py-4">
              <Icon className="size-4 shrink-0 text-money" aria-hidden="true" />
              <span className="text-[13.5px] font-semibold text-ink">
                {value ? <span className="font-mono text-money">{value} </span> : null}
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
