import { validateFDInput } from "@/features/calculators/fd/fd-schema"
import type { FDCompoundingFrequency, FDInput, FDResult } from "@/features/calculators/fd/fd-types"

export const FD_COMPOUNDING_PERIODS: Readonly<Record<FDCompoundingFrequency, number>> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
}

export function calculateFD(input: FDInput): FDResult {
  const validation = validateFDInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid FD input")
  }

  const { principalAmount, annualInterestRate, duration, durationUnit, compoundingFrequency } = input
  const totalMonths = durationUnit === "years" ? duration * 12 : duration
  const durationInYears = totalMonths / 12
  const annualRate = annualInterestRate / 100
  const compoundingPeriodsPerYear = FD_COMPOUNDING_PERIODS[compoundingFrequency]
  const maturityAmount = annualRate === 0
    ? principalAmount
    : principalAmount * Math.pow(
      1 + annualRate / compoundingPeriodsPerYear,
      compoundingPeriodsPerYear * durationInYears,
    )
  const interestEarned = maturityAmount - principalAmount

  if (![durationInYears, maturityAmount, interestEarned, compoundingPeriodsPerYear].every(Number.isFinite)) {
    throw new RangeError("FD calculation produced a non-finite result")
  }

  return {
    principalAmount,
    interestEarned,
    maturityAmount,
    annualInterestRate,
    compoundingFrequency,
    compoundingPeriodsPerYear,
    durationInYears,
    totalMonths,
  }
}
