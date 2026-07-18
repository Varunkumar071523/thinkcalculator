import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import type { FDInput } from "@/features/calculators/fd/fd-types"

export type FDYearlyScheduleRow = {
  readonly year: number
  readonly monthsElapsed: number
  readonly maturityAmount: number
  readonly interestEarned: number
  readonly yearlyGrowth: number
}

/** One row per elapsed year (a trailing partial year keeps its own row), so an FD's growth reads
 * as maturity value over time rather than the month-by-month/compounding-period detail. */
function yearlyMonthPoints(totalMonths: number): readonly number[] {
  const points: number[] = []
  for (let month = 12; month < totalMonths; month += 12) points.push(month)
  points.push(totalMonths)
  return points
}

export function calculateFDYearlySchedule(input: FDInput): readonly FDYearlyScheduleRow[] {
  const result = calculateFD(input)
  const rate = input.annualInterestRate / 100
  let previousMaturity = input.principalAmount

  return yearlyMonthPoints(result.totalMonths).map((monthsElapsed, index) => {
    const maturityAmount = rate === 0
      ? input.principalAmount
      : input.principalAmount * Math.pow(
        1 + rate / result.compoundingPeriodsPerYear,
        result.compoundingPeriodsPerYear * (monthsElapsed / 12),
      )
    const yearlyGrowth = maturityAmount - previousMaturity
    previousMaturity = maturityAmount

    return {
      year: index + 1,
      monthsElapsed,
      maturityAmount,
      interestEarned: maturityAmount - input.principalAmount,
      yearlyGrowth,
    }
  })
}
