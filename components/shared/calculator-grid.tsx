"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BarChart3 } from "lucide-react"

import { cn } from "@/lib/utils"
import { calculatorGroups, calculatorGroupStyles, calculatorIconBySlug, type CalculatorGroup } from "@/lib/calculator-taxonomy"
import type { GroupedCalculatorSummary } from "@/types/site"

type FilterValue = "all" | CalculatorGroup

export function CalculatorGrid({ calculators }: { readonly calculators: readonly GroupedCalculatorSummary[] }) {
  const [active, setActive] = useState<FilterValue>("all")

  const availableGroups = useMemo(
    () => calculatorGroups.filter((group) => calculators.some((calculator) => calculator.group === group.id)),
    [calculators],
  )
  const filtered = active === "all" ? calculators : calculators.filter((calculator) => calculator.group === active)

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter calculators by category">
        <FilterChip active={active === "all"} onClick={() => setActive("all")}>All</FilterChip>
        {availableGroups.map((group) => (
          <FilterChip key={group.id} active={active === group.id} activeClassName={calculatorGroupStyles[group.id].text} onClick={() => setActive(group.id)}>
            {group.label}
          </FilterChip>
        ))}
      </div>
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((calculator) => (
          <CalculatorGridCard key={calculator.href} calculator={calculator} />
        ))}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children, activeClassName }: { readonly active: boolean; readonly onClick: () => void; readonly children: React.ReactNode; readonly activeClassName?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active ? "border-ink bg-ink text-white" : cn("border-line bg-card text-muted-foreground hover:border-ink-soft", activeClassName),
      )}
    >
      {children}
    </button>
  )
}

export function CalculatorGridCard({ calculator }: { readonly calculator: GroupedCalculatorSummary }) {
  const Icon = calculatorIconBySlug[calculator.slug] ?? BarChart3
  const style = calculatorGroupStyles[calculator.group]
  const groupLabel = calculatorGroups.find((group) => group.id === calculator.group)?.label ?? calculator.category

  return (
    <Link
      href={calculator.href}
      className={cn("group rounded-xl border border-line bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "border-l-[3px]", style.border)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex size-9 items-center justify-center rounded-lg", style.iconBg, style.iconColor)}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        {calculator.popular ? (
          <span className="rounded-md bg-gold-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-gold uppercase">Popular</span>
        ) : null}
      </div>
      <h3 className="mt-2.5 text-[15.5px] font-semibold">{calculator.title}</h3>
      <p className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">{calculator.description}</p>
      <p className={cn("mt-2.5 text-[11.5px] font-semibold", style.text)}>{groupLabel}</p>
    </Link>
  )
}
