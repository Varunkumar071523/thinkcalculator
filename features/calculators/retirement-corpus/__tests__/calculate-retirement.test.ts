import { describe, expect, it } from "vitest"
import { calculateRetirement, generateRetirementDecumulationMonthlySchedule } from "../calculate-retirement"
import type { RetirementInput } from "../retirement-types"

const base: RetirementInput = {
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

// Independent closed-form cross-check for the accumulation phase: future value of a lump sum plus
// a beginning-of-month ordinary-annuity-due contribution, derived algebraically and implemented
// separately from calculateRetirement's iterative month loop.
function independentAccumulationFV(currentSavings: number, monthlyContribution: number, annualReturnPercent: number, months: number) {
  const rate = annualReturnPercent / 12 / 100
  if (rate === 0) return currentSavings + monthlyContribution * months
  const growthFactor = Math.pow(1 + rate, months)
  return currentSavings * growthFactor + monthlyContribution * ((growthFactor - 1) / rate) * (1 + rate)
}

// Independent closed-form cross-check for a single retirement year that is fully insulated from
// exhaustion (opening balance never hits zero mid-year): present-value-of-a-growing-annuity style
// balance recurrence for "withdraw first, then grow the remainder" with a withdrawal fixed for that
// year, solved algebraically rather than iterated.
function independentYearEndBalance(openingBalance: number, monthlyWithdrawal: number, monthlyRate: number) {
  if (monthlyRate === 0) return openingBalance - monthlyWithdrawal * 12
  const growthFactor = Math.pow(1 + monthlyRate, 12)
  return growthFactor * openingBalance - monthlyWithdrawal * (1 + monthlyRate) * (growthFactor - 1) / monthlyRate
}

describe("calculateRetirement — accumulation phase", () => {
  it("matches an independently derived future-value-of-annuity closed form", () => {
    const scenarios: RetirementInput[] = [
      base,
      { ...base, expectedReturnPreRetirement: 0 },
      { ...base, currentSavings: 0 },
      { ...base, monthlyContribution: 0 },
      { ...base, currentAge: 59, retirementAge: 60 },
    ]
    for (const scenario of scenarios) {
      const result = calculateRetirement(scenario)
      const months = (scenario.retirementAge - scenario.currentAge) * 12
      const expected = independentAccumulationFV(scenario.currentSavings, scenario.monthlyContribution, scenario.expectedReturnPreRetirement, months)
      expect(result.corpusAtRetirement).toBeCloseTo(expected, 4)
    }
  })

  it("reconciles cumulative investment and gain-to-date across every accumulation row", () => {
    const result = calculateRetirement(base)
    result.accumulationSchedule.forEach((row, index) => {
      const previousCumulativeInvestment = index ? result.accumulationSchedule[index - 1].cumulativeInvestment : base.currentSavings
      expect(row.cumulativeInvestment).toBeCloseTo(previousCumulativeInvestment + row.contributionThisYear, 6)
      expect(row.gainToDate).toBeCloseTo(row.yearEndBalance - row.cumulativeInvestment, 6)
    })
    const last = result.accumulationSchedule.at(-1)!
    expect(last.cumulativeInvestment).toBeCloseTo(base.currentSavings + result.totalContributions, 6)
    expect(last.yearEndBalance).toBeCloseTo(result.corpusAtRetirement, 10)
  })

  it("treats zero current savings as a pure-contribution scenario (starting from scratch)", () => {
    const result = calculateRetirement({ ...base, currentSavings: 0 })
    expect(result.accumulationSchedule[0].cumulativeInvestment).toBe(base.monthlyContribution * 12)
    expect(result.corpusAtRetirement).toBeGreaterThan(0)
  })

  it("treats zero monthly contribution as a pure lump-sum scenario", () => {
    const result = calculateRetirement({ ...base, monthlyContribution: 0 })
    expect(result.totalContributions).toBe(0)
    result.accumulationSchedule.forEach((row) => expect(row.cumulativeInvestment).toBe(base.currentSavings))
    expect(result.corpusAtRetirement).toBeCloseTo(base.currentSavings * Math.pow(1 + base.expectedReturnPreRetirement / 12 / 100, (base.retirementAge - base.currentAge) * 12), 4)
  })

  it("handles a very short (1 year) time to retirement without precision loss", () => {
    const result = calculateRetirement({ ...base, currentAge: 59, retirementAge: 60 })
    expect(result.yearsToRetirement).toBe(1)
    expect(result.accumulationSchedule).toHaveLength(1)
    expect(result.corpusAtRetirement).toBeGreaterThan(base.currentSavings)
  })
})

describe("calculateRetirement — accumulation-to-retirement handoff", () => {
  it("uses the exact same number for corpusAtRetirement, the last accumulation row, and the first decumulation opening balance", () => {
    for (const scenario of [base, { ...base, monthlyContribution: 0 }, { ...base, currentSavings: 0 }]) {
      const result = calculateRetirement(scenario)
      const lastAccumulationRow = result.accumulationSchedule.at(-1)!
      const firstDecumulationRow = result.decumulationSchedule[0]
      expect(lastAccumulationRow.yearEndBalance).toBe(result.corpusAtRetirement)
      expect(firstDecumulationRow.openingBalance).toBe(result.corpusAtRetirement)
      expect(firstDecumulationRow.openingBalance).toBe(lastAccumulationRow.yearEndBalance)
    }
  })

  it("does not let contributions and withdrawals overlap in time", () => {
    const result = calculateRetirement(base)
    expect(result.accumulationSchedule).toHaveLength(result.yearsToRetirement)
    expect(result.decumulationSchedule).toHaveLength(result.retirementDurationYears)
    expect(result.accumulationSchedule.at(-1)!.age).toBe(base.retirementAge)
    expect(result.decumulationSchedule[0].age).toBe(base.retirementAge + 1)
  })
})

describe("calculateRetirement — retirement (decumulation) phase", () => {
  it("escalates the nominal monthly withdrawal by the inflation rate once per year, anchored at retirement", () => {
    const monthly = generateRetirementDecumulationMonthlySchedule(base, 100_000_000)
    expect(monthly[0].targetWithdrawal).toBe(base.desiredMonthlyWithdrawal)
    expect(monthly[11].targetWithdrawal).toBe(base.desiredMonthlyWithdrawal)
    expect(monthly[12].targetWithdrawal).toBeCloseTo(base.desiredMonthlyWithdrawal * 1.06, 8)
    expect(monthly[23].targetWithdrawal).toBeCloseTo(base.desiredMonthlyWithdrawal * 1.06, 8)
    expect(monthly[24].targetWithdrawal).toBeCloseTo(base.desiredMonthlyWithdrawal * Math.pow(1.06, 2), 8)
  })

  it("keeps the withdrawal nominally flat at 0% inflation, matching the Inflation calculator's own 0% behaviour", () => {
    const monthly = generateRetirementDecumulationMonthlySchedule({ ...base, inflationRate: 0 }, 100_000_000)
    for (const row of monthly) expect(row.targetWithdrawal).toBe(base.desiredMonthlyWithdrawal)
  })

  it("matches an independently derived present-value-of-growing-annuity closed form for a year insulated from exhaustion", () => {
    const openingBalance = 50_000_000
    const monthlyRate = base.expectedReturnPostRetirement / 12 / 100
    const monthly = generateRetirementDecumulationMonthlySchedule(base, openingBalance)
    const expectedYearEnd = independentYearEndBalance(openingBalance, base.desiredMonthlyWithdrawal, monthlyRate)
    expect(monthly[11].closingBalance).toBeCloseTo(expectedYearEnd, 4)
  })

  it("reconciles total withdrawn, remaining balance, and total growth against the opening corpus", () => {
    for (const scenario of [base, { ...base, expectedReturnPostRetirement: 0 }, { ...base, inflationRate: 0 }, { ...base, inflationRate: -3 }]) {
      const result = calculateRetirement(scenario)
      expect(result.totalWithdrawn + result.remainingBalanceAtLifeExpectancy - result.corpusAtRetirement).toBeCloseTo(result.totalGrowthInRetirement, 4)
      const scheduleWithdrawn = result.decumulationSchedule.reduce((sum, row) => sum + row.withdrawalsInYear, 0)
      const scheduleGrowth = result.decumulationSchedule.reduce((sum, row) => sum + row.growthInYear, 0)
      expect(scheduleWithdrawn).toBeCloseTo(result.totalWithdrawn, 4)
      expect(scheduleGrowth).toBeCloseTo(result.totalGrowthInRetirement, 4)
      expect(result.decumulationSchedule.at(-1)?.closingBalance).toBeCloseTo(result.remainingBalanceAtLifeExpectancy, 4)
    }
  })

  it("reports a corpus exhausted before life expectancy without letting the balance go negative", () => {
    const scenario: RetirementInput = { ...base, currentSavings: 50_000, monthlyContribution: 500, desiredMonthlyWithdrawal: 8_000, expectedReturnPostRetirement: 4 }
    const result = calculateRetirement(scenario)
    expect(result.isExhausted).toBe(true)
    expect(result.corpusLastsFullDuration).toBe(false)
    expect(result.exhaustionMonth).not.toBeNull()
    expect(result.exhaustionYear).not.toBeNull()
    expect(result.exhaustionAge).toBe(base.retirementAge + result.exhaustionYear!)
    expect(result.remainingBalanceAtLifeExpectancy).toBe(0)
    result.decumulationSchedule.forEach((row) => expect(row.closingBalance).toBeGreaterThanOrEqual(0))
    expect(result.decumulationSchedule).toHaveLength(result.retirementDurationYears)
    const exhaustionRow = result.decumulationSchedule.find((row) => row.isExhaustionYear)
    expect(exhaustionRow).toBeDefined()
  })

  it("reports a surplus when the corpus outlasts life expectancy", () => {
    const result = calculateRetirement(base)
    expect(result.isExhausted).toBe(false)
    expect(result.corpusLastsFullDuration).toBe(true)
    expect(result.exhaustionMonth).toBeNull()
    expect(result.exhaustionYear).toBeNull()
    expect(result.exhaustionAge).toBeNull()
    expect(result.remainingBalanceAtLifeExpectancy).toBeGreaterThan(0)
  })

  it("handles a very long (40+ year) retirement duration without precision loss", () => {
    const scenario: RetirementInput = { ...base, retirementAge: 40, lifeExpectancy: 85 }
    const result = calculateRetirement(scenario)
    expect(result.retirementDurationYears).toBe(45)
    expect(result.decumulationSchedule).toHaveLength(45)
    expect(Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)).toBe(true)
  })
})

describe("calculateRetirement — validation and safety", () => {
  it("rejects invalid input", () => {
    expect(() => calculateRetirement({ ...base, currentAge: 10 })).toThrow(RangeError)
    expect(() => calculateRetirement({ ...base, retirementAge: base.currentAge })).toThrow(RangeError)
    expect(() => calculateRetirement({ ...base, lifeExpectancy: base.retirementAge })).toThrow(RangeError)
  })

  it("keeps long-duration, high-rate combinations finite and does not mutate input", () => {
    const scenario: RetirementInput = { ...base, currentAge: 18, retirementAge: 75, lifeExpectancy: 110, expectedReturnPreRetirement: 20, expectedReturnPostRetirement: 20, inflationRate: 5 }
    const before = { ...scenario }
    const result = calculateRetirement(scenario)
    expect(Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)).toBe(true)
    expect(scenario).toEqual(before)
  })
})
