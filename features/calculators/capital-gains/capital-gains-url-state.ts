import { buildCalculatorUrl } from "@/lib/calculator-url"
import { isCapitalGainsAssetType, isValidIsoDate, parseCapitalGainsNumericText, validateCapitalGainsInput } from "./capital-gains-schema"
import type { CapitalGainsAssetType, CapitalGainsInput, CapitalGainsLotInput } from "./capital-gains-types"

/** A worked example chosen so all three pieces of this sprint's logic fire at once: FIFO
 * matching across three lots with the most recent lot only partially consumed, the oldest lot
 * pre-dating 31 January 2018 so grandfathering binds, a mix of STCG (the partially-consumed
 * recent lot) and LTCG (the other two) classifications, and a pooled LTCG total that partially
 * exceeds the ₹1,25,000 exemption rather than sitting entirely inside or entirely outside it. See
 * capital-gains-content.ts's worked example for the full component-by-component walk. */
export const CAPITAL_GAINS_DEFAULT_INPUT: CapitalGainsInput = {
  assetType: "equity-share",
  lots: [
    { id: "lot-1", purchaseDate: "2016-03-10", units: 1500, costPerUnit: 50, fairMarketValuePerUnitOn31Jan2018: 100 },
    { id: "lot-2", purchaseDate: "2021-04-01", units: 500, costPerUnit: 120, fairMarketValuePerUnitOn31Jan2018: null },
    { id: "lot-3", purchaseDate: "2025-12-01", units: 300, costPerUnit: 150, fairMarketValuePerUnitOn31Jan2018: null },
  ],
  saleDate: "2026-06-15",
  unitsSold: 2150,
  salePricePerUnit: 200,
}

function serializeLots(lots: readonly CapitalGainsLotInput[]): string {
  return lots
    .map((lot) => [lot.purchaseDate, String(lot.units), String(lot.costPerUnit), lot.fairMarketValuePerUnitOn31Jan2018 === null ? "" : String(lot.fairMarketValuePerUnitOn31Jan2018)].join(":"))
    .join("|")
}

function parseLots(raw: string): readonly CapitalGainsLotInput[] | null {
  if (!raw) return null
  const parts = raw.split("|")
  const lots: CapitalGainsLotInput[] = []
  for (const [index, part] of parts.entries()) {
    const fields = part.split(":")
    if (fields.length !== 4) return null
    const [purchaseDate, unitsRaw, costPerUnitRaw, fmvRaw] = fields
    if (!isValidIsoDate(purchaseDate)) return null
    const units = parseCapitalGainsNumericText(unitsRaw)
    const costPerUnit = parseCapitalGainsNumericText(costPerUnitRaw)
    if (units === null || costPerUnit === null) return null
    const fairMarketValuePerUnitOn31Jan2018 = fmvRaw === "" ? null : parseCapitalGainsNumericText(fmvRaw)
    if (fmvRaw !== "" && fairMarketValuePerUnitOn31Jan2018 === null) return null
    lots.push({ id: `lot-${index + 1}`, purchaseDate, units, costPerUnit, fairMarketValuePerUnitOn31Jan2018 })
  }
  return lots
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["type", "lots", "saleDate", "unitsSold", "salePrice"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidCapitalGainsUrlState(search: SearchInput): CapitalGainsInput | null {
  const recognised = keys.filter((key) => (search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined))
  if (recognised.length !== keys.length) return null

  const assetType = readOne(search, "type") as CapitalGainsAssetType | undefined
  const lots = parseLots(readOne(search, "lots") ?? "")
  const saleDate = readOne(search, "saleDate")
  const unitsSold = parseCapitalGainsNumericText(readOne(search, "unitsSold") ?? "")
  const salePricePerUnit = parseCapitalGainsNumericText(readOne(search, "salePrice") ?? "")

  if (!assetType || !isCapitalGainsAssetType(assetType) || !lots || saleDate === undefined || unitsSold === null || salePricePerUnit === null) return null

  const validation = validateCapitalGainsInput({ assetType, lots, saleDate, unitsSold, salePricePerUnit })
  return validation.success ? validation.data : null
}

export function parseCapitalGainsUrlState(search: SearchInput, defaults: CapitalGainsInput = CAPITAL_GAINS_DEFAULT_INPUT): CapitalGainsInput {
  return parseValidCapitalGainsUrlState(search) ?? defaults
}

export function serializeCapitalGainsUrlState(input: CapitalGainsInput): URLSearchParams {
  if (!validateCapitalGainsInput(input).success) throw new RangeError("Invalid capital gains URL state")
  return new URLSearchParams({
    type: input.assetType,
    lots: serializeLots(input.lots),
    saleDate: input.saleDate,
    unitsSold: String(input.unitsSold),
    salePrice: String(input.salePricePerUnit),
  })
}

export function buildCapitalGainsCalculatorUrl(input: CapitalGainsInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/capital-gains-calculator",
    Object.fromEntries(serializeCapitalGainsUrlState(input)),
    origin,
  )
}
