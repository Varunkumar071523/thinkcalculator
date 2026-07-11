import { validateRDInput } from "@/features/calculators/rd/rd-schema"
import type { RDCompoundingFrequency, RDInput, RDResult } from "@/features/calculators/rd/rd-types"

export const RD_COMPOUNDING_PERIODS: Readonly<Record<RDCompoundingFrequency, number>> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
}

export function calculateRD(input: RDInput): RDResult {
  if (!validateRDInput(input).success) throw new RangeError("Invalid RD input")

  const { monthlyDeposit, annualInterestRate, duration, durationUnit, compoundingFrequency } = input
  const totalMonths = durationUnit === "years" ? duration * 12 : duration
  const durationInYears = totalMonths / 12
  const compoundingPeriodsPerYear = RD_COMPOUNDING_PERIODS[compoundingFrequency]
  const annualRate = annualInterestRate / 100
  const totalDeposited = monthlyDeposit * totalMonths
  let maturityAmount = totalDeposited

  if (annualRate !== 0) {
    maturityAmount = 0
    for (let contributionMonth = 0; contributionMonth < totalMonths; contributionMonth += 1) {
      const remainingYears = (totalMonths - contributionMonth) / 12
      maturityAmount += monthlyDeposit * Math.pow(1 + annualRate / compoundingPeriodsPerYear, compoundingPeriodsPerYear * remainingYears)
    }
  }
  const interestEarned = maturityAmount - totalDeposited
  if (![totalDeposited, maturityAmount, interestEarned, durationInYears, compoundingPeriodsPerYear].every(Number.isFinite)) {
    throw new RangeError("RD calculation produced a non-finite result")
  }

  return { monthlyDeposit, totalDeposited, interestEarned, maturityAmount, annualInterestRate, compoundingFrequency, compoundingPeriodsPerYear, totalMonths, durationInYears }
}
