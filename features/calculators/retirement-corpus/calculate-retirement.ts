import { findLastMatching } from "@/utils/array"

import { validateRetirementInput } from "./retirement-schema"
import type {
  RetirementAccumulationScheduleRow,
  RetirementDecumulationMonthlyRow,
  RetirementDecumulationScheduleRow,
  RetirementInput,
  RetirementResult,
} from "./retirement-types"

/**
 * Sprint 23 design decisions (Retirement Corpus Calculator). This calculator composes an
 * accumulation phase (SIP-shaped) with a decumulation phase (SWP-shaped) into one connected
 * projection, so the decisions below matter more than usual and are written out in full.
 *
 * (1) SWP-reuse vs. independent module: INDEPENDENT. `calculateSWP`/`generateSWPMonthlySchedule`
 *     (features/calculators/swp/calculate-swp.ts) take a single constant `monthlyWithdrawal:number`
 *     on a stable, separately-tested, separately-published `SWPInput` contract. This calculator's
 *     retirement-phase withdrawal is NOT constant: it must grow once per year with inflation
 *     (see decision 3). Bending SWP's function to accept a per-year withdrawal target would mean
 *     either widening SWPInput's public contract for a feature it doesn't otherwise need, or adding
 *     a parallel overload purely for this caller — infrastructure the SWP feature has no need of
 *     itself ("no infrastructure before need"). A ~20-line month loop is cheaper and clearer than
 *     that coupling, so `generateRetirementDecumulationMonthlySchedule` below is a self-contained
 *     function. It deliberately COPIES SWP's timing convention (withdraw first, then grow only the
 *     remainder; clamp the final withdrawal to the available balance; never let the balance go
 *     negative) so that setting inflation to 0% here is directly comparable to an equivalent SWP
 *     scenario — the convention is shared for consistency across the app, the code is not.
 *     ("One source of truth per domain" is preserved because the *domain* here is genuinely
 *     different — inflation-escalating decumulation, not fixed decumulation — not because the two
 *     calculators happen to share a recurrence shape.)
 *
 * (2) Single vs. dual return rate: DUAL, both effectively optional. `expectedReturnPreRetirement`
 *     and `expectedReturnPostRetirement` are both plain required fields on RetirementInput (pure
 *     calculation functions stay simple: no in-function defaulting, no nullable branches — see
 *     AGENTS.md "Calculation functions must not ... mutate input" spirit). The "optional" part lives
 *     one layer up: RETIREMENT_DEFAULT_INPUT sets expectedReturnPostRetirement equal to
 *     expectedReturnPreRetirement, and the form pre-fills the post-retirement field with whatever
 *     the user enters for the pre-retirement field until they explicitly change it (see
 *     retirement-calculator.tsx). So the simple single-rate case costs the user zero extra input —
 *     they can ignore the second field entirely — while a user who wants the realistic split
 *     (growth-oriented pre-retirement allocation vs. a more conservative post-retirement one, which
 *     is standard retirement-planning practice) can edit it. This avoids threading an
 *     optional/nullable rate through validation, URL state, and the pure calculator just to save one
 *     field most users will leave alone anyway.
 *
 * (3) Inflation-adjusted withdrawal, and where "today's money" is anchored (the crux of the
 *     no-double-counting requirement): `desiredMonthlyWithdrawal` is defined as the YEAR-1-OF-
 *     RETIREMENT nominal monthly withdrawal — i.e. "today's money" means money at the moment
 *     retirement begins, not money at the user's current age. For retirement year y (y = 1 is the
 *     first year of retirement):
 *       nominalMonthlyWithdrawal(y) = desiredMonthlyWithdrawal × (1 + inflationRate/100)^(y − 1)
 *     This is the ONLY place inflationRate is used anywhere in this module. It is never applied to
 *     the accumulation phase and never applied a second time to escalate the target from the user's
 *     current age forward to retirement age. That second application would be an equally defensible
 *     reading of "today's money" (today = right now, not today = retirement day), and picking it
 *     would silently compound the same inflation rate across two different spans (now→retirement,
 *     then year-over-year within retirement) for what a user would likely describe as one inflation
 *     assumption. Anchoring "today" at retirement avoids that ambiguity entirely rather than
 *     resolving it with extra logic, keeps the accumulation phase free of any inflation input (it
 *     only ever sees the pre-retirement return), and is called out explicitly here because it is the
 *     one place this sprint's "no double-counting" requirement was genuinely easy to get wrong.
 *
 * (4) Accumulation timing: beginning-of-month contribution, matching calculateSIP/calculateStepUpSIP
 *     — `balance = (balance + contribution) * (1 + monthlyRate)` each month. `currentSavings` (the
 *     lump sum already saved) is folded into the SAME monthly-compounding loop as the contributions,
 *     rather than compounded annually the way calculateLumpsum does its lump sum. This is a
 *     deliberate deviation from Lumpsum's annual convention: the lump sum and the contributions grow
 *     side by side on one balance, so they must share one clock, and SIP's monthly clock is the one
 *     that also has to represent the contributions correctly.
 *
 * (5) Accumulation → retirement handoff: `corpusAtRetirement` is computed exactly once, inside
 *     `generateAccumulationSchedule`, as the closing balance of the last accumulation month. That
 *     same JS number is passed as the `openingBalance` argument into
 *     `generateRetirementDecumulationMonthlySchedule` and assigned to `RetirementResult.corpusAtRetirement`
 *     — there is no second computation, rounding, or re-derivation anywhere in this file. The
 *     accumulation schedule's final `yearEndBalance` and the decumulation schedule's first
 *     `openingBalance` are therefore the same value by construction, which
 *     `__tests__/calculate-retirement.test.ts` asserts with exact (`toBe`) equality, not `toBeCloseTo`.
 *
 * (6) No double-counting of time: contributions run for exactly `retirementAge − currentAge` years
 *     and stop the instant that loop ends; withdrawals run for exactly `lifeExpectancy − retirementAge`
 *     years starting from the very next month. The two loops never overlap and never share a month.
 */

