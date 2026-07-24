import { computeGrandfatheredCostPerUnit, isGrandfatheringApplicable } from "./capital-gains-grandfathering"
import { matchLotsFifo } from "./capital-gains-fifo-matcher"
import { classifyHoldingPeriod, computeHoldingPeriodDays } from "./capital-gains-holding-period"
import { validateCapitalGainsInput } from "./capital-gains-schema"
import { computeCapitalGainsTax } from "./capital-gains-tax"
import type { CapitalGainsInput, CapitalGainsMatchedLot, CapitalGainsResult } from "./capital-gains-types"

export function calculateCapitalGains(input: CapitalGainsInput): CapitalGainsResult {
  const validation = validateCapitalGainsInput(input)
  if (!validation.success) throw new RangeError("Invalid capital gains input")
  const { assetType, lots, saleDate, unitsSold, salePricePerUnit } = validation.data

  const fifoPortions = matchLotsFifo(lots, unitsSold)

  const matchedLots: CapitalGainsMatchedLot[] = fifoPortions.map((portion) => {
    const classification = classifyHoldingPeriod(portion.purchaseDate, saleDate)
    const isGrandfathered = classification === "ltcg" && isGrandfatheringApplicable(portion.purchaseDate)
    const effectiveCostPerUnit = isGrandfathered
      ? computeGrandfatheredCostPerUnit(portion.costPerUnit, portion.fairMarketValuePerUnitOn31Jan2018 as number, salePricePerUnit)
      : portion.costPerUnit
    const saleValue = portion.matchedUnits * salePricePerUnit
    const costValue = portion.matchedUnits * effectiveCostPerUnit

    return {
      lotId: portion.lotId,
      purchaseDate: portion.purchaseDate,
      matchedUnits: portion.matchedUnits,
      originalCostPerUnit: portion.costPerUnit,
      holdingPeriodDays: computeHoldingPeriodDays(portion.purchaseDate, saleDate),
      classification,
      isGrandfathered,
      effectiveCostPerUnit,
      saleValue,
      costValue,
      gain: saleValue - costValue,
    }
  })

  const totalSTCG = matchedLots.filter((lot) => lot.classification === "stcg").reduce((sum, lot) => sum + lot.gain, 0)
  const totalLTCG = matchedLots.filter((lot) => lot.classification === "ltcg").reduce((sum, lot) => sum + lot.gain, 0)
  const taxSummary = computeCapitalGainsTax(totalSTCG, totalLTCG)
  const totalSaleValue = unitsSold * salePricePerUnit

  const numericValues = [totalSTCG, totalLTCG, taxSummary.stcgTax, taxSummary.ltcgTax, taxSummary.totalTax, totalSaleValue]
  if (!numericValues.every(Number.isFinite)) throw new RangeError("Capital gains calculation produced a non-finite result")

  return {
    assetType,
    saleDate,
    unitsSold,
    salePricePerUnit,
    totalSaleValue,
    matchedLots,
    totalSTCG,
    totalLTCG,
    ...taxSummary,
    netProceedsAfterTax: totalSaleValue - taxSummary.totalTax,
  }
}
