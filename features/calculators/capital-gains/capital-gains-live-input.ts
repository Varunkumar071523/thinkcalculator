import { isGrandfatheringApplicable } from "./capital-gains-grandfathering"
import { CAPITAL_GAINS_LIMITS, CAPITAL_GAINS_MAX_DATE, CAPITAL_GAINS_MIN_DATE, isCapitalGainsAssetType, isValidIsoDate, type CapitalGainsFormValues, type CapitalGainsLotFormValues } from "./capital-gains-schema"
import type { CapitalGainsInput, CapitalGainsLotInput } from "./capital-gains-types"
import { CAPITAL_GAINS_DEFAULT_INPUT } from "./capital-gains-url-state"

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function clampDate(value: string, fallback: string): string {
  return isValidIsoDate(value) && value >= CAPITAL_GAINS_MIN_DATE && value <= CAPITAL_GAINS_MAX_DATE ? value : fallback
}

const FALLBACK_LOT_DATE = "2020-01-01"

function toLiveLot(values: CapitalGainsLotFormValues, fallbackLot: CapitalGainsLotInput | undefined): CapitalGainsLotInput {
  const purchaseDate = clampDate(values.purchaseDate, fallbackLot?.purchaseDate ?? FALLBACK_LOT_DATE)
  const units = clampFinite(Number(values.units), fallbackLot?.units ?? 1, CAPITAL_GAINS_LIMITS.units.min, CAPITAL_GAINS_LIMITS.units.max)
  const costPerUnit = clampFinite(Number(values.costPerUnit), fallbackLot?.costPerUnit ?? 0, CAPITAL_GAINS_LIMITS.costPerUnit.min, CAPITAL_GAINS_LIMITS.costPerUnit.max)
  const needsFmv = isGrandfatheringApplicable(purchaseDate)
  const fairMarketValuePerUnitOn31Jan2018 = needsFmv
    ? clampFinite(Number(values.fairMarketValuePerUnitOn31Jan2018), fallbackLot?.fairMarketValuePerUnitOn31Jan2018 ?? costPerUnit, CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.min, CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.max)
    : null
  return { id: values.id, purchaseDate, units, costPerUnit, fairMarketValuePerUnitOn31Jan2018 }
}

/** Best-effort live view of the current form text, clamped into range on every keystroke, so the
 * result panel never hands calculateCapitalGains a NaN/Infinity/out-of-range value from an empty
 * or mid-edit field — same guard as leave-encashment-live-input.ts's toLiveInput, extracted into
 * its own module from the start so the clamp behavior (including the repeatable lot list) is
 * directly unit-testable without mounting a component. An empty lots array is passed through
 * unchanged rather than clamped to a fabricated row: calculateCapitalGains validly rejects zero
 * lots with a clear error, and the calculator component checks for this case before calling it. */
export function toLiveInput(values: CapitalGainsFormValues): CapitalGainsInput {
  return {
    assetType: isCapitalGainsAssetType(values.assetType) ? values.assetType : CAPITAL_GAINS_DEFAULT_INPUT.assetType,
    lots: values.lots.map((lotValues, index) => toLiveLot(lotValues, CAPITAL_GAINS_DEFAULT_INPUT.lots[index])),
    saleDate: clampDate(values.saleDate, CAPITAL_GAINS_DEFAULT_INPUT.saleDate),
    unitsSold: clampFinite(Number(values.unitsSold), CAPITAL_GAINS_DEFAULT_INPUT.unitsSold, CAPITAL_GAINS_LIMITS.unitsSold.min, CAPITAL_GAINS_LIMITS.unitsSold.max),
    salePricePerUnit: clampFinite(Number(values.salePricePerUnit), CAPITAL_GAINS_DEFAULT_INPUT.salePricePerUnit, CAPITAL_GAINS_LIMITS.salePricePerUnit.min, CAPITAL_GAINS_LIMITS.salePricePerUnit.max),
  }
}