function generateAccumulationSchedule(input: RetirementInput): {
  schedule: readonly RetirementAccumulationScheduleRow[]
  corpusAtRetirement: number
  totalContributions: number
} {
  const months = (input.retirementAge - input.currentAge) * 12
  const rate = input.expectedReturnPreRetirement / 12 / 100
  const rows: RetirementAccumulationScheduleRow[] = []
  let balance = input.currentSavings
  let invested = 0
  let yearContribution = 0
  for (let month = 1; month <= months; month++) {
    balance = (balance + input.monthlyContribution) * (1 + rate)
    invested += input.monthlyContribution
    yearContribution += input.monthlyContribution
    if (month % 12 === 0) {
      const year = month / 12
      const cumulativeInvestment = input.currentSavings + invested
      rows.push({
        year,
        age: input.currentAge + year,
        contributionThisYear: yearContribution,
        cumulativeInvestment,
        yearEndBalance: balance,
        gainToDate: balance - cumulativeInvestment,
      })
      yearContribution = 0
    }
  }
  return { schedule: rows, corpusAtRetirement: balance, totalContributions: invested }
}

export function generateRetirementDecumulationMonthlySchedule(input: RetirementInput, openingBalance: number): readonly RetirementDecumulationMonthlyRow[] {
  const months = (input.lifeExpectancy - input.retirementAge) * 12
  const rate = input.expectedReturnPostRetirement / 12 / 100
  const rows: RetirementDecumulationMonthlyRow[] = []
  let balance = openingBalance
  for (let month = 1; month <= months; month++) {
    const yearIndex = Math.ceil(month / 12)
    const targetWithdrawal = input.desiredMonthlyWithdrawal * Math.pow(1 + input.inflationRate / 100, yearIndex - 1)
    const opening = balance
    const withdrawal = Math.min(targetWithdrawal, Math.max(0, opening))
    const balanceAfterWithdrawal = opening - withdrawal
    const growth = balanceAfterWithdrawal * rate
    const closingBalance = Math.max(0, balanceAfterWithdrawal + growth)
    rows.push({ month, year: yearIndex, openingBalance: opening, targetWithdrawal, withdrawal, growth, closingBalance })
    balance = closingBalance
  }
  return rows
}

