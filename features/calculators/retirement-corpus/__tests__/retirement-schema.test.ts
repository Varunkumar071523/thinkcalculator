import { describe, expect, it } from "vitest"
import { parseAndValidateRetirementForm, parseRetirementNumericText, validateRetirementInput } from "../retirement-schema"
import type { RetirementInput } from "../retirement-types"

const valid: RetirementInput = {
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  currentSavings: 500_000,
  monthlyContribution: 15_000,
  expectedReturnPreRetirement: 10,
  expectedReturnPostRetirement: 10,
  desiredMonthlyWithdrawal: 50_000,
  inflationRate: 6,
}

describe("Retirement Corpus validation", () => {
  it("strictly parses plain decimals", () => {
    for (const value of ["0", "0.01", ".5", "1000", "7.50"]) expect(parseRetirementNumericText(value)).toBe(Number(value))
    for (const value of ["", " ", " 10", "10 ", "1,000", "₹1000", "+10", "-10", "1e3", "1.", ".", "NaN", "Infinity"]) expect(parseRetirementNumericText(value)).toBeNull()
  })

  it("optionally allows a leading '-' only when explicitly requested (for inflationRate)", () => {
    expect(parseRetirementNumericText("-6", true)).toBe(-6)
    expect(parseRetirementNumericText("-6", false)).toBeNull()
    expect(parseRetirementNumericText("-6.5", true)).toBe(-6.5)
  })

  it("accepts the baseline valid input", () => { expect(validateRetirementInput(valid).success).toBe(true) })

  it("accepts boundary values", () => {
    expect(validateRetirementInput({ ...valid, currentAge: 18 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, currentAge: 75, retirementAge: 76, lifeExpectancy: 77 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, retirementAge: 80, currentAge: 75, lifeExpectancy: 81 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, currentAge: 75, retirementAge: 80, lifeExpectancy: 110 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, currentSavings: 0 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, monthlyContribution: 0 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, expectedReturnPreRetirement: 0 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, expectedReturnPostRetirement: 0 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, inflationRate: -10 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, inflationRate: 0 }).success).toBe(true)
    expect(validateRetirementInput({ ...valid, desiredMonthlyWithdrawal: 100 }).success).toBe(true)
  })

  it("requires retirement age to be strictly after current age", () => {
    expect(validateRetirementInput({ ...valid, currentAge: 60, retirementAge: 60 }).success).toBe(false)
    expect(validateRetirementInput({ ...valid, currentAge: 61, retirementAge: 60 }).success).toBe(false)
    expect(validateRetirementInput({ ...valid, currentAge: 59, retirementAge: 60 }).success).toBe(true)
  })

  it("requires life expectancy to be strictly after retirement age", () => {
    expect(validateRetirementInput({ ...valid, retirementAge: 85, lifeExpectancy: 85 }).success).toBe(false)
    expect(validateRetirementInput({ ...valid, retirementAge: 86, lifeExpectancy: 85 }).success).toBe(false)
  })

  it.each([
    { currentAge: 17 }, { currentAge: 76 },
    { retirementAge: 18 }, { retirementAge: 81 },
    { lifeExpectancy: 19 }, { lifeExpectancy: 111 },
    { currentAge: 30.5 }, { retirementAge: 60.5 }, { lifeExpectancy: 85.5 },
    { currentSavings: -1 }, { monthlyContribution: -1 },
    { expectedReturnPreRetirement: -1 }, { expectedReturnPreRetirement: 51 },
    { expectedReturnPostRetirement: -1 }, { expectedReturnPostRetirement: 51 },
    { desiredMonthlyWithdrawal: 99 }, { desiredMonthlyWithdrawal: 10_000_001 },
    { inflationRate: -11 }, { inflationRate: 51 },
  ])("rejects invalid input %o", (change) => expect(validateRetirementInput({ ...valid, ...change }).success).toBe(false))

  it("rejects non-finite values", () => {
    expect(validateRetirementInput({ ...valid, currentSavings: Infinity }).success).toBe(false)
    expect(validateRetirementInput({ ...valid, monthlyContribution: Number.NaN }).success).toBe(false)
  })

  it("rejects combinations that would grow the projected corpus beyond a safe range", () => {
    const result = validateRetirementInput({ ...valid, currentAge: 18, retirementAge: 75, expectedReturnPreRetirement: 50, monthlyContribution: 10_000_000, currentSavings: 1_000_000_000 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.monthlyContribution).toBeDefined()
  })

  it("rejects combinations that would grow the inflation-adjusted withdrawal beyond a safe range", () => {
    const result = validateRetirementInput({ ...valid, currentAge: 18, retirementAge: 19, lifeExpectancy: 110, inflationRate: 50, desiredMonthlyWithdrawal: 10_000_000 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.inflationRate).toBeDefined()
  })

  it("rejects malformed form text without losing field-specific errors", () => {
    const result = parseAndValidateRetirementForm({
      currentAge: "1e1", retirementAge: " ", lifeExpectancy: "85",
      currentSavings: "5,00,000", monthlyContribution: "15000",
      expectedReturnPreRetirement: "10", expectedReturnPostRetirement: "10",
      desiredMonthlyWithdrawal: "50000", inflationRate: "6 ",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(Object.keys(result.errors).sort()).toEqual(["currentAge", "currentSavings", "inflationRate", "retirementAge"])
  })

  it("parses a valid form", () => {
    const result = parseAndValidateRetirementForm({
      currentAge: "30", retirementAge: "60", lifeExpectancy: "85",
      currentSavings: "500000", monthlyContribution: "15000",
      expectedReturnPreRetirement: "10", expectedReturnPostRetirement: "10",
      desiredMonthlyWithdrawal: "50000", inflationRate: "6",
    })
    expect(result).toEqual({ success: true, data: valid })
  })

  it("parses a form with a negative inflation rate", () => {
    const result = parseAndValidateRetirementForm({
      currentAge: "30", retirementAge: "60", lifeExpectancy: "85",
      currentSavings: "500000", monthlyContribution: "15000",
      expectedReturnPreRetirement: "10", expectedReturnPostRetirement: "10",
      desiredMonthlyWithdrawal: "50000", inflationRate: "-2",
    })
    expect(result).toEqual({ success: true, data: { ...valid, inflationRate: -2 } })
  })
})
