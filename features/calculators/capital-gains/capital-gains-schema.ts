import { isGrandfatheringApplicable } from "./capital-gains-grandfathering"
import type {
  CapitalGainsAssetType,
  CapitalGainsInput,
  CapitalGainsLotInput,
  CapitalGainsLotValidationErrors,
  CapitalGainsValidationErrors,
  CapitalGainsValidationResult,
} from "./capital-gains-types"

export const CAPITAL_GAINS_LIMITS = {
  units: { min: 0.0001, max: 10_000_000 },
  costPerUnit: { min: 0, max: 10_000_000 },
  fairMarketValuePerUnit: { min: 0, max: 10_000_000 },
  unitsSold: { min: 0.0001, max: 10_000_000 },
  salePricePerUnit: { min: 0, max: 10_000_000 },
} as const

export const CAPITAL_GAINS_MIN_DATE = "1980-01-01"
export const CAPITAL_GAINS_MAX_DATE = "2100-12-31"
export const CAPITAL_GAINS_MAX_LOTS = 20

export const CAPITAL_GAINS_ASSET_TYPE_OPTIONS: readonly { readonly label: string; readonly value: CapitalGainsAssetType }[] = [
  { label: "Listed equity shares", value: "equity-share" },
  { label: "Equity-oriented mutual fund units", value: "equity-mutual-fund" },
]

export type CapitalGainsLotFormValues = {
  readonly id: string
  readonly purchaseDate: string
  readonly units: string
  readonly costPerUnit: string
  readonly fairMarketValuePerUnitOn31Jan2018: string
}

export type CapitalGainsFormValues = {
  readonly assetType: string
  readonly lots: readonly CapitalGainsLotFormValues[]
  readonly saleDate: string
  readonly unitsSold: string
  readonly salePricePerUnit: string
}

