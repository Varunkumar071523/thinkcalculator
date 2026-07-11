import { validateLumpsumInput } from "@/features/calculators/lumpsum/lumpsum-schema"
import type { LumpsumInput, LumpsumResult } from "@/features/calculators/lumpsum/lumpsum-types"

export function calculateLumpsum(input: LumpsumInput): LumpsumResult {
  const validation = validateLumpsumInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid Lumpsum input")
  }

  const { initialInvestment, annualReturnRate, duration, durationUnit } = input
  const totalMonths = durationUnit === "years" ? duration * 12 : duration
  const durationInYears = totalMonths / 12
  const annualRate = annualReturnRate / 100
  const futureValue = annualRate === 0
    ? initialInvestment
    : initialInvestment * Math.pow(1 + annualRate, durationInYears)
  const estimatedReturns = futureValue - initialInvestment

  if (![annualRate, durationInYears, futureValue, estimatedReturns].every(Number.isFinite)) {
    throw new RangeError("Lumpsum calculation produced a non-finite result")
  }

  return {
    initialInvestment,
    estimatedReturns,
    futureValue,
    annualRate,
    durationInYears,
    totalMonths,
  }
}
