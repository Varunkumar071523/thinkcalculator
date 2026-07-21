import { validateNPSInput } from "./nps-schema"
import type { NPSInput, NPSResult, NPSScheduleRow } from "./nps-types"

/** Government securities is always the remainder of the 100% allocation — see NPSResult's doc
 * comment (nps-types.ts) and the schema's cross-field rule (nps-schema.ts). */
function deriveGovtSecuritiesAllocationPercent(input: NPSInput): number {
  return 100 - input.equityAllocationPercent - input.corporateDebtAllocationPercent
}

/** The single rate the accumulation loop compounds at: each asset class's expected return,
 * weighted by its share of the allocation. This is what ties the donut (allocation) to the growth
 * line (accumulation) together — changing the allocation changes the blended rate, which changes
 * the projected corpus, rather than the two charts being decorative and independent of each other. */
export function computeBlendedAnnualReturn(input: NPSInput): number {
  const govtSecuritiesAllocationPercent = deriveGovtSecuritiesAllocationPercent(input)
  return (
    (input.equityAllocationPercent / 100) * input.equityExpectedReturn +
    (input.corporateDebtAllocationPercent / 100) * input.corporateDebtExpectedReturn +
    (govtSecuritiesAllocationPercent / 100) * input.govtSecuritiesExpectedReturn
  )
}

/** Beginning-of-month contribution, matching calculateSIP/calculateStepUpSIP/calculateRetirement's
 * convention: `balance = (balance + contribution) * (1 + monthlyRate)` each month, compounding at
 * the blended annual return derived from the asset allocation. */
export function calculateNPS(input: NPSInput): NPSResult {
  const validation = validateNPSInput(input)
  if (!validation.success) throw new RangeError("Invalid NPS input")
  const data = validation.data

  const govtSecuritiesAllocationPercent = deriveGovtSecuritiesAllocationPercent(data)
  const blendedAnnualReturn = computeBlendedAnnualReturn(data)
  const months = (data.retirementAge - data.currentAge) * 12
  const monthlyRate = blendedAnnualReturn / 12 / 100

  const schedule: NPSScheduleRow[] = []
  let balance = 0
  let invested = 0
  let yearContribution = 0

  for (let month = 1; month <= months; month++) {
    balance = (balance + data.monthlyContribution) * (1 + monthlyRate)
    if (!Number.isFinite(balance)) throw new RangeError("NPS calculation produced a non-finite result")
    invested += data.monthlyContribution
    yearContribution += data.monthlyContribution

    if (month % 12 === 0) {
      const year = month / 12
      schedule.push({
        year,
        age: data.currentAge + year,
        contribution: yearContribution,
        cumulativeInvestment: invested,
        yearEndBalance: balance,
        gainToDate: balance - invested,
      })
      yearContribution = 0
    }
  }

  const result: NPSResult = {
    ...data,
    govtSecuritiesAllocationPercent,
    blendedAnnualReturn,
    totalContributions: invested,
    totalGrowth: balance - invested,
    corpusAtRetirement: balance,
    schedule,
  }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("NPS calculation produced a non-finite result")
  return result
}
