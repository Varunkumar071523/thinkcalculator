import { validateSIPInput } from "@/features/calculators/sip/sip-schema"
import type { SIPInput, SIPResult } from "@/features/calculators/sip/sip-types"

export function calculateSIP(input: SIPInput): SIPResult {
  const validation = validateSIPInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid SIP input")
  }

  const { monthlyInvestment, annualReturnRate, duration, durationUnit } = input
  const totalMonths = durationUnit === "years" ? duration * 12 : duration
  const monthlyRate = annualReturnRate / 12 / 100
  const totalInvested = monthlyInvestment * totalMonths

  const futureValue = monthlyRate === 0
    ? totalInvested
    : monthlyInvestment
      * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      * (1 + monthlyRate)
  const estimatedReturns = futureValue - totalInvested

  if (![totalInvested, futureValue, estimatedReturns, monthlyRate].every(Number.isFinite)) {
    throw new RangeError("SIP calculation produced a non-finite result")
  }

  return {
    monthlyInvestment,
    totalInvested,
    estimatedReturns,
    futureValue,
    monthlyRate,
    totalMonths,
  }
}
