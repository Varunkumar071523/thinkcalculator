import { describe, expect, it } from "vitest"

import { computeHraExemption } from "../engine"
import type { HraCalcInput } from "../types"

const FY = "2025-26"

describe("computeHraExemption", () => {
  it("binds on actual HRA received when it is the smallest of the three limits", () => {
    const input: HraCalcInput = { basicSalary: 600_000, da: 0, hraReceived: 200_000, rentPaid: 400_000, city: "metro" }
    const result = computeHraExemption(input, FY)
    expect(result.salary).toBe(600_000)
    expect(result.actualHraReceived).toBe(200_000)
    expect(result.rentMinusTenPercentSalary).toBe(340_000) // 400,000 - 10% of 600,000
    expect(result.percentOfSalary).toBe(300_000) // 50% of 600,000 (metro)
    expect(result.bindingConstraint).toBe("actualHraReceived")
    expect(result.exemptHra).toBe(200_000)
    expect(result.taxableHra).toBe(0)
  })

  it("binds on rent paid minus 10% of salary when it is the smallest of the three limits", () => {
    const input: HraCalcInput = { basicSalary: 600_000, da: 0, hraReceived: 350_000, rentPaid: 160_000, city: "metro" }
    const result = computeHraExemption(input, FY)
    expect(result.rentMinusTenPercentSalary).toBe(100_000) // 160,000 - 60,000
    expect(result.percentOfSalary).toBe(300_000)
    expect(result.bindingConstraint).toBe("rentMinusTenPercentSalary")
    expect(result.exemptHra).toBe(100_000)
    expect(result.taxableHra).toBe(250_000)
  })

  it("binds on the percentage-of-salary limit (non-metro, 40%) when it is the smallest of the three limits", () => {
    const input: HraCalcInput = { basicSalary: 1_000_000, da: 0, hraReceived: 600_000, rentPaid: 800_000, city: "non-metro" }
    const result = computeHraExemption(input, FY)
    expect(result.percentOfSalaryRate).toBe(0.4)
    expect(result.percentOfSalary).toBe(400_000)
    expect(result.rentMinusTenPercentSalary).toBe(700_000)
    expect(result.bindingConstraint).toBe("percentOfSalary")
    expect(result.exemptHra).toBe(400_000)
    expect(result.taxableHra).toBe(200_000)
  })

  it("applies the higher 50% metro rate instead of the 40% non-metro rate for the same salary", () => {
    const metro = computeHraExemption({ basicSalary: 600_000, da: 0, hraReceived: 400_000, rentPaid: 400_000, city: "metro" }, FY)
    const nonMetro = computeHraExemption({ basicSalary: 600_000, da: 0, hraReceived: 400_000, rentPaid: 400_000, city: "non-metro" }, FY)
    expect(metro.percentOfSalaryRate).toBe(0.5)
    expect(nonMetro.percentOfSalaryRate).toBe(0.4)
    expect(metro.percentOfSalary).toBeGreaterThan(nonMetro.percentOfSalary)
  })

  it("floors rent-minus-10%-of-salary at zero rather than going negative when rent is at or below 10% of salary", () => {
    const input: HraCalcInput = { basicSalary: 600_000, da: 0, hraReceived: 200_000, rentPaid: 50_000, city: "metro" }
    const result = computeHraExemption(input, FY)
    expect(result.rentMinusTenPercentSalary).toBe(0)
    expect(result.bindingConstraint).toBe("rentMinusTenPercentSalary")
    expect(result.exemptHra).toBe(0)
    expect(result.taxableHra).toBe(200_000)
  })

  it("handles zero rent paid by flooring the rent-based limit at zero", () => {
    const input: HraCalcInput = { basicSalary: 500_000, da: 100_000, hraReceived: 150_000, rentPaid: 0, city: "non-metro" }
    const result = computeHraExemption(input, FY)
    expect(result.salary).toBe(600_000) // basic + DA
    expect(result.rentMinusTenPercentSalary).toBe(0)
    expect(result.bindingConstraint).toBe("rentMinusTenPercentSalary")
    expect(result.exemptHra).toBe(0)
    expect(result.taxableHra).toBe(150_000)
  })

  it("handles zero HRA received: exemption and taxable HRA are both zero", () => {
    const input: HraCalcInput = { basicSalary: 500_000, da: 100_000, hraReceived: 0, rentPaid: 300_000, city: "non-metro" }
    const result = computeHraExemption(input, FY)
    expect(result.actualHraReceived).toBe(0)
    expect(result.bindingConstraint).toBe("actualHraReceived")
    expect(result.exemptHra).toBe(0)
    expect(result.taxableHra).toBe(0)
  })

  it("includes DA in the salary base used for both the rent and percentage limits", () => {
    const withoutDa = computeHraExemption({ basicSalary: 500_000, da: 0, hraReceived: 400_000, rentPaid: 300_000, city: "metro" }, FY)
    const withDa = computeHraExemption({ basicSalary: 500_000, da: 100_000, hraReceived: 400_000, rentPaid: 300_000, city: "metro" }, FY)
    expect(withDa.salary).toBe(600_000)
    expect(withDa.percentOfSalary).toBeGreaterThan(withoutDa.percentOfSalary)
    expect(withDa.rentMinusTenPercentSalary).toBeLessThan(withoutDa.rentMinusTenPercentSalary)
  })

  it("breaks ties in favour of actualHraReceived, then rentMinusTenPercentSalary, then percentOfSalary", () => {
    // rentMinusTenPercentSalary and percentOfSalary are equal (300,000 each); actualHraReceived is
    // larger, so the tie between the other two must resolve to rentMinusTenPercentSalary.
    const input: HraCalcInput = { basicSalary: 600_000, da: 0, hraReceived: 500_000, rentPaid: 360_000, city: "metro" }
    const result = computeHraExemption(input, FY)
    expect(result.rentMinusTenPercentSalary).toBe(300_000)
    expect(result.percentOfSalary).toBe(300_000)
    expect(result.bindingConstraint).toBe("rentMinusTenPercentSalary")
  })

  it("throws for invalid input", () => {
    expect(() => computeHraExemption({ basicSalary: -1, da: 0, hraReceived: 0, rentPaid: 0, city: "metro" }, FY)).toThrow(RangeError)
  })

  it("throws for an unregistered financial year", () => {
    const input: HraCalcInput = { basicSalary: 600_000, da: 0, hraReceived: 200_000, rentPaid: 400_000, city: "metro" }
    expect(() => computeHraExemption(input, "2030-31")).toThrow(RangeError)
  })
})
