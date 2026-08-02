import { describe, expect, it } from "vitest"
import { formatIndianCurrency } from "@/lib/formatters"
import { calculateRetirement } from "../calculate-retirement"
import { toRetirementPhaseView } from "../retirement-calculator"
import type { RetirementInput } from "../retirement-types"

const base: RetirementInput = {
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  currentSavings: 500_000,
  monthlyContribution: 15_000,
  expectedReturnPreRetirement: 10,
  expectedReturnPostRetirement: 8,
  desiredMonthlyWithdrawal: 50_000,
  inflationRate: 6,
}

const result = calculateRetirement(base)

describe("toRetirementPhaseView", () => {
  it("accumulation phase reproduces the pre-toggle donut and stat-grid content exactly", () => {
    const view = toRetirementPhaseView("accumulation", result)

    expect(view.donutTitle).toBe("Contributions vs growth at retirement")
    expect(view.donutItems).toEqual([
      { label: "Contributions", value: result.totalContributions, formattedValue: expect.any(String), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
      { label: "Growth", value: result.totalGainAtRetirement, formattedValue: expect.any(String), colorClass: "bg-gold", ringClass: "stroke-gold" },
    ])

    const labels = view.statCells.map((cell) => cell.label)
    expect(labels).toEqual(["Corpus at retirement", "Total contributions", "Total growth at retirement", "Years to retirement"])

    const totalGrowthCell = view.statCells.find((cell) => cell.label === "Total growth at retirement")
    const yearsToRetirementCell = view.statCells.find((cell) => cell.label === "Years to retirement")
    expect(totalGrowthCell?.value).toBe(formatIndianCurrency(result.totalGainAtRetirement))
    expect(yearsToRetirementCell?.value).toBe(`${result.yearsToRetirement} years`)
  })

  it("decumulation phase wires in totalWithdrawn and totalGrowthInRetirement, previously unused anywhere in the component", () => {
    const view = toRetirementPhaseView("decumulation", result)

    expect(view.donutTitle).toBe("Withdrawn vs growth during retirement")
    expect(view.donutItems).toEqual([
      { label: "Withdrawn", value: result.totalWithdrawn, formattedValue: expect.any(String), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
      { label: "Growth", value: result.totalGrowthInRetirement, formattedValue: expect.any(String), colorClass: "bg-gold", ringClass: "stroke-gold" },
    ])

    const labels = view.statCells.map((cell) => cell.label)
    expect(labels).toEqual(["First-year monthly withdrawal", "Final monthly withdrawal", "Total withdrawn", "Total growth in retirement"])

    const totalWithdrawnCell = view.statCells.find((cell) => cell.label === "Total withdrawn")
    const totalGrowthCell = view.statCells.find((cell) => cell.label === "Total growth in retirement")
    expect(totalWithdrawnCell?.value).toBe(formatIndianCurrency(result.totalWithdrawn))
    expect(totalGrowthCell?.value).toBe(formatIndianCurrency(result.totalGrowthInRetirement))
  })

  it("swapping phases changes every mapped field — no stale data carried over between phases", () => {
    const accumulation = toRetirementPhaseView("accumulation", result)
    const decumulation = toRetirementPhaseView("decumulation", result)

    expect(accumulation.donutTitle).not.toBe(decumulation.donutTitle)
    expect(accumulation.donutItems.map((item) => item.label)).not.toEqual(decumulation.donutItems.map((item) => item.label))
    expect(accumulation.statCells.map((cell) => cell.label)).not.toEqual(decumulation.statCells.map((cell) => cell.label))
  })

  it("donut values sum to the same underlying totals the stat grid reports, per phase", () => {
    const accumulation = toRetirementPhaseView("accumulation", result)
    expect(accumulation.donutItems[0].value).toBe(result.totalContributions)
    expect(accumulation.donutItems[1].value).toBe(result.totalGainAtRetirement)

    const decumulation = toRetirementPhaseView("decumulation", result)
    expect(decumulation.donutItems[0].value).toBe(result.totalWithdrawn)
    expect(decumulation.donutItems[1].value).toBe(result.totalGrowthInRetirement)
  })
})
