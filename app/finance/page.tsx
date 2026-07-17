import type { Metadata } from "next"
import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorGridCard } from "@/components/shared/calculator-grid"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { calculatorGroups, calculatorGroupStyles, countByGroup, toGroupedCalculators } from "@/lib/calculator-taxonomy"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Finance Calculators",
  description: "Explore finance calculators for loans, investments, savings, taxes, and personal money decisions in India.",
  alternates: { canonical: "/finance" },
}

export const financeCalculators = toGroupedCalculators(calculatorRegistry.filter((calculator) => calculator.category === "Finance"))
const groupCounts = countByGroup(financeCalculators)
const groupsWithCalculators = calculatorGroups
  .map((group) => ({ ...group, calculators: financeCalculators.filter((calculator) => calculator.group === group.id) }))
  .filter((group) => group.calculators.length > 0)

export default function FinancePage() {
  return (
    <SiteContainer className="py-10 sm:py-12">
      <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">{financeCalculators.length} finance calculators</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Finance calculators</h1>
      <p className="mt-4 max-w-[60ch] text-base leading-7 text-muted-foreground">Everything for loans, investments, savings, and tax planning — grouped so you can scan by decision, not just alphabetically.</p>

      <nav aria-label="Jump to category" className="mt-6 flex flex-wrap gap-2">
        <a href="#all" className="rounded-full border border-ink bg-ink px-3.5 py-1.5 text-sm font-semibold text-white">All ({financeCalculators.length})</a>
        {groupsWithCalculators.map((group) => (
          <a key={group.id} href={`#${group.id}`} className={cn("rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-semibold hover:border-ink-soft", calculatorGroupStyles[group.id].text)}>
            {group.label} ({groupCounts[group.id]})
          </a>
        ))}
      </nav>

      <div id="all" className="sr-only" aria-hidden="true" />

      {groupsWithCalculators.map((group) => {
        const style = calculatorGroupStyles[group.id]
        return (
          <section key={group.id} id={group.id} className="mt-9 scroll-mt-24">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className={cn("size-2.5 rounded-sm", style.dot)} aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold tracking-tight">{group.label}</h2>
              <span className="font-mono text-xs text-muted-foreground">{group.calculators.length} tool{group.calculators.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {group.calculators.map((calculator) => <CalculatorGridCard key={calculator.href} calculator={calculator} />)}
            </div>
          </section>
        )
      })}

      <p className="mt-10 text-sm text-muted-foreground">
        Looking for GST or another business tool? Visit <Link href="/business" className="font-medium text-money underline-offset-4 hover:underline">Business calculators</Link>.
      </p>
    </SiteContainer>
  )
}
