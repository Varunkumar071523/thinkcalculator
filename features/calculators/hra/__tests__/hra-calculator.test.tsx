import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { NoDonutResultCard } from "@/components/calculators/no-donut-result-card"
import { formatIndianCurrency } from "@/lib/formatters"
import { computeHraExemption } from "@/lib/hra/engine"
import type { HraCalcInput } from "@/lib/hra/types"
import { HRA_FINANCIAL_YEAR } from "../hra-regulatory-config"

// Sprint 71: HRA's result card migrated from a hand-written Card/CardContent block onto the
// shared NoDonutResultCard (DECISIONS.md #64). This renders the exact prop mapping
// hra-calculator.tsx now uses for both city cases — metro and non-metro drive different
// percentOfSalaryRate values (50% vs 40%), which changes both the fourth stat's label and the
// binding constraint, so both must be checked rather than just one.
function renderHraResultCard(input: HraCalcInput) {
  const result = computeHraExemption(input, HRA_FINANCIAL_YEAR)
  return renderToStaticMarkup(
    <NoDonutResultCard
      gradientFromClassName="from-cat-tax-soft"
      headlineLabel="Exempt HRA"
      headlineValue={formatIndianCurrency(result.exemptHra)}
      headlineValueColorClassName="text-cat-tax"
      subtitle={`of ${formatIndianCurrency(input.hraReceived)} HRA received, ${input.city === "metro" ? "metro" : "non-metro"} city`}
      stats={[
        { label: "Taxable HRA", value: formatIndianCurrency(result.taxableHra) },
        { label: "Actual HRA received", value: formatIndianCurrency(result.actualHraReceived) },
        { label: "Rent minus 10% of salary", value: formatIndianCurrency(result.rentMinusTenPercentSalary) },
        { label: `${result.percentOfSalaryRate * 100}% of salary`, value: formatIndianCurrency(result.percentOfSalary) },
      ]}
    />,
  )
}

describe("HRA result card on NoDonutResultCard", () => {
  it("renders the correct headline and all four stats for a metro city input", () => {
    const html = renderHraResultCard({ basicSalary: 600_000, da: 0, hraReceived: 240_000, rentPaid: 180_000, city: "metro" })

    expect(html).toContain("Exempt HRA")
    expect(html).toContain("₹1,20,000.00")
    expect(html).toContain("of ₹2,40,000.00 HRA received, metro city")
    expect(html).toContain("Taxable HRA")
    expect(html).toContain("Actual HRA received")
    expect(html).toContain("₹2,40,000.00")
    expect(html).toContain("Rent minus 10% of salary")
    expect(html).toContain("50% of salary")
    expect(html).toContain("₹3,00,000.00")
    expect(html).not.toContain("40% of salary")
  })

  it("renders the correct headline and all four stats for a non-metro city input, with the 40% label swapped in", () => {
    const html = renderHraResultCard({ basicSalary: 600_000, da: 0, hraReceived: 200_000, rentPaid: 150_000, city: "non-metro" })

    expect(html).toContain("Exempt HRA")
    expect(html).toContain("₹90,000.00")
    expect(html).toContain("of ₹2,00,000.00 HRA received, non-metro city")
    expect(html).toContain("Taxable HRA")
    expect(html).toContain("₹1,10,000.00")
    expect(html).toContain("Actual HRA received")
    expect(html).toContain("₹2,00,000.00")
    expect(html).toContain("Rent minus 10% of salary")
    expect(html).toContain("40% of salary")
    expect(html).toContain("₹2,40,000.00")
    expect(html).not.toContain("50% of salary")
  })

  it("carries the tax category gradient and headline color tokens through unchanged", () => {
    const html = renderHraResultCard({ basicSalary: 600_000, da: 0, hraReceived: 240_000, rentPaid: 180_000, city: "metro" })

    expect(html).toContain("from-cat-tax-soft")
    expect(html).toContain('class="font-mono text-[42px] leading-none font-bold text-cat-tax"')
  })
})
