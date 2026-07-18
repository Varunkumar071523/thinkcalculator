import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import type { RDInput } from "@/features/calculators/rd/rd-types"

export type RDYearlyScheduleRow = {
  readonly year: number
  readonly monthsElapsed: number
  readonly totalDeposited: number
  readonly maturityAmount: number
  readonly interestEarned: number
  readonly yearlyGrowth: number
}

/** One row per elapsed year (a trailing partial year keeps its own row), so an RD's growth reads
 * as maturity value over time rather than the month-by-month/compounding-period detail. */
function yearlyMonthPoints(totalMonths: number): readonly number[] {
  const points: number[] = []
  for (let month = 12; month < totalMonths; month += 12) points.push(month)
  points.push(totalMonths)
  return points
}

export function calculateRDYearlySchedule(input: RDInput): readonly RDYearlyScheduleRow[] {
  const result = calculateRD(input)
  const rate = input.annualInterestRate / 100
  let previousMaturity = 0

  return yearlyMonthPoints(result.totalMonths).map((monthsElapsed, index) => {
    const totalDeposited = input.monthlyDeposit * monthsElapsed
    let maturityAmount = totalDeposited

    if (rate !== 0) {
      maturityAmount = 0
      for (let contributionMonth = 0; contributionMonth < monthsElapsed; contributionMonth += 1) {
        const remainingYears = (monthsElapsed - contributionMonth) / 12
        maturityAmount += input.monthlyDeposit * Math.pow(1 + rate / result.compoundingPeriodsPerYear, result.compoundingPeriodsPerYear * remainingYears)
      }
    }

    const yearlyGrowth = maturityAmount - previousMaturity
    previousMaturity = maturityAmount

    return {
      year: index + 1,
      monthsElapsed,
      totalDeposited,
      maturityAmount,
      interestEarned: maturityAmount - totalDeposited,
      yearlyGrowth,
    }
  })
}
