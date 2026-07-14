import { validateSWPInput } from "./swp-schema"
import type { SWPInput, SWPMonthlyScheduleRow, SWPResult, SWPYearlyScheduleRow } from "./swp-types"

// Safety cap for "until balance is exhausted" mode: when the withdrawal amount is at or below the
// growth the corpus generates, the balance never reaches zero and would otherwise simulate forever.
// 1200 months (100 years) is treated as effectively perpetual; calculateSWP reports this via
// `cappedAtMaxDuration` instead of an unbounded loop or a fabricated "infinite" duration.
export const SWP_MAX_SIMULATION_MONTHS = 1_200

/**
 * Pure month-by-month SWP schedule generator. Explicit timing/growth/depletion decisions:
 *
 * (a) Withdrawal timing: BEGINNING-of-month. The requested withdrawal is taken out of the opening
 *     balance before that month's growth is calculated. This is the more common convention for
 *     illustrating retirement/decumulation income (money is drawn for the month's expenses first)
 *     and is also the conservative choice for corpus longevity versus an end-of-month withdrawal.
 * (b) Growth accrual: returns for the month are calculated AFTER the withdrawal, only on the balance
 *     that remains once the withdrawal has been taken (never on the amount just withdrawn).
 * (c) Partial final withdrawal: if the opening balance is less than the requested monthly withdrawal,
 *     only the available balance is withdrawn (min(requested, opening)) rather than over-withdrawing
 *     into a negative balance or throwing.
 * (d) Exhaustion representation: the balance is floored at zero and never goes negative. In
 *     "untilExhausted" mode, schedule generation stops at the exact month the balance first reaches
 *     zero. In "fixedDuration" mode, generation continues for the full selected duration with
 *     zero-withdrawal, zero-growth rows once the balance has reached zero, so the schedule always has
 *     one row per selected month.
 */
export function generateSWPMonthlySchedule(input: SWPInput): readonly SWPMonthlyScheduleRow[] {
  const rate = input.expectedAnnualReturn / 12 / 100
  const monthLimit = input.withdrawalMode === "fixedDuration" ? input.durationYears * 12 : SWP_MAX_SIMULATION_MONTHS
  const rows: SWPMonthlyScheduleRow[] = []
  let balance = input.initialInvestment
  for (let month = 1; month <= monthLimit; month++) {
    if (balance <= 0 && input.withdrawalMode === "untilExhausted") break
    const openingBalance = balance
    const withdrawal = Math.min(input.monthlyWithdrawal, openingBalance)
    const balanceAfterWithdrawal = openingBalance - withdrawal
    const growth = balanceAfterWithdrawal * rate
    const closingBalance = Math.max(0, balanceAfterWithdrawal + growth)
    rows.push({ month, year: Math.ceil(month / 12), openingBalance, withdrawal, growth, closingBalance })
    balance = closingBalance
  }
  return rows
}

function aggregateSWPYearlySchedule(monthlyRows: readonly SWPMonthlyScheduleRow[], exhaustionMonth: number | null): readonly SWPYearlyScheduleRow[] {
  const rows: SWPYearlyScheduleRow[] = []
  for (let index = 0; index < monthlyRows.length; index += 12) {
    const yearRows = monthlyRows.slice(index, index + 12)
    const withdrawalsInYear = yearRows.reduce((sum, row) => sum + row.withdrawal, 0)
    const growthInYear = yearRows.reduce((sum, row) => sum + row.growth, 0)
    rows.push({
      year: yearRows[0].year,
      openingBalance: yearRows[0].openingBalance,
      withdrawalsInYear,
      growthInYear,
      closingBalance: yearRows[yearRows.length - 1].closingBalance,
      isExhaustionYear: exhaustionMonth !== null && exhaustionMonth > index && exhaustionMonth <= index + 12,
    })
  }
  return rows
}

export function calculateSWP(input: SWPInput): SWPResult {
  if (!validateSWPInput(input).success) throw new RangeError("Invalid SWP input")
  const monthlyRows = generateSWPMonthlySchedule(input)
  const totalWithdrawn = monthlyRows.reduce((sum, row) => sum + row.withdrawal, 0)
  const totalGrowth = monthlyRows.reduce((sum, row) => sum + row.growth, 0)
  const remainingBalance = monthlyRows.length ? monthlyRows[monthlyRows.length - 1].closingBalance : input.initialInvestment
  const exhaustionRow = monthlyRows.find((row) => row.openingBalance > 0 && row.closingBalance === 0)
  const exhaustionMonth = exhaustionRow ? exhaustionRow.month : null
  const isExhausted = exhaustionMonth !== null
  const lastWithdrawalRow = monthlyRows.findLast((row) => row.withdrawal > 0)
  const finalWithdrawalAmount = lastWithdrawalRow ? lastWithdrawalRow.withdrawal : 0
  const cappedAtMaxDuration = input.withdrawalMode === "untilExhausted" && !isExhausted && monthlyRows.length >= SWP_MAX_SIMULATION_MONTHS
  const schedule = aggregateSWPYearlySchedule(monthlyRows, exhaustionMonth)

  const result: SWPResult = {
    totalWithdrawn,
    totalGrowth,
    remainingBalance,
    monthsSimulated: monthlyRows.length,
    yearsSimulated: monthlyRows.length / 12,
    exhaustionMonth,
    isExhausted,
    finalWithdrawalAmount,
    cappedAtMaxDuration,
    schedule,
  }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("SWP calculation produced a non-finite result")
  return result
}
