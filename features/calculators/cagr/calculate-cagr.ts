import { validateCAGRInput } from "@/features/calculators/cagr/cagr-schema"
import type { CAGRInput, CAGRResult } from "@/features/calculators/cagr/cagr-types"

export function calculateCAGR(input: CAGRInput): CAGRResult {
  const validation = validateCAGRInput(input)
  if (!validation.success) throw new RangeError("Invalid CAGR input")

  const { beginningValue, endingValue, investmentPeriodYears } = validation.data
  const growthMultiple = endingValue / beginningValue
  const cagrPercentage = endingValue === 0
    ? -100
    : (growthMultiple ** (1 / investmentPeriodYears) - 1) * 100
  const absoluteGainLoss = endingValue - beginningValue
  const totalReturnPercentage = (growthMultiple - 1) * 100

  if (![growthMultiple, cagrPercentage, absoluteGainLoss, totalReturnPercentage].every(Number.isFinite)) {
    throw new RangeError("CAGR calculation produced a non-finite result")
  }

  return { ...validation.data, cagrPercentage, absoluteGainLoss, totalReturnPercentage, growthMultiple }
}
