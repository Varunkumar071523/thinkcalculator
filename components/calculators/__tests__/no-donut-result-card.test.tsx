import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { NoDonutResultCard } from "../no-donut-result-card"

function renderCard(overrides: Partial<Parameters<typeof NoDonutResultCard>[0]> = {}) {
  return renderToStaticMarkup(
    <NoDonutResultCard
      gradientFromClassName="from-cat-invest-soft"
      headlineLabel="Compound annual growth rate"
      headlineValue="10.00%"
      headlineValueColorClassName="text-cat-invest"
      subtitle="from ₹1,00,000.00 to ₹1,61,051.00 over 5 years"
      stats={[
        { label: "Absolute gain", value: "₹61,051.00" },
        { label: "Total return", value: "61.05%" },
      ]}
      {...overrides}
    />,
  )
}

describe("NoDonutResultCard", () => {
  it("renders a 2-cell stat grid with both cells present and neither spanning the full row", () => {
    const html = renderCard()
    expect(html).toContain("Absolute gain")
    expect(html).toContain("₹61,051.00")
    expect(html).toContain("Total return")
    expect(html).toContain("61.05%")
    expect(html).not.toContain("col-span-2")
  })

  it("applies col-span-2 to a stat cell marked spanFull, and only to that cell", () => {
    const html = renderCard({
      stats: [
        { label: "Absolute gain", value: "₹61,051.00" },
        { label: "Growth multiple", value: "1.61×", spanFull: true },
      ],
    })
    const cellMatches = [...html.matchAll(/<div class="([^"]*rounded-lg border border-line bg-card p-3\.5[^"]*)">/g)]
    expect(cellMatches).toHaveLength(2)
    expect(cellMatches[0][1]).not.toContain("col-span-2")
    expect(cellMatches[1][1]).toContain("col-span-2")
  })

  it("renders a stat cell's note line when present, and omits the note paragraph entirely when absent", () => {
    const html = renderCard({
      stats: [
        { label: "Pensionable salary used", value: "₹15,000.00", note: "Capped from ₹24,000.00" },
        { label: "Pensionable service used", value: "28 years" },
      ],
    })
    expect(html).toContain("Capped from ₹24,000.00")
    // The note paragraph uses a class unique to notes (mt-1); confirm it appears exactly once,
    // for the cell that has a note, not for the one that doesn't.
    const noteMatches = [...html.matchAll(/<p class="mt-1 text-xs text-muted-foreground">/g)]
    expect(noteMatches).toHaveLength(1)
  })

  it("puts the headlineValueColorClassName on the headline value element", () => {
    const eligibleHtml = renderCard({ headlineValue: "₹18,500.00", headlineValueColorClassName: "text-cat-savings" })
    expect(eligibleHtml).toContain('class="font-mono text-[42px] leading-none font-bold text-cat-savings"')
    expect(eligibleHtml).not.toContain("text-destructive")

    const notEligibleHtml = renderCard({ headlineValue: "Not eligible", headlineValueColorClassName: "text-destructive" })
    expect(notEligibleHtml).toContain('class="font-mono text-[42px] leading-none font-bold text-destructive"')
    expect(notEligibleHtml).not.toContain("text-cat-savings")
  })
})
