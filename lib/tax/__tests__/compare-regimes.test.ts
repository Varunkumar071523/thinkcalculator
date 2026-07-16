import { describe, expect, it } from "vitest"

import { compareRegimes } from "../engine"
import type { CompareRegimesInput } from "../types"

describe("compareRegimes", () => {
  it("favours the old regime when heavy 80C + HRA + home loan interest deductions apply", () => {
    const input: CompareRegimesInput = {
      grossIncome: 2_000_000,
      ageBand: "below60",
      oldRegimeDeductions: {
        section80C: 150_000,
        section80D: 25_000,
        hraExemption: 200_000,
        homeLoanInterestSection24b: 200_000,
        otherSection80Deductions: 200_000,
      },
      newRegimeDeductions: { employerNpsSection80CCD2: 0 },
    }
    const result = compareRegimes(input, "2025-26")
    expect(result.beneficialRegime).toBe("old")
    expect(result.oldRegime.totalTaxLiability).toBeCloseTo(171_600, 0)
    expect(result.newRegime.totalTaxLiability).toBeCloseTo(192_400, 0)
    expect(result.savings).toBeCloseTo(20_800, 0)
  })

  it("favours the new regime when the taxpayer has few deductions and moderate income", () => {
    const input: CompareRegimesInput = {
      grossIncome: 800_000,
      ageBand: "below60",
      oldRegimeDeductions: {
        section80C: 0,
        section80D: 0,
        hraExemption: 0,
        homeLoanInterestSection24b: 0,
        otherSection80Deductions: 0,
      },
      newRegimeDeductions: { employerNpsSection80CCD2: 0 },
    }
    const result = compareRegimes(input, "2025-26")
    expect(result.beneficialRegime).toBe("new")
    expect(result.oldRegime.totalTaxLiability).toBeCloseTo(65_000, 0)
    expect(result.newRegime.totalTaxLiability).toBeCloseTo(0, 6)
    expect(result.savings).toBeCloseTo(65_000, 0)
  })

  it("runs both regimes against the same gross income and age band", () => {
    const input: CompareRegimesInput = {
      grossIncome: 1_200_000,
      ageBand: "60to80",
      oldRegimeDeductions: {
        section80C: 50_000,
        section80D: 30_000,
        hraExemption: 0,
        homeLoanInterestSection24b: 0,
        otherSection80Deductions: 0,
      },
      newRegimeDeductions: { employerNpsSection80CCD2: 0 },
    }
    const result = compareRegimes(input, "2025-26")
    expect(result.oldRegime.grossIncome).toBe(1_200_000)
    expect(result.newRegime.grossIncome).toBe(1_200_000)
    expect(result.oldRegime.ageBand).toBe("60to80")
    expect(result.newRegime.ageBand).toBe("60to80")
  })

  it("reports a non-negative savings amount regardless of which regime wins", () => {
    const input: CompareRegimesInput = {
      grossIncome: 900_000,
      ageBand: "below60",
      oldRegimeDeductions: {
        section80C: 0,
        section80D: 0,
        hraExemption: 0,
        homeLoanInterestSection24b: 0,
        otherSection80Deductions: 0,
      },
      newRegimeDeductions: { employerNpsSection80CCD2: 0 },
    }
    const result = compareRegimes(input, "2025-26")
    expect(result.savings).toBeGreaterThanOrEqual(0)
  })
})
