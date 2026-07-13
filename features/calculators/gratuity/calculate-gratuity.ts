import {
  GRATUITY_STATUTORY_CEILING,
} from "./gratuity-regulatory-config"
import { validateGratuityInput } from "./gratuity-schema"
import type { GratuityInput, GratuityResult } from "./gratuity-types"

export function calculateGratuity(input: GratuityInput): GratuityResult {
  const validation = validateGratuityInput(input)
  if (!validation.success) throw new RangeError("Invalid gratuity input")

  const { eligibleMonthlyWages, completedYears, additionalMonths } = validation.data
  const countedServiceYears = completedYears + (additionalMonths > 6 ? 1 : 0)
  const dailyWageBasis = eligibleMonthlyWages / 26
  const gratuityBeforeCeiling = dailyWageBasis * 15 * countedServiceYears
  const estimatedGratuity = Math.min(gratuityBeforeCeiling, GRATUITY_STATUTORY_CEILING)
  const ceilingAdjustment = gratuityBeforeCeiling - estimatedGratuity
  const ceilingApplied = gratuityBeforeCeiling > GRATUITY_STATUTORY_CEILING

  const numericValues = [countedServiceYears, dailyWageBasis, gratuityBeforeCeiling, estimatedGratuity, ceilingAdjustment]
  if (!numericValues.every(Number.isFinite)) throw new RangeError("Gratuity calculation produced a non-finite result")

  return {
    ...validation.data,
    countedServiceYears,
    dailyWageBasis,
    gratuityBeforeCeiling,
    statutoryCeiling: GRATUITY_STATUTORY_CEILING,
    estimatedGratuity,
    ceilingAdjustment,
    ceilingApplied,
  }
}