function aggregateDecumulationYearlySchedule(monthlyRows: readonly RetirementDecumulationMonthlyRow[], retirementAge: number, exhaustionMonth: number | null): readonly RetirementDecumulationScheduleRow[] {
  const rows: RetirementDecumulationScheduleRow[] = []
  for (let index = 0; index < monthlyRows.length; index += 12) {
    const yearRows = monthlyRows.slice(index, index + 12)
    const year = yearRows[0].year
    rows.push({
      year,
      age: retirementAge + year,
      openingBalance: yearRows[0].openingBalance,
      monthlyWithdrawalThisYear: yearRows[0].targetWithdrawal,
      withdrawalsInYear: yearRows.reduce((sum, row) => sum + row.withdrawal, 0),
      growthInYear: yearRows.reduce((sum, row) => sum + row.growth, 0),
      closingBalance: yearRows[yearRows.length - 1].closingBalance,
      isExhaustionYear: exhaustionMonth !== null && exhaustionMonth > index && exhaustionMonth <= index + 12,
    })
  }
  return rows
}

export function calculateRetirement(input: RetirementInput): RetirementResult {
  if (!validateRetirementInput(input).success) throw new RangeError("Invalid Retirement Corpus input")

  const { schedule: accumulationSchedule, corpusAtRetirement, totalContributions } = generateAccumulationSchedule(input)

  const monthlyDecumulation = generateRetirementDecumulationMonthlySchedule(input, corpusAtRetirement)
  const totalWithdrawn = monthlyDecumulation.reduce((sum, row) => sum + row.withdrawal, 0)
  const totalGrowthInRetirement = monthlyDecumulation.reduce((sum, row) => sum + row.growth, 0)
  const remainingBalanceAtLifeExpectancy = monthlyDecumulation.length ? monthlyDecumulation[monthlyDecumulation.length - 1].closingBalance : corpusAtRetirement
  const exhaustionRow = monthlyDecumulation.find((row) => row.openingBalance > 0 && row.closingBalance === 0)
  const exhaustionMonth = exhaustionRow ? exhaustionRow.month : null
  const isExhausted = exhaustionMonth !== null
  const exhaustionYear = exhaustionMonth !== null ? Math.ceil(exhaustionMonth / 12) : null
  const exhaustionAge = exhaustionYear !== null ? input.retirementAge + exhaustionYear : null
  const lastWithdrawalRow = findLastMatching(monthlyDecumulation, (row) => row.withdrawal > 0)
  const finalMonthlyWithdrawal = lastWithdrawalRow ? lastWithdrawalRow.withdrawal : 0
  const decumulationSchedule = aggregateDecumulationYearlySchedule(monthlyDecumulation, input.retirementAge, exhaustionMonth)
  const firstYearMonthlyWithdrawal = monthlyDecumulation.length ? monthlyDecumulation[0].targetWithdrawal : input.desiredMonthlyWithdrawal

  const result: RetirementResult = {
    yearsToRetirement: input.retirementAge - input.currentAge,
    retirementDurationYears: input.lifeExpectancy - input.retirementAge,
    totalContributions,
    corpusAtRetirement,
    totalGainAtRetirement: corpusAtRetirement - input.currentSavings - totalContributions,
    accumulationSchedule,
    firstYearMonthlyWithdrawal,
    totalWithdrawn,
    totalGrowthInRetirement,
    remainingBalanceAtLifeExpectancy,
    decumulationSchedule,
    isExhausted,
    exhaustionMonth,
    exhaustionYear,
    exhaustionAge,
    finalMonthlyWithdrawal,
    corpusLastsFullDuration: !isExhausted,
  }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("Retirement Corpus calculation produced a non-finite result")
  return result
}