export function isCapitalGainsAssetType(value: string): value is CapitalGainsAssetType {
  return value === "equity-share" || value === "equity-mutual-fund"
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function parseCapitalGainsNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^\d+(?:\.\d+)?$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Distinguishes "left intentionally blank" (null — valid for a post-cutoff lot) from "typed
 * something unparseable" (undefined — always an error) for the conditionally-required FMV field. */
function parseFairMarketValueField(value: string): number | null | undefined {
  if (value.trim() === "") return null
  const parsed = parseCapitalGainsNumericText(value)
  return parsed === null ? undefined : parsed
}

export function validateCapitalGainsInput(input: CapitalGainsInput): CapitalGainsValidationResult {
  const errors: CapitalGainsValidationErrors = {}
  const lotErrors: Record<string, CapitalGainsLotValidationErrors> = {}
  const saleDateIsValid = isValidIsoDate(input.saleDate) && input.saleDate >= CAPITAL_GAINS_MIN_DATE && input.saleDate <= CAPITAL_GAINS_MAX_DATE

  if (!isCapitalGainsAssetType(input.assetType)) errors.assetType = "Choose an asset type."
  if (!saleDateIsValid) errors.saleDate = "Enter a valid sale date."
  if (!Number.isFinite(input.unitsSold) || input.unitsSold < CAPITAL_GAINS_LIMITS.unitsSold.min || input.unitsSold > CAPITAL_GAINS_LIMITS.unitsSold.max) {
    errors.unitsSold = `Enter units sold greater than 0, up to ${CAPITAL_GAINS_LIMITS.unitsSold.max.toLocaleString("en-IN")}.`
  }
  if (!Number.isFinite(input.salePricePerUnit) || input.salePricePerUnit < CAPITAL_GAINS_LIMITS.salePricePerUnit.min || input.salePricePerUnit > CAPITAL_GAINS_LIMITS.salePricePerUnit.max) {
    errors.salePricePerUnit = "Enter a valid sale price per unit."
  }

  if (input.lots.length === 0) {
    errors.lots = "Add at least one purchase lot."
  } else if (input.lots.length > CAPITAL_GAINS_MAX_LOTS) {
    errors.lots = `Enter at most ${CAPITAL_GAINS_MAX_LOTS} purchase lots.`
  }

  for (const lot of input.lots) {
    const thisLotErrors: CapitalGainsLotValidationErrors = {}
    const purchaseDateIsValid = isValidIsoDate(lot.purchaseDate) && lot.purchaseDate >= CAPITAL_GAINS_MIN_DATE && lot.purchaseDate <= CAPITAL_GAINS_MAX_DATE
    if (!purchaseDateIsValid) {
      thisLotErrors.purchaseDate = "Enter a valid purchase date."
    } else if (saleDateIsValid && lot.purchaseDate > input.saleDate) {
      thisLotErrors.purchaseDate = "Purchase date must be on or before the sale date."
    }
    if (!Number.isFinite(lot.units) || lot.units < CAPITAL_GAINS_LIMITS.units.min || lot.units > CAPITAL_GAINS_LIMITS.units.max) {
      thisLotErrors.units = "Enter a number of units greater than 0."
    }
    if (!Number.isFinite(lot.costPerUnit) || lot.costPerUnit < CAPITAL_GAINS_LIMITS.costPerUnit.min || lot.costPerUnit > CAPITAL_GAINS_LIMITS.costPerUnit.max) {
      thisLotErrors.costPerUnit = "Enter a valid cost per unit."
    }
    if (purchaseDateIsValid && isGrandfatheringApplicable(lot.purchaseDate)) {
      const fmv = lot.fairMarketValuePerUnitOn31Jan2018
      if (fmv === null || !Number.isFinite(fmv) || fmv < CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.min || fmv > CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.max) {
        thisLotErrors.fairMarketValuePerUnitOn31Jan2018 = "Enter the fair market value per unit as on 31 January 2018 — required for a lot acquired before that date."
      }
    }
    if (Object.keys(thisLotErrors).length) lotErrors[lot.id] = thisLotErrors
  }
  if (Object.keys(lotErrors).length) errors.lotErrors = lotErrors

  const totalUnitsHeld = input.lots.reduce((sum, lot) => sum + (Number.isFinite(lot.units) ? lot.units : 0), 0)
  if (!errors.lots && !errors.unitsSold && Number.isFinite(input.unitsSold) && input.unitsSold > totalUnitsHeld) {
    errors.unitsSold = `Units sold cannot exceed the ${totalUnitsHeld.toLocaleString("en-IN")} units held across all lots.`
  }

  return Object.keys(errors).length
    ? { success: false, errors }
    : { success: true, data: { ...input, lots: input.lots.map((lot) => ({ ...lot })) } }
}

export function parseAndValidateCapitalGainsForm(values: CapitalGainsFormValues): CapitalGainsValidationResult {
  const unitsSold = parseCapitalGainsNumericText(values.unitsSold)
  const salePricePerUnit = parseCapitalGainsNumericText(values.salePricePerUnit)
  const errors: CapitalGainsValidationErrors = {}
  const lotErrors: Record<string, CapitalGainsLotValidationErrors> = {}

  if (!isCapitalGainsAssetType(values.assetType)) errors.assetType = "Choose an asset type."
  if (!isValidIsoDate(values.saleDate)) errors.saleDate = "Enter a valid sale date."
  if (unitsSold === null) errors.unitsSold = "Enter units sold as a plain number."
  if (salePricePerUnit === null) errors.salePricePerUnit = "Enter a valid plain-decimal sale price per unit."
  if (values.lots.length === 0) errors.lots = "Add at least one purchase lot."

  const parsedLots: CapitalGainsLotInput[] = []
  for (const lotValues of values.lots) {
    const units = parseCapitalGainsNumericText(lotValues.units)
    const costPerUnit = parseCapitalGainsNumericText(lotValues.costPerUnit)
    const fairMarketValuePerUnitOn31Jan2018 = parseFairMarketValueField(lotValues.fairMarketValuePerUnitOn31Jan2018)
    const thisLotErrors: CapitalGainsLotValidationErrors = {}

    if (!isValidIsoDate(lotValues.purchaseDate)) thisLotErrors.purchaseDate = "Enter a valid purchase date."
    if (units === null) thisLotErrors.units = "Enter units as a plain number."
    if (costPerUnit === null) thisLotErrors.costPerUnit = "Enter cost per unit as a plain number."
    if (fairMarketValuePerUnitOn31Jan2018 === undefined) thisLotErrors.fairMarketValuePerUnitOn31Jan2018 = "Enter a valid plain-decimal fair market value, or leave blank."
    if (Object.keys(thisLotErrors).length) lotErrors[lotValues.id] = thisLotErrors

    parsedLots.push({
      id: lotValues.id,
      purchaseDate: isValidIsoDate(lotValues.purchaseDate) ? lotValues.purchaseDate : "",
      units: units ?? Number.NaN,
      costPerUnit: costPerUnit ?? Number.NaN,
      fairMarketValuePerUnitOn31Jan2018: fairMarketValuePerUnitOn31Jan2018 ?? null,
    })
  }
  if (Object.keys(lotErrors).length) errors.lotErrors = { ...errors.lotErrors, ...lotErrors }

  if (Object.keys(errors).length || !isCapitalGainsAssetType(values.assetType) || !isValidIsoDate(values.saleDate) || unitsSold === null || salePricePerUnit === null) {
    return { success: false, errors }
  }

  return validateCapitalGainsInput({
    assetType: values.assetType,
    lots: parsedLots,
    saleDate: values.saleDate,
    unitsSold,
    salePricePerUnit,
  })
}
