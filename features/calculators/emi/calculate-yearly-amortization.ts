import type { AmortizationRow } from "@/features/calculators/emi/emi-types"

export type YearlyAmortizationRow = {
  readonly year: number
  readonly principalPaid: number
  readonly interestPaid: number
  readonly yearlyTotal: number
  readonly balanceRemaining: number
}

/** Rolls a monthly amortization schedule up into one row per 12 payments (a trailing partial year keeps its own row). */
export function calculateYearlyAmortization(monthlySchedule: readonly AmortizationRow[]): readonly YearlyAmortizationRow[] {
  const rows: YearlyAmortizationRow[] = []

  for (let start = 0; start < monthlySchedule.length; start += 12) {
    const yearMonths = monthlySchedule.slice(start, start + 12)
    const principalPaid = yearMonths.reduce((sum, month) => sum + month.principalPaid, 0)
    const interestPaid = yearMonths.reduce((sum, month) => sum + month.interestPaid, 0)
    const balanceRemaining = yearMonths[yearMonths.length - 1].closingBalance

    rows.push({
      year: rows.length + 1,
      principalPaid,
      interestPaid,
      yearlyTotal: principalPaid + interestPaid,
      balanceRemaining,
    })
  }

  return rows
}
