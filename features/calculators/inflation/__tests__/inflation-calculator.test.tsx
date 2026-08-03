import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { NoDonutResultCard } from "@/components/calculators/no-donut-result-card"
import { formatIndianCurrency } from "@/lib/formatters"
import { calculateInflation } from "../calculate-inflation"
import type { InflationInput } from "../inflation-types"

// Sprint 72: Inflation's result card migrated from a hand-written Card/CardContent block onto the
// shared NoDonutResultCard (DECISIONS.md #60/#64 follow-up). Unlike HRA/EPS Pension, Inflation's
// conditional headline is driven by a user-facing mode toggle (futureCost vs presentValue), not a
// derived eligibility check — both modes render successfully, they just swap every label/value.
// This renders the exact prop mapping inflation-calculator.tsx now uses for both modes.
function renderInflationResultCard(input: InflationInput) {
  const result = calculateInflation(input)
  const isFutureCost = input.mode === "futureCost"
  const amountLabel = isFutureCost ? "Current amount" : "Future amount"
  const primaryLabel = isFutureCost ? "Equivalent future cost" : "Present value (today's purchasing power)"
  const primaryValue = result.mode === "futureCost" ? result.futureValue : result.presentValue
  const secondaryLabel = isFutureCost ? "Total inflation impact" : "Purchasing power change"
  const secondaryValue = result.mode === "futureCost" ? result.totalInflationImpact : result.purchasingPowerChange
  const multipleLabel = isFutureCost ? "Inflation multiple" : "Discount multiple"
  const multipleValue = result.mode === "futureCost" ? result.inflationMultiple : result.discountMultiple
  const subtitle = `from ${formatIndianCurrency(input.amount)} (${amountLabel.toLowerCase()}) over ${input.years} years at ${input.annualInflationRate.toFixed(1)}% p.a.`

  return renderToStaticMarkup(
    <NoDonutResultCard
      gradientFromClassName="from-cat-invest-soft"
      headlineLabel={primaryLabel}
      headlineValue={formatIndianCurrency(primaryValue)}
      headlineValueColorClassName="text-cat-invest"
      subtitle={subtitle}
      stats={[
        { label: secondaryLabel, value: formatIndianCurrency(secondaryValue) },
        { label: multipleLabel, value: `${multipleValue.toFixed(4)}×` },
      ]}
    />,
  )
}

describe("Inflation result card on NoDonutResultCard", () => {
  it("renders the futureCost headline, subtitle, and both stats", () => {
    const html = renderInflationResultCard({ mode: "futureCost", amount: 100_000, annualInflationRate: 6, years: 10 })

    expect(html).toContain("Equivalent future cost")
    expect(html).toContain(formatIndianCurrency(179_084.76965428545))
    expect(html).toContain("from ₹1,00,000.00 (current amount) over 10 years at 6.0% p.a.")
    expect(html).toContain("Total inflation impact")
    expect(html).toContain(formatIndianCurrency(79_084.76965428545))
    expect(html).toContain("Inflation multiple")
    expect(html).toContain("1.7908×")
    expect(html).not.toContain("Present value")
    expect(html).not.toContain("Discount multiple")
  })

  it("renders the presentValue headline, subtitle, and both stats, with every label/value swapped", () => {
    const html = renderInflationResultCard({ mode: "presentValue", amount: 100_000, annualInflationRate: 6, years: 10 })

    expect(html).toContain("Present value (today&#x27;s purchasing power)")
    expect(html).toContain(formatIndianCurrency(55_839.47769151178))
    expect(html).toContain("from ₹1,00,000.00 (future amount) over 10 years at 6.0% p.a.")
    expect(html).toContain("Purchasing power change")
    expect(html).toContain(formatIndianCurrency(44_160.52230848822))
    expect(html).toContain("Discount multiple")
    expect(html).toContain("0.5584×")
    expect(html).not.toContain("Equivalent future cost")
    expect(html).not.toContain("Inflation multiple<")
  })

  it("carries the invest category gradient and headline color tokens through unchanged for both modes", () => {
    const futureCostHtml = renderInflationResultCard({ mode: "futureCost", amount: 100_000, annualInflationRate: 6, years: 10 })
    const presentValueHtml = renderInflationResultCard({ mode: "presentValue", amount: 100_000, annualInflationRate: 6, years: 10 })

    for (const html of [futureCostHtml, presentValueHtml]) {
      expect(html).toContain("from-cat-invest-soft")
      expect(html).toContain('class="font-mono text-[42px] leading-none font-bold text-cat-invest"')
    }
  })

  it("keeps the stat grid at exactly two cells with neither spanning the full row, for both modes", () => {
    const futureCostHtml = renderInflationResultCard({ mode: "futureCost", amount: 100_000, annualInflationRate: 6, years: 10 })
    const presentValueHtml = renderInflationResultCard({ mode: "presentValue", amount: 100_000, annualInflationRate: 6, years: 10 })

    for (const html of [futureCostHtml, presentValueHtml]) {
      const cellMatches = [...html.matchAll(/<div class="([^"]*rounded-lg border border-line bg-card p-3\.5[^"]*)">/g)]
      expect(cellMatches).toHaveLength(2)
      expect(cellMatches[0][1]).not.toContain("col-span-2")
      expect(cellMatches[1][1]).not.toContain("col-span-2")
    }
  })
})
