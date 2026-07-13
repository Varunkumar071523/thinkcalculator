"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type SearchableCalculator = {
  id: string
  title: string
  shortTitle: string
  description: string
  category: string
  href: string
}

export function CalculatorSearch({ calculators }: { calculators: readonly SearchableCalculator[] }) {
  const [query, setQuery] = useState("")
  const inputId = useId()
  const normalizedQuery = query.trim().toLocaleLowerCase("en-IN")
  const matches = useMemo(() => {
    if (!normalizedQuery) return []
    return calculators.filter((calculator) =>
      [calculator.title, calculator.shortTitle, calculator.description, calculator.category]
        .some((value) => value.toLocaleLowerCase("en-IN").includes(normalizedQuery)),
    )
  }, [calculators, normalizedQuery])

  return (
    <div className="relative mx-auto w-full max-w-2xl text-left">
      <label htmlFor={inputId} className="sr-only">Search calculators</label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search EMI, SIP, GST, deposits…"
          className="h-14 rounded-xl bg-background pr-12 pl-12 text-base shadow-sm"
          autoComplete="off"
          aria-controls={`${inputId}-results`}
          aria-expanded={normalizedQuery.length > 0}
        />
        {query ? (
          <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={() => setQuery("")} aria-label="Clear calculator search">
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {normalizedQuery ? (
        <div id={`${inputId}-results`} className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg" aria-live="polite">
          {matches.length ? (
            <ul className="max-h-80 overflow-y-auto">
              {matches.map((calculator) => (
                <li key={calculator.id}>
                  <Link href={calculator.href} className="group flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span><span className="block font-medium">{calculator.title}</span><span className="mt-0.5 block text-sm text-muted-foreground">{calculator.description}</span></span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-5 text-center text-sm text-muted-foreground">No calculator matches “{query.trim()}”. Try EMI, SIP, GST, FD, or RD.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
