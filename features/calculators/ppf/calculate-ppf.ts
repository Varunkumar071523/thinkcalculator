import { validatePPFInput } from "./ppf-schema"
import type { PPFInput, PPFResult, PPFScheduleRow } from "./ppf-types"

export function calculatePPF(input: PPFInput): PPFResult {
  const validation = validatePPFInput(input)
  if (!validation.success) throw new RangeError("Invalid PPF input")
  const { annualContribution, assumedAnnualInterestRate, durationYears } = validation.data
  const rate = assumedAnnualInterestRate / 100
  const schedule: PPFScheduleRow[] = []
  let openingBalance = 0
  let totalInterest = 0
  for (let year = 1; year <= durationYears; year += 1) {
    const eligibleBalance = openingBalance + annualContribution
    const interestEarned = eligibleBalance * rate
    const closingBalance = eligibleBalance + interestEarned
    if (![eligibleBalance, interestEarned, closingBalance].every(Number.isFinite)) throw new RangeError("PPF calculation produced a non-finite result")
    schedule.push({ year, openingBalance, contribution: annualContribution, interestEarned, closingBalance })
    totalInterest += interestEarned
    openingBalance = closingBalance
  }
  const totalContributions = annualContribution * durationYears
  const maturityValue = openingBalance
  if (!Number.isFinite(totalInterest) || Math.abs((maturityValue - totalContributions) - totalInterest) > Math.max(1, maturityValue) * Number.EPSILON * durationYears) {
    throw new RangeError("PPF schedule totals did not reconcile")
  }
  return { ...validation.data, totalContributions, totalInterest, maturityValue, schedule }
}
