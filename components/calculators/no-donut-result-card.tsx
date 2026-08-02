import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type NoDonutStat = {
  readonly label: string
  readonly value: string
  /** Secondary line under the value, e.g. a "Capped from ₹X" or "Includes Y bonus" note. */
  readonly note?: string
  /** Spans both grid columns, for a cell that doesn't pair naturally with a neighbour
   * (e.g. CAGR's growth multiple, EPS Pension's standard-age pension). */
  readonly spanFull?: boolean
}

type NoDonutResultCardProps = {
  /** Tailwind gradient-from token for the card background, e.g. "from-cat-invest-soft". */
  readonly gradientFromClassName: string
  readonly headlineLabel: string
  readonly headlineValue: string
  /** Tailwind text-color token for the headline value, e.g. "text-cat-invest" or "text-destructive"
   * for a not-eligible/error state — kept as a free string rather than a fixed category enum so a
   * conditional headline (CAGR/EPS's isEligible-style branches) can swap it per branch. */
  readonly headlineValueColorClassName: string
  readonly subtitle: string
  readonly stats: readonly NoDonutStat[]
  /** Rendered below the stat grid, e.g. CalculatorActions — kept as children rather than a fixed
   * prop shape so this component doesn't need to know about share/print/copy actions at all. */
  readonly children?: ReactNode
}

/** Shared above-the-fold result-card shape for calculators with no part-to-whole breakdown to put
 * in a SimpleDonutChart: a centered headline (label/value/subtitle) over a grid-cols-2 grid of
 * bordered stat cells. Extracted from CAGR and EPS Pension (docs/DECISIONS.md #59) — both already
 * used this exact markup independently before this component existed. */
export function NoDonutResultCard({
  gradientFromClassName,
  headlineLabel,
  headlineValue,
  headlineValueColorClassName,
  subtitle,
  stats,
  children,
}: NoDonutResultCardProps) {
  return (
    <Card className={cn("bg-gradient-to-b to-card to-55%", gradientFromClassName)} data-testid="calculator-result-card" data-print-summary aria-live="polite">
      <CardContent>
        <div className="border-b border-line pb-5 text-center">
          <p className="mb-1.5 text-[13px] text-muted-foreground">{headlineLabel}</p>
          <p className={cn("font-mono text-[42px] leading-none font-bold", headlineValueColorClassName)}>{headlineValue}</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className={cn("rounded-lg border border-line bg-card p-3.5", stat.spanFull && "col-span-2")}>
              <p className="mb-1 text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-mono text-lg font-semibold">{stat.value}</p>
              {stat.note ? <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p> : null}
            </div>
          ))}
        </div>

        {children ? <div className="mt-5">{children}</div> : null}
      </CardContent>
    </Card>
  )
}
