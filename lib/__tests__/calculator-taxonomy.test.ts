import { describe, expect, it } from "vitest"

import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { toGroupedCalculators } from "@/lib/calculator-taxonomy"

describe("toGroupedCalculators badge derivation", () => {
  const grouped = toGroupedCalculators(calculatorRegistry)

  it("carries the 'popular' badge for EMI and SIP, straight from the registry", () => {
    const emi = grouped.find((calculator) => calculator.slug === "emi-calculator")
    const sip = grouped.find((calculator) => calculator.slug === "sip-calculator")
    expect(emi?.badge).toBe("popular")
    expect(sip?.badge).toBe("popular")
  })

  it("leaves badge undefined for calculators with no badge set in the registry", () => {
    const fd = grouped.find((calculator) => calculator.slug === "fd-calculator")
    expect(fd?.badge).toBeUndefined()
  })

  it("never invents a badge that isn't present on the source CalculatorDefinition", () => {
    const badgeBySlug = new Map(calculatorRegistry.map((calculator) => [calculator.slug, calculator.badge]))
    for (const calculator of grouped) {
      expect(calculator.badge).toBe(badgeBySlug.get(calculator.slug))
    }
  })
})
